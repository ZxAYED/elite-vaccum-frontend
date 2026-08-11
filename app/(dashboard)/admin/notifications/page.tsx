import Link from "next/link";
import { ArrowRight, Bell, CreditCard, ShieldCheck, Wrench } from "lucide-react";

import { StatusBadge } from "@/components/customer-portal/StatusBadge";
import { Button } from "@/components/ui/Button";
import { mockNotifications } from "@/data/mock/notifications";
import { formatLongDate } from "@/lib/formatters";

const adminNotificationHrefById: Record<string, string> = {
  "notif-1001": "/admin/service-requests/REQ-1001",
  "notif-1002": "/admin/service-requests/REQ-1006",
  "notif-1003": "/admin/financials",
  "notif-1004": "/admin/service-requests",
};

function getNotificationIcon(type: string) {
  if (type === "payment") return CreditCard;
  if (type === "system") return ShieldCheck;
  if (type === "service-update") return Wrench;
  return Bell;
}

export default function AdminNotificationsPage() {
  return (
    <main className="min-h-screen bg-[#f4f7f7] text-slate-950">
      <section className="space-y-4">
        <div className="flex flex-col gap-4 rounded-xl border border-teal-100 bg-white p-5 shadow-[0_18px_56px_-44px_rgba(28,79,80,0.35)] sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.26em] text-teal-700">
              Admin Updates
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-teal-950">
              Notifications
            </h1>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
              Review service, payment, and system updates from the admin control
              center.
            </p>
          </div>
          <Button variant="outline">
            <ShieldCheck className="text-teal-700" size={17} />
            Mark all as read
          </Button>
        </div>

        <div className="space-y-3">
          {mockNotifications.map((notification) => {
            const Icon = getNotificationIcon(notification.type);

            return (
              <Link
                className="group block rounded-xl border border-teal-100 bg-white p-5 shadow-[0_16px_50px_-42px_rgba(28,79,80,0.36)] transition hover:border-teal-200 hover:bg-[#fbfefd]"
                href={adminNotificationHrefById[notification.id] ?? "/admin"}
                key={notification.id}
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="flex gap-4">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-800">
                      <Icon size={21} />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-semibold text-teal-950 transition group-hover:text-teal-700">
                          {notification.title}
                        </h2>
                        {!notification.isRead ? (
                          <StatusBadge label="Unread" status="pending" />
                        ) : null}
                      </div>
                      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                        {notification.message}
                      </p>
                      {notification.ctaLabel ? (
                        <div className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-teal-700">
                          {notification.ctaLabel}
                          <ArrowRight size={15} />
                        </div>
                      ) : null}
                    </div>
                  </div>
                  <p className="shrink-0 text-sm text-slate-500">
                    {formatLongDate(notification.createdAt)}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </main>
  );
}
