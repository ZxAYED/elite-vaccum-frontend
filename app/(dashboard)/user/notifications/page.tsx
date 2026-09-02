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
    <div className="space-y-6 pb-8">
      <PageHeader
        actions={
          <Button variant="outline" size="sm" className="rounded-md font-medium">
            <ShieldCheck className="text-teal-600 mr-1.5" size={15} />
            Mark all as read
          </Button>
        }
        description="Notifications route you directly into the correct service, payment, or schedule workflow."
        eyebrow="Updates"
        title="Notifications"
      />

      <div className="space-y-3.5">
        {mockCustomerNotifications.map((notification) => {
          const Icon = getNotificationIcon(notification.type);

          return (
            <Link
              className="group block overflow-hidden rounded-lg border border-slate-200 bg-white p-4 sm:p-5 shadow-xs transition hover:border-teal-400 hover:shadow-sm"
              href={mockNotificationHrefById[notification.id] ?? "/user"}
              key={notification.id}
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="flex gap-3.5">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-md border border-teal-200 bg-teal-50 text-teal-800 shadow-xs">
                    <Icon size={16} />
                  </div>

                  <div>
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
                </div>

                <p className="text-xs text-slate-400 font-medium shrink-0">{formatLongDate(notification.createdAt)}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
