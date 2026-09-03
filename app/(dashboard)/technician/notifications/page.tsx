"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Bell,
  CheckCheck,
  CreditCard,
  Loader2,
  ShieldCheck,
  Trash2,
  Wrench,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";

import { StatusBadge } from "@/components/customer-portal/StatusBadge";
import {
  AdminSurface,
  TechnicianRouteShell,
} from "@/components/technician/TechnicianRouteShell";
import { Button } from "@/components/ui/Button";
import {
  useGetNotificationsQuery,
  useMarkAllNotificationsAsReadMutation,
  useMarkNotificationAsReadMutation,
  useDeleteNotificationMutation,
} from "@/redux/api/notificationsApi";
import {
  getTechnicianNotificationHref,
  getTechnicianNotifications,
} from "@/data/mock/technician-dashboard";
import { formatLongDate } from "@/lib/formatters";

type FilterTab = "all" | "unread" | "service-update" | "system";

function getNotificationIcon(type?: string) {
  if (type === "payment") return CreditCard;
  if (type === "system") return ShieldCheck;
  if (type === "service-update") return Wrench;
  return Bell;
}

export default function TechnicianNotificationsPage() {
  const [activeTab, setActiveTab] = useState<FilterTab>("all");

  const { data: apiNotificationsData, isLoading } = useGetNotificationsQuery();
  const [markAllAsRead, { isLoading: isMarkingAll }] = useMarkAllNotificationsAsReadMutation();
  const [markSingleAsRead] = useMarkNotificationAsReadMutation();
  const [deleteNotification] = useDeleteNotificationMutation();

  const mockFallback = getTechnicianNotifications();
  const rawNotifications =
    apiNotificationsData?.items && apiNotificationsData.items.length > 0
      ? apiNotificationsData.items
      : mockFallback;

  const filteredNotifications = rawNotifications.filter((notif) => {
    if (activeTab === "unread") return !notif.isRead;
    if (activeTab === "service-update") return notif.type === "service-update";
    if (activeTab === "system") return notif.type === "system";
    return true;
  });

  const unreadCount = rawNotifications.filter((n) => !n.isRead).length;

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead().unwrap();
      toast.success("All technician notifications marked as read.");
    } catch {
      toast.error("Failed to mark all as read.");
    }
  };

  const handleMarkSingle = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await markSingleAsRead(id).unwrap();
      toast.success("Notification marked as read.");
    } catch {
      toast.error("Failed to update notification.");
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await deleteNotification(id).unwrap();
      toast.success("Notification removed.");
    } catch {
      toast.error("Failed to delete notification.");
    }
  };

  return (
    <TechnicianRouteShell
      eyebrow="Updates"
      title="Notifications"
      description="Assignment changes, reminders, admin notes, and service report updates."
      action={
        <Button
          variant="outline"
          onClick={handleMarkAllRead}
          disabled={isMarkingAll || unreadCount === 0}
          className="gap-2"
        >
          {isMarkingAll ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <CheckCheck className="text-teal-700" size={16} />
          )}
          Mark all as read
        </Button>
      }
    >
      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200/80 pb-3">
        {(
          [
            { key: "all", label: "All Updates" },
            { key: "unread", label: `Unread (${unreadCount})` },
            { key: "service-update", label: "Job & Dispatch Updates" },
            { key: "system", label: "System Alerts" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            type="button"
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
              activeTab === tab.key
                ? "bg-teal-800 text-white shadow-xs"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-4">
        {isLoading ? (
          <AdminSurface>
            <div className="flex items-center justify-center p-8 text-slate-500">
              <Loader2 size={22} className="animate-spin text-teal-700 mr-2" />
              Loading technician notifications...
            </div>
          </AdminSurface>
        ) : filteredNotifications.length === 0 ? (
          <AdminSurface>
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <div className="flex size-11 items-center justify-center rounded-full bg-teal-50 text-teal-800">
                <Bell size={20} />
              </div>
              <p className="mt-3 text-sm font-semibold text-slate-900">
                No notifications found
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {activeTab === "unread"
                  ? "You have completed all pending updates!"
                  : "No updates found for this category."}
              </p>
            </div>
          </AdminSurface>
        ) : (
          filteredNotifications.map((notification) => {
            const Icon = getNotificationIcon(notification.type);
            const relatedJobHref =
              getTechnicianNotificationHref(notification.id) || "/technician/jobs";

            return (
              <AdminSurface key={notification.id}>
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="flex gap-4">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-md border border-teal-200 bg-teal-50 text-teal-800 shadow-xs">
                      <Icon size={18} />
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-base font-semibold text-slate-900">
                          {notification.title}
                        </h2>
                        {!notification.isRead ? (
                          <StatusBadge label="Unread" status="pending" />
                        ) : null}
                      </div>
                      <p className="mt-1.5 max-w-3xl text-sm leading-6 text-slate-600">
                        {notification.message}
                      </p>
                      {notification.ctaLabel ? (
                        <div className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700">
                          {notification.ctaLabel}
                          <ArrowRight size={13} />
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col items-start gap-3 md:items-end">
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-slate-400">
                        {formatLongDate(notification.createdAt)}
                      </p>
                      <button
                        onClick={(e) => handleDelete(e, notification.id)}
                        title="Delete notification"
                        type="button"
                        className="rounded-md p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {!notification.isRead ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => handleMarkSingle(e, notification.id)}
                          className="h-8 text-xs"
                        >
                          Mark as Read
                        </Button>
                      ) : null}
                      <Button asChild size="sm" className="h-8 text-xs">
                        <Link
                          href={relatedJobHref}
                          onClick={(e) => {
                            if (!notification.isRead) {
                              handleMarkSingle(e, notification.id);
                            }
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
          })
        )}
      </div>
    </TechnicianRouteShell>
  );
}
