import Link from "next/link";
import { ArrowRight, Bell, CreditCard, ShieldCheck, Wrench } from "lucide-react";

import { PageHeader } from "@/components/customer-portal/PageHeader";
import { StatusBadge } from "@/components/customer-portal/StatusBadge";
import { Button } from "@/components/ui/Button";
import {
  mockCustomerNotifications,
  mockNotificationHrefById,
} from "@/data/mock/customer-portal";
import { formatLongDate } from "@/lib/formatters";

function getNotificationIcon(type: string) {
  if (type === "payment") return CreditCard;
  if (type === "system") return ShieldCheck;
  if (type === "service-update") return Wrench;
  return Bell;
}

export default function NotificationsPage() {
  return (
    <div className="min-h-screen">
      <PageHeader
        actions={
          <Button variant="outline">
            <ShieldCheck className="text-teal-600" size={18} />
            Mark all as read
          </Button>
        }
        description="Notifications now route customers directly into the correct service, payment, or review workflow."
        eyebrow="Updates"
        title="Notifications"
      />

      <div className="space-y-4">
        {mockCustomerNotifications.map((notification) => {
          const Icon = getNotificationIcon(notification.type);

          return (
            <Link
              className="group block overflow-hidden rounded-3xl border border-gray-200 bg-white p-6 shadow-sm transition hover:border-teal-200 hover:shadow-md"
              href={mockNotificationHrefById[notification.id] ?? "/user"}
              key={notification.id}
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="flex gap-4">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#E8EDEE] text-primary">
                    <Icon size={22} />
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-lg font-semibold text-gray-900 transition group-hover:text-teal-700">
                        {notification.title}
                      </h2>
                      {!notification.isRead ? (
                        <StatusBadge label="Unread" status="pending" />
                      ) : null}
                    </div>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">
                      {notification.message}
                    </p>
                    {notification.ctaLabel ? (
                      <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-teal-700">
                        {notification.ctaLabel}
                        <ArrowRight size={16} />
                      </div>
                    ) : null}
                  </div>
                </div>

                <p className="text-sm text-gray-500">{formatLongDate(notification.createdAt)}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
