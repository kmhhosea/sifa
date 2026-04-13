export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: string;
}

export interface Business {
  id: string;
  name: string;
  description?: string;
  currency: string;
  logo?: string;
  createdAt: string;
}

export interface BusinessMember {
  id: string;
  userId: string;
  businessId: string;
  role: string;
  joinedAt: string;
  user: User;
}

export interface Category {
  id: string;
  name: string;
  businessId: string;
  _count?: { products: number };
}

export interface Product {
  id: string;
  name: string;
  sku?: string;
  categoryId?: string;
  businessId: string;
  description?: string;
  costPrice: number;
  sellingPrice: number;
  currentStock: number;
  reorderLevel: number;
  unit: string;
  isActive: boolean;
  createdAt: string;
  category?: Category;
}

export interface StockEntry {
  id: string;
  productId: string;
  quantity: number;
  type: string;
  costPrice: number;
  transportCost: number;
  taxCost: number;
  storageCost: number;
  totalLandedCost: number;
  supplier?: string;
  notes?: string;
  userId: string;
  createdAt: string;
  product: Product;
  user: User;
}

export interface TransactionItem {
  id: string;
  transactionId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  costPrice: number;
  discount: number;
  total: number;
  product: Product;
}

export interface Transaction {
  id: string;
  businessId: string;
  userId: string;
  type: string;
  status: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  amountPaid: number;
  paymentMethod: string;
  customerName?: string;
  customerPhone?: string;
  notes?: string;
  createdAt: string;
  items: TransactionItem[];
  user: User;
}

export interface Expense {
  id: string;
  businessId: string;
  userId: string;
  category: string;
  amount: number;
  description: string;
  date: string;
  createdAt: string;
  user: User;
}

export interface AuditLog {
  id: string;
  businessId: string;
  userId: string;
  action: string;
  entity: string;
  entityId?: string;
  details?: string;
  createdAt: string;
  user: User;
}

export interface Notification {
  id: string;
  businessId: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface DashboardStats {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  totalProducts: number;
  totalTransactions: number;
  lowStockProducts: number;
  revenueChange: number;
  profitChange: number;
  recentTransactions: Transaction[];
  topProducts: { name: string; revenue: number; quantity: number }[];
  revenueByDay: { date: string; revenue: number; expenses: number; profit: number }[];
  expensesByCategory: { category: string; amount: number }[];
}

export type Role = "owner" | "manager" | "accountant" | "staff" | "viewer";

export const ROLE_PERMISSIONS: Record<Role, string[]> = {
  owner: ["*"],
  manager: [
    "inventory:read", "inventory:write",
    "sales:read", "sales:write",
    "expenses:read", "expenses:write",
    "reports:read",
    "analytics:read",
    "team:read",
    "audit:read",
    "notifications:read",
    "settings:read",
  ],
  accountant: [
    "inventory:read",
    "sales:read", "sales:write",
    "expenses:read", "expenses:write",
    "reports:read",
    "analytics:read",
    "notifications:read",
  ],
  staff: [
    "inventory:read",
    "sales:read", "sales:write",
    "expenses:read",
    "notifications:read",
  ],
  viewer: [
    "inventory:read",
    "sales:read",
    "expenses:read",
    "reports:read",
    "analytics:read",
    "notifications:read",
  ],
};

export function hasPermission(role: Role, permission: string): boolean {
  const perms = ROLE_PERMISSIONS[role];
  if (!perms) return false;
  if (perms.includes("*")) return true;
  return perms.includes(permission);
}
