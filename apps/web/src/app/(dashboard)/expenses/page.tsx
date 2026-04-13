"use client";

import React, { useState } from "react";
import { Receipt, Plus, Loader2, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Header } from "@/components/layout/header";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/stores/auth-store";
import { useApi, apiPost, apiDelete } from "@/hooks/use-api";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Expense {
  id: string; category: string; amount: number; description: string;
  date: string; createdAt: string; user: { name: string };
}

const EXPENSE_CATEGORIES = [
  { value: "rent", label: "Rent", color: "default" as const },
  { value: "salaries", label: "Salaries", color: "default" as const },
  { value: "utilities", label: "Utilities", color: "warning" as const },
  { value: "logistics", label: "Logistics", color: "default" as const },
  { value: "supplier", label: "Supplier Payment", color: "success" as const },
  { value: "misc", label: "Miscellaneous", color: "secondary" as const },
];

export default function ExpensesPage() {
  const { currentBusiness } = useAuthStore();
  const [showAdd, setShowAdd] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("");

  const { data: expData, loading, refetch } = useApi<{ expenses: Expense[]; total: number }>(
    currentBusiness ? `/api/expenses?businessId=${currentBusiness.id}${categoryFilter ? `&category=${categoryFilter}` : ""}` : null,
    [currentBusiness?.id, categoryFilter]
  );

  const expenses = expData?.expenses || [];
  const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);

  const handleDelete = async (id: string) => {
    if (!currentBusiness || !confirm("Delete this expense?")) return;
    await apiDelete(`/api/expenses?id=${id}&businessId=${currentBusiness.id}`);
    refetch();
  };

  return (
    <div>
      <Header
        title="Expenses"
        description={`${expData?.total || 0} entries | Total: ${formatCurrency(totalAmount)}`}
        actions={
          <Button size="sm" onClick={() => setShowAdd(true)}>
            <Plus className="w-4 h-4 mr-1" /> Add Expense
          </Button>
        }
      />
      <div className="p-6 space-y-4">
        <div className="flex gap-3">
          <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="w-48">
            <option value="">All Categories</option>
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </Select>
        </div>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 space-y-3">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12" />)}
              </div>
            ) : expenses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                <Receipt className="w-12 h-12 mb-3 text-gray-300" />
                <p className="font-medium">No expenses recorded</p>
                <p className="text-sm">Track your business expenses here</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Recorded By</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell className="whitespace-nowrap">{formatDate(expense.date)}</TableCell>
                      <TableCell>
                        <Badge variant={EXPENSE_CATEGORIES.find((c) => c.value === expense.category)?.color || "default"} className="capitalize">
                          {expense.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[300px] truncate">{expense.description}</TableCell>
                      <TableCell className="text-right font-semibold text-red-600">{formatCurrency(expense.amount)}</TableCell>
                      <TableCell className="text-sm text-gray-500">{expense.user.name}</TableCell>
                      <TableCell className="text-right">
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500" onClick={() => handleDelete(expense.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent onClose={() => setShowAdd(false)}>
          <DialogHeader>
            <DialogTitle>Add Expense</DialogTitle>
          </DialogHeader>
          <ExpenseForm
            businessId={currentBusiness?.id || ""}
            onSuccess={() => { refetch(); setShowAdd(false); }}
            onCancel={() => setShowAdd(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ExpenseForm({ businessId, onSuccess, onCancel }: {
  businessId: string; onSuccess: () => void; onCancel: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    category: "misc" as string, amount: "", description: "", date: new Date().toISOString().split("T")[0],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiPost("/api/expenses", {
        businessId, category: form.category,
        amount: parseFloat(form.amount), description: form.description, date: form.date,
      });
      onSuccess();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium">Category *</label>
        <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
          {EXPENSE_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </Select>
      </div>
      <div>
        <label className="text-sm font-medium">Amount *</label>
        <Input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required placeholder="0.00" />
      </div>
      <div>
        <label className="text-sm font-medium">Description *</label>
        <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required placeholder="What was this expense for?" />
      </div>
      <div>
        <label className="text-sm font-medium">Date</label>
        <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
          Add Expense
        </Button>
      </div>
    </form>
  );
}
