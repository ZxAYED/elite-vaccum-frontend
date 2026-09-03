"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Bell,
  CheckCheck,
  CreditCard,
  Loader2,
  ShieldCheck,
  Trash2,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/customer-portal/PageHeader";
import { StatusBadge } from "@/components/customer-portal/StatusBadge";
import { Button } from "@/components/ui/Button";
import {
  useGetNotificationsQuery,
  useMarkAllNotificationsAsReadMutation,
  useMarkNotificationAsReadMutation,
  useDeleteNotificationMutation,
} from "@/redux/api/notificationsApi";
import {
  mockCustomerNotifications,
  mockNotificationHrefById,
} from "@/data/mock/customer-portal";
import { formatLongDate } from "@/lib/formatters";

type FilterTab = "all" | "unread" | "service-update" | "payment" | "system";

function getNotificationIcon(type?: string) {
  if (type === "payment") return CreditCard;
  if (type === "system") return ShieldCheck;
  if (type === "service-update") return Wrench;
  return Bell;
}

export default function CustomerNotificationsPage() {
  const [activeTab, setActiveTab] = useState<FilterTab>("all");

  const { data: apiNotificationsData, isLoading } = useGetNotificationsQuery();
  const [markAllAsRead, { isLoading: isMarkingAll }] = useMarkAllNotificationsAsReadMutation();
  const [markSingleAsRead] = useMarkNotificationAsReadMutation();
  const [deleteNotification] = useDeleteNotificationMutation();

  const rawNotifications =
    apiNotificationsData?.items && apiNotificationsData.items.length > 0
      ? apiNotificationsData.items
      : mockCustomerNotifications;

  const filteredNotifications = rawNotifications.filter((notif) => {
    if (activeTab === "unread") return !notif.isRead;
    if (activeTab === "service-update") return notif.type === "service-update";
    if (activeTab === "payment") return notif.type === "payment";
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
    <div className="space-y-6 pb-8">
      <PageHeader
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllRead}
            disabled={isMarkingAll || unreadCount === 0}
            className="rounded-md font-medium gap-1.5"
          >
            {isMarkingAll ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <ShieldCheck className="text-teal-600" size={15} />
            )}
            Mark all as read
          </Button>
        }
        description="Notifications route you directly into the correct service, payment, or schedule workflow."
        eyebrow="Updates"
        title="Notifications"
      />

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200/80 pb-3">
        {(
          [
            { key: "all", label: "All Updates" },
            { key: "unread", label: `Unread (${unreadCount})` },
            { key: "service-update", label: "Services & Maintenance" },
            { key: "payment", label: "Orders & Invoices" },
            { key: "system", label: "System Alerts" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            type="button"
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              activeTab === tab.key
                ? "bg-teal-800 text-white shadow-xs"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center rounded-lg border border-slate-200 bg-white p-12 text-slate-500">
          <Loader2 size={22} className="animate-spin text-teal-700 mr-2" />
          Loading notifications...
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white p-12 text-center">
          <div className="flex size-11 items-center justify-center rounded-full bg-teal-50 text-teal-800">
            <Bell size={20} />
          </div>
          <p className="mt-3 text-sm font-semibold text-slate-900">
            No notifications found
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {activeTab === "unread"
              ? "You have no unread notifications right now."
              : "No notifications found in this category."}
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredNotifications.map((notification) => {
            const Icon = getNotificationIcon(notification.type);
            const targetHref =
              mockNotificationHrefById[notification.id] || "/user/services";

            return (
              <div
                key={notification.id}
                className={`group relative flex flex-col justify-between gap-3 overflow-hidden rounded-lg border p-4 sm:p-5 shadow-xs transition sm:flex-row sm:items-start ${
                  !notification.isRead
                    ? "border-teal-400 bg-teal-50/20 hover:border-teal-500 hover:bg-teal-50/30"
                    : "border-slate-200 bg-white hover:border-teal-300 hover:shadow-sm"
                }`}
              >
                <Link
                  href={targetHref}
                  className="flex flex-1 items-start gap-3.5 text-left"
                >
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-md border border-teal-200 bg-teal-50 text-teal-800 shadow-xs">
                    <Icon size={16} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-sm sm:text-base font-bold text-slate-900 transition group-hover:text-teal-700">
                        {notification.title}
                      </h2>
                      {!notification.isRead ? (
                        <StatusBadge label="Unread" status="pending" />
                      ) : null}
                    </div>
                    <p className="mt-1 max-w-3xl text-xs sm:text-sm leading-relaxed text-slate-600 font-normal">
                      {notification.message}
                    </p>
                    {notification.ctaLabel ? (
                      <div className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700">
                        {notification.ctaLabel}
                        <ArrowRight size={13} />
                      </div>
                    ) : null}
                  </div>
                </Link>

                <div className="flex shrink-0 items-center gap-3 self-end sm:self-start sm:flex-col sm:items-end">
                  <p className="text-xs text-slate-400 font-medium">
                    {formatLongDate(notification.createdAt)}
                  </p>
                  <div className="flex items-center gap-1">
                    {!notification.isRead ? (
                      <button
                        onClick={(e) => handleMarkSingle(e, notification.id)}
                        title="Mark as read"
                        type="button"
                        className="rounded-md p-1.5 text-slate-400 hover:bg-teal-100 hover:text-teal-800"
                      >
                        <CheckCheck size={16} />
                      </button>
                    ) : null}
                    <button
                      onClick={(e) => handleDelete(e, notification.id)}
                      title="Delete notification"
                      type="button"
                      className="rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
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
    </div>
  );
}
