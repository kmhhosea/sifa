"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface TabsProps {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

function Tabs({ value, onValueChange, children, className }: TabsProps) {
  return (
    <div className={cn("w-full", className)} data-value={value} data-onchange={String(onValueChange)}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<{ value?: string; activeValue?: string; onValueChange?: (v: string) => void }>, {
            activeValue: value,
            onValueChange,
          });
        }
        return child;
      })}
    </div>
  );
}

interface TabsListProps {
  children: React.ReactNode;
  className?: string;
  activeValue?: string;
  onValueChange?: (value: string) => void;
}

function TabsList({ children, className, activeValue, onValueChange }: TabsListProps) {
  return (
    <div className={cn("inline-flex h-10 items-center justify-center rounded-lg bg-gray-100 p-1 dark:bg-gray-800", className)}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<{ activeValue?: string; onValueChange?: (v: string) => void }>, {
            activeValue,
            onValueChange,
          });
        }
        return child;
      })}
    </div>
  );
}

interface TabsTriggerProps {
  value: string;
  children: React.ReactNode;
  className?: string;
  activeValue?: string;
  onValueChange?: (value: string) => void;
}

function TabsTrigger({ value, children, className, activeValue, onValueChange }: TabsTriggerProps) {
  const isActive = activeValue === value;
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-all",
        isActive
          ? "bg-white text-gray-900 shadow-sm dark:bg-gray-950 dark:text-gray-100"
          : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100",
        className
      )}
      onClick={() => onValueChange?.(value)}
    >
      {children}
    </button>
  );
}

interface TabsContentProps {
  value: string;
  children: React.ReactNode;
  className?: string;
  activeValue?: string;
}

function TabsContent({ value, children, className, activeValue }: TabsContentProps) {
  if (activeValue !== value) return null;
  return <div className={cn("mt-4", className)}>{children}</div>;
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
