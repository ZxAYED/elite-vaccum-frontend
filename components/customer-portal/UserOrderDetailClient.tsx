"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type Dispatch, type SetStateAction } from "react";
import {
  AlertCircle,
  Check,
  CreditCard,
  Loader2,
  Package,
  RotateCcw,
  Star,
  Truck,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { OrderInvoiceCard } from "@/components/invoices/OrderInvoiceCard";
import { PageHeader } from "@/components/customer-portal/PageHeader";
import { StatusBadge } from "@/components/customer-portal/StatusBadge";
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
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { readApiMessage } from "@/lib/api-error";
import { buildProductTimeline, toStatusSlug } from "@/lib/customer-orders";
import { formatCurrencyUsd, formatLongDate } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import type { CustomerReview } from "@/types/domain";
import {
  useGetMyReviewsQuery,
  useSubmitReviewMutation,
  type SubmitReviewRequest,
} from "@/redux/api/reviewsApi";
import {
  CUSTOMER_CANCELLABLE_STATUSES,
  RETURNABLE_ORDER_STATUSES,
  RETURN_REASONS,
  useCancelOrderMutation,
  useGetOrderByIdQuery,
  useGetReturnStatusQuery,
  useLazyGetStripeCheckoutSessionQuery,
  useSubmitOrderReturnMutation,
  type StoreOrderDto,
  type StoreOrderInvoiceDto,
  type StoreOrderItemDto,
} from "@/redux/api/ordersApi";

/**
 * Product order detail. `/store/orders` covers physical goods only — service
 * work is tracked from `/user/services` off its service request, so nothing
 * here branches on an order "type".
 */

type ReviewDraft = {
  itemId: string;
  rating: 1 | 2 | 3 | 4 | 5;
  title: string;
  body: string;
};

const emptyReviewDraft: ReviewDraft = {
  itemId: "",
  rating: 5,
  title: "",
  body: "",
};

export function UserOrderDetailClient({ orderId }: { orderId: string }) {
  const {
    data: order,
    isLoading,
    isError,
    refetch,
  } = useGetOrderByIdQuery(orderId);

  const returnable =
    order ? RETURNABLE_ORDER_STATUSES.includes(order.status) : false;
  // The return endpoint 404s for orders that were never delivered, so only ask
  // for a return record once one is possible.
  const { data: returnStatus } = useGetReturnStatusQuery(orderId, {
    skip: !returnable,
  });

  const [cancelOrder, { isLoading: isCancelling }] = useCancelOrderMutation();
  const [fetchCheckoutSession, { isLoading: isCreatingSession }] =
    useLazyGetStripeCheckoutSessionQuery();
  const [submitReturn, { isLoading: isSubmittingReturn }] =
    useSubmitOrderReturnMutation();
  const { data: myProductReviews = [] } = useGetMyReviewsQuery({
    type: "PRODUCT",
  });
  const [submitReview, { isLoading: isSubmittingReview }] =
    useSubmitReviewMutation();

  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [returnReason, setReturnReason] = useState<string>(
    RETURN_REASONS[0].value,
  );
  const [returnNote, setReturnNote] = useState("");
  // The server does not deduplicate return requests, so latch locally too.
  const [returnFiled, setReturnFiled] = useState(false);
  const [reviewDraft, setReviewDraft] = useState<ReviewDraft>(emptyReviewDraft);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-slate-200 bg-white py-20 text-slate-500">
        <Loader2 className="mr-2 size-5 animate-spin text-teal-700" />
        Loading order details...
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-10 text-center">
        <AlertCircle className="mx-auto size-8 text-slate-400" />
        <h1 className="mt-4 text-lg font-bold text-slate-900">
          Order not found
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Order {orderId} isn&apos;t on your account, or it couldn&apos;t be
          loaded.
        </p>
        <div className="mt-5 flex justify-center gap-2">
          <Button onClick={() => void refetch()} size="sm" variant="outline">
            Try again
          </Button>
          <Button asChild size="sm">
            <Link href="/user/orders">Back to Orders</Link>
          </Button>
        </div>
      </div>
    );
  }

  const orderRef = order.businessId || order.id;
  const canCancel = CUSTOMER_CANCELLABLE_STATUSES.includes(order.status);
  const canCompletePayment =
    order.status === "PENDING" && order.paymentMethod !== "COD";
  const hasReturnRequest = returnFiled || Boolean(returnStatus?.hasReturnRequest);
  const canRequestReturn = returnable && !hasReturnRequest;
  const canReview =
    order.status === "DELIVERED" || order.status === "COMPLETED";
  const refund = order.refundSummary;
  // An invoice exists only once payment resolved — a PENDING card order has
  // none, and `invoices` is []. The card renders the waiting state instead.
  const invoice = order.invoice ?? order.invoices[0];
  const latestReturnEntry =
    returnStatus?.returnHistory[returnStatus.returnHistory.length - 1];

  async function handleCancelOrder() {
    try {
      await cancelOrder(orderId).unwrap();
      toast.success("Order cancelled. Any reserved stock has been restored.");
      setCancelDialogOpen(false);
    } catch (err) {
      toast.error("Could not cancel this order", {
        description: readApiMessage(
          err,
          "This order can no longer be cancelled. Please contact support.",
        ),
      });
    }
  }

  /** Stripe pay links are single-use, so a fresh session is minted each time. */
  async function handleCompletePayment() {
    try {
      const session = await fetchCheckoutSession(orderId).unwrap();
      if (!session.checkoutUrl) throw new Error("No checkout URL returned");
      window.location.href = session.checkoutUrl;
    } catch (err) {
      toast.error("Could not start payment", {
        description: readApiMessage(
          err,
          "We couldn't create a payment link for this order. Please try again shortly.",
        ),
      });
    }
  }

  async function handleSubmitReturn() {
    try {
      const result = await submitReturn({
        orderId,
        body: {
          reason: returnReason,
          ...(returnNote.trim() ? { customerNote: returnNote.trim() } : {}),
        },
      }).unwrap();
      setReturnFiled(true);
      setReturnDialogOpen(false);
      toast.success("Return request submitted", {
        description: result.message,
      });
    } catch (err) {
      toast.error("Could not submit return request", {
        description: readApiMessage(
          err,
          "Returns can only be requested for delivered orders.",
        ),
      });
    }
  }

  async function handleSubmitProductReview(item: StoreOrderItemDto) {
    if (!order) return;
    if (!reviewDraft.title.trim() || reviewDraft.body.trim().length < 20) {
      return;
    }

    const body: SubmitReviewRequest = {
      type: "PRODUCT",
      productId: item.productId,
      productOrderId: order.id,
      rating: reviewDraft.rating,
      title: reviewDraft.title.trim(),
      body: reviewDraft.body.trim(),
    };

    try {
      await submitReview(body).unwrap();
      toast.success("Product review submitted for moderation.");
      setReviewDraft(emptyReviewDraft);
    } catch (err) {
      toast.error("Could not submit this review", {
        description: readApiMessage(
          err,
          "Please check the review details and try again.",
        ),
      });
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

            {canCompletePayment ? (
              <Button
                size="sm"
                className="rounded-md"
                disabled={isCreatingSession}
                onClick={handleCompletePayment}
              >
                <CreditCard size={14} className="mr-1.5" />
                {isCreatingSession ? "Preparing..." : "Complete Payment"}
              </Button>
            ) : null}

            {canCancel ? (
              <Button
                variant="destructive"
                size="sm"
                className="rounded-md"
                onClick={() => setCancelDialogOpen(true)}
              >
                <XCircle size={14} className="mr-1.5" />
                Cancel Order
              </Button>
            ) : null}

            {canRequestReturn ? (
              <Button
                variant="outline"
                size="sm"
                className="rounded-md border-amber-300 text-amber-800 hover:bg-amber-50"
                onClick={() => setReturnDialogOpen(true)}
              >
                <RotateCcw size={14} className="mr-1.5" />
                Request Return
              </Button>
            ) : null}

            {canReview ? (
              <Button asChild variant="outline" size="sm" className="rounded-md">
                <Link href={`/user/reviews?compose=product&orderId=${order.id}`}>
                  <Star size={14} className="mr-1.5" />
                  Write Review
                </Link>
              </Button>
            ) : null}

          </div>
        }
        description={`Placed on ${formatLongDate(order.placedAt)}.`}
        eyebrow="Product Order"
        title={`Order ${orderRef}`}
      />

      {/*
        The invoice stays PAID after a refund — that is the record of payment.
        The reversal is the refund entry, so this reads "Refunded", never "unpaid".
      */}
      {refund?.isRefunded ? (
        <div className="flex items-start gap-3 rounded-lg border border-slate-300 bg-slate-50 p-4 text-slate-800">
          <RotateCcw className="mt-0.5 size-5 shrink-0 text-slate-500" />
          <div className="text-sm">
            <p className="font-bold">
              Refunded {formatCurrencyUsd(Number(refund.totalRefundedUsd))}
            </p>
            <p className="mt-0.5 text-slate-600">
              {refund.refundCount} refund
              {refund.refundCount === 1 ? "" : "s"} issued against this order.
              {refund.refunds[0]?.processedAt
                ? ` Processed ${formatLongDate(refund.refunds[0].processedAt)}.`
                : ""}
            </p>
          </div>
        </div>
      ) : null}

      {latestReturnEntry ? (
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900">
          <RotateCcw className="mt-0.5 size-5 shrink-0 text-amber-600" />
          <div className="text-sm">
            <p className="font-bold">Return request on file</p>
            <p className="mt-0.5 text-amber-800">
              {latestReturnEntry.note ||
                "Our support team is reviewing your request and will send return shipping instructions."}
            </p>
          </div>
        </div>
      ) : null}

      {order.status === "FAILED" ? (
        <div className="flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 p-4 text-rose-900">
          <AlertCircle className="mt-0.5 size-5 shrink-0 text-rose-600" />
          <div className="text-sm">
            <p className="font-bold">Payment was not completed</p>
            <p className="mt-0.5 text-rose-800">
              Nothing was charged and the items were returned to stock. Please
              place a new order from the store.
            </p>
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={toStatusSlug(order.status)} />
        {order.paymentMethod ? (
          <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-semibold text-slate-600">
            {order.paymentMethod === "COD" ? "Cash on delivery" : "Paid online"}
          </span>
        ) : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          <DeliveryProgress status={order.status} />
          <OrderItems
            activeDraft={reviewDraft}
            canReview={canReview}
            isSubmittingReview={isSubmittingReview}
            order={order}
            productReviews={myProductReviews}
            onCancelReview={() => setReviewDraft(emptyReviewDraft)}
            onChangeDraft={setReviewDraft}
            onStartReview={(item) =>
              setReviewDraft({
                itemId: item.id,
                rating: 5,
                title: "",
                body: "",
              })
            }
            onSubmitReview={handleSubmitProductReview}
          />
          <StatusHistory order={order} />
        </div>

        <div className="space-y-6 lg:col-span-4">
          <ShippingPanel invoice={invoice} order={order} />
          <TotalSummary order={order} />
          <OrderInvoiceCard
            invoice={invoice}
            orderId={order.id}
            orderStatus={order.status}
            paymentMethod={order.paymentMethod}
          />
        </div>
      </div>

      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-slate-900">Cancel Order</DialogTitle>
            <DialogDescription className="text-slate-600">
              Cancel order {orderRef}? Reserved stock returns to the catalogue
              and any unpaid invoice is voided. If you already paid, a refund is
              handled separately by our support team.
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

      {/*
        Partial returns are not supported by the API (the per-item field is
        ignored server-side), so this covers the whole order.
      */}
      <Dialog open={returnDialogOpen} onOpenChange={setReturnDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-slate-900">
              Request a Return
            </DialogTitle>
            <DialogDescription className="text-slate-600">
              This files a return request for all items in order {orderRef}. Our
              support team reviews it and sends you return shipping
              instructions — no refund is issued until then.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-4 text-sm">
            <div>
              <label className="font-semibold text-slate-800" htmlFor="return-reason">
                Return Reason
              </label>
              <Select value={returnReason} onValueChange={setReturnReason}>
                <SelectTrigger className="mt-1.5" id="return-reason">
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  {RETURN_REASONS.map((reason) => (
                    <SelectItem key={reason.value} value={reason.value}>
                      {reason.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="font-semibold text-slate-800" htmlFor="return-note">
                Additional Details (Optional)
              </label>
              <Textarea
                className="mt-1.5 min-h-20"
                id="return-note"
                placeholder="Describe the issue you encountered..."
                value={returnNote}
                onChange={(event) => setReturnNote(event.target.value)}
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
              className="bg-teal-600 text-white hover:bg-teal-500"
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

/** Fulfilment progress derived from the order's current status. */
function DeliveryProgress({ status }: { status: StoreOrderDto["status"] }) {
  const isClosed =
    status === "CANCELLED" || status === "REFUNDED" || status === "FAILED";

  if (isClosed) return null;

  const steps = buildProductTimeline(status);

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
      <h2 className="text-base font-bold text-slate-900">Delivery Status</h2>
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-5">
        {steps.map((step) => (
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
            <p className="mt-2 text-sm font-bold text-slate-900">
              {step.label}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">{step.detail}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

interface OrderItemsProps {
  order: StoreOrderDto;
  canReview: boolean;
  productReviews: CustomerReview[];
  activeDraft: ReviewDraft;
  isSubmittingReview: boolean;
  onStartReview: (item: StoreOrderItemDto) => void;
  onCancelReview: () => void;
  onChangeDraft: Dispatch<SetStateAction<ReviewDraft>>;
  onSubmitReview: (item: StoreOrderItemDto) => void;
}

function OrderItems({
  order,
  canReview,
  productReviews,
  activeDraft,
  isSubmittingReview,
  onStartReview,
  onCancelReview,
  onChangeDraft,
  onSubmitReview,
}: OrderItemsProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
      <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500">
        Order Items ({order.items.length})
      </p>
      <div className="space-y-3">
        {order.items.map((item) => {
          const existingReview = productReviews.find(
            (review) =>
              review.type === "PRODUCT" &&
              review.relatedEntityId === item.productId,
          );
          const isComposing = activeDraft.itemId === item.id;

          return (
            <div
              key={item.id}
              className={cn(
                "rounded-md border border-slate-200 bg-white p-4 transition",
                isComposing ? "border-teal-200 shadow-sm" : "hover:border-teal-100",
              )}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative flex size-[4.5rem] shrink-0 items-center justify-center overflow-hidden rounded-md border border-slate-200 bg-slate-50 sm:size-20">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.productName}
                        fill
                        className="object-contain p-2"
                      />
                    ) : (
                      <Package size={24} className="text-slate-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-base font-bold leading-snug text-slate-900">
                      {item.productName}
                    </h3>
                    <p className="mt-1 text-sm font-medium text-slate-500">
                      Qty: {item.quantity}
                      {item.productSku ? ` · SKU: ${item.productSku}` : ""}
                    </p>
                    <p className="mt-0.5 text-sm text-slate-500">
                      {formatCurrencyUsd(Number(item.unitPriceUsd))} each
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-start gap-2 sm:items-end">
                  <p className="text-lg font-bold text-slate-900">
                    {formatCurrencyUsd(Number(item.totalUsd))}
                  </p>
                  {existingReview ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1 text-sm font-semibold text-amber-800">
                        <Star className="size-3.5 fill-amber-400 text-amber-500" />
                        {existingReview.rating}/5
                      </span>
                      <StatusBadge
                        label={
                          existingReview.status === "PENDING"
                            ? "Review pending"
                            : existingReview.status === "PUBLISHED"
                              ? "Review published"
                              : "Review hidden"
                        }
                        status={existingReview.status.toLowerCase()}
                      />
                    </div>
                  ) : canReview ? (
                    <Button
                      type="button"
                      size="sm"
                      variant={isComposing ? "default" : "outline"}
                      className="rounded-md"
                      onClick={() => onStartReview(item)}
                    >
                      <Star className="mr-1.5 size-4" />
                      Review product
                    </Button>
                  ) : null}
                </div>
              </div>

              {isComposing ? (
                <ProductReviewComposer
                  draft={activeDraft}
                  item={item}
                  isSubmitting={isSubmittingReview}
                  onCancel={onCancelReview}
                  onChangeDraft={onChangeDraft}
                  onSubmit={() => onSubmitReview(item)}
                />
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ProductReviewComposer({
  draft,
  item,
  isSubmitting,
  onChangeDraft,
  onSubmit,
  onCancel,
}: {
  draft: ReviewDraft;
  item: StoreOrderItemDto;
  isSubmitting: boolean;
  onChangeDraft: Dispatch<SetStateAction<ReviewDraft>>;
  onSubmit: () => void;
  onCancel: () => void;
}) {
  const canSubmit = Boolean(draft.title.trim()) && draft.body.trim().length >= 20;

  return (
    <div className="mt-4 rounded-md border border-teal-100 bg-teal-50/40 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h4 className="text-base font-bold text-slate-900">
            Review {item.productName}
          </h4>
          <p className="mt-0.5 text-sm text-slate-600">
            Your review is submitted to moderation before it appears publicly.
          </p>
        </div>
        <div className="flex gap-1.5" aria-label={`${draft.rating} out of 5 stars`}>
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              aria-label={`Rate ${value} star${value > 1 ? "s" : ""}`}
              className={cn(
                "inline-flex size-10 items-center justify-center rounded-md border bg-white transition hover:border-amber-300 hover:bg-amber-50",
                draft.rating >= value
                  ? "border-amber-300 text-amber-500"
                  : "border-slate-200 text-slate-300",
              )}
              onClick={() =>
                onChangeDraft((current) => ({
                  ...current,
                  rating: value as ReviewDraft["rating"],
                }))
              }
            >
              <Star
                className={cn(
                  "size-4",
                  draft.rating >= value ? "fill-amber-400" : "fill-transparent",
                )}
              />
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 grid gap-3">
        <div>
          <label
            className="mb-1.5 block text-sm font-semibold text-slate-800"
            htmlFor={`review-title-${item.id}`}
          >
            Review headline
          </label>
          <Input
            id={`review-title-${item.id}`}
            value={draft.title}
            onChange={(event) =>
              onChangeDraft((current) => ({
                ...current,
                title: event.target.value,
              }))
            }
            placeholder="Summarize your experience"
          />
        </div>

        <div>
          <label
            className="mb-1.5 block text-sm font-semibold text-slate-800"
            htmlFor={`review-body-${item.id}`}
          >
            Review details
          </label>
          <Textarea
            id={`review-body-${item.id}`}
            className="min-h-28"
            value={draft.body}
            onChange={(event) =>
              onChangeDraft((current) => ({
                ...current,
                body: event.target.value,
              }))
            }
            placeholder="Share installation fit, product quality, suction performance, or anything future buyers should know."
          />
          <p className="mt-1.5 text-xs text-slate-500">
            Minimum 20 characters.
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          className="rounded-md"
          disabled={isSubmitting || !canSubmit}
          onClick={onSubmit}
        >
          {isSubmitting ? "Submitting..." : "Submit review"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="rounded-md"
          onClick={onCancel}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}

/** The server's own audit trail, oldest first. */
function StatusHistory({ order }: { order: StoreOrderDto }) {
  if (order.statusHistory.length === 0) return null;

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
      <h2 className="text-base font-bold text-slate-900">Order History</h2>
      <ol className="mt-4 space-y-3">
        {order.statusHistory.map((entry) => (
          <li
            className="flex gap-3 border-l-2 border-teal-100 pl-3.5"
            key={entry.id || entry.changedAt}
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge
                  status={toStatusSlug(entry.status)}
                />
                <span className="text-xs text-slate-500">
                  {formatLongDate(entry.changedAt)}
                </span>
              </div>
              {entry.note ? (
                <p className="mt-1 text-sm text-slate-700">{entry.note}</p>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function ShippingPanel({
  invoice,
  order,
}: {
  invoice?: StoreOrderInvoiceDto;
  order: StoreOrderDto;
}) {
  const address = order.shippingAddress;
  const invoiceConfirmsPayment = Boolean(
    invoice &&
      (order.paymentMethod !== "COD" ||
        invoice.status === "PAID" ||
        invoice.paidAt ||
        invoice.payments?.some((payment) => payment.status === "SUCCEEDED")),
  );

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-xs">
      <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
        <Truck className="text-teal-700" size={18} />
        <h2 className="text-base font-bold text-slate-900">Shipping Info</h2>
      </div>
      <div className="mt-4 space-y-3 text-sm">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Delivery Address
          </p>
          {address?.line1 ? (
            <p className="mt-1 font-medium text-slate-800">
              {address.recipientName ? (
                <>
                  {address.recipientName}
                  <br />
                </>
              ) : null}
              {address.line1}
              {address.line2 ? (
                <>
                  <br />
                  {address.line2}
                </>
              ) : null}
              <br />
              {[address.city, address.state, address.postalCode]
                .filter(Boolean)
                .join(", ")}
              {address.country ? (
                <>
                  <br />
                  {address.country}
                </>
              ) : null}
            </p>
          ) : (
            <p className="mt-1 text-slate-500">Not recorded</p>
          )}
        </div>

        {/* Tracking only exists once an admin dispatches the order. */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Tracking
          </p>
          {order.trackingNumber ? (
            <p className="mt-1 font-mono font-bold text-teal-900">
              {order.trackingNumber}
            </p>
          ) : (
            <p className="mt-1 text-slate-500">Not dispatched yet</p>
          )}
        </div>

        {order.shippingProvider ? (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Carrier
            </p>
            <p className="mt-1 font-semibold text-slate-900">
              {order.shippingProvider}
            </p>
          </div>
        ) : null}

        {order.customerNotes ? (
          <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-slate-700">
            <span className="font-semibold text-slate-900">Your notes:</span>{" "}
            {order.customerNotes}
          </div>
        ) : null}
      </div>

      <div className="mt-5 border-t border-slate-100 pt-4">
        <div className="mb-2 flex items-center gap-2">
          <CreditCard className="text-teal-700" size={16} />
          <h3 className="text-sm font-bold text-slate-900">Payment</h3>
        </div>
        {invoiceConfirmsPayment ? (
          <StatusBadge status="paid" />
        ) : invoice && order.paymentMethod === "COD" ? (
          <p className="text-sm text-slate-500">Cash on delivery</p>
        ) : !invoice && order.paymentStatus ? (
          <StatusBadge
            status={toStatusSlug(order.paymentStatus)}
          />
        ) : (
          <p className="text-sm text-slate-500">Awaiting confirmation</p>
        )}
      </div>
    </section>
  );
}

/** Server-authoritative figures — never recomputed on the client. */
function TotalSummary({ order }: { order: StoreOrderDto }) {
  const discount = Number(order.discountUsd);

  return (
    <section className="rounded-lg border border-teal-800 bg-teal-900 p-5 text-white shadow-xs sm:p-6">
      <h2 className="text-base font-bold text-white">Order Summary</h2>
      <div className="mt-4 space-y-2.5 text-sm text-teal-100/80">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span className="font-semibold text-white">
            {formatCurrencyUsd(Number(order.subtotalUsd))}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Shipping</span>
          <span className="font-semibold text-white">
            {formatCurrencyUsd(Number(order.shippingFeeUsd))}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Tax</span>
          <span className="font-semibold text-white">
            {formatCurrencyUsd(Number(order.taxUsd))}
          </span>
        </div>
        {discount > 0 ? (
          <div className="flex justify-between font-medium text-emerald-400">
            <span>Discount</span>
            <span>-{formatCurrencyUsd(discount)}</span>
          </div>
        ) : null}
      </div>
      <div className="mt-5 flex justify-between border-t border-white/15 pt-4 text-lg font-bold text-white">
        <span>Total</span>
        <span className="text-teal-200">
          {formatCurrencyUsd(Number(order.totalUsd))}
        </span>
      </div>
    </section>
  );
}
