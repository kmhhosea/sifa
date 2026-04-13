"use client";

import React, { useState } from "react";
import { ShoppingCart, Plus, Loader2, Trash2, DollarSign } from "lucide-react";
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
import { useApi, apiPost } from "@/hooks/use-api";
import { formatCurrency, formatDateTime } from "@/lib/utils";

interface Product { id: string; name: string; sellingPrice: number; costPrice: number; currentStock: number; unit: string }
interface Transaction {
  id: string; type: string; status: string; subtotal: number; discount: number; tax: number;
  total: number; amountPaid: number; paymentMethod: string; customerName?: string; createdAt: string;
  items: { id: string; quantity: number; unitPrice: number; total: number; product: { name: string } }[];
  user: { name: string };
}

export default function SalesPage() {
  const { currentBusiness } = useAuthStore();
  const [showNewSale, setShowNewSale] = useState(false);

  const { data: txData, loading, refetch } = useApi<{ transactions: Transaction[]; total: number }>(
    currentBusiness ? `/api/transactions?businessId=${currentBusiness.id}` : null,
    [currentBusiness?.id]
  );

  const transactions = txData?.transactions || [];

  const statusColor: Record<string, "success" | "warning" | "danger" | "default"> = {
    completed: "success", partial: "warning", pending: "danger", refunded: "default",
  };

  return (
    <div>
      <Header
        title="Sales"
        description={`${txData?.total || 0} transactions`}
        actions={
          <Button size="sm" onClick={() => setShowNewSale(true)}>
            <Plus className="w-4 h-4 mr-1" /> New Sale
          </Button>
        }
      />
      <div className="p-6">
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 space-y-3">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12" />)}
              </div>
            ) : transactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                <ShoppingCart className="w-12 h-12 mb-3 text-gray-300" />
                <p className="font-medium">No sales recorded</p>
                <p className="text-sm">Create your first sale to get started</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Sold By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="whitespace-nowrap text-sm">{formatDateTime(tx.createdAt)}</TableCell>
                      <TableCell>
                        <div className="max-w-[200px]">
                          {tx.items.map((item, i) => (
                            <span key={item.id} className="text-sm">
                              {item.product.name} x{item.quantity}
                              {i < tx.items.length - 1 ? ", " : ""}
                            </span>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{tx.customerName || "-"}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="capitalize">{tx.paymentMethod}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusColor[tx.status] || "default"} className="capitalize">{tx.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold">{formatCurrency(tx.total)}</TableCell>
                      <TableCell className="text-sm text-gray-500">{tx.user.name}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <NewSaleDialog
        open={showNewSale}
        onClose={() => setShowNewSale(false)}
        businessId={currentBusiness?.id || ""}
        onSuccess={refetch}
      />
    </div>
  );
}

function NewSaleDialog({ open, onClose, businessId, onSuccess }: {
  open: boolean; onClose: () => void; businessId: string; onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<{ productId: string; quantity: number; unitPrice: number; discount: number }[]>([]);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [amountPaid, setAmountPaid] = useState<string>("");
  const [customerName, setCustomerName] = useState("");
  const [notes, setNotes] = useState("");
  const [discount, setDiscount] = useState(0);

  const { data: productsData } = useApi<{ products: Product[] }>(
    businessId ? `/api/products?businessId=${businessId}&limit=200` : null,
    [businessId]
  );
  const products = productsData?.products || [];

  const addItem = () => setItems([...items, { productId: "", quantity: 1, unitPrice: 0, discount: 0 }]);
  const removeItem = (index: number) => setItems(items.filter((_, i) => i !== index));
  const updateItem = (index: number, field: string, value: string | number) => {
    const newItems = [...items];
    (newItems[index] as Record<string, string | number>)[field] = value;
    if (field === "productId") {
      const product = products.find((p) => p.id === value);
      if (product) newItems[index].unitPrice = product.sellingPrice;
    }
    setItems(newItems);
  };

  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity - item.discount, 0);
  const total = subtotal - discount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0 || items.some((i) => !i.productId)) {
      alert("Please add at least one product");
      return;
    }
    setLoading(true);
    try {
      await apiPost("/api/transactions", {
        businessId, items, discount, paymentMethod,
        amountPaid: amountPaid ? parseFloat(amountPaid) : total,
        customerName: customerName || undefined,
        notes: notes || undefined,
      });
      onSuccess();
      onClose();
      setItems([]);
      setDiscount(0);
      setCustomerName("");
      setNotes("");
      setAmountPaid("");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl" onClose={onClose}>
        <DialogHeader>
          <DialogTitle>New Sale</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Items</label>
              <Button type="button" size="sm" variant="outline" onClick={addItem}>
                <Plus className="w-3 h-3 mr-1" /> Add Item
              </Button>
            </div>
            {items.map((item, index) => (
              <div key={index} className="flex gap-2 items-end">
                <div className="flex-1">
                  <Select value={item.productId} onChange={(e) => updateItem(index, "productId", e.target.value)} required>
                    <option value="">Select product</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.currentStock} {p.unit})
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="w-20">
                  <Input type="number" min="1" placeholder="Qty" value={item.quantity}
                    onChange={(e) => updateItem(index, "quantity", parseInt(e.target.value) || 1)} />
                </div>
                <div className="w-28">
                  <Input type="number" step="0.01" placeholder="Price" value={item.unitPrice}
                    onChange={(e) => updateItem(index, "unitPrice", parseFloat(e.target.value) || 0)} />
                </div>
                <Button type="button" size="icon" variant="ghost" className="h-10 w-10 text-red-500" onClick={() => removeItem(index)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
            {items.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">Click &quot;Add Item&quot; to add products to this sale</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Payment Method</label>
              <Select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="mobile">Mobile Money</option>
                <option value="credit">Credit</option>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Amount Paid</label>
              <Input type="number" step="0.01" placeholder={total.toFixed(2)} value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">Customer Name</label>
              <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Optional" />
            </div>
            <div>
              <label className="text-sm font-medium">Discount</label>
              <Input type="number" step="0.01" value={discount}
                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)} />
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium">Notes</label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Optional" />
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <div className="text-sm text-gray-500">
              <p>Subtotal: {formatCurrency(subtotal)}</p>
              {discount > 0 && <p>Discount: -{formatCurrency(discount)}</p>}
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-emerald-600">{formatCurrency(total)}</p>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={loading || items.length === 0}>
              {loading && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
              <DollarSign className="w-4 h-4 mr-1" /> Complete Sale
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
