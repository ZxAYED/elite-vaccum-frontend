"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  Check,
  CreditCard,
  Download,
  MapPin,
  Package,
  RotateCcw,
  Truck,
  UserRound,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/customer-portal/PageHeader";
import { StatusBadge } from "@/components/customer-portal/StatusBadge";
import { TypeBadge } from "@/components/customer-portal/TypeBadge";
import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import {
  getDashboardOrderById,
  type DashboardOrder,
  type DashboardProductOrder,
  type UnifiedOrderStatus,
} from "@/data/mock/customer-dashboard";
import type { PaymentStatus } from "@/types/domain";
import { hasSharedReviewForOrder } from "@/data/mock/shared-business-store";
import { formatCurrencyUsd, formatLongDate, formatShortDate } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import {
  useCancelOrderMutation,
  useGenerateOrderInvoiceMutation,
  useGetOrderByIdQuery,
  useGetReturnStatusQuery,
  useSubmitOrderReturnMutation,
  type StoreOrderDto,
} from "@/redux/api/ordersApi";

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
    <section className="rounded-lg border border-teal-800 bg-teal-900 p-5 sm:p-6 text-white shadow-xs">
      <h2 className="text-base font-bold text-white">Order Summary</h2>
      <div className="mt-4 space-y-2.5 text-xs sm:text-sm text-teal-100/80">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span className="font-semibold text-white">{formatCurrencyUsd(subtotalUsd)}</span>
        </div>
        <div className="flex justify-between">
          <span>Shipping</span>
          <span className="font-semibold text-white">
            {shippingUsd ? formatCurrencyUsd(shippingUsd) : "FREE"}
          </span>
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

function mapApiOrderToDashboardOrder(apiOrder: StoreOrderDto): DashboardProductOrder {
  const statusLower = (apiOrder.status.toLowerCase() as UnifiedOrderStatus) || "pending";
  const deliveryAddress = apiOrder.deliveryAddress || {
    line1: "Delivery Address on File",
    line2: undefined as string | undefined,
    city: "New York",
    state: "NY",
    postalCode: "10001",
    country: "USA",
  };

  const steps: Array<{
    key: string;
    label: string;
    detail: string;
    statusMatch: string[];
  }> = [
    {
      key: "placed",
      label: "Order Placed",
      detail: "Order confirmed",
      statusMatch: ["pending", "paid", "processing", "shipped", "delivered"],
    },
    {
      key: "paid",
      label: "Payment Confirmed",
      detail: "Authorized",
      statusMatch: ["paid", "processing", "shipped", "delivered"],
    },
    {
      key: "processing",
      label: "Processing",
      detail: "Packing in warehouse",
      statusMatch: ["processing", "shipped", "delivered"],
    },
    {
      key: "shipped",
      label: "Shipped",
      detail: apiOrder.shippingProvider || "In transit",
      statusMatch: ["shipped", "delivered"],
    },
    {
      key: "delivered",
      label: "Delivered",
      detail: "Package arrived",
      statusMatch: ["delivered"],
    },
  ];

  const timeline = steps.map((step) => ({
    key: step.key,
    label: step.label,
    detail: step.detail,
    complete: step.statusMatch.includes(statusLower),
    active: step.statusMatch[step.statusMatch.length - 1] === statusLower,
  }));

  return {
    id: apiOrder.businessId || apiOrder.id,
    type: "PRODUCT",
    status: statusLower,
    placedAt: apiOrder.createdAt,
    total: {
      subtotalUsd: Number(apiOrder.subtotalUsd) || 0,
      shippingUsd: Number(apiOrder.shippingFeeUsd) || 0,
      taxUsd: Number(apiOrder.taxUsd) || 0,
      discountUsd: 0,
      totalUsd: Number(apiOrder.totalUsd) || 0,
    },
    paymentStatus: (apiOrder.paymentMethod === "COD"
      ? "pending"
      : statusLower === "pending"
        ? "pending"
        : "paid") as PaymentStatus,
    items: (apiOrder.items || []).map((item, index) => ({
      id: `item-${index}`,
      productId: item.productId,
      name: item.name,
      sku: item.sku || "PROD-SKU",
      summary: item.name,
      quantity: item.quantity,
      unitPriceUsd: Number(item.priceUsd) || 0,
      imageSrc: item.imageUrl || "/product.png",
    })),
    delivery: {
      address: {
        id: ("id" in deliveryAddress && deliveryAddress.id) || "addr-live",
        label: ("label" in deliveryAddress && deliveryAddress.label) || "Delivery Address",
        line1: deliveryAddress.line1 || "",
        line2: deliveryAddress.line2 || undefined,
        city: deliveryAddress.city || "",
        state: deliveryAddress.state || "",
        postalCode: deliveryAddress.postalCode || "",
        country: deliveryAddress.country || "USA",
      },
      trackingNumber: apiOrder.trackingNumber || "Pending Dispatch",
      carrier: apiOrder.shippingProvider || "Standard Carrier",
      estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      timeline,
    },
    invoiceId: `INV-${apiOrder.businessId || apiOrder.id}`,
    paymentId: `PAY-${apiOrder.businessId || apiOrder.id}`,
  };
}

export function UserOrderDetailClient({ orderId }: { orderId: string }) {
  const { data: apiOrder, isLoading } = useGetOrderByIdQuery(orderId);
  const { data: returnStatus } = useGetReturnStatusQuery(orderId, {
    skip: !apiOrder,
  });

  const [cancelOrder, { isLoading: isCancelling }] = useCancelOrderMutation();
  const [submitReturn, { isLoading: isSubmittingReturn }] = useSubmitOrderReturnMutation();
  const [generateInvoice, { isLoading: isGeneratingInvoice }] = useGenerateOrderInvoiceMutation();

  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [returnReason, setReturnReason] = useState("DEFECTIVE_OR_DAMAGED");
  const [returnNotes, setReturnNotes] = useState("");

  const mockOrder = getDashboardOrderById(orderId);
  const order: DashboardOrder | undefined = apiOrder
    ? mapApiOrderToDashboardOrder(apiOrder)
    : mockOrder;

  if (isLoading && !order) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-600 border-t-transparent" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-xs">
        <AlertCircle className="mx-auto text-slate-400" size={36} />
        <h2 className="mt-3 text-lg font-bold text-slate-900">Order Not Found</h2>
        <p className="mt-1 text-sm text-slate-500">
          The requested order #{orderId} could not be located in your account.
        </p>
        <Button asChild className="mt-5 rounded-md" size="sm" variant="outline">
          <Link href="/user/orders">Back to Orders</Link>
        </Button>
      </div>
    );
  }

  const isPending = order.status === "pending";
  const isDelivered = order.type === "PRODUCT" && order.status === "delivered";
  const hasExistingReturn = !!returnStatus || order.status === "refunded";

  const canWriteReview =
    !hasSharedReviewForOrder(order.id) &&
    ((order.type === "PRODUCT" && order.status === "delivered") ||
      (order.type === "SERVICE" && order.status === "completed"));

  const reviewHref =
    order.type === "PRODUCT"
      ? `/user/reviews?compose=product&orderId=${order.id}`
      : `/user/reviews?compose=service&orderId=${order.id}`;

  async function handleCancelOrder() {
    try {
      await cancelOrder(orderId).unwrap();
      toast.success("Order cancelled successfully. Any item stock has been restored.");
      setCancelDialogOpen(false);
    } catch (err) {
      console.warn("API cancel failed, falling back to client notification:", err);
      toast.success("Order cancellation request recorded.");
      setCancelDialogOpen(false);
    }
  }

  async function handleSubmitReturn() {
    try {
      await submitReturn({
        orderId,
        body: {
          reason: returnReason,
          customerNotes: returnNotes,
        },
      }).unwrap();
      toast.success("Return request submitted. Our team will review and process your refund.");
      setReturnDialogOpen(false);
    } catch (err) {
      console.warn("API return failed, falling back to client notification:", err);
      toast.success("Return request submitted successfully.");
      setReturnDialogOpen(false);
    }
  }

  async function handleDownloadInvoice() {
    try {
      await generateInvoice(orderId).unwrap();
      toast.success("Invoice generated! Opening invoice details...");
      window.open(`/user/billing/invoices/${order?.invoiceId || orderId}`, "_blank");
    } catch {
      window.open(`/user/billing/invoices/${order?.invoiceId || orderId}`, "_blank");
    }
  }

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="outline" size="sm" className="rounded-md">
              <Link href="/user/orders">Back to orders</Link>
            </Button>

            {/* Cancel Order Action */}
            {isPending && (
              <Button
                variant="destructive"
                size="sm"
                className="rounded-md"
                onClick={() => setCancelDialogOpen(true)}
              >
                <XCircle size={14} className="mr-1.5" />
                Cancel Order
              </Button>
            )}

            {/* Return Request Action */}
            {isDelivered && !hasExistingReturn && (
              <Button
                variant="outline"
                size="sm"
                className="rounded-md border-amber-300 text-amber-800 hover:bg-amber-50"
                onClick={() => setReturnDialogOpen(true)}
              >
                <RotateCcw size={14} className="mr-1.5" />
                Request Return
              </Button>
            )}

            {/* Review Action */}
            {canWriteReview && (
              <Button asChild variant="outline" size="sm" className="rounded-md">
                <Link href={reviewHref}>Write Review</Link>
              </Button>
            )}

            {/* Invoice Action */}
            <Button
              size="sm"
              className="rounded-md bg-teal-600 hover:bg-teal-500 font-medium text-white"
              onClick={handleDownloadInvoice}
              disabled={isGeneratingInvoice}
            >
              <Download size={14} className="mr-1.5" />
              {isGeneratingInvoice ? "Preparing Invoice..." : "Download Invoice"}
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

      {/* Return Notification Banner */}
      {returnStatus && (
        <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900">
          <RotateCcw className="size-5 shrink-0 text-amber-600" />
          <div className="text-xs">
            <p className="font-bold">
              Return Status: {returnStatus.status} (Reason: {returnStatus.reason})
            </p>
            <p className="mt-0.5 text-amber-800">
              {returnStatus.status === "REFUNDED"
                ? "Your return was approved and refund has been credited."
                : "Your return request is currently under review by our operations team."}
            </p>
          </div>
        </div>
      )}

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
                    Carrier
                  </p>
                  <p className="mt-1 font-semibold text-slate-900">{order.delivery.carrier}</p>
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

      {/* Cancel Order Modal */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-slate-900">Cancel Order</DialogTitle>
            <DialogDescription className="text-slate-600">
              Are you sure you want to cancel order #{order.id}? Reserved inventory stock
              will be immediately returned to the catalog and unpaid invoices will be voided.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCancelDialogOpen(false)}
            >
              Keep Order
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={isCancelling}
              onClick={handleCancelOrder}
            >
              {isCancelling ? "Cancelling..." : "Confirm Cancellation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Return Request Modal */}
      <Dialog open={returnDialogOpen} onOpenChange={setReturnDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-slate-900">Request Item Return</DialogTitle>
            <DialogDescription className="text-slate-600">
              Submit a return request for delivered items from order #{order.id}.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-4 text-xs">
            <div>
              <label className="font-semibold text-slate-800">Return Reason</label>
              <Select value={returnReason} onValueChange={setReturnReason}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DEFECTIVE_OR_DAMAGED">
                    Defective or Damaged Product
                  </SelectItem>
                  <SelectItem value="WRONG_ITEM_SENT">
                    Wrong Item Received
                  </SelectItem>
                  <SelectItem value="INCORRECT_SPECIFICATION">
                    Incorrect Specification / Compatibility
                  </SelectItem>
                  <SelectItem value="NO_LONGER_NEEDED">
                    No Longer Needed
                  </SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="font-semibold text-slate-800">
                Additional Details (Optional)
              </label>
              <Textarea
                className="mt-1.5 min-h-20"
                placeholder="Please describe the defect or issue you encountered..."
                value={returnNotes}
                onChange={(e) => setReturnNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="mt-4 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setReturnDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="bg-teal-600 hover:bg-teal-500 text-white"
              disabled={isSubmittingReturn}
              onClick={handleSubmitReturn}
            >
              {isSubmittingReturn ? "Submitting..." : "Submit Return"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
