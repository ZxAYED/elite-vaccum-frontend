import type { InvoiceDto } from "@/redux/api/billingApi";
import type { StoreOrderStatus } from "@/redux/api/ordersApi";

/**
 * Derived invoice state.
 *
 * Two rules from the billing contract are easy to get wrong, so they live here
 * rather than being re-derived per screen:
 *
 * 1. **The outstanding balance is never stored.** It is
 *    `total − Σ(SUCCEEDED payments) + Σ(COMPLETED refunds)`.
 * 2. **A refunded invoice keeps `status: "PAID"`.** There is no REFUNDED
 *    invoice status, so "Refunded" has to be inferred from a non-empty
 *    `refunds[]` — showing "Unpaid" there would be wrong.
 */

const money = (value: string | number | undefined | null): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export interface InvoiceState {
  total: number;
  /** Sum of SUCCEEDED payments. */
  paid: number;
  /** Sum of COMPLETED refunds. */
  refunded: number;
  /** `total − paid + refunded`, floored at 0. */
  balance: number;
  hasRefund: boolean;
  isVoid: boolean;
  isDraft: boolean;
  isFullyPaid: boolean;
  /** True when this invoice belongs to a store order — blocks the pay rail. */
  isStoreOrderInvoice: boolean;
  /** The label to render, accounting for the refund rule. */
  label: string;
  /** Status slug for `StatusBadge`. */
  slug: string;
}

export function getInvoiceState(invoice: InvoiceDto): InvoiceState {
  const status = String(invoice.status ?? "").toUpperCase();

  const paid = (invoice.payments ?? [])
    .filter((payment) => String(payment.status).toUpperCase() === "SUCCEEDED")
    .reduce((sum, payment) => sum + money(payment.amountUsd), 0);

  const refunded = (invoice.refunds ?? [])
    .filter((refund) => String(refund.status).toUpperCase() === "COMPLETED")
    .reduce((sum, refund) => sum + money(refund.amountUsd), 0);

  const total = money(invoice.totalUsd);
  const balance = Math.max(0, Number((total - paid + refunded).toFixed(2)));
  const hasRefund = (invoice.refunds ?? []).length > 0;
  const isVoid = status === "VOID";
  const isDraft = status === "DRAFT";
  const isFullyPaid = status === "PAID";

  // A refund leaves the invoice PAID, so the badge has to be overridden.
  const label = hasRefund
    ? "Refunded"
    : status === "PARTIALLY_PAID"
      ? "Partially paid"
      : status.charAt(0) + status.slice(1).toLowerCase();

  return {
    total,
    paid,
    refunded,
    balance,
    hasRefund,
    isVoid,
    isDraft,
    isFullyPaid,
    isStoreOrderInvoice: Boolean(invoice.productOrderId),
    label,
    slug: hasRefund ? "refunded" : status.toLowerCase().replace(/_/g, "-"),
  };
}

/**
 * The boundary rule: billing refuses card payment for a store order — those
 * are paid once, at store checkout. Also never payable: DRAFT, VOID, PAID, or
 * anything with nothing outstanding.
 */
export function canPayInvoiceOnline(invoice: InvoiceDto): boolean {
  const state = getInvoiceState(invoice);
  return (
    !state.isStoreOrderInvoice &&
    !state.isDraft &&
    !state.isVoid &&
    !state.isFullyPaid &&
    state.balance > 0
  );
}

/**
 * A store order only has an invoice once its payment resolved. Before that
 * `order.invoices` is `[]`, the invoice endpoints 404/400, and the download
 * button must stay hidden.
 */
const INVOICED_ORDER_STATUSES: StoreOrderStatus[] = [
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "COMPLETED",
  "REFUNDED",
];

export function orderHasInvoice(
  status: StoreOrderStatus,
  paymentMethod?: string,
): boolean {
  // COD is invoiced at placement — the courier collects on delivery.
  if (paymentMethod === "COD") return status !== "CANCELLED";
  return INVOICED_ORDER_STATUSES.includes(status);
}

/** A FAILED order is terminal: no repay link, re-order from the cart instead. */
export function isOrderTerminalFailure(status: StoreOrderStatus): boolean {
  return status === "FAILED";
}

/**
 * A store-order invoice is identified by `productOrderId` — never by a `type`
 * field. Only service and custom invoices are raised through billing.
 */
export function invoiceKind(invoice: InvoiceDto): "PRODUCT" | "SERVICE" {
  return invoice.productOrderId ? "PRODUCT" : "SERVICE";
}

/** A line total, falling back to `quantity × unitPrice` when absent. */
export function lineItemTotal(item: {
  quantity?: number;
  unitPriceUsd: string | number;
  totalUsd?: string | number;
}): number {
  if (item.totalUsd !== undefined && item.totalUsd !== null) {
    return money(item.totalUsd);
  }
  return money(item.unitPriceUsd) * (Number(item.quantity) || 1);
}
