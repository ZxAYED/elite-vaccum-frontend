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
  getDashboardInvoices,
  getDashboardOrders,
  getDashboardServiceOrders,
} from "@/data/mock/customer-dashboard";
import {
  getCustomerQuotations,
  getCustomerServiceRequests,
  mockCustomerNotifications,
} from "@/data/mock/customer-portal";
import { mockCurrentUser } from "@/data/mock/user";
import { formatCurrencyUsd, formatLongDate } from "@/lib/formatters";

const cardToneClasses = {
  white: "bg-white border-slate-200",
  amber: "bg-amber-50/40 border-amber-200/80",
  teal: "bg-teal-50/40 border-teal-200/80",
  blue: "bg-sky-50/40 border-sky-200/80",
} as const;

export default function DashboardOverview() {
  const serviceOrders = getDashboardServiceOrders();
  const allOrders = getDashboardOrders();
  const invoices = getDashboardInvoices();
  const serviceRequests = getCustomerServiceRequests();

  const quoteReady = getCustomerQuotations()[0];
  const upcomingServiceOrder = serviceOrders.find(
    (order) => order.status !== "completed",
  );
  const recentProductOrder = allOrders.find(
    (order) => order.type === "PRODUCT",
  );
  const recentInvoice = invoices[0];
  const underReview = serviceRequests.find(
    (request) => request.status === "under-review" || request.status === "submitted",
  );
  const activeRequests = serviceRequests.filter(
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
    <div className="space-y-6 pb-8">
      <PageHeader
        actions={
          <div className="flex gap-2.5">
            <Button asChild variant="outline" size="sm" className="rounded-md">
              <Link href="/store">Browse store</Link>
            </Button>
            <Button asChild size="sm" className="rounded-md bg-teal-600 hover:bg-teal-500 text-white font-medium">
              <Link href="/services">Request Service</Link>
            </Button>
          </div>
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
              className={`group relative flex min-h-52 flex-col justify-between rounded-lg border p-5 shadow-xs transition hover:border-teal-400 hover:shadow-sm ${cardToneClasses[card.tone]}`}
              key={card.title}
            >
              <div>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex size-10 items-center justify-center rounded-md border border-teal-200 bg-teal-50 text-teal-800 shadow-xs">
                    <Icon size={18} aria-hidden="true" />
                  </div>
                  <span className="rounded-md border border-slate-200 bg-white px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-slate-700">
                    {card.badge}
                  </span>
                </div>

                <div className="mt-4">
                  <h2 className="text-sm font-semibold text-slate-900">{card.title}</h2>
                  <p className="mt-1 text-xs text-slate-500 leading-relaxed line-clamp-2">
                    {card.description}
                  </p>
                  <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                    {card.value}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100">
                <Button
                  asChild
                  size="sm"
                  className="rounded-md w-full font-medium"
                  variant={
                    card.tone === "teal" || card.tone === "amber"
                      ? "default"
                      : "outline"
                  }
                >
                  <Link href={card.href} className="flex items-center justify-center gap-1.5">
                    {card.action}
                    <ArrowRight size={14} />
                  </Link>
                </Button>
              </div>
            </section>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <section className="lg:col-span-7 rounded-lg border border-slate-200 bg-white p-5 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-md bg-teal-50 border border-teal-200 text-teal-800">
                <Package size={16} />
              </div>
              <h2 className="text-base font-bold text-slate-900">Latest Orders</h2>
            </div>
            <Button asChild variant="ghost" size="sm" className="rounded-md text-xs text-teal-800 hover:text-teal-900 font-medium">
              <Link href="/user/orders">View All</Link>
            </Button>
          </div>

          <div className="mt-4 space-y-3">
            {allOrders.slice(0, 3).map((order) => (
              <Link
                className="flex flex-col gap-3 rounded-md border border-slate-200 bg-slate-50/50 p-3.5 transition hover:border-teal-300 hover:bg-teal-50/40 sm:flex-row sm:items-center sm:justify-between"
                href={`/user/orders/${order.id}`}
                key={order.id}
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <TypeBadge type={order.type} />
                    <StatusBadge status={order.status} />
                  </div>
                  <p className="text-sm font-semibold text-slate-900">
                    {order.type === "PRODUCT"
                      ? order.items[0]?.name
                      : order.serviceName}
                  </p>
                </div>
                <p className="text-sm font-bold text-slate-900">
                  {formatCurrencyUsd(order.total.totalUsd)}
                </p>
              </Link>
            ))}
          </div>
        </section>

        <section className="lg:col-span-5 rounded-lg border border-teal-800 bg-teal-900 p-5 sm:p-6 text-white shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 border-b border-white/10 pb-4">
              <div className="flex size-8 items-center justify-center rounded-md bg-teal-800/60 border border-teal-500/30 text-teal-200">
                <CalendarDays size={16} />
              </div>
              <h2 className="text-base font-bold text-white">Upcoming Schedule</h2>
            </div>
            {upcomingServiceOrder ? (
              <div className="mt-4 space-y-2">
                <span className="inline-block rounded-md bg-teal-800/80 px-2 py-0.5 text-xs font-semibold uppercase tracking-wider text-teal-200">
                  Confirmed Dispatch
                </span>
                <p className="text-lg font-bold text-white">
                  {upcomingServiceOrder.serviceName}
                </p>
                <p className="text-xs text-teal-100/80">
                  {upcomingServiceOrder.currentSchedule}
                </p>
                <p className="text-xs text-teal-200/60">
                  Created {formatLongDate(upcomingServiceOrder.createdAt)}
                </p>
              </div>
            ) : (
              <p className="mt-4 text-xs text-teal-100/70">
                No active service appointments are scheduled at this time.
              </p>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-white/10">
            {upcomingServiceOrder ? (
              <Button asChild size="sm" className="w-full rounded-md bg-white text-teal-950 hover:bg-teal-50 font-semibold">
                <Link href={`/user/schedule/${upcomingServiceOrder.serviceRequestId}`}>
                  View Schedule Details
                </Link>
              </Button>
            ) : (
              <Button asChild size="sm" variant="outline" className="w-full rounded-md border-teal-500/40 text-teal-100 hover:bg-teal-800">
                <Link href="/services">Request Service</Link>
              </Button>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
