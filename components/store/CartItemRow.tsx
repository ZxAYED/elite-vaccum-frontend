"use client";

import { Trash2 } from "lucide-react";
import Image from "next/image";

import { mockProductImagesById } from "@/data/mock/product-images";
import { formatCurrencyUsd } from "@/lib/formatters";
import type { CartProduct } from "@/data/mock/customer-portal";

import { QuantityControl } from "./QuantityControl";

interface CartItemRowProps {
  item: CartProduct;
  onDecrease: () => void;
  onIncrease: () => void;
  onRemove: () => void;
  compact?: boolean;
}

export function CartItemRow({
  item,
  onDecrease,
  onIncrease,
  onRemove,
  compact = false,
}: CartItemRowProps) {
  const productImage = mockProductImagesById[item.product.id];
  const total = item.quantity * item.product.priceUsd;

  return (
    <article className="rounded-[1.5rem] bg-[linear-gradient(180deg,#ffffff_0%,#f8fbfa_100%)] p-4 shadow-[0_24px_48px_-38px_rgba(28,79,80,0.28)] sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <div
            className={`flex shrink-0 items-center justify-center rounded-[1.2rem] bg-[linear-gradient(180deg,#f8fbfb_0%,#e6efed_100%)] p-3 ${
              compact ? "size-20" : "size-24"
            }`}
          >
            {productImage ? (
              <div className="relative size-full">
                <Image
                  src={productImage}
                  alt={item.product.imageAlt}
                  fill
                  className="object-contain"
                  sizes="6rem"
                />
              </div>
            ) : null}
          </div>

          <div className="min-w-0">
            <h2 className={`${compact ? "text-lg" : "text-xl"} font-semibold text-slate-950`}>
              {item.product.name}
            </h2>
            <p className="mt-1 text-sm text-slate-500">{item.product.summary}</p>
            <div className="mt-4">
              <QuantityControl
                quantity={item.quantity}
                onDecrease={onDecrease}
                onIncrease={onIncrease}
              />
            </div>
          </div>
        </div>

        <div
          className={`flex items-center justify-between gap-4 ${
            compact
              ? "sm:min-w-[7.5rem] sm:flex-col sm:items-end"
              : "sm:min-w-[9rem] sm:flex-col sm:items-end"
          }`}
        >
          <span className="text-xl font-semibold text-slate-950">
            {formatCurrencyUsd(total)}
          </span>
          <button
            type="button"
            aria-label={`Remove ${item.product.name}`}
            onClick={onRemove}
            className="inline-flex size-10 items-center justify-center rounded-full bg-[var(--surface-muted)] text-slate-400 transition hover:bg-[#eef4f2] hover:text-slate-700"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
    </article>
  );
}
