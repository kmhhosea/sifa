"use client";

import React from "react";
import {
  DollarSign, TrendingUp, TrendingDown, Package, ShoppingCart,
  AlertTriangle, ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/layout/header";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/stores/auth-store";
import { useApi } from "@/hooks/use-api";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell,
} from "recharts";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

interface AnalyticsData {
  totalRevenue: number;
  totalExpenses: number;
  grossProfit: number;
  netProfit: number;
  totalProducts: number;
  totalTransactions: number;
  lowStockProducts: number;
  revenueChange: number;
  profitChange: number;
  revenueByDay: { date: string; revenue: number; expenses: number; profit: number }[];
  topProducts: { name: string; revenue: number; quantity: number; profit: number }[];
  expensesByCategory: { category: string; amount: number }[];
  lowStockItems: { id: string; name: string; currentStock: number; reorderLevel: number; unit: string; category?: string }[];
  recentTransactions: {
    id: string; total: number; createdAt: string; customerName?: string; paymentMethod: string;
    items: { product: { name: string }; quantity: number }[];
  }[];
}

export default function DashboardPage() {
  const { currentBusiness } = useAuthStore();
  const { data, loading } = useApi<AnalyticsData>(
    currentBusiness ? `/api/analytics?businessId=${currentBusiness.id}&period=30` : null,
    [currentBusiness?.id]
  );

  if (loading || !data) {
    return (
      <div>
        <Header title="Dashboard" description="Business overview and analytics" />
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Skeleton className="h-80 lg:col-span-2 rounded-xl" />
            <Skeleton className="h-80 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  const kpis = [
    {
      title: "Total Revenue",
      value: formatCurrency(data.totalRevenue),
      change: data.revenueChange,
      icon: DollarSign,
      color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20",
    },
    {
      title: "Net Profit",
      value: formatCurrency(data.netProfit),
      change: data.profitChange,
      icon: data.netProfit >= 0 ? TrendingUp : TrendingDown,
      color: data.netProfit >= 0
        ? "text-blue-600 bg-blue-50 dark:bg-blue-900/20"
        : "text-red-600 bg-red-50 dark:bg-red-900/20",
    },
    {
      title: "Total Transactions",
      value: data.totalTransactions.toLocaleString(),
      change: null,
      icon: ShoppingCart,
      color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20",
    },
    {
      title: "Low Stock Items",
      value: data.lowStockProducts.toString(),
      change: null,
      icon: data.lowStockProducts > 0 ? AlertTriangle : Package,
      color: data.lowStockProducts > 0
        ? "text-amber-600 bg-amber-50 dark:bg-amber-900/20"
        : "text-gray-600 bg-gray-50 dark:bg-gray-900/20",
    },
  ];

  return (
    <div>
      <Header title="Dashboard" description="Business overview and analytics" />
      <div className="p-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((kpi) => (
            <Card key={kpi.title}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{kpi.title}</p>
                    <p className="text-2xl font-bold mt-1">{kpi.value}</p>
                    {kpi.change !== null && (
                      <div className="flex items-center mt-1 gap-1">
                        {kpi.change >= 0 ? (
                          <ArrowUpRight className="w-3 h-3 text-emerald-500" />
                        ) : (
                          <ArrowDownRight className="w-3 h-3 text-red-500" />
                        )}
                        <span className={`text-xs font-medium ${kpi.change >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                          {Math.abs(kpi.change).toFixed(1)}%
                        </span>
                        <span className="text-xs text-gray-400">vs prev period</span>
                      </div>
                    )}
                  </div>
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${kpi.color}`}>
                    <kpi.icon className="w-5 h-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue Trend */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Revenue & Profit Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={data.revenueByDay}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-800" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(255,255,255,0.95)",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                    }}
                    formatter={(value) => [`$${Number(value).toFixed(2)}`, undefined]}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fill="url(#colorRevenue)" strokeWidth={2} name="Revenue" />
                  <Area type="monotone" dataKey="profit" stroke="#10b981" fill="url(#colorProfit)" strokeWidth={2} name="Profit" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Expenses Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Expenses by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={data.expensesByCategory}
                    dataKey="amount"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={50}
                    paddingAngle={2}
                  >
                    {data.expensesByCategory.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`$${Number(value).toFixed(2)}`, undefined]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {data.expensesByCategory.slice(0, 5).map((item, i) => (
                  <div key={item.category} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="capitalize">{item.category}</span>
                    </div>
                    <span className="font-medium">{formatCurrency(item.amount)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Products */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Top Selling Products</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={data.topProducts.slice(0, 6)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-800" />
                  <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={120}
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) => v.length > 15 ? v.slice(0, 15) + "..." : v}
                  />
                  <Tooltip formatter={(value) => [`$${Number(value).toFixed(2)}`, undefined]} />
                  <Bar dataKey="revenue" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Revenue" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Recent Transactions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.recentTransactions.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-8">No recent transactions</p>
                ) : (
                  data.recentTransactions.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                      <div>
                        <p className="text-sm font-medium">
                          {tx.items.map((i) => i.product.name).join(", ").slice(0, 40)}
                          {tx.items.map((i) => i.product.name).join(", ").length > 40 ? "..." : ""}
                        </p>
                        <p className="text-xs text-gray-500">{formatDateTime(tx.createdAt)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-emerald-600">{formatCurrency(tx.total)}</p>
                        <Badge variant="secondary" className="text-xs">{tx.paymentMethod}</Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Low Stock Alert */}
        {data.lowStockItems.length > 0 && (
          <Card className="border-amber-200 dark:border-amber-800">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Low Stock Alerts ({data.lowStockItems.length} items)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {data.lowStockItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-amber-50 dark:bg-amber-900/10">
                    <div>
                      <p className="text-sm font-medium">{item.name}</p>
                      <p className="text-xs text-gray-500">{item.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-amber-600">
                        {item.currentStock} {item.unit}
                      </p>
                      <p className="text-xs text-gray-500">min: {item.reorderLevel}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
