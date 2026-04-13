"use client";

import React, { useState } from "react";
import { FileText, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Header } from "@/components/layout/header";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/stores/auth-store";
import { useApi } from "@/hooks/use-api";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function ReportsPage() {
  const { currentBusiness } = useAuthStore();
  const [reportType, setReportType] = useState("sales");
  const [startDate, setStartDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split("T")[0]);

  const params = new URLSearchParams({
    businessId: currentBusiness?.id || "",
    type: reportType,
    startDate,
    endDate,
  });

  const { data, loading } = useApi<Record<string, unknown>>(
    currentBusiness ? `/api/reports?${params}` : null,
    [currentBusiness?.id, reportType, startDate, endDate]
  );

  const downloadCSV = () => {
    if (!data) return;
    const summary = data.summary as Record<string, unknown>;
    let csv = "Field,Value\n";
    Object.entries(summary).forEach(([key, value]) => {
      if (typeof value === "object") {
        Object.entries(value as Record<string, number>).forEach(([k, v]) => {
          csv += `${key} - ${k},${v}\n`;
        });
      } else {
        csv += `${key},${value}\n`;
      }
    });
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${reportType}-report-${startDate}-to-${endDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const summary = (data?.summary || {}) as Record<string, unknown>;

  return (
    <div>
      <Header
        title="Reports"
        description="Generate and export business reports"
        actions={
          <Button size="sm" variant="outline" onClick={downloadCSV} disabled={!data}>
            <Download className="w-4 h-4 mr-1" /> Export CSV
          </Button>
        }
      />
      <div className="p-6 space-y-6">
        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-3 flex-wrap items-end">
              <div>
                <label className="text-sm font-medium block mb-1">Report Type</label>
                <Select value={reportType} onChange={(e) => setReportType(e.target.value)} className="w-48">
                  <option value="sales">Sales Report</option>
                  <option value="inventory">Inventory Report</option>
                  <option value="expenses">Expenses Report</option>
                  <option value="profit-loss">Profit & Loss</option>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Start Date</label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">End Date</label>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-40 rounded-xl" />
            <Skeleton className="h-80 rounded-xl" />
          </div>
        ) : !data ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-500">
            <FileText className="w-12 h-12 mb-3 text-gray-300" />
            <p>Select report parameters and click generate</p>
          </div>
        ) : (
          <>
            {/* Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base capitalize">{reportType.replace("-", " & ")} Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(summary).filter(([, v]) => typeof v !== "object").map(([key, value]) => (
                    <div key={key} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900">
                      <p className="text-xs text-gray-500 capitalize">{key.replace(/([A-Z])/g, " $1").trim()}</p>
                      <p className="text-lg font-bold mt-1">
                        {typeof value === "number"
                          ? key.toLowerCase().includes("margin") || key.toLowerCase().includes("percentage")
                            ? `${(value as number).toFixed(1)}%`
                            : key.toLowerCase().includes("count") || key.toLowerCase().includes("total") && !key.toLowerCase().includes("revenue") && !key.toLowerCase().includes("cost") && !key.toLowerCase().includes("profit") && !key.toLowerCase().includes("expense") && !key.toLowerCase().includes("value") && !key.toLowerCase().includes("discount")
                              ? value.toLocaleString()
                              : formatCurrency(value as number)
                          : String(value)}
                      </p>
                    </div>
                  ))}
                </div>
                {summary.byCategory && typeof summary.byCategory === "object" ? (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                    <p className="text-sm font-medium mb-2">By Category</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {Object.entries(summary.byCategory as Record<string, number>).map(([cat, amount]) => (
                        <div key={cat} className="p-2 rounded bg-gray-50 dark:bg-gray-900 flex justify-between">
                          <span className="text-sm capitalize">{cat}</span>
                          <span className="text-sm font-medium">{formatCurrency(amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
                {summary.expensesByCategory && typeof summary.expensesByCategory === "object" ? (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                    <p className="text-sm font-medium mb-2">Expenses by Category</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {Object.entries(summary.expensesByCategory as Record<string, number>).map(([cat, amount]) => (
                        <div key={cat} className="p-2 rounded bg-gray-50 dark:bg-gray-900 flex justify-between">
                          <span className="text-sm capitalize">{cat}</span>
                          <span className="text-sm font-medium">{formatCurrency(amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
