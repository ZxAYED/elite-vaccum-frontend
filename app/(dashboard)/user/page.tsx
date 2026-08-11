import Link from "next/link";
import {
  ArrowRight,
  Bell,
  CalendarDays,
  ClipboardCheck,
  DollarSign,
  Package,
  ReceiptText,
  Wrench,
} from "lucide-react";

import { PageHeader } from "@/components/customer-portal/PageHeader";
import { StatusBadge } from "@/components/customer-portal/StatusBadge";
import { TypeBadge } from "@/components/customer-portal/TypeBadge";
import { Button } from "@/components/ui/Button";
import {
  dashboardInvoices,
  dashboardOrders,
  dashboardServiceOrders,
} from "@/data/mock/customer-dashboard";
import {
  getCustomerQuotations,
  mockCustomerNotifications,
  mockCustomerServiceRequests,
} from "@/data/mock/customer-portal";
import { mockCurrentUser } from "@/data/mock/user";
import { formatCurrencyUsd, formatLongDate } from "@/lib/formatters";

const cardToneClasses = {
  white: "bg-white ring-teal-100",
  amber: "bg-[linear-gradient(135deg,#fff8df_0%,#fffdf4_100%)] ring-amber-200",
  teal: "bg-[linear-gradient(135deg,#e8fbf7_0%,#f8fffd_100%)] ring-teal-200",
  blue: "bg-[linear-gradient(135deg,#edf7ff_0%,#ffffff_100%)] ring-sky-100",
} as const;

export default function DashboardOverview() {
  const quoteReady = getCustomerQuotations()[0];
  const upcomingServiceOrder = dashboardServiceOrders.find(
    (order) => order.status !== "completed",
  );
  const recentProductOrder = dashboardOrders.find(
    (order) => order.type === "PRODUCT",
  );
  const recentInvoice = dashboardInvoices[0];
  const underReview = mockCustomerServiceRequests.find(
    (request) => request.status === "under-review" || request.status === "submitted",
  );
  const activeRequests = mockCustomerServiceRequests.filter(
    (request) => request.status !== "completed" && request.status !== "rejected",
  );
  const unreadNotifications = mockCustomerNotifications.filter(
    (notification) => !notification.isRead,
  );

  const summaryCards = [
    {
      title: "Active Requests",
      value: String(activeRequests.length),
      description: underReview
        ? `${underReview.title} is currently in review.`
        : "No service requests are waiting on review.",
      icon: ClipboardCheck,
      href: "/user/services",
      action: "View Requests",
      tone: "white",
      badge: "Requests",
    },
    {
      title: "Quote Ready",
      value: quoteReady ? formatCurrencyUsd(quoteReady.quote.totalUsd) : "$0",
      description: quoteReady
        ? `${quoteReady.request.title} - ${quoteReady.quote.id}`
        : "No quotation needs review right now.",
      icon: DollarSign,
      href: quoteReady
        ? `/user/services/${quoteReady.request.id}/quotation`
        : "/user/quotations",
      action: quoteReady ? "Review Quote" : "Open Quotes",
      tone: "amber",
      badge: quoteReady ? "Quote" : "Clear",
    },
    {
      title: "Upcoming Service",
      value: upcomingServiceOrder ? "1" : "0",
      description: upcomingServiceOrder
        ? `${upcomingServiceOrder.serviceName} - ${upcomingServiceOrder.currentSchedule}`
        : "No active service appointments are scheduled.",
      icon: Wrench,
      href: upcomingServiceOrder
        ? `/user/schedule/${upcomingServiceOrder.serviceRequestId}`
        : "/services",
      action: upcomingServiceOrder ? "View Schedule" : "Request Service",
      tone: "teal",
      badge: upcomingServiceOrder ? "Service" : "None",
    },
    {
      title: "Product Orders",
      value: recentProductOrder
        ? formatCurrencyUsd(recentProductOrder.total.totalUsd)
        : "$0",
      description: recentProductOrder
        ? `${recentProductOrder.id} - ${recentProductOrder.items[0]?.name}`
        : "No recent product orders.",
      icon: Package,
      href: recentProductOrder
        ? `/user/orders/${recentProductOrder.id}`
        : "/user/orders",
      action: "View Orders",
      tone: "blue",
      badge: "Product",
    },
    {
      title: "Recent Invoice",
      value: recentInvoice ? formatCurrencyUsd(recentInvoice.totals.totalUsd) : "$0",
      description: recentInvoice
        ? `${recentInvoice.id} is ready in billing.`
        : "No invoice activity is available.",
      icon: ReceiptText,
      href: recentInvoice
        ? `/user/billing/invoices/${recentInvoice.id}`
        : "/user/billing",
      action: "View Invoice",
      tone: "white",
      badge: "Billing",
    },
    {
      title: "Unread Notifications",
      value: String(unreadNotifications.length),
      description: `${unreadNotifications.length} customer update${
        unreadNotifications.length === 1 ? "" : "s"
      } need attention.`,
      icon: Bell,
      href: "/user/notifications",
      action: "Open Notifications",
      tone: "white",
      badge: "Updates",
    },
  ] satisfies Array<{
    title: string;
    value: string;
    description: string;
    icon: typeof Bell;
    href: string;
    action: string;
    tone: keyof typeof cardToneClasses;
    badge: string;
  }>;

  return (
    <div className="min-h-screen">
      <PageHeader
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/store">Browse store</Link>
            </Button>
            <Button asChild>
              <Link href="/services">Request Service</Link>
            </Button>
          </>
        }
        description="Track requests, quotes, orders, invoices, schedules, reviews, and notifications from one dashboard."
        eyebrow="Customer Dashboard"
        title={`Welcome back, ${mockCurrentUser.firstName}`}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {summaryCards.map((card) => {
          const Icon = card.icon;

          return (
            <section
              className={`group relative flex min-h-56 flex-col overflow-hidden rounded-3xl p-6 shadow-[0_22px_70px_-58px_rgba(28,79,80,0.62)] ring-1 transition-transform hover:-translate-y-0.5 ${cardToneClasses[card.tone]}`}
              key={card.title}
            >
              <div className="pointer-events-none absolute -right-8 -top-8 size-28 rounded-full bg-white/60" />

              <div className="relative flex items-start justify-between gap-4">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-white text-teal-700 shadow-[0_16px_40px_-28px_rgba(28,79,80,0.55)] ring-1 ring-teal-100">
                  <Icon size={22} aria-hidden="true" />
                </div>
                <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-primary ring-1 ring-teal-100">
                  {card.badge}
                </span>
              </div>

              <div className="relative mt-6 flex-1">
                <h2 className="text-lg font-semibold text-primary">{card.title}</h2>
                <p className="mt-2 min-h-10 overflow-hidden text-sm leading-5 text-slate-600">
                  {card.description}
                </p>
                <p className="mt-4 text-3xl font-bold tabular-nums text-primary">
                  {card.value}
                </p>
              </div>

              <Button
                asChild
                className="relative mt-5 w-fit rounded-full"
                variant={
                  card.tone === "teal" || card.tone === "amber"
                    ? "default"
                    : "outline"
                }
              >
                <Link href={card.href}>
                  {card.action}
                  <ArrowRight size={16} />
                </Link>
              </Button>
            </section>
          );
        })}
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-3xl bg-white p-6 shadow-[0_22px_70px_-58px_rgba(28,79,80,0.62)] ring-1 ring-teal-100">
          <div className="flex items-center gap-3">
            <Package className="text-teal-700" size={22} />
            <h2 className="text-xl font-semibold text-primary">Latest Orders</h2>
          </div>

          <div className="mt-5 space-y-4">
            {dashboardOrders.slice(0, 3).map((order) => (
              <Link
                className="flex flex-col gap-3 rounded-2xl bg-slate-50/60 p-4 ring-1 ring-slate-100 transition hover:bg-teal-50 hover:ring-teal-200 sm:flex-row sm:items-center sm:justify-between"
                href={`/user/orders/${order.id}`}
                key={order.id}
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <TypeBadge type={order.type} />
                    <StatusBadge status={order.status} />
                  </div>
                  <p className="mt-3 font-semibold text-primary">
                    {order.type === "PRODUCT"
                      ? order.items[0]?.name
                      : order.serviceName}
                  </p>
                </div>
                <p className="font-semibold tabular-nums text-primary">
                  {formatCurrencyUsd(order.total.totalUsd)}
                </p>
              </Link>
            ))}
          </div>
        </section>

        <section className="relative overflow-hidden rounded-3xl bg-[linear-gradient(145deg,#0c4b4c_0%,#1c5b5b_100%)] p-6 text-white shadow-[0_24px_80px_-54px_rgba(28,79,80,0.72)]">
          <div className="pointer-events-none absolute -right-12 -top-12 size-44 rounded-full bg-white/10" />
          <div className="relative flex items-center gap-3">
            <CalendarDays size={22} />
            <h2 className="text-xl font-semibold">Upcoming Schedule</h2>
          </div>
          {upcomingServiceOrder ? (
            <div className="relative">
              <p className="mt-8 text-2xl font-semibold">
                {upcomingServiceOrder.serviceName}
              </p>
              <p className="mt-2 text-sm text-white/75">
                {upcomingServiceOrder.currentSchedule}
              </p>
              <p className="mt-2 text-sm text-white/75">
                Created {formatLongDate(upcomingServiceOrder.createdAt)}
              </p>
              <Button asChild className="mt-7 bg-white text-primary hover:bg-white/90">
                <Link href={`/user/schedule/${upcomingServiceOrder.serviceRequestId}`}>
                  View Schedule
                </Link>
              </Button>
            </div>
          ) : (
            <p className="relative mt-5 text-sm text-white/75">
              No active service appointments are scheduled.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
