"use client";

import { Minus, Plus } from "lucide-react";

interface QuantityControlProps {
  quantity: number;
  onDecrease?: () => void;
  onIncrease?: () => void;
  className?: string;
}

export function QuantityControl({
  quantity,
  onDecrease,
  onIncrease,
  className,
}: QuantityControlProps) {
  return (
    <div
      className={`inline-flex h-11 items-center gap-3 rounded-full border border-teal-100 bg-white px-3 text-sm font-semibold text-slate-700 shadow-[0_16px_32px_-28px_rgba(28,79,80,0.35)] ${className ?? ""}`}
    >
      <button
        type="button"
        aria-label="Decrease quantity"
        onClick={onDecrease}
        className="inline-flex size-6 items-center justify-center rounded-full text-slate-400 transition hover:bg-[var(--brand-soft)] hover:text-teal-700"
      >
        <Minus size={14} />
      </button>
      <span className="min-w-4 text-center">{quantity}</span>
      <button
        type="button"
        aria-label="Increase quantity"
        onClick={onIncrease}
        className="inline-flex size-6 items-center justify-center rounded-full text-slate-400 transition hover:bg-[var(--brand-soft)] hover:text-teal-700"
      >
        <Plus size={14} />
      </button>
    </div>
  );
}
