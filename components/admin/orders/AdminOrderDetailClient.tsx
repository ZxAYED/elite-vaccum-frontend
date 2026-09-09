"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  Banknote,
  CreditCard,
  FileText,
  History,
  Loader2,
  Mail,
  MapPin,
  Package,
  Phone,
  RotateCcw,
  Settings2,
  Truck,
  UserRound,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import {
  AdminPageHeader,
  AdminPageShell,
  AdminSurface,
} from "@/components/admin/AdminPageShell";
import { StatusBadge } from "@/components/customer-portal/StatusBadge";
import { OrderInvoiceCard } from "@/components/invoices/OrderInvoiceCard";
import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { readApiMessage } from "@/lib/api-error";
import { toStatusSlug } from "@/lib/customer-orders";
import { formatCurrencyUsd, formatLongDate } from "@/lib/formatters";
import {
  ADMIN_CANCELLABLE_STATUSES,
  REFUNDABLE_ORDER_STATUSES,
  useApproveReturnRefundMutation,
  useCancelOrderMutation,
  useGetOrderByIdQuery,
  useGetReturnStatusQuery,
  useUpdateOrderStatusMutation,
  type StoreOrderDto,
  type StoreOrderStatus,
} from "@/redux/api/ordersApi";

/**
 * Admin detail for a PRODUCT order. Service jobs are not orders — they live as
 * service requests / service orders under `/admin/service-requests`, so this
 * screen has no service branch.
 */

/** Statuses an admin can set. FAILED and REFUNDED are set by the system. */
const ASSIGNABLE_STATUSES: StoreOrderStatus[] = [
  "PENDING",
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "COMPLETED",
];

export function AdminOrderDetailClient({ orderId }: { orderId: string }) {
  const {
    data: order,
    isLoading,
    isError,
    refetch,
  } = useGetOrderByIdQuery(orderId);

  const { data: returnStatus } = useGetReturnStatusQuery(orderId, {
    skip: !order,
  });

  const [updateOrderStatus, { isLoading: isUpdatingStatus }] =
    useUpdateOrderStatusMutation();
  const [cancelOrder, { isLoading: isCancelling }] = useCancelOrderMutation();
  const [approveRefund, { isLoading: isRefunding }] =
    useApproveReturnRefundMutation();

  const [statusDraft, setStatusDraft] = useState<StoreOrderStatus | null>(null);
  const [statusNote, setStatusNote] = useState("");
  const [trackingDraft, setTrackingDraft] = useState<{
    carrier: string;
    trackingNumber: string;
  } | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [refundOpen, setRefundOpen] = useState(false);
  const [refundNote, setRefundNote] = useState("");

  if (isLoading) {
    return (
      <AdminPageShell>
        <div className="flex items-center justify-center rounded-xl border border-teal-100 bg-white py-24 text-slate-500">
          <Loader2 className="mr-2 size-5 animate-spin text-teal-700" />
          Loading order...
        </div>
      </AdminPageShell>
    );
  }

  if (isError || !order) {
    return (
      <AdminPageShell>
        <AdminSurface className="py-16 text-center">
          <AlertTriangle className="mx-auto size-8 text-slate-400" />
          <h1 className="mt-4 text-xl font-semibold text-slate-950">
            Order not found
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            No order matched &ldquo;{orderId}&rdquo;.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button onClick={() => void refetch()} variant="outline">
              Try again
            </Button>
            <Button asChild>
              <Link href="/admin/orders">Back to Orders</Link>
            </Button>
          </div>
        </AdminSurface>
      </AdminPageShell>
    );
  }

  const orderRef = order.businessId || order.id;
  const canCancel = ADMIN_CANCELLABLE_STATUSES.includes(order.status);
  const canRefund =
    REFUNDABLE_ORDER_STATUSES.includes(order.status) &&
    !order.refundSummary?.isRefunded;
  const refund = order.refundSummary;
  // A refund with no Stripe id never moved money — it has to be paid by hand.
  const manualRefund = refund?.refunds.some((entry) => !entry.stripeRefundId);
  const selectedStatus = statusDraft ?? order.status;
  const carrier = trackingDraft?.carrier ?? order.shippingProvider ?? "";
  const trackingNumber =
    trackingDraft?.trackingNumber ?? order.trackingNumber ?? "";

  /** Only the fields that actually changed are sent, per the API contract. */
  const handleSaveStatus = async () => {
    if (!statusDraft && !statusNote.trim()) return;
    try {
      await updateOrderStatus({
        id: order.id,
        ...(statusDraft && statusDraft !== order.status
          ? { status: statusDraft }
          : {}),
        ...(statusNote.trim() ? { notes: statusNote.trim() } : {}),
      }).unwrap();
      toast.success("Order status updated.");
      setStatusDraft(null);
      setStatusNote("");
    } catch (err) {
      toast.error("Could not update status", {
        description: readApiMessage(err, "The status change was rejected."),
      });
    }
  }

  const handleSaveTracking = async () => {
    try {
      await updateOrderStatus({
        id: order.id,
        shippingProvider: carrier.trim(),
        trackingNumber: trackingNumber.trim(),
      }).unwrap();
      toast.success("Shipping details saved.");
      setTrackingDraft(null);
    } catch (err) {
      toast.error("Could not save shipping details", {
        description: readApiMessage(err, "The update was rejected."),
      });
    }
  }

  const handleCancel = async () => {
    try {
      await cancelOrder(order.id).unwrap();
      toast.success(`Order ${orderRef} cancelled. Inventory restored.`);
      setCancelOpen(false);
    } catch (err) {
      toast.error("Could not cancel this order", {
        description: readApiMessage(
          err,
          "This order can no longer be cancelled.",
        ),
      });
    }
  }

  /**
   * Approving a return issues a full Stripe refund where one is possible,
   * restores inventory and sets the order REFUNDED. `requiresManualPayout`
   * means no money moved — never report that as a completed refund.
   */
  const handleRefund = async () => {
    try {
      const result = await approveRefund({
        orderId: order.id,
        adminNote: refundNote,
      }).unwrap();

      setRefundOpen(false);
      setRefundNote("");

      if (result.refund.requiresManualPayout) {
        toast.warning("Refund requires a manual payout", {
          description: result.message,
          duration: 12000,
        });
      } else {
        toast.success("Refund issued", { description: result.message });
      }
    } catch (err) {
      const status = (err as { status?: number }).status;
      if (status === 409) {
        // A refund is already running server-side; this is not a hard failure.
        toast.info("A refund is already being processed", {
          description: "Give it a moment, then reload the order.",
        });
        setRefundOpen(false);
        return;
      }
      toast.error("Refund failed", {
        description: readApiMessage(err, "The refund was rejected."),
      });
    }
  }

  return (
    <AdminPageShell>
      <AdminPageHeader
        eyebrow="Product Order"
        title={`Order ${orderRef}`}
        description={`Placed ${formatLongDate(order.placedAt)} · ${order.items.length} line item${order.items.length === 1 ? "" : "s"} · ${formatCurrencyUsd(Number(order.totalUsd))}`}
        action={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/orders">
                <ArrowLeft size={14} />
                All Orders
              </Link>
            </Button>
            {canRefund ? (
              <Button
                variant="outline"
                size="sm"
                className="border-amber-300 text-amber-800 hover:bg-amber-50"
                onClick={() => setRefundOpen(true)}
              >
                <RotateCcw size={14} />
                Approve Refund
              </Button>
            ) : null}
            {canCancel ? (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setCancelOpen(true)}
              >
                <XCircle size={14} />
                Cancel Order
              </Button>
            ) : null}
          </div>
        }
      />

      {refund?.isRefunded ? (
        <div
          className={
            manualRefund
              ? "flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-900"
              : "flex items-start gap-3 rounded-xl border border-slate-300 bg-slate-50 p-4 text-slate-800"
          }
        >
          {manualRefund ? (
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-600" />
          ) : (
            <BadgeCheck className="mt-0.5 size-5 shrink-0 text-slate-500" />
          )}
          <div className="text-sm">
            <p className="font-bold">
              {manualRefund
                ? "Manual payout required"
                : `Refunded ${formatCurrencyUsd(Number(refund.totalRefundedUsd))}`}
            </p>
            <p className="mt-0.5 text-xs">
              {manualRefund
                ? `No card refund was possible for this order. ${formatCurrencyUsd(Number(refund.totalRefundedUsd))} must be returned to the customer offline.`
                : `${refund.refundCount} refund${refund.refundCount === 1 ? "" : "s"} recorded against this order.`}
            </p>
            {refund.refunds.map((entry) => (
              <p className="mt-1 font-mono text-[11px]" key={entry.id}>
                {formatCurrencyUsd(Number(entry.amountUsd))} · {entry.status}
                {entry.stripeRefundId ? ` · ${entry.stripeRefundId}` : ""}
              </p>
            ))}
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={toStatusSlug(order.status)} />
        {order.paymentStatus ? (
          <StatusBadge status={toStatusSlug(order.paymentStatus)} />
        ) : null}
        <span className="inline-flex items-center gap-1.5 rounded-md border border-teal-100 bg-teal-50/70 px-2 py-0.5 text-xs font-semibold text-teal-900">
          {order.paymentMethod === "COD" ? (
            <>
              <Banknote size={13} /> Cash on delivery
            </>
          ) : (
            <>
              <CreditCard size={13} /> Paid online
            </>
          )}
        </span>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.25fr_0.9fr]">
        <div className="space-y-4">
          <AdminSurface>
            <div className="flex items-center gap-3">
              <Package className="text-teal-700" size={20} />
              <div>
                <h2 className="text-xl font-semibold text-slate-950">
                  Order Items
                </h2>
                <p className="text-sm text-slate-500">
                  {order.items.length} line item
                  {order.items.length === 1 ? "" : "s"} in this order.
                </p>
              </div>
            </div>
            <div className="mt-5 space-y-4">
              {order.items.map((item) => (
                <div
                  className="flex flex-col gap-4 rounded-xl border border-teal-100 p-4 sm:flex-row sm:items-center sm:justify-between"
                  key={item.id}
                >
                  <div className="flex gap-4">
                    <div className="relative flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-teal-50">
                      {item.imageUrl ? (
                        <Image
                          alt={item.productName}
                          className="object-contain p-3"
                          fill
                          src={item.imageUrl}
                        />
                      ) : (
                        <Package size={26} className="text-teal-700/40" />
                      )}
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-slate-950">
                        {item.productName}
                      </p>
                      {item.productSku ? (
                        <p className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                          SKU {item.productSku}
                        </p>
                      ) : null}
                      <p className="mt-2 text-sm text-slate-600">
                        Qty {item.quantity} • Unit{" "}
                        {formatCurrencyUsd(Number(item.unitPriceUsd))}
                      </p>
                    </div>
                  </div>
                  <p className="text-xl font-semibold text-slate-950">
                    {formatCurrencyUsd(Number(item.totalUsd))}
                  </p>
                </div>
              ))}
            </div>
          </AdminSurface>

          <AdminSurface id="shipping">
            <div className="flex items-center gap-3">
              <Truck className="text-teal-700" size={20} />
              <div>
                <h2 className="text-xl font-semibold text-slate-950">
                  Shipping &amp; Tracking
                </h2>
                <p className="text-sm text-slate-500">
                  Carrier and tracking number sent to the customer.
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                  <MapPin size={12} />
                  Delivery Address
                </p>
                {order.shippingAddress?.line1 ? (
                  <p className="mt-2 text-sm leading-6 text-slate-700">
                    {order.shippingAddress.recipientName ? (
                      <>
                        <strong>{order.shippingAddress.recipientName}</strong>
                        <br />
                      </>
                    ) : null}
                    {order.shippingAddress.line1}
                    {order.shippingAddress.line2 ? (
                      <>
                        <br />
                        {order.shippingAddress.line2}
                      </>
                    ) : null}
                    <br />
                    {[
                      order.shippingAddress.city,
                      order.shippingAddress.state,
                      order.shippingAddress.postalCode,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                    {order.shippingAddress.country ? (
                      <>
                        <br />
                        {order.shippingAddress.country}
                      </>
                    ) : null}
                  </p>
                ) : (
                  <p className="mt-2 text-sm text-slate-500">Not recorded</p>
                )}
              </div>

              <div className="space-y-3 rounded-xl bg-slate-50 p-4">
                <div>
                  <label
                    className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400"
                    htmlFor="carrier"
                  >
                    Carrier
                  </label>
                  <Input
                    className="mt-1.5"
                    id="carrier"
                    placeholder="e.g. FedEx Freight"
                    value={carrier}
                    onChange={(event) =>
                      setTrackingDraft({
                        carrier: event.target.value,
                        trackingNumber,
                      })
                    }
                  />
                </div>
                <div>
                  <label
                    className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400"
                    htmlFor="tracking-number"
                  >
                    Tracking Number
                  </label>
                  <Input
                    className="mt-1.5"
                    id="tracking-number"
                    placeholder="e.g. FX-8899223311"
                    value={trackingNumber}
                    onChange={(event) =>
                      setTrackingDraft({
                        carrier,
                        trackingNumber: event.target.value,
                      })
                    }
                  />
                </div>
                <Button
                  className="w-full"
                  disabled={!trackingDraft || isUpdatingStatus}
                  onClick={handleSaveTracking}
                  size="sm"
                >
                  {isUpdatingStatus ? "Saving..." : "Save Shipping Details"}
                </Button>
              </div>
            </div>
          </AdminSurface>

          {order.statusHistory.length > 0 ? (
            <AdminSurface>
              <div className="flex items-center gap-3">
                <History className="text-teal-700" size={20} />
                <div>
                  <h2 className="text-xl font-semibold text-slate-950">
                    Status History
                  </h2>
                  <p className="text-sm text-slate-500">
                    Every recorded change, oldest first.
                  </p>
                </div>
              </div>
              <ol className="mt-5 space-y-3">
                {order.statusHistory.map((entry) => (
                  <li
                    className="rounded-xl border border-teal-100 p-3.5"
                    key={entry.id || entry.changedAt}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={toStatusSlug(entry.status)} />
                      <span className="text-xs text-slate-500">
                        {formatLongDate(entry.changedAt)}
                      </span>
                      {entry.actorLabel ? (
                        <span className="text-xs font-medium text-slate-600">
                          · {entry.actorLabel}
                        </span>
                      ) : null}
                    </div>
                    {entry.note ? (
                      <p className="mt-1.5 text-sm text-slate-700">
                        {entry.note}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ol>
            </AdminSurface>
          ) : null}

          {returnStatus?.returnHistory.length ? (
            <AdminSurface>
              <div className="flex items-center gap-3">
                <RotateCcw className="text-teal-700" size={20} />
                <div>
                  <h2 className="text-xl font-semibold text-slate-950">
                    Return Requests
                  </h2>
                  <p className="text-sm text-slate-500">
                    Filed by the customer. Partial returns are not supported —
                    approving refunds the whole order.
                  </p>
                </div>
              </div>
              <ol className="mt-5 space-y-3">
                {returnStatus.returnHistory.map((entry) => (
                  <li
                    className="rounded-xl border border-amber-200 bg-amber-50/60 p-3.5"
                    key={entry.id || entry.changedAt}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={toStatusSlug(entry.status)} />
                      <span className="text-xs text-slate-500">
                        {formatLongDate(entry.changedAt)}
                      </span>
                      {entry.actorLabel ? (
                        <span className="text-xs font-medium text-slate-600">
                          · {entry.actorLabel}
                        </span>
                      ) : null}
                    </div>
                    {entry.note ? (
                      <p className="mt-1.5 text-sm text-slate-800">
                        {entry.note}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ol>
            </AdminSurface>
          ) : null}
        </div>

        <div className="space-y-4">
          <AdminSurface id="status">
            <div className="flex items-center gap-3">
              <Settings2 className="text-teal-700" size={20} />
              <div>
                <h2 className="text-xl font-semibold text-slate-950">
                  Order Status
                </h2>
                <p className="text-sm text-slate-500">
                  FAILED and REFUNDED are set by the system, not here.
                </p>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              <Select
                onValueChange={(value) =>
                  setStatusDraft(value as StoreOrderStatus)
                }
                value={selectedStatus}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {ASSIGNABLE_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Textarea
                onChange={(event) => setStatusNote(event.target.value)}
                placeholder="Optional note recorded in the order history..."
                value={statusNote}
              />
              <Button
                className="w-full"
                disabled={
                  isUpdatingStatus ||
                  (statusDraft === null && !statusNote.trim()) ||
                  (statusDraft === order.status && !statusNote.trim())
                }
                onClick={handleSaveStatus}
              >
                {isUpdatingStatus ? "Saving..." : "Save Status"}
              </Button>
            </div>
          </AdminSurface>

          <AdminSurface>
            <div className="flex items-center gap-3">
              <UserRound className="text-teal-700" size={20} />
              <h2 className="text-xl font-semibold text-slate-950">Customer</h2>
            </div>
            <div className="mt-4 space-y-2 text-sm">
              <p className="font-semibold text-slate-950">
                {order.customer?.displayName || "Customer"}
              </p>
              {order.customer?.email ? (
                <p className="flex items-center gap-2 text-slate-600">
                  <Mail size={14} className="text-slate-400" />
                  {order.customer.email}
                </p>
              ) : null}
              {order.customer?.phone ? (
                <p className="flex items-center gap-2 text-slate-600">
                  <Phone size={14} className="text-slate-400" />
                  {order.customer.phone}
                </p>
              ) : null}
              {order.customerId ? (
                <Button asChild className="mt-2 w-full" size="sm" variant="outline">
                  <Link href={`/admin/customers/${order.customerId}`}>
                    View Customer
                  </Link>
                </Button>
              ) : null}
            </div>
            {order.customerNotes ? (
              <div className="mt-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
                <span className="font-semibold text-slate-900">
                  Customer notes:
                </span>{" "}
                {order.customerNotes}
              </div>
            ) : null}
          </AdminSurface>

          <AdminSurface>
            <h2 className="text-xl font-semibold text-slate-950">
              Order Summary
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Server-calculated: flat $18.00 shipping, 8% tax.
            </p>
            <div className="mt-5 space-y-3 text-sm text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatCurrencyUsd(Number(order.subtotalUsd))}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>{formatCurrencyUsd(Number(order.shippingFeeUsd))}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax</span>
                <span>{formatCurrencyUsd(Number(order.taxUsd))}</span>
              </div>
              {Number(order.discountUsd) > 0 ? (
                <div className="flex justify-between">
                  <span>Discount</span>
                  <span>-{formatCurrencyUsd(Number(order.discountUsd))}</span>
                </div>
              ) : null}
              <div className="flex justify-between border-t border-teal-100 pt-3 text-lg font-semibold text-slate-950">
                <span>Total</span>
                <span>{formatCurrencyUsd(Number(order.totalUsd))}</span>
              </div>
            </div>
          </AdminSurface>

          <OrderInvoiceCard
            canRegenerate
            invoice={order.invoice ?? order.invoices[0]}
            orderId={order.id}
            orderStatus={order.status}
            paymentMethod={order.paymentMethod}
          />
          {/* Only shown when an order somehow carries more than one invoice. */}
          {order.invoices.length > 1 ? <InvoicesPanel order={order} /> : null}
        </div>
      </div>

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Order</DialogTitle>
            <DialogDescription>
              Cancel {orderRef}? Stock is restored and any unpaid invoice is
              voided. No Stripe refund is issued — for a paid order use{" "}
              <strong>Approve Refund</strong> instead.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setCancelOpen(false)} variant="outline">
              Keep Order
            </Button>
            <Button
              disabled={isCancelling}
              onClick={handleCancel}
              variant="destructive"
            >
              {isCancelling ? "Cancelling..." : "Confirm Cancellation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={refundOpen} onOpenChange={setRefundOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Return &amp; Refund</DialogTitle>
            <DialogDescription>
              Refunds the full {formatCurrencyUsd(Number(order.totalUsd))} for{" "}
              {orderRef}, restores inventory and sets the order to REFUNDED.
              Partial amounts are not supported. If the order was paid by cash
              on delivery, no card refund is possible and you will need to pay
              the customer offline.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label
              className="text-sm font-medium text-slate-900"
              htmlFor="refund-note"
            >
              Admin note (optional)
            </label>
            <Textarea
              id="refund-note"
              onChange={(event) => setRefundNote(event.target.value)}
              placeholder="e.g. Approved after image verification. Items received at warehouse."
              value={refundNote}
            />
          </div>
          <DialogFooter>
            <Button onClick={() => setRefundOpen(false)} variant="outline">
              Cancel
            </Button>
            <Button disabled={isRefunding} onClick={handleRefund}>
              {isRefunding ? "Processing..." : "Issue Refund"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminPageShell>
  );
}

/**
 * Invoices, their payments and their refunds. An invoice stays PAID after a
 * refund — that record is the proof payment happened; the reversal is the
 * refund row. It must never be shown as unpaid.
 */
function InvoicesPanel({ order }: { order: StoreOrderDto }) {
  return (
    <AdminSurface id="billing">
      <div className="flex items-center gap-3">
        <FileText className="text-teal-700" size={20} />
        <div>
          <h2 className="text-xl font-semibold text-slate-950">
            Invoices &amp; Payments
          </h2>
          <p className="text-sm text-slate-500">
            Issued automatically when the order was placed.
          </p>
        </div>
      </div>

      {order.invoices.length === 0 ? (
        <p className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
          No invoice recorded for this order.
        </p>
      ) : (
        <div className="mt-5 space-y-4">
          {order.invoices.map((invoice) => (
            <div
              className="rounded-xl border border-teal-100 p-4"
              key={invoice.id}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Link
                  className="font-semibold text-teal-900 hover:underline"
                  href={`/admin/financials/invoices/${invoice.id}`}
                >
                  {invoice.businessId || invoice.id}
                </Link>
                <div className="flex items-center gap-2">
                  <StatusBadge status={toStatusSlug(invoice.status)} />
                  <span className="font-semibold text-slate-950">
                    {formatCurrencyUsd(Number(invoice.totalUsd))}
                  </span>
                </div>
              </div>

              {invoice.payments?.length ? (
                <div className="mt-3 space-y-1.5">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                    Payments
                  </p>
                  {invoice.payments.map((payment) => (
                    <p className="text-xs text-slate-600" key={payment.id}>
                      {formatCurrencyUsd(Number(payment.amountUsd))} ·{" "}
                      {payment.status}
                      {payment.methodLabel ? ` · ${payment.methodLabel}` : ""}
                      {payment.transactionReference ? (
                        <span className="ml-1 font-mono text-[11px] text-slate-500">
                          {payment.transactionReference}
                        </span>
                      ) : null}
                    </p>
                  ))}
                </div>
              ) : null}

              {invoice.refunds?.length ? (
                <div className="mt-3 space-y-1.5">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                    Refunds
                  </p>
                  {invoice.refunds.map((entry) => (
                    <p className="text-xs text-slate-600" key={entry.id}>
                      {formatCurrencyUsd(Number(entry.amountUsd))} ·{" "}
                      {entry.status}
                      {entry.reason ? ` · ${entry.reason}` : ""}
                      {entry.stripeRefundId ? (
                        <span className="ml-1 font-mono text-[11px] text-slate-500">
                          {entry.stripeRefundId}
                        </span>
                      ) : null}
                    </p>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </AdminSurface>
  );
}
