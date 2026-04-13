import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession, verifyBusinessMembership } from "@/lib/auth";
import { expenseSchema } from "@/lib/validations";
import { createAuditLog } from "@/lib/audit";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get("businessId");
    const category = searchParams.get("category");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    if (!businessId) return NextResponse.json({ error: "Business ID required" }, { status: 400 });

    const membership = await verifyBusinessMembership(session.userId, businessId);
    if (!membership) return NextResponse.json({ error: "Not a member of this business" }, { status: 403 });

    const where: Record<string, unknown> = { businessId };
    if (category) where.category = category;

    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { date: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.expense.count({ where }),
    ]);

    return NextResponse.json({ expenses, total, page, limit });
  } catch (error) {
    console.error("Expenses fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { businessId, ...expenseData } = body;

    const membership = await verifyBusinessMembership(session.userId, businessId);
    if (!membership) return NextResponse.json({ error: "Not a member of this business" }, { status: 403 });

    const parsed = expenseSchema.safeParse(expenseData);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const expense = await prisma.expense.create({
      data: {
        businessId,
        userId: session.userId,
        category: parsed.data.category,
        amount: parsed.data.amount,
        description: parsed.data.description,
        date: parsed.data.date ? new Date(parsed.data.date) : new Date(),
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    await createAuditLog({
      businessId,
      userId: session.userId,
      action: "create",
      entity: "expense",
      entityId: expense.id,
      details: JSON.stringify({ category: expense.category, amount: expense.amount }),
    });

    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    console.error("Expense create error:", error);
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

    const membership = await verifyBusinessMembership(session.userId, businessId);
    if (!membership) return NextResponse.json({ error: "Not a member of this business" }, { status: 403 });

    await prisma.expense.delete({ where: { id } });

    await createAuditLog({
      businessId,
      userId: session.userId,
      action: "delete",
      entity: "expense",
      entityId: id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Expense delete error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
