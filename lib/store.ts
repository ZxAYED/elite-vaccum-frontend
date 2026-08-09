import type { CartProduct } from "@/data/mock/customer-portal";

const TAX_RATE = 0.08;
const STANDARD_SHIPPING_USD = 18;
const FREE_SHIPPING_THRESHOLD_USD = 150;

export interface CartTotals {
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
}

export function calculateCartSubtotal(items: CartProduct[]) {
  return items.reduce((sum, item) => sum + item.quantity * item.product.priceUsd, 0);
}

export function calculateCartShipping(subtotal: number) {
  return subtotal >= FREE_SHIPPING_THRESHOLD_USD ? 0 : STANDARD_SHIPPING_USD;
}

export function calculateCartTax(subtotal: number) {
  return Number((subtotal * TAX_RATE).toFixed(2));
}

export function calculateCartTotals(items: CartProduct[]): CartTotals {
  const subtotal = calculateCartSubtotal(items);
  const shipping = calculateCartShipping(subtotal);
  const tax = calculateCartTax(subtotal);

  return {
    subtotal,
    shipping,
    tax,
    total: subtotal + shipping + tax,
  };
}
