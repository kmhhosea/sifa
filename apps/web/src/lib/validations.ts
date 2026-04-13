import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  businessName: z.string().min(2, "Business name must be at least 2 characters"),
});

export const productSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  sku: z.string().optional(),
  categoryId: z.string().optional(),
  description: z.string().optional(),
  costPrice: z.number().min(0, "Cost price must be positive"),
  sellingPrice: z.number().min(0, "Selling price must be positive"),
  currentStock: z.number().int().min(0).optional(),
  reorderLevel: z.number().int().min(0).optional(),
  unit: z.string().optional(),
});

export const stockEntrySchema = z.object({
  productId: z.string().min(1, "Product is required"),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
  type: z.enum(["in", "out", "adjustment", "return"]),
  costPrice: z.number().min(0).optional(),
  transportCost: z.number().min(0).optional(),
  taxCost: z.number().min(0).optional(),
  storageCost: z.number().min(0).optional(),
  supplier: z.string().optional(),
  notes: z.string().optional(),
});

export const transactionSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string(),
      quantity: z.number().int().min(1),
      unitPrice: z.number().min(0),
      discount: z.number().min(0).optional(),
    })
  ).min(1, "At least one item is required"),
  discount: z.number().min(0).optional(),
  tax: z.number().min(0).optional(),
  paymentMethod: z.enum(["cash", "card", "mobile", "credit"]),
  amountPaid: z.number().min(0).optional(),
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  notes: z.string().optional(),
});

export const expenseSchema = z.object({
  category: z.enum(["rent", "salaries", "utilities", "logistics", "supplier", "misc"]),
  amount: z.number().min(0.01, "Amount must be positive"),
  description: z.string().min(1, "Description is required"),
  date: z.string().optional(),
});

export const categorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
});

export const teamMemberSchema = z.object({
  email: z.string().email("Invalid email"),
  role: z.enum(["manager", "accountant", "staff", "viewer"]),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ProductInput = z.infer<typeof productSchema>;
export type StockEntryInput = z.infer<typeof stockEntrySchema>;
export type TransactionInput = z.infer<typeof transactionSchema>;
export type ExpenseInput = z.infer<typeof expenseSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
export type TeamMemberInput = z.infer<typeof teamMemberSchema>;
