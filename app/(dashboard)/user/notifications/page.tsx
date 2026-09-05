"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Bell,
  CheckCheck,
  CreditCard,
  FileText,
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
import type { Notification } from "@/types/domain";

type FilterTab = "all" | "unread" | "service-update" | "payment" | "system";

function getNotificationIcon(type?: string) {
  if (type === "payment") return CreditCard;
  if (type === "system") return ShieldCheck;
  if (type === "service-update") return Wrench;
  return Bell;
}

interface NotificationRouting {
  primaryHref: string;
  viewRequestHref?: string;
  reviewQuotationHref?: string;
  serviceRequestId?: string;
  quotationId?: string;
  orderHref?: string;
  isQuotation: boolean;
}

function resolveNotificationRouting(notification: Notification): NotificationRouting {
  const meta = notification.metadata || {};
  const serviceRequestId =
    (meta.serviceRequestId as string) ||
    (meta.requestId as string) ||
    (meta.businessId as string);

  const quotationId =
    (meta.quotationId as string) ||
    (meta.quotationBusinessId as string);

  const orderId = meta.orderId as string;

  const titleLower = notification.title.toLowerCase();
  const messageLower = notification.message.toLowerCase();
  const ctaLower = (notification.ctaLabel || "").toLowerCase();

  const isQuotation =
    Boolean(quotationId) ||
    titleLower.includes("quotation") ||
    titleLower.includes("quote") ||
    messageLower.includes("quotation") ||
    messageLower.includes("quote") ||
    ctaLower.includes("quotation") ||
    ctaLower.includes("quote");

  // Check if we have a service request ID (either business ID or UUID)
  if (serviceRequestId) {
    const viewRequestHref = `/user/services/${serviceRequestId}`;
    const reviewQuotationHref = `/user/services/${serviceRequestId}#quotation`;

    return {
      primaryHref: isQuotation ? reviewQuotationHref : viewRequestHref,
      viewRequestHref,
      reviewQuotationHref: isQuotation ? reviewQuotationHref : undefined,
      serviceRequestId,
      quotationId,
      isQuotation,
    };
  }

  // Fallback to mock dictionary if available
  const mockHref = mockNotificationHrefById[notification.id];
  if (mockHref) {
    if (mockHref.includes("#quotation")) {
      const baseReq = mockHref.split("#")[0];
      return {
        primaryHref: mockHref,
        viewRequestHref: baseReq,
        reviewQuotationHref: mockHref,
        isQuotation: true,
      };
    }
    return {
      primaryHref: mockHref,
      viewRequestHref: mockHref.startsWith("/user/services") ? mockHref : undefined,
      isQuotation: false,
    };
  }

  // Fallback for orders
  if (orderId) {
    return {
      primaryHref: `/user/orders/${orderId}`,
      orderHref: `/user/orders/${orderId}`,
      isQuotation: false,
    };
  }

  // Fallback for payments
  if (notification.type === "payment") {
    return {
      primaryHref: "/user/billing",
      isQuotation: false,
    };
  }

  // Generic fallback
  return {
    primaryHref: "/user/services",
    isQuotation,
  };
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
        <div className="space-y-4">
          {filteredNotifications.map((notification) => {
            const Icon = getNotificationIcon(notification.type);
            const routing = resolveNotificationRouting(notification);

            return (
              <div
                key={notification.id}
                className={`group relative flex flex-col justify-between gap-4 overflow-hidden rounded-xl border p-4 sm:p-5 shadow-xs transition ${
                  !notification.isRead
                    ? "border-teal-400 bg-teal-50/20 hover:border-teal-500 hover:bg-teal-50/30"
                    : "border-slate-200 bg-white hover:border-teal-300 hover:shadow-sm"
                }`}
              >
                <div className="flex flex-col gap-3.5 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-teal-200 bg-teal-50 text-teal-800 shadow-xs">
                      <Icon size={18} />
                    </div>

                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={routing.primaryHref}
                          className="text-base sm:text-lg font-bold text-primary transition hover:text-teal-700"
                        >
                          {notification.title}
                        </Link>
                        {!notification.isRead ? (
                          <StatusBadge label="Unread" status="pending" />
                        ) : null}
                      </div>

                      {/* Associated ID Badges if available */}
                      {(routing.serviceRequestId || routing.quotationId) && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                          {routing.serviceRequestId && (
                            <span className="inline-flex items-center rounded bg-slate-100 px-2 py-0.5 text-[11px] font-mono font-medium text-slate-700">
                              Request: {routing.serviceRequestId}
                            </span>
                          )}
                          {routing.quotationId && (
                            <span className="inline-flex items-center rounded bg-amber-50 px-2 py-0.5 text-[11px] font-mono font-medium text-amber-800 border border-amber-200/60">
                              Quote: {routing.quotationId}
                            </span>
                          )}
                        </div>
                      )}

                      <p className="text-xs sm:text-sm leading-relaxed text-slate-600 font-normal">
                        {notification.message}
                      </p>
                    </div>
                  </div>

                  {/* Header Actions: Date & Dismiss */}
                  <div className="flex shrink-0 items-center justify-between sm:justify-end gap-3 self-stretch sm:self-start sm:flex-col sm:items-end">
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

                {/* Footer Action Buttons */}
                <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-slate-100/80">
                  {routing.isQuotation && routing.reviewQuotationHref ? (
                    <>
                      <Button
                        asChild
                        size="sm"
                        className="rounded-md bg-teal-700 hover:bg-teal-800 text-white font-medium shadow-xs text-xs sm:text-sm"
                      >
                        <Link href={routing.reviewQuotationHref}>
                          <FileText size={14} className="mr-1.5" />
                          Review Quotation
                          <ArrowRight size={13} className="ml-1" />
                        </Link>
                      </Button>

                      {routing.viewRequestHref && (
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="rounded-md text-slate-700 hover:bg-slate-50 font-medium text-xs sm:text-sm"
                        >
                          <Link href={routing.viewRequestHref}>
                            View Request
                            <ArrowRight size={13} className="ml-1 text-slate-400" />
                          </Link>
                        </Button>
                      )}
                    </>
                  ) : routing.viewRequestHref ? (
                    <Button
                      asChild
                      size="sm"
                      className="rounded-md bg-teal-700 hover:bg-teal-800 text-white font-medium shadow-xs text-xs sm:text-sm"
                    >
                      <Link href={routing.viewRequestHref}>
                        <Wrench size={14} className="mr-1.5" />
                        View Request
                        <ArrowRight size={13} className="ml-1" />
                      </Link>
                    </Button>
                  ) : routing.orderHref ? (
                    <Button
                      asChild
                      size="sm"
                      className="rounded-md bg-teal-700 hover:bg-teal-800 text-white font-medium shadow-xs text-xs sm:text-sm"
                    >
                      <Link href={routing.orderHref}>
                        View Order
                        <ArrowRight size={13} className="ml-1" />
                      </Link>
                    </Button>
                  ) : (
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="rounded-md text-slate-700 hover:bg-slate-50 font-medium text-xs sm:text-sm"
                    >
                      <Link href={routing.primaryHref}>
                        {notification.ctaLabel || "View Details"}
                        <ArrowRight size={13} className="ml-1 text-slate-400" />
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

