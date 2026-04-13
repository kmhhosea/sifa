import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession, verifyBusinessMembership } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get("businessId");

    if (!businessId) return NextResponse.json({ error: "Business ID required" }, { status: 400 });

    const membership = await verifyBusinessMembership(session.userId, businessId);
    if (!membership) return NextResponse.json({ error: "Not a member of this business" }, { status: 403 });

    const members = await prisma.businessMember.findMany({
      where: { businessId },
      include: {
        user: { select: { id: true, name: true, email: true, avatar: true, createdAt: true } },
      },
      orderBy: { joinedAt: "asc" },
    });

    return NextResponse.json(members);
  } catch (error) {
    console.error("Team fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { businessId, email, role } = await request.json();
    if (!businessId || !email || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const membership = await verifyBusinessMembership(session.userId, businessId);
    if (!membership) return NextResponse.json({ error: "Not a member of this business" }, { status: 403 });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: "User not found. They must register first." }, { status: 404 });
    }

    const existing = await prisma.businessMember.findUnique({
      where: { userId_businessId: { userId: user.id, businessId } },
    });
    if (existing) {
      return NextResponse.json({ error: "User is already a member" }, { status: 409 });
    }

    const member = await prisma.businessMember.create({
      data: { userId: user.id, businessId, role },
      include: {
        user: { select: { id: true, name: true, email: true, avatar: true, createdAt: true } },
      },
    });

    await createAuditLog({
      businessId,
      userId: session.userId,
      action: "create",
      entity: "team_member",
      entityId: member.id,
      details: JSON.stringify({ email, role }),
    });

    return NextResponse.json(member, { status: 201 });
  } catch (error) {
    console.error("Team add error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id, role, businessId } = await request.json();

    const membership = await verifyBusinessMembership(session.userId, businessId);
    if (!membership) return NextResponse.json({ error: "Not a member of this business" }, { status: 403 });

    const member = await prisma.businessMember.update({
      where: { id },
      data: { role },
      include: {
        user: { select: { id: true, name: true, email: true, avatar: true, createdAt: true } },
      },
    });

    await createAuditLog({
      businessId,
      userId: session.userId,
      action: "update",
      entity: "team_member",
      entityId: id,
      details: JSON.stringify({ role }),
    });

    return NextResponse.json(member);
  } catch (error) {
    console.error("Team update error:", error);
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

    await prisma.businessMember.delete({ where: { id } });

    await createAuditLog({
      businessId,
      userId: session.userId,
      action: "delete",
      entity: "team_member",
      entityId: id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Team remove error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
