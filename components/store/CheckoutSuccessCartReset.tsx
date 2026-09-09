"use client";

import { useEffect, useRef } from "react";

import { useCartSync } from "@/hooks/useCartSync";

/**
 * The cart survives the hand-off to Stripe so a cancelled payment can be
 * retried from `/checkout?cancelled=true`. Reaching the success page is the
 * point where the order is real, so empty it here — once per mount.
 *
 * `enabled` is false while a Stripe payment is still confirming or came back
 * FAILED: that order was rolled back and the customer needs the cart intact to
 * place a new one.
 */
export function CheckoutSuccessCartReset({ enabled = true }: { enabled?: boolean }) {
  const { items, emptyCart } = useCartSync();
  const hasReset = useRef(false);

  useEffect(() => {
    if (!enabled || hasReset.current || items.length === 0) return;
    hasReset.current = true;
    void emptyCart();
  }, [enabled, items.length, emptyCart]);

  return null;
}
