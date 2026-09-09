"use client";

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
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCurrencyUsd, formatLongDate } from "@/lib/formatters";
import { useGetMeQuery } from "@/redux/api/authApi";
import { useGetMyInvoicesQuery } from "@/redux/api/billingApi";
import { useGetUnreadNotificationsCountQuery } from "@/redux/api/notificationsApi";
import { useGetCustomerOrdersQuery } from "@/redux/api/ordersApi";
import { useGetMyQuotationsQuery } from "@/redux/api/quotationsApi";
import { useGetMyServiceRequestsQuery } from "@/redux/api/serviceRequestsApi";
import { useGetMyServiceOrdersQuery } from "@/redux/api/serviceOrdersApi";

const cardToneClasses = {
  white: "bg-white border-slate-200",
  amber: "bg-amber-50/40 border-amber-200/80",
  teal: "bg-teal-50/40 border-teal-200/80",
  blue: "bg-sky-50/40 border-sky-200/80",
} as const;

const CLOSED_REQUEST_STATUSES = ["completed", "rejected", "cancelled"];
const CLOSED_SERVICE_ORDER_STATUSES = ["completed", "cancelled"];

function normalize(value?: string) {
  return String(value ?? "").toLowerCase().replace(/_/g, "-");
}

export default function DashboardOverview() {
  // Phase 1.5 profile, 8.2 own requests, 9.7 own quotations, 6.4 product
  // orders, 10.1 own service orders, 12.2 own invoices, 11.2 unread badge.
  const { data: user } = useGetMeQuery();
  const { data: requestsData, isLoading: isLoadingRequests } =
    useGetMyServiceRequestsQuery();
  const { data: quotations } = useGetMyQuotationsQuery();
  const { data: productOrdersData, isLoading: isLoadingOrders } =
    useGetCustomerOrdersQuery({ page: 1, limit: 10 });
  const { data: serviceOrdersData } = useGetMyServiceOrdersQuery({
    page: 1,
    limit: 10,
  });
  const { data: invoicesData } = useGetMyInvoicesQuery({ page: 1, limit: 5 });
  const { data: unread } = useGetUnreadNotificationsCountQuery();

  const serviceRequests = requestsData?.items ?? [];
  const productOrders = productOrdersData?.items ?? [];
  const serviceOrders = serviceOrdersData?.items ?? [];
  const invoices = invoicesData?.items ?? [];
  const unreadCount = unread?.unreadCount ?? 0;

  const activeRequests = serviceRequests.filter(
    (request) => !CLOSED_REQUEST_STATUSES.includes(normalize(request.status)),
  );
  const underReview = serviceRequests.find((request) =>
    ["under-review", "submitted"].includes(normalize(request.status)),
  );

  // A quotation still awaiting the customer's decision is the one worth
  // surfacing on the dashboard.
  const quoteReady = (quotations ?? []).find((quotation) =>
    ["sent", "viewed", "draft"].includes(normalize(quotation.status)),
  );

  const upcomingServiceOrder = serviceOrders.find(
    (order) => !CLOSED_SERVICE_ORDER_STATUSES.includes(normalize(order.status)),
  );
  const recentProductOrder = productOrders[0];
  const recentInvoice = invoices[0];

  const firstName =
    user?.firstName || user?.fullName?.split(" ")[0] || "there";

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
      value: quoteReady ? formatCurrencyUsd(Number(quoteReady.totalUsd) || 0) : "$0",
      description: quoteReady
        ? `Quotation ${quoteReady.businessId || quoteReady.id} needs your decision.`
        : "No quotation needs review right now.",
      icon: DollarSign,
      href: quoteReady
        ? `/user/services/${quoteReady.serviceRequestId}#quotation`
        : "/user/quotations",
      action: quoteReady ? "Review Quote" : "Open Quotes",
      tone: "amber",
      badge: quoteReady ? "Quote" : "Clear",
    },
    {
      title: "Upcoming Service",
      value: upcomingServiceOrder ? "1" : "0",
      description: upcomingServiceOrder
        ? `${upcomingServiceOrder.serviceName} is scheduled.`
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
        ? formatCurrencyUsd(Number(recentProductOrder.totalUsd) || 0)
        : "$0",
      description: recentProductOrder
        ? `${recentProductOrder.businessId || recentProductOrder.id} — ${
            recentProductOrder.items?.[0]?.name ?? "Order placed"
          }`
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
      value: recentInvoice
        ? formatCurrencyUsd(Number(recentInvoice.totalUsd) || 0)
        : "$0",
      description: recentInvoice
        ? `${recentInvoice.businessId || recentInvoice.id} is ready in billing.`
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
      value: String(unreadCount),
      description: `${unreadCount} customer update${
        unreadCount === 1 ? "" : "s"
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

  const isLoadingSummary = isLoadingRequests || isLoadingOrders;

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        actions={
          <div className="flex gap-2.5">
            <Button asChild variant="outline" size="sm" className="rounded-md">
              <Link href="/store">Browse store</Link>
            </Button>
            <Button
              asChild
              size="sm"
              className="rounded-md bg-teal-600 hover:bg-teal-500 text-white font-medium"
            >
              <Link href="/services">Request Service</Link>
            </Button>
          </div>
        }
        description="Track requests, quotes, orders, invoices, schedules, reviews, and notifications from one dashboard."
        eyebrow="Customer Dashboard"
        title={`Welcome back, ${firstName}`}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {isLoadingSummary
          ? Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-52 animate-pulse rounded-lg border border-slate-200 bg-slate-50"
              />
            ))
          : summaryCards.map((card) => {
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
                      <h2 className="text-sm font-semibold text-slate-900">
                        {card.title}
                      </h2>
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
                      <Link
                        href={card.href}
                        className="flex items-center justify-center gap-1.5"
                      >
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
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="rounded-md text-xs text-teal-800 hover:text-teal-900 font-medium"
            >
              <Link href="/user/orders">View All</Link>
            </Button>
          </div>

          {isLoadingOrders ? (
            <div className="mt-4 space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="h-20 animate-pulse rounded-md bg-slate-50"
                />
              ))}
            </div>
          ) : productOrders.length === 0 ? (
            <EmptyState
              icon={Package}
              title="No active orders"
              description="You haven't placed any product or service orders yet."
              action={{ label: "Browse Store", href: "/store" }}
              secondaryAction={{ label: "Request Service", href: "/services" }}
              tone="minimal"
              className="py-8"
            />
          ) : (
            <div className="mt-4 space-y-3">
              {productOrders.slice(0, 3).map((order) => (
                <Link
                  className="flex flex-col gap-3 rounded-md border border-slate-200 bg-slate-50/50 p-3.5 transition hover:border-teal-300 hover:bg-teal-50/40 sm:flex-row sm:items-center sm:justify-between"
                  href={`/user/orders/${order.id}`}
                  key={order.id}
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <TypeBadge type="PRODUCT" />
                      <StatusBadge status={normalize(order.status)} />
                    </div>
                    <p className="text-sm font-semibold text-slate-900">
                      {order.items?.[0]?.name ??
                        order.businessId ??
                        "Product order"}
                    </p>
                  </div>
                  <p className="text-sm font-bold text-slate-900">
                    {formatCurrencyUsd(Number(order.totalUsd) || 0)}
                  </p>
                </Link>
              ))}
            </div>
          )}
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
                {upcomingServiceOrder.currentSchedule?.label ? (
                  <p className="text-xs text-teal-100/80">
                    {upcomingServiceOrder.currentSchedule.label}
                  </p>
                ) : null}
                {upcomingServiceOrder.createdAt ? (
                  <p className="text-xs text-teal-200/60">
                    Created {formatLongDate(upcomingServiceOrder.createdAt)}
                  </p>
                ) : null}
              </div>
            ) : (
              <p className="mt-4 text-xs text-teal-100/70">
                No active service appointments are scheduled at this time.
              </p>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-white/10">
            {upcomingServiceOrder ? (
              <Button
                asChild
                size="sm"
                className="w-full rounded-md bg-white text-teal-950 hover:bg-teal-50 font-semibold"
              >
                <Link
                  href={`/user/schedule/${upcomingServiceOrder.serviceRequestId}`}
                >
                  View Schedule Details
                </Link>
              </Button>
            ) : (
              <Button
                asChild
                size="sm"
                variant="outline"
                className="w-full rounded-md border-teal-500/40 text-teal-100 hover:bg-teal-800"
              >
                <Link href="/services">Request Service</Link>
              </Button>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
