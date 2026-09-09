import type { CartProduct } from "@/types/domain";

/**
 * Pricing mirrors the server's rules so the cart can show a total before an
 * order exists, but the server is authoritative: the figures on the order
 * response (`subtotalUsd`/`shippingFeeUsd`/`taxUsd`/`totalUsd`) are what is
 * actually charged. Never send computed totals to the API.
 *
 * - Shipping: flat $18.00, charged **once per order** regardless of item
 *   count. There is no free-shipping threshold.
 * - Tax: 8% of the taxable-items subtotal.
 * - total = subtotal + 18.00 + tax − discount
 */
const TAX_RATE = 0.08;

export const SHIPPING_FLAT_FEE_USD = 18;
export const SHIPPING_FEE_LABEL = "$18.00";

export interface CartTotals {
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
}

export function calculateCartSubtotal(items: CartProduct[]) {
  return items.reduce((sum, item) => {
    const price = Number(item.product?.priceUsd) || 0;
    const quantity = Number(item.quantity) || 0;
    return sum + quantity * price;
  }, 0);
}

/**
 * `hasItems` is required because an empty cart must not be charged shipping at
 * all — a $0 subtotal would otherwise be indistinguishable from a cart of
 * genuinely free items.
 */
export function calculateCartShipping(_subtotal: number, hasItems: boolean) {
  return hasItems ? SHIPPING_FLAT_FEE_USD : 0;
}

export function calculateCartTax(subtotal: number) {
  return Number((subtotal * TAX_RATE).toFixed(2));
}

export function calculateCartTotals(items: CartProduct[]): CartTotals {
  // An empty cart owes nothing at all — no shipping, no tax, no total.
  if (items.length === 0) {
    return { subtotal: 0, shipping: 0, tax: 0, total: 0 };
  }

  const subtotal = calculateCartSubtotal(items);
  const shipping = calculateCartShipping(subtotal, true);
  const tax = calculateCartTax(subtotal);

  return {
    subtotal,
    shipping,
    tax,
    total: Number((subtotal + shipping + tax).toFixed(2)),
  };
}
