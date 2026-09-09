"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Loader2, RefreshCw } from "lucide-react";

import { CheckoutSuccessCartReset } from "@/components/store/CheckoutSuccessCartReset";
import { Button } from "@/components/ui/Button";
import { formatCurrencyUsd } from "@/lib/formatters";
import {
  ordersApi,
  useGetOrderByIdQuery,
  type StoreOrderStatus,
} from "@/redux/api/ordersApi";

const POLL_INTERVAL_MS = 2000;
/** Payment normally settles in 2-5s; stop nagging the API after this. */
const POLL_TIMEOUT_MS = 30000;

interface CheckoutPaymentStatusProps {
  orderId: string;
}

const STATUS_COPY: Partial<
  Record<StoreOrderStatus, { title: string; detail: string }>
> = {
  PAID: {
    title: "Payment confirmed",
    detail: "We've received your payment and your order is being prepared.",
  },
  PROCESSING: {
    title: "Payment confirmed",
    detail: "Your order is being packed for shipment.",
  },
  SHIPPED: {
    title: "Payment confirmed",
    detail: "Your order is on its way.",
  },
  OUT_FOR_DELIVERY: {
    title: "Payment confirmed",
    detail: "Your order is out for delivery.",
  },
  DELIVERED: {
    title: "Payment confirmed",
    detail: "Your order has been delivered.",
  },
  COMPLETED: {
    title: "Payment confirmed",
    detail: "This order is complete.",
  },
  REFUNDED: {
    title: "Order refunded",
    detail: "This order has been refunded.",
  },
  CANCELLED: {
    title: "Order cancelled",
    detail: "This order was cancelled and your stock reservation released.",
  },
};

/**
 * Stripe's redirect back to this page does not mean the charge succeeded —
 * payment is confirmed by the Stripe webhook. So poll `GET /store/orders/:id`
 * until the status leaves `PENDING` and report what the server actually says.
 */
export function CheckoutPaymentStatus({ orderId }: CheckoutPaymentStatusProps) {
  // A subscription-less cache read, so the polling interval can be derived
  // during render without an effect writing state.
  const cached = ordersApi.endpoints.getOrderById.useQueryState(orderId);
  const cachedStatus = cached.data?.status;
  const isSettled = Boolean(cachedStatus && cachedStatus !== "PENDING");

  const [hasTimedOut, setHasTimedOut] = useState(false);

  const { data: order, isLoading, isError, refetch, isFetching } =
    useGetOrderByIdQuery(orderId, {
      pollingInterval: isSettled || hasTimedOut ? 0 : POLL_INTERVAL_MS,
    });

  useEffect(() => {
    const timer = setTimeout(() => setHasTimedOut(true), POLL_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <StatusPanel
        tone="pending"
        icon={<Loader2 className="animate-spin" size={20} />}
        title="Loading your order..."
        detail="Fetching the latest status from our system."
      />
    );
  }

  if (isError || !order) {
    return (
      <StatusPanel
        tone="warning"
        icon={<AlertTriangle size={20} />}
        title="We couldn't load this order"
        detail="Your order may still have been placed. Check your dashboard, or contact support with your order reference."
        action={
          <Button onClick={() => void refetch()} size="sm" variant="outline">
            <RefreshCw size={14} />
            Try again
          </Button>
        }
      />
    );
  }

  // Payment declined or the session expired. Stock was released, so the dead
  // order can't be retried — the customer has to order again from the cart.
  if (order.status === "FAILED") {
    return (
      <StatusPanel
        // The cart is deliberately left intact here so the order can be re-placed.
        tone="error"
        icon={<AlertTriangle size={20} />}
        title="Payment was not completed"
        detail="Your card was declined or the payment session expired, so this order was not placed. Nothing was charged and the items were returned to stock."
        action={
          <Button asChild size="sm">
            <Link href="/store">Back to the store</Link>
          </Button>
        }
      />
    );
  }

  if (order.status === "PENDING") {
    if (hasTimedOut) {
      return (
        <StatusPanel
          tone="pending"
          icon={<Loader2 size={20} />}
          title="Still confirming your payment"
          detail="This is taking longer than usual. Your order is saved — its status will update automatically once the payment clears."
          action={
            <Button
              onClick={() => {
                setHasTimedOut(false);
                void refetch();
              }}
              disabled={isFetching}
              size="sm"
              variant="outline"
            >
              <RefreshCw size={14} />
              Check again
            </Button>
          }
        />
      );
    }

    return (
      <StatusPanel
        tone="pending"
        icon={<Loader2 className="animate-spin" size={20} />}
        title="Confirming your payment..."
        detail="This usually takes just a few seconds. Please don't close this page."
      />
    );
  }

  const copy = STATUS_COPY[order.status] ?? {
    title: "Order placed",
    detail: "Your order has been recorded.",
  };
  const isNegative =
    order.status === "CANCELLED" || order.status === "REFUNDED";

  return (
    <>
      {/* The order is real, so the cart can now be emptied. */}
      <CheckoutSuccessCartReset />
      <StatusPanel
        tone={isNegative ? "warning" : "success"}
        icon={
          isNegative ? <AlertTriangle size={20} /> : <CheckCircle2 size={20} />
        }
        title={copy.title}
        detail={copy.detail}
        footer={<OrderTotalsSummary order={order} />}
      />
    </>
  );
}

function OrderTotalsSummary({
  order,
}: {
  order: NonNullable<ReturnType<typeof useGetOrderByIdQuery>["data"]>;
}) {
  const rows: Array<[string, number]> = [
    ["Subtotal", Number(order.subtotalUsd)],
    ["Shipping", Number(order.shippingFeeUsd)],
    ["Tax", Number(order.taxUsd)],
  ];
  if (Number(order.discountUsd) > 0) {
    rows.push(["Discount", -Number(order.discountUsd)]);
  }

  return (
    <dl className="mt-4 space-y-1.5 border-t border-slate-200 pt-4 text-left text-xs text-slate-600">
      {rows.map(([label, value]) => (
        <div className="flex items-center justify-between" key={label}>
          <dt>{label}</dt>
          <dd className="font-medium text-slate-900">
            {formatCurrencyUsd(value)}
          </dd>
        </div>
      ))}
      <div className="flex items-center justify-between border-t border-slate-200 pt-2 text-sm">
        <dt className="font-semibold text-slate-900">Total</dt>
        <dd className="font-bold text-slate-900">
          {formatCurrencyUsd(Number(order.totalUsd))}
        </dd>
      </div>
    </dl>
  );
}

const TONE_STYLES = {
  pending: "border-slate-200 bg-slate-50 text-slate-700",
  success: "border-emerald-200 bg-emerald-50/70 text-emerald-900",
  warning: "border-amber-300 bg-amber-50/80 text-amber-900",
  error: "border-rose-200 bg-rose-50/80 text-rose-900",
} as const;

function StatusPanel({
  tone,
  icon,
  title,
  detail,
  action,
  footer,
}: {
  tone: keyof typeof TONE_STYLES;
  icon: React.ReactNode;
  title: string;
  detail: string;
  action?: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div
      className={`mt-6 rounded-xl border p-4 text-left ${TONE_STYLES[tone]}`}
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 shrink-0">{icon}</span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">{title}</p>
          <p className="mt-1 text-xs leading-relaxed opacity-90">{detail}</p>
          {action ? <div className="mt-3">{action}</div> : null}
        </div>
      </div>
      {footer}
    </div>
  );
}
