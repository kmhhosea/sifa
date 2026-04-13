import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get("businessId");
    const period = searchParams.get("period") || "30";

    if (!businessId) return NextResponse.json({ error: "Business ID required" }, { status: 400 });

    const days = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const prevStartDate = new Date();
    prevStartDate.setDate(prevStartDate.getDate() - days * 2);

    // Current period data
    const [transactions, expenses, products, prevTransactions, prevExpenses] = await Promise.all([
      prisma.transaction.findMany({
        where: { businessId, createdAt: { gte: startDate }, type: "sale" },
        include: { items: { include: { product: true } } },
        orderBy: { createdAt: "asc" },
      }),
      prisma.expense.findMany({
        where: { businessId, date: { gte: startDate } },
      }),
      prisma.product.findMany({
        where: { businessId, isActive: true },
        include: { category: true },
      }),
      prisma.transaction.findMany({
        where: { businessId, createdAt: { gte: prevStartDate, lt: startDate }, type: "sale" },
      }),
      prisma.expense.findMany({
        where: { businessId, date: { gte: prevStartDate, lt: startDate } },
      }),
    ]);

    // Calculate KPIs
    const totalRevenue = transactions.reduce((sum, t) => sum + t.total, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const totalCost = transactions.reduce(
      (sum, t) => sum + t.items.reduce((s, i) => s + i.costPrice * i.quantity, 0),
      0
    );
    const grossProfit = totalRevenue - totalCost;
    const netProfit = grossProfit - totalExpenses;

    const prevRevenue = prevTransactions.reduce((sum, t) => sum + t.total, 0);
    const prevExpenseTotal = prevExpenses.reduce((sum, e) => sum + e.amount, 0);
    const prevProfit = prevRevenue - prevExpenseTotal;

    const revenueChange = prevRevenue === 0 ? 100 : ((totalRevenue - prevRevenue) / prevRevenue) * 100;
    const profitChange = prevProfit === 0 ? 100 : ((netProfit - prevProfit) / prevProfit) * 100;

    // Low stock products
    const lowStockProducts = products.filter((p) => p.currentStock <= p.reorderLevel);

    // Revenue by day
    const revenueByDay: Record<string, { revenue: number; expenses: number; profit: number }> = {};
    transactions.forEach((t) => {
      const date = t.createdAt.toISOString().split("T")[0];
      if (!revenueByDay[date]) revenueByDay[date] = { revenue: 0, expenses: 0, profit: 0 };
      revenueByDay[date].revenue += t.total;
      const cost = t.items.reduce((s, i) => s + i.costPrice * i.quantity, 0);
      revenueByDay[date].profit += t.total - cost;
    });
    expenses.forEach((e) => {
      const date = e.date.toISOString().split("T")[0];
      if (!revenueByDay[date]) revenueByDay[date] = { revenue: 0, expenses: 0, profit: 0 };
      revenueByDay[date].expenses += e.amount;
      revenueByDay[date].profit -= e.amount;
    });

    const revenueByDayArray = Object.entries(revenueByDay)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Top products
    const productSales: Record<string, { name: string; revenue: number; quantity: number; profit: number }> = {};
    transactions.forEach((t) => {
      t.items.forEach((item) => {
        const key = item.productId;
        if (!productSales[key]) {
          productSales[key] = { name: item.product.name, revenue: 0, quantity: 0, profit: 0 };
        }
        productSales[key].revenue += item.total;
        productSales[key].quantity += item.quantity;
        productSales[key].profit += item.total - item.costPrice * item.quantity;
      });
    });
    const topProducts = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Expenses by category
    const expensesByCategory: Record<string, number> = {};
    expenses.forEach((e) => {
      expensesByCategory[e.category] = (expensesByCategory[e.category] || 0) + e.amount;
    });
    const expensesByCategoryArray = Object.entries(expensesByCategory)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);

    // Recent transactions
    const recentTransactions = transactions.slice(-5).reverse();

    return NextResponse.json({
      totalRevenue,
      totalExpenses,
      grossProfit,
      netProfit,
      totalProducts: products.length,
      totalTransactions: transactions.length,
      lowStockProducts: lowStockProducts.length,
      revenueChange: Math.round(revenueChange * 10) / 10,
      profitChange: Math.round(profitChange * 10) / 10,
      revenueByDay: revenueByDayArray,
      topProducts,
      expensesByCategory: expensesByCategoryArray,
      recentTransactions,
      lowStockItems: lowStockProducts.map((p) => ({
        id: p.id,
        name: p.name,
        currentStock: p.currentStock,
        reorderLevel: p.reorderLevel,
        unit: p.unit,
        category: p.category?.name,
      })),
    });
  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
