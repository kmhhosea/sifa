"use client";

import React, { useState } from "react";
import { TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Header } from "@/components/layout/header";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuthStore } from "@/stores/auth-store";
import { useApi } from "@/hooks/use-api";
import { formatCurrency } from "@/lib/utils";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, Legend,
} from "recharts";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"];

interface AnalyticsData {
  totalRevenue: number; totalExpenses: number; grossProfit: number; netProfit: number;
  totalTransactions: number; revenueChange: number; profitChange: number;
  revenueByDay: { date: string; revenue: number; expenses: number; profit: number }[];
  topProducts: { name: string; revenue: number; quantity: number; profit: number }[];
  expensesByCategory: { category: string; amount: number }[];
}

export default function AnalyticsPage() {
  const { currentBusiness } = useAuthStore();
  const [period, setPeriod] = useState("30");
  const [tab, setTab] = useState("overview");

  const { data, loading } = useApi<AnalyticsData>(
    currentBusiness ? `/api/analytics?businessId=${currentBusiness.id}&period=${period}` : null,
    [currentBusiness?.id, period]
  );

  if (loading || !data) {
    return (
      <div>
        <Header title="Analytics" description="Business performance insights" />
        <div className="p-6 space-y-6">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-80 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header
        title="Analytics"
        description="Business performance insights"
        actions={
          <Select value={period} onChange={(e) => setPeriod(e.target.value)} className="w-40">
            <option value="7">Last 7 Days</option>
            <option value="14">Last 14 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
            <option value="365">Last Year</option>
          </Select>
        }
      />
      <div className="p-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Revenue", value: formatCurrency(data.totalRevenue), change: data.revenueChange, positive: true },
            { label: "Gross Profit", value: formatCurrency(data.grossProfit), change: null, positive: data.grossProfit >= 0 },
            { label: "Net Profit", value: formatCurrency(data.netProfit), change: data.profitChange, positive: data.netProfit >= 0 },
            { label: "Expenses", value: formatCurrency(data.totalExpenses), change: null, positive: false },
          ].map((item) => (
            <Card key={item.label}>
              <CardContent className="p-4">
                <p className="text-sm text-gray-500">{item.label}</p>
                <p className={`text-xl font-bold mt-1 ${item.positive ? "text-emerald-600" : "text-red-600"}`}>
                  {item.value}
                </p>
                {item.change !== null && (
                  <p className={`text-xs mt-1 ${item.change >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                    {item.change >= 0 ? "+" : ""}{item.change.toFixed(1)}% vs prev period
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="overview">Revenue & Profit</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader><CardTitle className="text-base">Revenue Trend</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={data.revenueByDay}>
                      <defs>
                        <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-800" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(value) => [`$${Number(value).toFixed(2)}`]} />
                      <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fill="url(#revGrad)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-base">Profit vs Expenses</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={data.revenueByDay}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-800" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(value) => [`$${Number(value).toFixed(2)}`]} />
                      <Legend />
                      <Line type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="products">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader><CardTitle className="text-base">Top Products by Revenue</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={data.topProducts.slice(0, 8)} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-800" />
                      <XAxis type="number" tick={{ fontSize: 11 }} />
                      <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 11 }}
                        tickFormatter={(v) => v.length > 18 ? v.slice(0, 18) + "..." : v} />
                      <Tooltip formatter={(value) => [`$${Number(value).toFixed(2)}`]} />
                      <Bar dataKey="revenue" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Revenue" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-base">Product Profit Comparison</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={data.topProducts.slice(0, 8)}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-800" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(0, 10)} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(value) => [`$${Number(value).toFixed(2)}`]} />
                      <Legend />
                      <Bar dataKey="revenue" fill="#3b82f6" name="Revenue" />
                      <Bar dataKey="profit" fill="#10b981" name="Profit" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="expenses">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader><CardTitle className="text-base">Expense Distribution</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={data.expensesByCategory} dataKey="amount" nameKey="category"
                        cx="50%" cy="50%" outerRadius={110} innerRadius={60} paddingAngle={3}>
                        {data.expensesByCategory.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`$${Number(value).toFixed(2)}`]} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-base">Expense Breakdown</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {data.expensesByCategory.map((item, i) => {
                      const percentage = data.totalExpenses > 0 ? (item.amount / data.totalExpenses) * 100 : 0;
                      return (
                        <div key={item.category}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="capitalize font-medium">{item.category}</span>
                            <span>{formatCurrency(item.amount)} ({percentage.toFixed(1)}%)</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2.5">
                            <div className="h-2.5 rounded-full" style={{ width: `${percentage}%`, backgroundColor: COLORS[i % COLORS.length] }} />
                          </div>
                        </div>
                      );
                    })}
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-800 flex justify-between font-bold">
                      <span>Total</span>
                      <span className="text-red-600">{formatCurrency(data.totalExpenses)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
