import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

export async function POST() {
  try {
    // Check if already seeded
    const existingUser = await prisma.user.findUnique({ where: { email: "admin@bizsuite.app" } });
    if (existingUser) {
      return NextResponse.json({ message: "Already seeded" });
    }

    const hashedPassword = await hashPassword("admin123");

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        name: "Admin User",
        email: "admin@bizsuite.app",
        password: hashedPassword,
      },
    });

    // Create demo user
    const demoPassword = await hashPassword("demo123");
    const demo = await prisma.user.create({
      data: {
        name: "Demo Staff",
        email: "demo@bizsuite.app",
        password: demoPassword,
      },
    });

    // Create business
    const business = await prisma.business.create({
      data: {
        name: "TechMart Electronics",
        description: "Premium electronics and gadgets store",
        currency: "USD",
      },
    });

    // Add members
    await prisma.businessMember.createMany({
      data: [
        { userId: admin.id, businessId: business.id, role: "owner" },
        { userId: demo.id, businessId: business.id, role: "staff" },
      ],
    });

    // Create categories
    const categoryNames = [
      "Smartphones", "Laptops", "Accessories", "Audio", "Tablets",
      "Networking", "Storage", "Office Supplies",
    ];
    const categories = await Promise.all(
      categoryNames.map((name) =>
        prisma.category.create({ data: { name, businessId: business.id } })
      )
    );

    // Create products with realistic data
    const productData = [
      { name: "iPhone 16 Pro", sku: "IP16P-001", categoryIdx: 0, costPrice: 899, sellingPrice: 1199, currentStock: 45, reorderLevel: 10 },
      { name: "Samsung Galaxy S25", sku: "SGS25-001", categoryIdx: 0, costPrice: 699, sellingPrice: 999, currentStock: 38, reorderLevel: 10 },
      { name: "Google Pixel 9", sku: "GP9-001", categoryIdx: 0, costPrice: 599, sellingPrice: 849, currentStock: 22, reorderLevel: 8 },
      { name: "MacBook Pro 16\"", sku: "MBP16-001", categoryIdx: 1, costPrice: 1899, sellingPrice: 2499, currentStock: 15, reorderLevel: 5 },
      { name: "Dell XPS 15", sku: "DXP15-001", categoryIdx: 1, costPrice: 1199, sellingPrice: 1599, currentStock: 12, reorderLevel: 5 },
      { name: "ThinkPad X1 Carbon", sku: "TPX1-001", categoryIdx: 1, costPrice: 1099, sellingPrice: 1449, currentStock: 8, reorderLevel: 5 },
      { name: "USB-C Hub 7-in-1", sku: "USBC7-001", categoryIdx: 2, costPrice: 25, sellingPrice: 49.99, currentStock: 120, reorderLevel: 30 },
      { name: "Wireless Mouse", sku: "WM-001", categoryIdx: 2, costPrice: 15, sellingPrice: 29.99, currentStock: 85, reorderLevel: 20 },
      { name: "Laptop Stand", sku: "LS-001", categoryIdx: 2, costPrice: 20, sellingPrice: 44.99, currentStock: 60, reorderLevel: 15 },
      { name: "AirPods Pro 3", sku: "APP3-001", categoryIdx: 3, costPrice: 179, sellingPrice: 249, currentStock: 35, reorderLevel: 10 },
      { name: "Sony WH-1000XM6", sku: "SNWH6-001", categoryIdx: 3, costPrice: 249, sellingPrice: 349, currentStock: 20, reorderLevel: 8 },
      { name: "JBL Charge 6", sku: "JBLC6-001", categoryIdx: 3, costPrice: 99, sellingPrice: 179, currentStock: 28, reorderLevel: 10 },
      { name: "iPad Air M3", sku: "IPAM3-001", categoryIdx: 4, costPrice: 499, sellingPrice: 699, currentStock: 18, reorderLevel: 5 },
      { name: "Samsung Tab S10", sku: "STS10-001", categoryIdx: 4, costPrice: 399, sellingPrice: 599, currentStock: 14, reorderLevel: 5 },
      { name: "Wi-Fi 7 Router", sku: "WF7R-001", categoryIdx: 5, costPrice: 149, sellingPrice: 249, currentStock: 25, reorderLevel: 8 },
      { name: "1TB NVMe SSD", sku: "NVME1-001", categoryIdx: 6, costPrice: 59, sellingPrice: 99.99, currentStock: 50, reorderLevel: 15 },
      { name: "4TB External HDD", sku: "EXT4-001", categoryIdx: 6, costPrice: 75, sellingPrice: 129.99, currentStock: 30, reorderLevel: 10 },
      { name: "Mechanical Keyboard", sku: "MK-001", categoryIdx: 2, costPrice: 45, sellingPrice: 89.99, currentStock: 40, reorderLevel: 10 },
      { name: "Monitor Arm", sku: "MA-001", categoryIdx: 7, costPrice: 30, sellingPrice: 59.99, currentStock: 5, reorderLevel: 10 },
      { name: "Webcam 4K", sku: "WC4K-001", categoryIdx: 2, costPrice: 55, sellingPrice: 99.99, currentStock: 3, reorderLevel: 8 },
    ];

    const products = await Promise.all(
      productData.map((p) =>
        prisma.product.create({
          data: {
            name: p.name,
            sku: p.sku,
            categoryId: categories[p.categoryIdx].id,
            businessId: business.id,
            costPrice: p.costPrice,
            sellingPrice: p.sellingPrice,
            currentStock: p.currentStock,
            reorderLevel: p.reorderLevel,
          },
        })
      )
    );

    // Create sales transactions over the last 30 days
    const paymentMethods = ["cash", "card", "mobile"];
    const now = Date.now();

    for (let day = 30; day >= 0; day--) {
      const salesPerDay = Math.floor(Math.random() * 5) + 2;
      for (let s = 0; s < salesPerDay; s++) {
        const itemCount = Math.floor(Math.random() * 3) + 1;
        const selectedProducts = [...products].sort(() => Math.random() - 0.5).slice(0, itemCount);
        const items = selectedProducts.map((p) => {
          const qty = Math.floor(Math.random() * 3) + 1;
          return {
            productId: p.id,
            quantity: qty,
            unitPrice: p.sellingPrice,
            costPrice: p.costPrice,
            discount: 0,
            total: p.sellingPrice * qty,
          };
        });
        const subtotal = items.reduce((s, i) => s + i.total, 0);
        const discount = Math.random() > 0.8 ? Math.round(subtotal * 0.05) : 0;
        const total = subtotal - discount;
        const date = new Date(now - day * 86400000 + Math.floor(Math.random() * 86400000));

        await prisma.transaction.create({
          data: {
            businessId: business.id,
            userId: Math.random() > 0.3 ? admin.id : demo.id,
            type: "sale",
            status: "completed",
            subtotal,
            discount,
            tax: 0,
            total,
            amountPaid: total,
            paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
            createdAt: date,
            items: { create: items },
          },
        });
      }
    }

    // Create expenses
    const expenseCategories = [
      { category: "rent", desc: "Monthly store rent", amount: 3500 },
      { category: "salaries", desc: "Employee salaries", amount: 8500 },
      { category: "utilities", desc: "Electricity & Internet", amount: 450 },
      { category: "logistics", desc: "Shipping & delivery costs", amount: 1200 },
      { category: "supplier", desc: "Supplier payment - Electronics", amount: 15000 },
      { category: "misc", desc: "Office cleaning service", amount: 200 },
      { category: "utilities", desc: "Water bill", amount: 85 },
      { category: "misc", desc: "Marketing materials", amount: 350 },
      { category: "logistics", desc: "Courier service", amount: 680 },
      { category: "rent", desc: "Warehouse storage", amount: 1200 },
    ];

    for (let i = 0; i < expenseCategories.length; i++) {
      const e = expenseCategories[i];
      const daysAgo = Math.floor(Math.random() * 30);
      await prisma.expense.create({
        data: {
          businessId: business.id,
          userId: admin.id,
          category: e.category,
          amount: e.amount,
          description: e.desc,
          date: new Date(now - daysAgo * 86400000),
        },
      });
    }

    // Create stock entries
    for (const p of products.slice(0, 8)) {
      await prisma.stockEntry.create({
        data: {
          productId: p.id,
          businessId: business.id,
          quantity: 50,
          type: "in",
          costPrice: p.costPrice,
          transportCost: p.costPrice * 0.02,
          taxCost: p.costPrice * 0.05,
          storageCost: 5,
          totalLandedCost: (p.costPrice + p.costPrice * 0.02 + p.costPrice * 0.05 + 5) * 50,
          supplier: "Global Electronics Ltd",
          notes: "Initial stock",
          userId: admin.id,
          createdAt: new Date(now - 25 * 86400000),
        },
      });
    }

    // Create notifications
    await prisma.notification.createMany({
      data: [
        {
          businessId: business.id,
          userId: admin.id,
          type: "low_stock",
          title: "Low Stock Alert",
          message: "Webcam 4K is running low (3 pcs remaining)",
        },
        {
          businessId: business.id,
          userId: admin.id,
          type: "low_stock",
          title: "Low Stock Alert",
          message: "Monitor Arm is running low (5 pcs remaining)",
        },
        {
          businessId: business.id,
          userId: admin.id,
          type: "sales_spike",
          title: "Sales Spike Detected",
          message: "iPhone 16 Pro sales increased by 45% this week",
        },
      ],
    });

    return NextResponse.json({
      message: "Database seeded successfully",
      credentials: {
        admin: { email: "admin@bizsuite.app", password: "admin123" },
        demo: { email: "demo@bizsuite.app", password: "demo123" },
      },
    });
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json({ error: "Seed failed: " + String(error) }, { status: 500 });
  }
}
