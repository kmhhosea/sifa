import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { stockEntrySchema } from "@/lib/validations";
import { createAuditLog } from "@/lib/audit";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get("businessId");
    const productId = searchParams.get("productId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    if (!businessId) return NextResponse.json({ error: "Business ID required" }, { status: 400 });

    const where: Record<string, unknown> = { businessId };
    if (productId) where.productId = productId;

    const [entries, total] = await Promise.all([
      prisma.stockEntry.findMany({
        where,
        include: {
          product: true,
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.stockEntry.count({ where }),
    ]);

    return NextResponse.json({ entries, total, page, limit });
  } catch (error) {
    console.error("Stock fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { businessId, ...entryData } = body;
    const parsed = stockEntrySchema.safeParse(entryData);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { productId, quantity, type, costPrice = 0, transportCost = 0, taxCost = 0, storageCost = 0, supplier, notes } = parsed.data;

    const totalLandedCost = (costPrice + transportCost + taxCost + storageCost) * quantity;

    const entry = await prisma.stockEntry.create({
      data: {
        productId,
        businessId,
        quantity,
        type,
        costPrice,
        transportCost,
        taxCost,
        storageCost,
        totalLandedCost,
        supplier,
        notes,
        userId: session.userId,
      },
      include: { product: true },
    });

    // Update product stock
    const stockChange = type === "in" || type === "return" ? quantity : -quantity;
    await prisma.product.update({
      where: { id: productId },
      data: {
        currentStock: { increment: stockChange },
        ...(type === "in" && costPrice > 0 ? { costPrice } : {}),
      },
    });

    // Check for low stock notification
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (product && product.currentStock + stockChange <= product.reorderLevel) {
      await prisma.notification.create({
        data: {
          businessId,
          userId: session.userId,
          type: "low_stock",
          title: "Low Stock Alert",
          message: `${product.name} is running low (${product.currentStock + stockChange} ${product.unit} remaining)`,
        },
      });
    }

    await createAuditLog({
      businessId,
      userId: session.userId,
      action: "create",
      entity: "stock",
      entityId: entry.id,
      details: JSON.stringify({ product: entry.product.name, quantity, type }),
    });

    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    console.error("Stock entry error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
