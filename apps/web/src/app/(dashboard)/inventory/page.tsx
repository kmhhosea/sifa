"use client";

import React, { useState } from "react";
import {
  Package, Plus, Search, Filter, Edit, Trash2, ArrowUpDown,
  AlertTriangle, Loader2, PackagePlus,
} from "lucide-react";
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
import { useApi, apiPost, apiPut, apiDelete } from "@/hooks/use-api";
import { formatCurrency } from "@/lib/utils";

interface Product {
  id: string; name: string; sku?: string; costPrice: number; sellingPrice: number;
  currentStock: number; reorderLevel: number; unit: string; description?: string;
  categoryId?: string; category?: { id: string; name: string };
}
interface Category { id: string; name: string; _count?: { products: number } }

export default function InventoryPage() {
  const { currentBusiness } = useAuthStore();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showAddStock, setShowAddStock] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);

  const { data: productsData, loading, refetch } = useApi<{ products: Product[]; total: number }>(
    currentBusiness ? `/api/products?businessId=${currentBusiness.id}&search=${search}&categoryId=${categoryFilter}` : null,
    [currentBusiness?.id, search, categoryFilter]
  );
  const { data: categories } = useApi<Category[]>(
    currentBusiness ? `/api/categories?businessId=${currentBusiness.id}` : null,
    [currentBusiness?.id]
  );

  const handleDeleteProduct = async (id: string) => {
    if (!currentBusiness || !confirm("Are you sure you want to delete this product?")) return;
    await apiDelete(`/api/products?id=${id}&businessId=${currentBusiness.id}`);
    refetch();
  };

  const products = productsData?.products || [];

  return (
    <div>
      <Header
        title="Inventory"
        description={`${productsData?.total || 0} products`}
        actions={
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setShowAddStock(true)}>
              <PackagePlus className="w-4 h-4 mr-1" /> Add Stock
            </Button>
            <Button size="sm" onClick={() => setShowAddProduct(true)}>
              <Plus className="w-4 h-4 mr-1" /> Add Product
            </Button>
          </div>
        }
      />
      <div className="p-6 space-y-4">
        {/* Filters */}
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search products..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="">All Categories</option>
            {categories?.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
        </div>

        {/* Products Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 space-y-3">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12" />)}
              </div>
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                <Package className="w-12 h-12 mb-3 text-gray-300" />
                <p className="font-medium">No products found</p>
                <p className="text-sm">Add your first product to get started</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Cost</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                    <TableHead className="text-right">Margin</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => {
                    const margin = product.sellingPrice > 0
                      ? ((product.sellingPrice - product.costPrice) / product.sellingPrice * 100).toFixed(1)
                      : "0";
                    const isLowStock = product.currentStock <= product.reorderLevel;
                    const isOutOfStock = product.currentStock === 0;

                    return (
                      <TableRow key={product.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{product.name}</p>
                            {product.description && (
                              <p className="text-xs text-gray-500 truncate max-w-[200px]">{product.description}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-500">{product.sku || "-"}</TableCell>
                        <TableCell>
                          {product.category ? (
                            <Badge variant="secondary">{product.category.name}</Badge>
                          ) : "-"}
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(product.costPrice)}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(product.sellingPrice)}</TableCell>
                        <TableCell className="text-right">
                          <span className={isOutOfStock ? "text-red-600 font-bold" : isLowStock ? "text-amber-600 font-bold" : ""}>
                            {product.currentStock}
                          </span>
                          <span className="text-gray-400 text-xs ml-1">{product.unit}</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={parseFloat(margin) >= 30 ? "text-emerald-600" : parseFloat(margin) >= 15 ? "text-amber-600" : "text-red-600"}>
                            {margin}%
                          </span>
                        </TableCell>
                        <TableCell>
                          {isOutOfStock ? (
                            <Badge variant="danger">Out of Stock</Badge>
                          ) : isLowStock ? (
                            <Badge variant="warning">
                              <AlertTriangle className="w-3 h-3 mr-1" /> Low
                            </Badge>
                          ) : (
                            <Badge variant="success">In Stock</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditProduct(product)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500" onClick={() => handleDeleteProduct(product.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Product Dialog */}
      <ProductDialog
        open={showAddProduct || !!editProduct}
        onClose={() => { setShowAddProduct(false); setEditProduct(null); }}
        product={editProduct}
        categories={categories || []}
        businessId={currentBusiness?.id || ""}
        onSuccess={refetch}
      />

      {/* Add Stock Dialog */}
      <StockDialog
        open={showAddStock}
        onClose={() => setShowAddStock(false)}
        products={products}
        businessId={currentBusiness?.id || ""}
        onSuccess={refetch}
      />
    </div>
  );
}

function ProductDialog({
  open, onClose, product, categories, businessId, onSuccess,
}: {
  open: boolean; onClose: () => void; product: Product | null;
  categories: Category[]; businessId: string; onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "", sku: "", categoryId: "", description: "",
    costPrice: 0, sellingPrice: 0, currentStock: 0, reorderLevel: 10, unit: "pcs",
  });

  React.useEffect(() => {
    if (product) {
      setForm({
        name: product.name, sku: product.sku || "", categoryId: product.categoryId || "",
        description: product.description || "", costPrice: product.costPrice,
        sellingPrice: product.sellingPrice, currentStock: product.currentStock,
        reorderLevel: product.reorderLevel, unit: product.unit,
      });
    } else {
      setForm({ name: "", sku: "", categoryId: "", description: "", costPrice: 0, sellingPrice: 0, currentStock: 0, reorderLevel: 10, unit: "pcs" });
    }
  }, [product, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (product) {
        await apiPut("/api/products", { ...form, id: product.id, businessId, costPrice: Number(form.costPrice), sellingPrice: Number(form.sellingPrice), currentStock: Number(form.currentStock), reorderLevel: Number(form.reorderLevel) });
      } else {
        await apiPost("/api/products", { ...form, businessId, costPrice: Number(form.costPrice), sellingPrice: Number(form.sellingPrice), currentStock: Number(form.currentStock), reorderLevel: Number(form.reorderLevel) });
      }
      onSuccess();
      onClose();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent onClose={onClose}>
        <DialogHeader>
          <DialogTitle>{product ? "Edit Product" : "Add New Product"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-sm font-medium">Product Name *</label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <label className="text-sm font-medium">SKU</label>
              <Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium">Category</label>
              <Select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
                <option value="">Select category</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Cost Price *</label>
              <Input type="number" step="0.01" value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: parseFloat(e.target.value) || 0 })} required />
            </div>
            <div>
              <label className="text-sm font-medium">Selling Price *</label>
              <Input type="number" step="0.01" value={form.sellingPrice} onChange={(e) => setForm({ ...form, sellingPrice: parseFloat(e.target.value) || 0 })} required />
            </div>
            <div>
              <label className="text-sm font-medium">Current Stock</label>
              <Input type="number" value={form.currentStock} onChange={(e) => setForm({ ...form, currentStock: parseInt(e.target.value) || 0 })} />
            </div>
            <div>
              <label className="text-sm font-medium">Reorder Level</label>
              <Input type="number" value={form.reorderLevel} onChange={(e) => setForm({ ...form, reorderLevel: parseInt(e.target.value) || 0 })} />
            </div>
            <div>
              <label className="text-sm font-medium">Unit</label>
              <Select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}>
                <option value="pcs">Pieces</option>
                <option value="kg">Kilograms</option>
                <option value="ltr">Liters</option>
                <option value="box">Boxes</option>
                <option value="pack">Packs</option>
              </Select>
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
              {product ? "Update" : "Add Product"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function StockDialog({
  open, onClose, products, businessId, onSuccess,
}: {
  open: boolean; onClose: () => void; products: Product[];
  businessId: string; onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    productId: "", quantity: 1, type: "in" as string, costPrice: 0,
    transportCost: 0, taxCost: 0, storageCost: 0, supplier: "", notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiPost("/api/stock", {
        ...form, businessId,
        quantity: Number(form.quantity), costPrice: Number(form.costPrice),
        transportCost: Number(form.transportCost), taxCost: Number(form.taxCost),
        storageCost: Number(form.storageCost),
      });
      onSuccess();
      onClose();
      setForm({ productId: "", quantity: 1, type: "in", costPrice: 0, transportCost: 0, taxCost: 0, storageCost: 0, supplier: "", notes: "" });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent onClose={onClose}>
        <DialogHeader>
          <DialogTitle>Add Stock Entry</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-sm font-medium">Product *</label>
              <Select value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })} required>
                <option value="">Select product</option>
                {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Type *</label>
              <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="in">Stock In</option>
                <option value="out">Stock Out</option>
                <option value="adjustment">Adjustment</option>
                <option value="return">Return</option>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Quantity *</label>
              <Input type="number" min="1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) || 0 })} required />
            </div>
            <div>
              <label className="text-sm font-medium">Cost Price/Unit</label>
              <Input type="number" step="0.01" value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: parseFloat(e.target.value) || 0 })} />
            </div>
            <div>
              <label className="text-sm font-medium">Transport Cost</label>
              <Input type="number" step="0.01" value={form.transportCost} onChange={(e) => setForm({ ...form, transportCost: parseFloat(e.target.value) || 0 })} />
            </div>
            <div>
              <label className="text-sm font-medium">Tax Cost</label>
              <Input type="number" step="0.01" value={form.taxCost} onChange={(e) => setForm({ ...form, taxCost: parseFloat(e.target.value) || 0 })} />
            </div>
            <div>
              <label className="text-sm font-medium">Storage Cost</label>
              <Input type="number" step="0.01" value={form.storageCost} onChange={(e) => setForm({ ...form, storageCost: parseFloat(e.target.value) || 0 })} />
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium">Supplier</label>
              <Input value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} />
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium">Notes</label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
              Add Entry
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
