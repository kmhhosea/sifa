import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: {
        businessMembers: {
          include: {
            business: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const businesses = user.businessMembers.map((bm) => ({
      id: bm.business.id,
      name: bm.business.name,
      currency: bm.business.currency,
      role: bm.role,
    }));

    return NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name, avatar: user.avatar },
      businesses,
    });
  } catch (error) {
    console.error("Auth check error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
