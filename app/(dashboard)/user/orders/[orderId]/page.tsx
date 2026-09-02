import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CalendarDays,
  Check,
  CreditCard,
  FileText,
  MapPin,
  Package,
  Truck,
  UserRound,
} from "lucide-react";

import { PageHeader } from "@/components/customer-portal/PageHeader";
import { StatusBadge } from "@/components/customer-portal/StatusBadge";
import { TypeBadge } from "@/components/customer-portal/TypeBadge";
import { Button } from "@/components/ui/Button";
import { getDashboardOrderById } from "@/data/mock/customer-dashboard";
import { hasSharedReviewForOrder } from "@/data/mock/shared-business-store";
import { formatCurrencyUsd, formatLongDate, formatShortDate } from "@/lib/formatters";
import { cn } from "@/lib/utils";

interface OrderDetailPageProps {
  params: Promise<{ orderId: string }>;
}

function TotalSummary({
  subtotalUsd,
  shippingUsd,
  taxUsd,
  discountUsd,
  totalUsd,
}: {
  subtotalUsd: number;
  shippingUsd?: number;
  taxUsd: number;
  discountUsd?: number;
  totalUsd: number;
}) {
  return (
    <section className="rounded-lg border border-teal-900/60 bg-gradient-to-br from-teal-950 via-teal-900 to-slate-900 p-5 sm:p-6 text-white shadow-xs">
      <h2 className="text-base font-bold text-white">Order Summary</h2>
      <div className="mt-4 space-y-2.5 text-xs sm:text-sm text-teal-100/80">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span className="font-semibold text-white">{formatCurrencyUsd(subtotalUsd)}</span>
        </div>
        <div className="flex justify-between">
          <span>Shipping</span>
          <span className="font-semibold text-white">{shippingUsd ? formatCurrencyUsd(shippingUsd) : "FREE"}</span>
        </div>
        <div className="flex justify-between">
          <span>Estimated Tax</span>
          <span className="font-semibold text-white">{formatCurrencyUsd(taxUsd)}</span>
        </div>
        {discountUsd ? (
          <div className="flex justify-between text-emerald-400 font-medium">
            <span>Special Discount</span>
            <span>-{formatCurrencyUsd(discountUsd)}</span>
          </div>
        ) : null}
      </div>
      <div className="mt-5 flex justify-between border-t border-white/15 pt-4 text-lg font-bold text-white">
        <span>Total</span>
        <span className="text-teal-200">{formatCurrencyUsd(totalUsd)}</span>
      </div>
    </section>
  );
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { orderId } = await params;
  const order = getDashboardOrderById(orderId);

  if (!order) {
    notFound();
  }

  const canWriteReview =
    !hasSharedReviewForOrder(order.id) &&
    ((order.type === "PRODUCT" && order.status === "delivered") ||
      (order.type === "SERVICE" && order.status === "completed"));
  const reviewHref =
    order.type === "PRODUCT"
      ? `/user/reviews?compose=product&orderId=${order.id}`
      : `/user/reviews?compose=service&orderId=${order.id}`;

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm" className="rounded-md">
              <Link href="/user/orders">Back to orders</Link>
            </Button>
            {canWriteReview ? (
              <Button asChild variant="outline" size="sm" className="rounded-md">
                <Link href={reviewHref}>Write Review</Link>
              </Button>
            ) : null}
            <Button asChild size="sm" className="rounded-md bg-teal-600 hover:bg-teal-500 font-medium">
              <Link href={`/user/billing/invoices/${order.invoiceId}`}>
                <FileText size={14} className="mr-1.5" />
                View Invoice
              </Link>
            </Button>
          </div>
        }
        description={
          order.type === "PRODUCT"
            ? `Placed on ${formatLongDate(order.placedAt)}.`
            : `Created from service request ${order.serviceRequestId}.`
        }
        eyebrow={`${order.type} Order`}
        title={`Order Details ${order.id}`}
      />

      <div className="flex flex-wrap items-center gap-2">
        <TypeBadge type={order.type} />
        <StatusBadge status={order.status} />
      </div>

      {order.type === "PRODUCT" ? (
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-8">
            <section className="rounded-lg border border-slate-200 bg-white p-5 sm:p-6 shadow-xs">
              <h2 className="text-base font-bold text-slate-900">Delivery Status</h2>
              <div className="mt-6 grid gap-4 grid-cols-2 sm:grid-cols-5">
                {order.delivery.timeline.map((step) => (
                  <div key={step.key} className="relative text-center">
                    <div
                      className={cn(
                        "mx-auto flex size-10 items-center justify-center rounded-full border-2",
                        step.complete
                          ? "border-teal-500 bg-teal-600 text-white"
                          : "border-slate-200 bg-slate-50 text-slate-400",
                      )}
                    >
                      <Check size={16} />
                    </div>
                    <p className="mt-2 text-xs font-bold text-slate-900">{step.label}</p>
                    <p className="mt-0.5 text-[11px] text-slate-500">{step.detail}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-5 sm:p-6 shadow-xs">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4">
                Order Items ({order.items.length})
              </p>
              <div className="space-y-3">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col gap-3 rounded-md border border-slate-200 p-3.5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="relative size-16 shrink-0 overflow-hidden rounded-md border border-slate-200 bg-slate-50">
                        <Image
                          src={item.imageSrc}
                          alt={item.name}
                          fill
                          className="object-contain p-2"
                        />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">{item.name}</h3>
                        <p className="mt-0.5 text-xs text-slate-600">{item.summary}</p>
                        <p className="mt-1 text-[11px] font-medium text-slate-500">
                          Qty: {item.quantity} · SKU: {item.sku}
                        </p>
                      </div>
                    </div>
                    <p className="text-base font-bold text-slate-900">
                      {formatCurrencyUsd(item.quantity * item.unitPriceUsd)}
                    </p>
                  </div>
                ))}
              </div>
              <Button className="mt-5 rounded-md" size="sm" asChild>
                <Link href="/user/orders">Track Order Shipment</Link>
              </Button>
            </section>
          </div>

          <div className="space-y-6 lg:col-span-4">
            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-xs">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Truck className="text-teal-700" size={18} />
                <h2 className="text-sm font-bold text-slate-900">Shipping Info</h2>
              </div>
              <div className="mt-4 space-y-3 text-xs">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Delivery Address
                  </p>
                  <p className="mt-1 font-medium text-slate-800">
                    {order.delivery.address.line1}
                    <br />
                    {order.delivery.address.city}, {order.delivery.address.state}{" "}
                    {order.delivery.address.postalCode}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Tracking Number
                  </p>
                  <p className="mt-1 font-mono font-bold text-teal-900">
                    {order.delivery.trackingNumber}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Estimated Delivery
                  </p>
                  <p className="mt-1 font-semibold text-slate-900">
                    {formatShortDate(order.delivery.estimatedDelivery)}
                  </p>
                </div>
              </div>

              <div className="mt-5 border-t border-slate-100 pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className="text-teal-700" size={16} />
                  <h3 className="text-xs font-bold text-slate-900">Payment Details</h3>
                </div>
                <StatusBadge status={order.paymentStatus} />
              </div>
            </section>

            <TotalSummary {...order.total} />
          </div>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-8">
            <section className="rounded-lg border border-slate-200 bg-white p-5 sm:p-6 shadow-xs">
              <h2 className="text-base font-bold text-slate-900">Service Timeline</h2>
              <div className="mt-6 grid gap-4 grid-cols-2 sm:grid-cols-4">
                {order.timeline.map((step) => (
                  <div key={step.key} className="text-center">
                    <div
                      className={cn(
                        "mx-auto flex size-10 items-center justify-center rounded-full border-2",
                        step.complete
                          ? "border-teal-500 bg-teal-600 text-white"
                          : "border-slate-200 bg-slate-50 text-slate-400",
                      )}
                    >
                      <Check size={16} />
                    </div>
                    <p className="mt-2 text-xs font-bold text-slate-900">{step.label}</p>
                    <p className="mt-0.5 text-[11px] text-slate-500">{step.detail}</p>
                    <p className="mt-1 text-[10px] text-slate-400 font-mono">{step.dateLabel}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-5 sm:p-6 shadow-xs">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <CalendarDays className="text-teal-700" size={18} />
                <h2 className="text-sm font-bold text-slate-900">Appointment Details</h2>
              </div>
              <div className="mt-4 grid gap-3 rounded-md bg-slate-50 p-3.5 sm:grid-cols-2 text-xs">
                <div>
                  <p className="font-semibold uppercase tracking-wider text-slate-400 text-[10px]">
                    Requested Schedule
                  </p>
                  <p className="mt-1 font-semibold text-slate-900">
                    {order.requestedSchedule}
                  </p>
                </div>
                <div>
                  <p className="font-semibold uppercase tracking-wider text-slate-400 text-[10px]">
                    Confirmed Schedule
                  </p>
                  <p className="mt-1 font-semibold text-teal-950">
                    {order.currentSchedule}
                  </p>
                </div>
              </div>
              {order.technician ? (
                <div className="mt-4 flex items-center gap-3.5 rounded-md border border-slate-200 bg-slate-50/70 p-3.5">
                  <Image
                    src={order.technician.avatarSrc}
                    alt={order.technician.name}
                    width={44}
                    height={44}
                    className="rounded-full object-cover border border-teal-200"
                  />
                  <div>
                    <p className="font-bold text-xs uppercase tracking-wider text-slate-900">
                      {order.technician.name}
                    </p>
                    <p className="text-xs text-slate-500">{order.technician.role}</p>
                  </div>
                </div>
              ) : null}
            </section>
          </div>

          <div className="space-y-6 lg:col-span-4">
            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-xs">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Package className="text-teal-700" size={18} />
                <h2 className="text-sm font-bold text-slate-900">Service Overview</h2>
              </div>
              <div className="mt-4 space-y-3.5 text-xs">
                <div className="flex items-start gap-2.5">
                  <UserRound className="mt-0.5 text-teal-700" size={16} />
                  <div>
                    <p className="font-semibold uppercase tracking-wider text-slate-400 text-[10px]">
                      Service Type
                    </p>
                    <p className="mt-0.5 font-semibold text-slate-900">{order.serviceName}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <MapPin className="mt-0.5 text-teal-700" size={16} />
                  <div>
                    <p className="font-semibold uppercase tracking-wider text-slate-400 text-[10px]">
                      Address
                    </p>
                    <p className="mt-0.5 font-medium text-slate-800">
                      {order.location.line1}, {order.location.city},{" "}
                      {order.location.state} {order.location.postalCode}
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-4 rounded-md bg-teal-900 p-3.5 text-white text-xs">
                <p className="font-bold">Payment Status</p>
                <p className="mt-1 text-teal-100/80">
                  Final payment is connected to invoice {order.invoiceId}.
                </p>
              </div>
              {order.customerNotes && (
                <div className="mt-3 rounded-md bg-slate-50 border border-slate-200 p-3 text-xs text-slate-700">
                  <span className="font-semibold text-slate-900">Notes:</span>{" "}
                  {order.customerNotes}
                </div>
              )}
            </section>

            <TotalSummary {...order.total} />
          </div>
        </div>
      )}
    </div>
  );
}
