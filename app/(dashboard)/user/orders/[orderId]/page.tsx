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
    <section className="rounded-3xl bg-primary p-6 text-white shadow-sm">
      <h2 className="text-xl font-semibold">Order Summary</h2>
      <div className="mt-5 space-y-3 text-sm text-white/75">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>{formatCurrencyUsd(subtotalUsd)}</span>
        </div>
        <div className="flex justify-between">
          <span>Shipping</span>
          <span>{shippingUsd ? formatCurrencyUsd(shippingUsd) : "FREE"}</span>
        </div>
        <div className="flex justify-between">
          <span>Tax</span>
          <span>{formatCurrencyUsd(taxUsd)}</span>
        </div>
        {discountUsd ? (
          <div className="flex justify-between">
            <span>Discount</span>
            <span>-{formatCurrencyUsd(discountUsd)}</span>
          </div>
        ) : null}
      </div>
      <div className="mt-5 flex justify-between border-t border-white/15 pt-5 text-2xl font-semibold">
        <span>Total</span>
        <span>{formatCurrencyUsd(totalUsd)}</span>
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

  return (
    <div className="min-h-screen">
      <PageHeader
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/user/orders">Back to orders</Link>
            </Button>
            <Button asChild>
              <Link href={`/user/billing/invoices/${order.invoiceId}`}>
                <FileText size={16} />
                View Invoice
              </Link>
            </Button>
          </>
        }
        description={
          order.type === "PRODUCT"
            ? `Placed on ${formatLongDate(order.placedAt)}.`
            : `Created from service request ${order.serviceRequestId}.`
        }
        eyebrow={`${order.type} Order`}
        title={`Order Details ${order.id}`}
      />

      <div className="mb-8 flex flex-wrap items-center gap-3">
        <TypeBadge type={order.type} />
        <StatusBadge status={order.status} />
      </div>

      {order.type === "PRODUCT" ? (
        <div className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
          <div className="space-y-6">
            <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-primary">Delivery Status</h2>
              <div className="mt-8 grid gap-5 sm:grid-cols-5">
                {order.delivery.timeline.map((step) => (
                  <div key={step.key} className="relative text-center">
                    <div
                      className={cn(
                        "mx-auto flex size-12 items-center justify-center rounded-full border-4",
                        step.complete
                          ? "border-teal-100 bg-primary text-white"
                          : "border-gray-100 bg-gray-50 text-gray-400",
                      )}
                    >
                      <Check size={18} />
                    </div>
                    <p className="mt-3 text-sm font-semibold text-primary">{step.label}</p>
                    <p className="mt-1 text-xs text-gray-500">{step.detail}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                Order Items
              </p>
              <div className="mt-5 space-y-4">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col gap-4 rounded-2xl border border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex gap-4">
                      <div className="relative size-24 shrink-0 overflow-hidden rounded-2xl bg-teal-50">
                        <Image
                          src={item.imageSrc}
                          alt={item.name}
                          fill
                          className="object-contain p-3"
                        />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-primary">{item.name}</h3>
                        <p className="mt-1 text-sm text-gray-600">{item.summary}</p>
                        <p className="mt-2 text-xs font-semibold text-gray-500">
                          Qty: {item.quantity} · SKU: {item.sku}
                        </p>
                      </div>
                    </div>
                    <p className="text-2xl font-semibold text-primary">
                      {formatCurrencyUsd(item.quantity * item.unitPriceUsd)}
                    </p>
                  </div>
                ))}
              </div>
              <Button className="mt-6" asChild>
                <Link href="/user/orders">Track Order</Link>
              </Button>
            </section>
          </div>

          <div className="space-y-6">
            <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <Truck className="text-teal-700" size={22} />
                <h2 className="text-xl font-semibold text-primary">Shipping Info</h2>
              </div>
              <div className="mt-6 grid gap-5 md:grid-cols-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-gray-400">
                    Delivery Address
                  </p>
                  <p className="mt-3 text-sm text-gray-700">
                    {order.delivery.address.line1}
                    <br />
                    {order.delivery.address.city}, {order.delivery.address.state}{" "}
                    {order.delivery.address.postalCode}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-gray-400">
                    Tracking Number
                  </p>
                  <p className="mt-3 text-sm font-semibold text-primary">
                    {order.delivery.trackingNumber}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-gray-400">
                    Estimated Delivery
                  </p>
                  <p className="mt-3 text-sm font-semibold text-gray-900">
                    {formatShortDate(order.delivery.estimatedDelivery)}
                  </p>
                </div>
              </div>

              <div className="mt-8 flex items-center gap-3">
                <CreditCard className="text-teal-700" size={22} />
                <h2 className="text-xl font-semibold text-primary">Payment Details</h2>
              </div>
              <StatusBadge className="mt-4" status={order.paymentStatus} />
            </section>

            <TotalSummary {...order.total} />
          </div>
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1.25fr_0.9fr]">
          <div className="space-y-6">
            <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-primary">Service Timeline</h2>
              <div className="mt-8 grid gap-5 md:grid-cols-4">
                {order.timeline.map((step) => (
                  <div key={step.key} className="text-center">
                    <div
                      className={cn(
                        "mx-auto flex size-12 items-center justify-center rounded-full border-4",
                        step.complete
                          ? "border-teal-100 bg-primary text-white"
                          : "border-gray-100 bg-gray-50 text-gray-400",
                      )}
                    >
                      <Check size={18} />
                    </div>
                    <p className="mt-3 font-semibold text-gray-900">{step.label}</p>
                    <p className="mt-1 text-sm text-gray-600">{step.detail}</p>
                    <p className="mt-2 text-xs text-gray-400">{step.dateLabel}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <CalendarDays className="text-teal-700" size={22} />
                <h2 className="text-xl font-semibold text-primary">Appointment Details</h2>
              </div>
              <div className="mt-5 grid gap-4 rounded-2xl bg-gray-50 p-5 md:grid-cols-2">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-gray-400">
                    Requested Schedule
                  </p>
                  <p className="mt-2 font-semibold text-primary">
                    {order.requestedSchedule}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-gray-400">
                    Current Schedule
                  </p>
                  <p className="mt-2 font-semibold text-primary">
                    {order.currentSchedule}
                  </p>
                </div>
              </div>
              {order.technician ? (
                <div className="mt-5 flex items-center gap-4 rounded-2xl bg-gray-50 p-5">
                  <Image
                    src={order.technician.avatarSrc}
                    alt={order.technician.name}
                    width={56}
                    height={56}
                    className="rounded-full object-cover"
                  />
                  <div>
                    <p className="font-bold uppercase tracking-[0.12em] text-gray-900">
                      {order.technician.name}
                    </p>
                    <p className="text-sm text-gray-500">{order.technician.role}</p>
                  </div>
                </div>
              ) : null}
            </section>
          </div>

          <div className="space-y-6">
            <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <Package className="text-teal-700" size={22} />
                <h2 className="text-xl font-semibold text-primary">Service Overview</h2>
              </div>
              <div className="mt-5 space-y-5">
                <div className="flex items-start gap-3">
                  <UserRound className="mt-1 text-teal-700" size={18} />
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-gray-400">
                      Service Type
                    </p>
                    <p className="mt-2 text-gray-700">{order.serviceName}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="mt-1 text-teal-700" size={18} />
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-gray-400">
                      Address
                    </p>
                    <p className="mt-2 text-gray-700">
                      {order.location.line1}, {order.location.city},{" "}
                      {order.location.state} {order.location.postalCode}
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-6 rounded-2xl bg-primary p-5 text-white">
                <p className="font-semibold">Payment Status</p>
                <p className="mt-2 text-sm text-white/80">
                  Final payment is connected to invoice {order.invoiceId}.
                </p>
              </div>
              <div className="mt-4 rounded-2xl bg-gray-50 p-4 text-sm text-gray-700">
                <span className="font-semibold text-primary">Customer Notes:</span>{" "}
                {order.customerNotes}
              </div>
              <div className="mt-4 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900">
                <span className="font-semibold">Technician Instruction:</span>{" "}
                {order.technicianInstruction}
              </div>
            </section>

            <TotalSummary {...order.total} />
          </div>
        </div>
      )}
    </div>
  );
}
