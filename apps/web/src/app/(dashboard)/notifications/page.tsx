"use client";

import React from "react";
import { Bell, AlertTriangle, TrendingUp, TrendingDown, Check, CheckCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/layout/header";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/stores/auth-store";
import { useApi, apiPut } from "@/hooks/use-api";
import { formatDateTime } from "@/lib/utils";

interface Notification {
  id: string; type: string; title: string; message: string;
  isRead: boolean; createdAt: string;
}

const typeIcons: Record<string, React.ReactNode> = {
  low_stock: <AlertTriangle className="w-5 h-5 text-amber-500" />,
  sales_spike: <TrendingUp className="w-5 h-5 text-emerald-500" />,
  sales_drop: <TrendingDown className="w-5 h-5 text-red-500" />,
  expense_warning: <AlertTriangle className="w-5 h-5 text-red-500" />,
};

export default function NotificationsPage() {
  const { currentBusiness } = useAuthStore();

  const { data, loading, refetch } = useApi<{ notifications: Notification[]; unreadCount: number }>(
    currentBusiness ? `/api/notifications?businessId=${currentBusiness.id}` : null,
    [currentBusiness?.id]
  );

  const markAsRead = async (id: string) => {
    await apiPut("/api/notifications", { id });
    refetch();
  };

  const markAllRead = async () => {
    if (!currentBusiness) return;
    await apiPut("/api/notifications", { markAllRead: true, businessId: currentBusiness.id });
    refetch();
  };

  const notifications = data?.notifications || [];
  const unreadCount = data?.unreadCount || 0;

  return (
    <div>
      <Header
        title="Notifications"
        description={`${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}`}
        actions={
          unreadCount > 0 ? (
            <Button size="sm" variant="outline" onClick={markAllRead}>
              <CheckCheck className="w-4 h-4 mr-1" /> Mark All Read
            </Button>
          ) : undefined
        }
      />
      <div className="p-6 space-y-3">
        {loading ? (
          [...Array(5)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)
        ) : notifications.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="font-medium text-gray-500">No notifications</p>
              <p className="text-sm text-gray-400 mt-1">You&apos;re all caught up!</p>
            </CardContent>
          </Card>
        ) : (
          notifications.map((notification) => (
            <Card
              key={notification.id}
              className={`transition-colors ${
                !notification.isRead
                  ? "bg-blue-50/50 dark:bg-blue-900/5 border-blue-200 dark:border-blue-800"
                  : ""
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {typeIcons[notification.type] || <Bell className="w-5 h-5 text-gray-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{notification.title}</p>
                      {!notification.isRead && <Badge variant="default" className="text-[10px] px-1.5">New</Badge>}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">{notification.message}</p>
                    <p className="text-xs text-gray-400 mt-1">{formatDateTime(notification.createdAt)}</p>
                  </div>
                  {!notification.isRead && (
                    <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={() => markAsRead(notification.id)}>
                      <Check className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
