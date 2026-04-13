import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get("businessId");
    const type = searchParams.get("type") || "sales";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!businessId) return NextResponse.json({ error: "Business ID required" }, { status: 400 });

    const dateFilter: Record<string, unknown> = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);

    if (type === "sales") {
      const transactions = await prisma.transaction.findMany({
        where: {
          businessId,
          type: "sale",
          ...(startDate || endDate ? { createdAt: dateFilter } : {}),
        },
        include: {
          items: { include: { product: true } },
          user: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      const totalRevenue = transactions.reduce((sum, t) => sum + t.total, 0);
      const totalCost = transactions.reduce(
        (sum, t) => sum + t.items.reduce((s, i) => s + i.costPrice * i.quantity, 0),
        0
      );
      const totalProfit = totalRevenue - totalCost;
      const totalDiscount = transactions.reduce((sum, t) => sum + t.discount, 0);

      return NextResponse.json({
        type: "sales",
        summary: { totalRevenue, totalCost, totalProfit, totalDiscount, totalTransactions: transactions.length },
        data: transactions,
      });
    }

    if (type === "inventory") {
      const products = await prisma.product.findMany({
        where: { businessId, isActive: true },
        include: { category: true },
        orderBy: { name: "asc" },
      });

      const totalValue = products.reduce((sum, p) => sum + p.costPrice * p.currentStock, 0);
      const totalRetailValue = products.reduce((sum, p) => sum + p.sellingPrice * p.currentStock, 0);
      const lowStock = products.filter((p) => p.currentStock <= p.reorderLevel);
      const outOfStock = products.filter((p) => p.currentStock === 0);

      return NextResponse.json({
        type: "inventory",
        summary: {
          totalProducts: products.length,
          totalValue,
          totalRetailValue,
          potentialProfit: totalRetailValue - totalValue,
          lowStockCount: lowStock.length,
          outOfStockCount: outOfStock.length,
        },
        data: products,
      });
    }

    if (type === "expenses") {
      const expenses = await prisma.expense.findMany({
        where: {
          businessId,
          ...(startDate || endDate ? { date: dateFilter } : {}),
        },
        include: { user: { select: { id: true, name: true } } },
        orderBy: { date: "desc" },
      });

      const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
      const byCategory: Record<string, number> = {};
      expenses.forEach((e) => {
        byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;
      });

      return NextResponse.json({
        type: "expenses",
        summary: { totalExpenses, byCategory, totalEntries: expenses.length },
        data: expenses,
      });
    }

    if (type === "profit-loss") {
      const [transactions, expenses] = await Promise.all([
        prisma.transaction.findMany({
          where: {
            businessId,
            type: "sale",
            ...(startDate || endDate ? { createdAt: dateFilter } : {}),
          },
          include: { items: true },
        }),
        prisma.expense.findMany({
          where: {
            businessId,
            ...(startDate || endDate ? { date: dateFilter } : {}),
          },
        }),
      ]);

      const totalRevenue = transactions.reduce((sum, t) => sum + t.total, 0);
      const totalCOGS = transactions.reduce(
        (sum, t) => sum + t.items.reduce((s, i) => s + i.costPrice * i.quantity, 0),
        0
      );
      const grossProfit = totalRevenue - totalCOGS;
      const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
      const netProfit = grossProfit - totalExpenses;
      const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
      const netMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

      const expensesByCategory: Record<string, number> = {};
      expenses.forEach((e) => {
        expensesByCategory[e.category] = (expensesByCategory[e.category] || 0) + e.amount;
      });

      return NextResponse.json({
        type: "profit-loss",
        summary: {
          totalRevenue,
          totalCOGS,
          grossProfit,
          totalExpenses,
          netProfit,
          grossMargin: Math.round(grossMargin * 10) / 10,
          netMargin: Math.round(netMargin * 10) / 10,
          expensesByCategory,
        },
      });
    }

    return NextResponse.json({ error: "Invalid report type" }, { status: 400 });
  } catch (error) {
    console.error("Report error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
