"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Bell,
  CheckCheck,
  CreditCard,
  Plus,
  ShieldCheck,
  Trash2,
  Wrench,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

import { StatusBadge } from "@/components/customer-portal/StatusBadge";
import { Button } from "@/components/ui/Button";
import { AdminEnqueueNotificationModal } from "@/components/admin/notifications/AdminEnqueueNotificationModal";
import {
  useGetNotificationsQuery,
  useMarkAllNotificationsAsReadMutation,
  useMarkNotificationAsReadMutation,
  useDeleteNotificationMutation,
} from "@/redux/api/notificationsApi";
import { formatLongDate } from "@/lib/formatters";

type FilterTab = "all" | "unread" | "payment" | "service-update" | "system";

const adminNotificationHrefById: Record<string, string> = {
  "notif-1001": "/admin/service-requests",
  "notif-1002": "/admin/service-requests",
  "notif-1003": "/admin/financials",
  "notif-1004": "/admin/service-requests",
};

function getNotificationIcon(type?: string) {
  if (type === "payment") return CreditCard;
  if (type === "system") return ShieldCheck;
  if (type === "service-update") return Wrench;
  return Bell;
}

export default function AdminNotificationsPage() {
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [isEnqueueModalOpen, setIsEnqueueModalOpen] = useState(false);

  const { data: apiNotificationsData, isLoading } = useGetNotificationsQuery();
  const [markAllAsRead, { isLoading: isMarkingAll }] = useMarkAllNotificationsAsReadMutation();
  const [markSingleAsRead] = useMarkNotificationAsReadMutation();
  const [deleteNotification] = useDeleteNotificationMutation();

  const rawNotifications =
    apiNotificationsData?.items && apiNotificationsData.items.length > 0
      ? apiNotificationsData.items
      : [];

  const filteredNotifications = rawNotifications.filter((notif) => {
    if (activeTab === "unread") return !notif.isRead;
    if (activeTab === "payment") return notif.type === "payment";
    if (activeTab === "service-update") return notif.type === "service-update";
    if (activeTab === "system") return notif.type === "system";
    return true;
  });

  const unreadCount = rawNotifications.filter((n) => !n.isRead).length;

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead().unwrap();
      toast.success("All notifications marked as read.");
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
    <main className="min-h-screen bg-[#f4f7f7] text-slate-950">
      <section className="space-y-6">
        <div className="flex flex-col gap-4 rounded-xl border border-teal-100 bg-white p-5 shadow-[0_18px_56px_-44px_rgba(28,79,80,0.35)] sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.26em] text-teal-700">
              Admin Updates
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-teal-950">
              Notifications
            </h1>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
              Review service, payment, and system updates from the admin control center.
              {unreadCount > 0 ? (
                <span className="ml-2 font-semibold text-teal-800">
                  ({unreadCount} unread)
                </span>
              ) : null}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="outline"
              onClick={() => setIsEnqueueModalOpen(true)}
              className="gap-2 text-teal-800 border-teal-200 hover:bg-teal-50"
            >
              <Plus size={16} />
              Dispatch Notification
            </Button>
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
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200/80 pb-3">
          {(
            [
              { key: "all", label: "All Updates" },
              { key: "unread", label: `Unread (${unreadCount})` },
              { key: "service-update", label: "Service Operations" },
              { key: "payment", label: "Payments & Invoices" },
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

        {/* Notifications List */}
        {isLoading ? (
          <div className="flex items-center justify-center rounded-xl border border-teal-100 bg-white p-12 text-slate-500">
            <Loader2 size={24} className="animate-spin text-teal-700 mr-2" />
            Loading updates...
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-teal-50 text-teal-800">
              <Bell size={22} />
            </div>
            <h3 className="mt-3 text-base font-semibold text-slate-900">
              No notifications found
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              {activeTab === "unread"
                ? "You are all caught up! No unread notifications."
                : "No notifications match the selected category."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((notification) => {
              const Icon = getNotificationIcon(notification.type);
              const targetHref =
                adminNotificationHrefById[notification.id] || "/admin/service-requests";

              return (
                <div
                  key={notification.id}
                  className={`group relative flex flex-col justify-between gap-4 rounded-xl border p-5 shadow-xs transition sm:flex-row sm:items-start ${
                    !notification.isRead
                      ? "border-teal-300 bg-teal-50/20 hover:bg-teal-50/30"
                      : "border-teal-100 bg-white hover:border-teal-200 hover:bg-[#fbfefd]"
                  }`}
                >
                  <Link
                    href={targetHref}
                    className="flex flex-1 items-start gap-4 text-left"
                  >
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-800 border border-teal-100/80">
                      <Icon size={21} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-base font-semibold text-teal-950 group-hover:text-teal-700">
                          {notification.title}
                        </h2>
                        {!notification.isRead ? (
                          <StatusBadge label="Unread" status="pending" />
                        ) : null}
                      </div>
                      <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-slate-600">
                        {notification.message}
                      </p>
                      {notification.ctaLabel ? (
                        <div className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 hover:underline">
                          {notification.ctaLabel}
                          <ArrowRight size={13} />
                        </div>
                      ) : null}
                    </div>
                  </Link>

                  <div className="flex shrink-0 items-center gap-3 self-end sm:self-start sm:flex-col sm:items-end">
                    <p className="text-xs font-medium text-slate-400">
                      {formatLongDate(notification.createdAt)}
                    </p>
                    <div className="flex items-center gap-1">
                      {!notification.isRead ? (
                        <button
                          onClick={(e) => handleMarkSingle(e, notification.id)}
                          title="Mark as read"
                          type="button"
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-teal-100 hover:text-teal-800"
                        >
                          <CheckCheck size={16} />
                        </button>
                      ) : null}
                      <button
                        onClick={(e) => handleDelete(e, notification.id)}
                        title="Delete notification"
                        type="button"
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <AdminEnqueueNotificationModal
        isOpen={isEnqueueModalOpen}
        onClose={() => setIsEnqueueModalOpen(false)}
      />
    </main>
  );
}
