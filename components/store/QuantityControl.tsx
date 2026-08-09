"use client";

import { motion, useReducedMotion } from "framer-motion";
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
  const reduceMotion = useReducedMotion();

  return (
    <div
      className={`inline-flex h-11 items-center gap-3 rounded-full border border-teal-100 bg-white px-3 text-sm font-semibold text-slate-700 shadow-[0_16px_32px_-28px_rgba(28,79,80,0.35)] ${className ?? ""}`}
    >
      <motion.button
        type="button"
        aria-label="Decrease quantity"
        onClick={onDecrease}
        className="inline-flex size-6 items-center justify-center rounded-full text-slate-400 transition hover:bg-[var(--brand-soft)] hover:text-teal-700"
        whileHover={reduceMotion ? undefined : { scale: 1.03 }}
        whileTap={reduceMotion ? undefined : { scale: 0.9 }}
        transition={{ type: "spring", stiffness: 380, damping: 24, mass: 0.8 }}
      >
        <Minus size={14} />
      </motion.button>
      <span className="min-w-4 text-center">{quantity}</span>
      <motion.button
        type="button"
        aria-label="Increase quantity"
        onClick={onIncrease}
        className="inline-flex size-6 items-center justify-center rounded-full text-slate-400 transition hover:bg-[var(--brand-soft)] hover:text-teal-700"
        whileHover={reduceMotion ? undefined : { scale: 1.03 }}
        whileTap={reduceMotion ? undefined : { scale: 0.9 }}
        transition={{ type: "spring", stiffness: 380, damping: 24, mass: 0.8 }}
      >
        <Plus size={14} />
      </motion.button>
    </div>
  );
}
