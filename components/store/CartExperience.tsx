"use client";

import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";

import { FadeIn, Pressable, StaggerGroup, StaggerItem } from "@/components/motion/Animated";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Button } from "@/components/ui/Button";
import type { CartProduct } from "@/data/mock/customer-portal";
import { calculateCartTotals } from "@/lib/store";

import { CartItemRow } from "./CartItemRow";
import { OrderTotals } from "./OrderTotals";

interface CartExperienceProps {
  initialItems: CartProduct[];
}

export function CartExperience({ initialItems }: CartExperienceProps) {
  const [items, setItems] = useState(initialItems);

  const totals = useMemo(() => calculateCartTotals(items), [items]);

  const updateQuantity = (productId: string, nextQuantity: number) => {
    setItems((currentItems) =>
      currentItems
        .map((item) =>
          item.productId === productId
            ? { ...item, quantity: Math.max(1, nextQuantity) }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  };

  const removeItem = (productId: string) => {
    setItems((currentItems) =>
      currentItems.filter((item) => item.productId !== productId),
    );
  };

  return (
    <AuthGuard>
      <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.12fr)_28rem]">
      <FadeIn className="landing-card landing-card-soft p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-700/80">
              Checkout
            </p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-950">Your cart</h2>
          </div>
          <Pressable>
            <Button asChild size="pill" variant="outline">
              <Link href="/store">Continue shopping</Link>
            </Button>
          </Pressable>
        </div>

        <StaggerGroup className="mt-6 space-y-4" delay={0.05}>
          {items.map((item) => (
            <StaggerItem key={item.productId}>
              <CartItemRow
                item={item}
                onDecrease={() => updateQuantity(item.productId, item.quantity - 1)}
                onIncrease={() => updateQuantity(item.productId, item.quantity + 1)}
                onRemove={() => removeItem(item.productId)}
              />
            </StaggerItem>
          ))}

          {items.length === 0 ? (
            <StaggerItem>
              <div className="rounded-[1.5rem] bg-white px-6 py-10 text-center shadow-[0_24px_48px_-38px_rgba(28,79,80,0.38)]">
                <p className="text-lg font-semibold text-slate-900">Your cart is empty</p>
                <p className="mt-2 text-sm text-slate-500">
                  Add compatible accessories or support tools from the store.
                </p>
                <Pressable className="mt-5">
                  <Button asChild size="pill">
                    <Link href="/store">Browse store</Link>
                  </Button>
                </Pressable>
              </div>
            </StaggerItem>
          ) : null}
        </StaggerGroup>
      </FadeIn>

      <FadeIn
        className="landing-card landing-card-soft h-fit p-6 xl:sticky xl:top-24"
        delay={0.08}
      >
        <h2 className="text-2xl font-semibold text-slate-950">Order summary</h2>

        <div className="mt-6">
          <OrderTotals totals={totals} />
        </div>

        <Pressable className="mt-6 w-full">
          {items.length > 0 ? (
            <Button asChild className="w-full" size="pill">
              <Link href="/checkout">
                Proceed to checkout
                <ArrowRight size={16} />
              </Link>
            </Button>
          ) : (
            <Button className="w-full" size="pill" disabled>
              Proceed to checkout
              <ArrowRight size={16} />
            </Button>
          )}
        </Pressable>

        <Pressable className="mt-3 w-full">
          <Button asChild className="w-full" size="pill" variant="outline">
            <Link href="/store">Continue shopping</Link>
          </Button>
        </Pressable>

        <div className="mt-5 rounded-[1.25rem] bg-[#f1f6f5] p-4 text-sm leading-6 text-slate-600">
          <div className="flex items-start gap-3">
            <ShieldCheck size={18} className="mt-0.5 text-teal-700" />
            <p>
              Your order is protected by our 10-year architectural wellness
              guidance and secure checkout preview flow.
            </p>
          </div>
        </div>
      </FadeIn>
    </div>
    </AuthGuard>
  );
}
