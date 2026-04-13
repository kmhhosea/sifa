"use client";

import React from "react";
import { Bell, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/stores/auth-store";

interface HeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export function Header({ title, description, actions }: HeaderProps) {
  const { currentBusiness } = useAuthStore();

  return (
    <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 sticky top-0 z-10">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h1>
        {description && (
          <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
        )}
      </div>
      <div className="flex items-center gap-3">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input placeholder="Search..." className="pl-9 w-64" />
        </div>
        {actions}
        {currentBusiness && (
          <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md hidden lg:block">
            {currentBusiness.currency}
          </span>
        )}
      </div>
    </div>
  );
}
