"use client";

import React from "react";
import { ThemeProvider } from "@/components/layout/theme-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}
