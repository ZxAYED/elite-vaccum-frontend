import Link from "next/link";
import {
  ArrowRight,
  Bell,
  CalendarDays,
  Package,
  ReceiptText,
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

export default function DashboardOverview() {
  const quoteReady = getCustomerQuotations()[0];
  const upcomingServiceOrder = dashboardServiceOrders.find(
    (order) => order.status !== "completed",
  );
  const recentProductOrder = dashboardOrders.find((order) => order.type === "PRODUCT");
  const recentInvoice = dashboardInvoices[0];
  const underReview = mockCustomerServiceRequests.find(
    (request) => request.status === "under-review" || request.status === "submitted",
  );
  const unreadNotifications = mockCustomerNotifications.filter(
    (notification) => !notification.isRead,
  );

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

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {underReview ? (
          <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <StatusBadge status={underReview.status} />
            <h2 className="mt-5 text-xl font-semibold text-primary">
              Service Request Under Review
            </h2>
            <p className="mt-2 text-sm text-gray-600">{underReview.title}</p>
            <Button asChild className="mt-5" variant="outline">
              <Link href={`/user/services/${underReview.id}`}>
                View Request
                <ArrowRight size={16} />
              </Link>
            </Button>
          </section>
        ) : null}

        {quoteReady ? (
          <section className="rounded-3xl border border-amber-100 bg-amber-50 p-6 shadow-sm">
            <StatusBadge status={quoteReady.quote.status} />
            <h2 className="mt-5 text-xl font-semibold text-primary">Quote Ready</h2>
            <p className="mt-2 text-sm text-gray-600">
              {quoteReady.request.title} · {quoteReady.quote.id}
            </p>
            <p className="mt-3 text-2xl font-semibold text-primary">
              {formatCurrencyUsd(quoteReady.quote.totalUsd)}
            </p>
            <Button asChild className="mt-5">
              <Link href={`/user/services/${quoteReady.request.id}/quotation`}>
                Review Quote
                <ArrowRight size={16} />
              </Link>
            </Button>
          </section>
        ) : null}

        {upcomingServiceOrder ? (
          <section className="rounded-3xl border border-teal-100 bg-teal-50 p-6 shadow-sm">
            <TypeBadge type="SERVICE" />
            <h2 className="mt-5 text-xl font-semibold text-primary">
              Upcoming Service Order
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {upcomingServiceOrder.serviceName} · {upcomingServiceOrder.currentSchedule}
            </p>
            <StatusBadge className="mt-4" status={upcomingServiceOrder.status} />
            <Button asChild className="mt-5">
              <Link href={`/user/orders/${upcomingServiceOrder.id}`}>View Order</Link>
            </Button>
          </section>
        ) : null}

        {recentProductOrder ? (
          <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <TypeBadge type="PRODUCT" />
            <h2 className="mt-5 text-xl font-semibold text-primary">
              Recent Product Order
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {recentProductOrder.id} ·{" "}
              {formatCurrencyUsd(recentProductOrder.total.totalUsd)}
            </p>
            <StatusBadge className="mt-4" status={recentProductOrder.status} />
            <Button asChild className="mt-5" variant="outline">
              <Link href={`/user/orders/${recentProductOrder.id}`}>View Order</Link>
            </Button>
          </section>
        ) : null}

        {recentInvoice ? (
          <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <ReceiptText className="text-teal-700" size={24} />
            <h2 className="mt-5 text-xl font-semibold text-primary">Recent Invoice</h2>
            <p className="mt-2 text-sm text-gray-600">
              {recentInvoice.id} · {formatCurrencyUsd(recentInvoice.totals.totalUsd)}
            </p>
            <Button asChild className="mt-5" variant="outline">
              <Link href={`/user/billing/invoices/${recentInvoice.id}`}>
                View Invoice
              </Link>
            </Button>
          </section>
        ) : null}

        <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <Bell className="text-teal-700" size={24} />
          <h2 className="mt-5 text-xl font-semibold text-primary">
            Unread Notifications
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {unreadNotifications.length} customer update
            {unreadNotifications.length === 1 ? "" : "s"} need attention.
          </p>
          <Button asChild className="mt-5" variant="outline">
            <Link href="/user/notifications">Open Notifications</Link>
          </Button>
        </section>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <Package className="text-teal-700" size={22} />
            <h2 className="text-xl font-semibold text-primary">Latest Orders</h2>
          </div>
          <div className="mt-5 space-y-4">
            {dashboardOrders.slice(0, 3).map((order) => (
              <Link
                className="flex flex-col gap-3 rounded-2xl border border-gray-100 p-4 transition hover:border-teal-200 hover:bg-teal-50/40 sm:flex-row sm:items-center sm:justify-between"
                href={`/user/orders/${order.id}`}
                key={order.id}
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <TypeBadge type={order.type} />
                    <StatusBadge status={order.status} />
                  </div>
                  <p className="mt-3 font-semibold text-primary">
                    {order.type === "PRODUCT" ? order.items[0]?.name : order.serviceName}
                  </p>
                </div>
                <p className="font-semibold text-primary">
                  {formatCurrencyUsd(order.total.totalUsd)}
                </p>
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-3xl bg-primary p-6 text-white shadow-sm">
          <div className="flex items-center gap-3">
            <CalendarDays size={22} />
            <h2 className="text-xl font-semibold">Upcoming Schedule</h2>
          </div>
          {upcomingServiceOrder ? (
            <>
              <p className="mt-5 text-2xl font-semibold">
                {upcomingServiceOrder.serviceName}
              </p>
              <p className="mt-2 text-sm text-white/70">
                {upcomingServiceOrder.currentSchedule}
              </p>
              <p className="mt-2 text-sm text-white/70">
                Created {formatLongDate(upcomingServiceOrder.createdAt)}
              </p>
              <Button asChild className="mt-6 bg-white text-primary hover:bg-white/90">
                <Link href={`/user/schedule/${upcomingServiceOrder.serviceRequestId}`}>
                  View Schedule
                </Link>
              </Button>
            </>
          ) : (
            <p className="mt-5 text-sm text-white/70">
              No active service appointments are scheduled.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
