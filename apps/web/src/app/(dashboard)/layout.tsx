"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { useAuthStore } from "@/stores/auth-store";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, setUser, setBusinesses, setCurrentBusiness, currentBusiness } = useAuthStore();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) {
          router.push("/login");
          return;
        }
        const data = await res.json();
        setUser(data.user);
        setBusinesses(data.businesses);
        if (!currentBusiness && data.businesses.length > 0) {
          setCurrentBusiness(data.businesses[0]);
        }
      } catch {
        router.push("/login");
      }
    };

    if (!isAuthenticated) {
      checkAuth();
    }
  }, [isAuthenticated, router, setUser, setBusinesses, setCurrentBusiness, currentBusiness]);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
