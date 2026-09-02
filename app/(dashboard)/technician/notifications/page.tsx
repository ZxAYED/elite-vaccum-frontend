"use client";

import Link from "next/link";
import { useState } from "react";
import { Bell, CreditCard, ShieldCheck, Wrench } from "lucide-react";

import { StatusBadge } from "@/components/customer-portal/StatusBadge";
import {
  AdminSurface,
  TechnicianRouteShell,
} from "@/components/technician/TechnicianRouteShell";
import { Button } from "@/components/ui/Button";
import {
  getTechnicianNotificationHref,
  getTechnicianNotifications,
  markAllTechnicianNotificationsRead,
  markTechnicianNotificationRead,
} from "@/data/mock/technician-dashboard";
import { useSharedAdminScheduleStateVersion } from "@/hooks/useSharedAdminScheduleStateVersion";
import { formatLongDate } from "@/lib/formatters";

function getNotificationIcon(type: string) {
  if (type === "payment") return CreditCard;
  if (type === "system") return ShieldCheck;
  if (type === "service-update") return Wrench;
  return Bell;
}

export default function TechnicianNotificationsPage() {
  useSharedAdminScheduleStateVersion();
  const [version, setVersion] = useState(0);
  const notifications = getTechnicianNotifications();

  return (
    <TechnicianRouteShell
      eyebrow="Updates"
      title="Notifications"
      description="Assignment changes, reminders, admin notes, and service report updates."
      action={
        <Button
          variant="outline"
          onClick={() => {
            markAllTechnicianNotificationsRead();
            setVersion((current) => current + 1);
          }}
        >
          Mark all as read
        </Button>
      }
    >
      <div className="space-y-4" data-version={version}>
        {notifications.length === 0 ? (
          <AdminSurface>
            <p className="text-sm text-slate-600">
              No notifications right now.
            </p>
          </AdminSurface>
        ) : notifications.map((notification) => {
          const Icon = getNotificationIcon(notification.type);

          return (
            <AdminSurface key={notification.id}>
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="flex gap-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-md border border-teal-200 bg-teal-50 text-teal-800 shadow-xs">
                    <Icon size={18} />
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-lg font-semibold text-slate-900">
                        {notification.title}
                      </h2>
                      {!notification.isRead ? (
                        <StatusBadge label="Unread" status="pending" />
                      ) : null}
                    </div>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                      {notification.message}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 flex-col items-start gap-3 md:items-end">
                  <p className="text-sm text-slate-500">
                    {formatLongDate(notification.createdAt)}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {!notification.isRead ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          markTechnicianNotificationRead(notification.id);
                          setVersion((current) => current + 1);
                        }}
                      >
                        Mark as Read
                      </Button>
                    ) : null}
                    <Button asChild size="sm">
                      <Link
                        href={getTechnicianNotificationHref(notification.id)}
                        onClick={() => {
                          markTechnicianNotificationRead(notification.id);
                          setVersion((current) => current + 1);
                        }}
                      >
                        Open Related Job
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </AdminSurface>
          );
        })}
      </div>
    </TechnicianRouteShell>
  );
}
