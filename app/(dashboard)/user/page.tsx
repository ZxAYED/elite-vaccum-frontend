import Link from "next/link";
import {
  Bell,
  Calendar,
  CreditCard,
  Package,
  ReceiptText,
  ShoppingBag,
  Wrench,
} from "lucide-react";

import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/customer-portal/PageHeader";
import { StatusBadge } from "@/components/customer-portal/StatusBadge";
import {
  getProductById,
  getTechnicianById,
  mockCustomerNotifications,
  mockCustomerPaymentMethods,
  mockCustomerProductOrders,
  mockCustomerReviews,
  mockCustomerServiceDetailsByRequestId,
  mockCustomerServiceRequests,
  mockPaymentLedger,
} from "@/data/mock/customer-portal";
import { mockCurrentUser } from "@/data/mock/user";
import { formatCurrencyUsd, formatMonthDay, formatTime } from "@/lib/formatters";

export default function DashboardOverview() {
  const nextAppointmentRequest = mockCustomerServiceRequests.find(
    (request) => request.status === "scheduled",
  );
  const nextAppointment =
    nextAppointmentRequest &&
    mockCustomerServiceDetailsByRequestId[nextAppointmentRequest.id]?.appointment;
  const quoteReadyRequest = mockCustomerServiceRequests.find(
    (request) => request.status === "quoted",
  );
  const quoteReady =
    quoteReadyRequest && mockCustomerServiceDetailsByRequestId[quoteReadyRequest.id]?.quote;
  const unreadCount = mockCustomerNotifications.filter(
    (notification) => !notification.isRead,
  ).length;
  const pendingBalance = mockPaymentLedger
    .filter((entry) => entry.status === "pending")
    .reduce((sum, entry) => sum + entry.amountUsd, 0);
  const latestOrder = mockCustomerProductOrders[0];
  const latestOrderProduct = getProductById(latestOrder.items[0]?.productId);
  const submittedReviews = mockCustomerReviews.filter(
    (review) => review.status === "submitted",
  ).length;
  const appointmentTechnician = getTechnicianById(nextAppointment?.technicianId);

  return (
    <div className="min-h-screen">
      <PageHeader
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/store">
                <ShoppingBag size={18} />
                Browse store
              </Link>
            </Button>
            <Button asChild>
              <Link href="/user/services">
                <Wrench size={18} />
                Manage requests
              </Link>
            </Button>
          </>
        }
        description="Track service requests, approve quotes, review upcoming appointments, and manage product orders from one place."
        eyebrow="Customer Dashboard"
        title={`Welcome back, ${mockCurrentUser.firstName}`}
      />

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-3xl bg-linear-to-br from-teal-700 to-teal-800 p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <Calendar className="text-teal-200" size={24} />
            <StatusBadge className="bg-white/15 text-white" status="scheduled" />
          </div>
          <p className="mt-6 text-sm uppercase tracking-[0.2em] text-teal-100">
            Upcoming visit
          </p>
          <h2 className="mt-2 text-xl font-semibold">
            {nextAppointment ? formatMonthDay(nextAppointment.startAt) : "No appointment booked"}
          </h2>
          <p className="mt-2 text-sm text-teal-100">
            {nextAppointment
              ? `${formatTime(nextAppointment.startAt)} with ${appointmentTechnician?.displayName ?? "assigned technician"}`
              : "Accept a quote to choose your next service window."}
          </p>
        </div>

        <div className="rounded-3xl border border-amber-100 bg-amber-50 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <ReceiptText className="text-amber-700" size={24} />
            {quoteReady ? <StatusBadge status={quoteReady.status} /> : null}
          </div>
          <p className="mt-6 text-sm uppercase tracking-[0.2em] text-amber-700">
            Quote awaiting action
          </p>
          <h2 className="mt-2 text-xl font-semibold text-gray-900">
            {quoteReady ? formatCurrencyUsd(quoteReady.totalUsd) : "All quotes handled"}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {quoteReadyRequest && quoteReady
              ? `${quoteReadyRequest.title} expires ${formatMonthDay(quoteReady.expiresAt)}`
              : "No pending quote approvals right now."}
          </p>
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <CreditCard className="text-teal-700" size={24} />
            <p className="text-sm font-semibold text-gray-500">Outstanding</p>
          </div>
          <h2 className="mt-6 text-xl font-semibold text-gray-900">
            {formatCurrencyUsd(pendingBalance)}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Default card: {mockCustomerPaymentMethods[0]?.brand} ending in{" "}
            {mockCustomerPaymentMethods[0]?.last4}
          </p>
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <Bell className="text-teal-700" size={24} />
            <p className="text-sm font-semibold text-gray-500">Unread</p>
          </div>
          <h2 className="mt-6 text-xl font-semibold text-gray-900">
            {unreadCount} notification{unreadCount === 1 ? "" : "s"}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {submittedReviews} completed review{submittedReviews === 1 ? "" : "s"} already
            submitted.
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="rounded-3xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Service workflow</h2>
              <p className="mt-1 text-sm text-gray-500">
                Requests, quotes, appointments, and completions stay separated from store orders.
              </p>
            </div>
            <Button asChild variant="ghost">
              <Link href="/user/services">View all</Link>
            </Button>
          </div>

          <div className="divide-y divide-gray-100">
            {mockCustomerServiceRequests.map((request) => (
              <Link
                className="block px-6 py-5 transition hover:bg-gray-50"
                href={`/user/services/${request.id}`}
                key={request.id}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-lg font-semibold text-gray-900">{request.title}</h3>
                      <StatusBadge status={request.status} />
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                      {request.propertyLabel} · Preferred {formatMonthDay(request.preferredDate)} at{" "}
                      {request.preferredTime}
                    </p>
                  </div>

                  <p className="text-sm font-medium text-teal-700">Open details</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <Package className="text-teal-700" size={20} />
              <h2 className="text-lg font-semibold text-gray-900">Latest store order</h2>
            </div>
            <p className="mt-4 text-sm text-gray-500">{latestOrder.id}</p>
            <h3 className="mt-2 text-xl font-semibold text-gray-900">
              {latestOrderProduct?.name ?? "Product order"}
            </h3>
            <p className="mt-2 text-sm text-gray-600">{latestOrder.etaLabel}</p>
            <div className="mt-4 flex items-center justify-between">
              <StatusBadge status={latestOrder.status} />
              <span className="font-semibold text-gray-900">
                {formatCurrencyUsd(latestOrder.totalUsd)}
              </span>
            </div>
            <Button asChild className="mt-5 w-full">
              <Link href={`/user/orders/${latestOrder.id}`}>Review order details</Link>
            </Button>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">Portal shortcuts</h2>
            <div className="mt-5 space-y-3">
              <Link
                className="flex items-center justify-between rounded-2xl border border-gray-200 px-4 py-3 text-sm text-gray-700 transition hover:border-teal-200 hover:bg-teal-50"
                href="/user/notifications"
              >
                View unread notifications
                <span className="font-semibold text-teal-700">{unreadCount}</span>
              </Link>
              <Link
                className="flex items-center justify-between rounded-2xl border border-gray-200 px-4 py-3 text-sm text-gray-700 transition hover:border-teal-200 hover:bg-teal-50"
                href="/user/payments"
              >
                Review payment history
                <span className="font-semibold text-teal-700">
                  {mockPaymentLedger.length}
                </span>
              </Link>
              <Link
                className="flex items-center justify-between rounded-2xl border border-gray-200 px-4 py-3 text-sm text-gray-700 transition hover:border-teal-200 hover:bg-teal-50"
                href="/user/reviews"
              >
                Manage reviews
                <span className="font-semibold text-teal-700">
                  {mockCustomerReviews.length}
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
