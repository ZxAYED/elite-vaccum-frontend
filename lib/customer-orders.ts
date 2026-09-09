import type { StoreOrderStatus } from "@/redux/api/ordersApi";

/**
 * Product order delivery progress. `GET /store/orders/:id` exposes a single
 * current status plus a `statusHistory` audit trail, but no per-step
 * timestamps, so a progress strip has to infer completion from the status's
 * position in the fulfilment sequence.
 */
const PRODUCT_TIMELINE = [
  { key: "placed", label: "Order Placed", detail: "We received your order" },
  { key: "processing", label: "Processing", detail: "Preparing your items" },
  { key: "shipped", label: "Shipped", detail: "Handed to the carrier" },
  {
    key: "out-for-delivery",
    label: "Out for Delivery",
    detail: "With the courier today",
  },
  { key: "delivered", label: "Delivered", detail: "Arrived at your address" },
] as const;

const PRODUCT_STATUS_INDEX: Partial<Record<StoreOrderStatus, number>> = {
  PENDING: 0,
  PAID: 0,
  PROCESSING: 1,
  SHIPPED: 2,
  OUT_FOR_DELIVERY: 3,
  DELIVERED: 4,
  COMPLETED: 4,
};

export interface ProductTimelineStep {
  key: string;
  label: string;
  detail: string;
  complete: boolean;
  active: boolean;
}

export function buildProductTimeline(
  status: StoreOrderStatus,
): ProductTimelineStep[] {
  const activeIndex = PRODUCT_STATUS_INDEX[status] ?? 0;
  return PRODUCT_TIMELINE.map((step, index) => ({
    key: step.key,
    label: step.label,
    detail: step.detail,
    complete: index <= activeIndex,
    active: index === activeIndex,
  }));
}

/** `OUT_FOR_DELIVERY` -> `out-for-delivery`, for the shared StatusBadge map. */
export function toStatusSlug(value: string): string {
  return value.toLowerCase().replace(/_/g, "-");
}
