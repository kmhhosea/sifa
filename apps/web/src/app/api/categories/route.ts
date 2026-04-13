import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession, verifyBusinessMembership } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get("businessId");
    if (!businessId) return NextResponse.json({ error: "Business ID required" }, { status: 400 });

    const membership = await verifyBusinessMembership(session.userId, businessId);
    if (!membership) return NextResponse.json({ error: "Not a member of this business" }, { status: 403 });

    const categories = await prisma.category.findMany({
      where: { businessId },
      include: { _count: { select: { products: true } } },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error("Categories fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { name, businessId } = await request.json();
    if (!name || !businessId) return NextResponse.json({ error: "Name and businessId required" }, { status: 400 });

    const membership = await verifyBusinessMembership(session.userId, businessId);
    if (!membership) return NextResponse.json({ error: "Not a member of this business" }, { status: 403 });

    const existing = await prisma.category.findUnique({
      where: { name_businessId: { name, businessId } },
    });
    if (existing) return NextResponse.json({ error: "Category already exists" }, { status: 409 });

    const category = await prisma.category.create({
      data: { name, businessId },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("Category create error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
