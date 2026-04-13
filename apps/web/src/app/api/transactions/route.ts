import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession, verifyBusinessMembership } from "@/lib/auth";
import { transactionSchema } from "@/lib/validations";
import { createAuditLog } from "@/lib/audit";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get("businessId");
    const type = searchParams.get("type");
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    if (!businessId) return NextResponse.json({ error: "Business ID required" }, { status: 400 });

    const membership = await verifyBusinessMembership(session.userId, businessId);
    if (!membership) return NextResponse.json({ error: "Not a member of this business" }, { status: 403 });

    const where: Record<string, unknown> = { businessId };
    if (type) where.type = type;
    if (status) where.status = status;

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          items: { include: { product: true } },
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.transaction.count({ where }),
    ]);

    return NextResponse.json({ transactions, total, page, limit });
  } catch (error) {
    console.error("Transactions fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { businessId, ...txData } = body;

    const membership = await verifyBusinessMembership(session.userId, businessId);
    if (!membership) return NextResponse.json({ error: "Not a member of this business" }, { status: 403 });

    const parsed = transactionSchema.safeParse(txData);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { items, discount = 0, tax = 0, paymentMethod, amountPaid, customerName, customerPhone, notes } = parsed.data;

    // Get product details for cost price calculation
    const productIds = items.map((i) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });
    const productMap = new Map(products.map((p) => [p.id, p]));

    // Calculate totals
    const transactionItems = items.map((item) => {
      const product = productMap.get(item.productId);
      const itemDiscount = item.discount || 0;
      const total = item.unitPrice * item.quantity - itemDiscount;
      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        costPrice: product?.costPrice || 0,
        discount: itemDiscount,
        total,
      };
    });

    const subtotal = transactionItems.reduce((sum, item) => sum + item.total, 0);
    const total = subtotal - discount + tax;
    const paid = amountPaid !== undefined ? amountPaid : total;
    const status = paid >= total ? "completed" : paid > 0 ? "partial" : "pending";

    const transaction = await prisma.transaction.create({
      data: {
        businessId,
        userId: session.userId,
        type: "sale",
        status,
        subtotal,
        discount,
        tax,
        total,
        amountPaid: paid,
        paymentMethod,
        customerName,
        customerPhone,
        notes,
        items: {
          create: transactionItems,
        },
      },
      include: {
        items: { include: { product: true } },
        user: { select: { id: true, name: true, email: true } },
      },
    });

    // Update product stock
    for (const item of items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: { currentStock: { decrement: item.quantity } },
      });

      // Check low stock
      const product = productMap.get(item.productId);
      if (product && product.currentStock - item.quantity <= product.reorderLevel) {
        await prisma.notification.create({
          data: {
            businessId,
            userId: session.userId,
            type: "low_stock",
            title: "Low Stock Alert",
            message: `${product.name} is running low after sale (${product.currentStock - item.quantity} ${product.unit} remaining)`,
          },
        });
      }
    }

    await createAuditLog({
      businessId,
      userId: session.userId,
      action: "create",
      entity: "transaction",
      entityId: transaction.id,
      details: JSON.stringify({ total: transaction.total, items: items.length }),
    });

    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    console.error("Transaction create error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
