import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { productSchema } from "@/lib/validations";
import { createAuditLog } from "@/lib/audit";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get("businessId");
    const search = searchParams.get("search") || "";
    const categoryId = searchParams.get("categoryId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    if (!businessId) return NextResponse.json({ error: "Business ID required" }, { status: 400 });

    const where: Record<string, unknown> = { businessId, isActive: true };
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { sku: { contains: search } },
        { description: { contains: search } },
      ];
    }
    if (categoryId) where.categoryId = categoryId;

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { category: true },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json({ products, total, page, limit });
  } catch (error) {
    console.error("Products fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { businessId, ...productData } = body;
    const parsed = productSchema.safeParse(productData);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const product = await prisma.product.create({
      data: {
        ...parsed.data,
        businessId,
      },
      include: { category: true },
    });

    await createAuditLog({
      businessId,
      userId: session.userId,
      action: "create",
      entity: "product",
      entityId: product.id,
      details: JSON.stringify({ name: product.name }),
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("Product create error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { id, businessId, ...updateData } = body;

    const product = await prisma.product.update({
      where: { id },
      data: updateData,
      include: { category: true },
    });

    await createAuditLog({
      businessId,
      userId: session.userId,
      action: "update",
      entity: "product",
      entityId: product.id,
      details: JSON.stringify(updateData),
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error("Product update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const businessId = searchParams.get("businessId");

    if (!id || !businessId) return NextResponse.json({ error: "Missing params" }, { status: 400 });

    await prisma.product.update({
      where: { id },
      data: { isActive: false },
    });

    await createAuditLog({
      businessId,
      userId: session.userId,
      action: "delete",
      entity: "product",
      entityId: id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Product delete error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
