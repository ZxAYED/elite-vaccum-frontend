"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

interface SwitchProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

export function Switch({
  checked = false,
  onCheckedChange,
  className,
  disabled,
  ...props
}: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange?.(!checked)}
      className={cn(
        "inline-flex h-7 w-12 shrink-0 items-center rounded-full p-1 transition-[background-color,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--focus-ring)] disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "bg-primary" : "bg-slate-200",
        className,
      )}
      {...props}
    >
      <span
        className={cn(
          "size-5 rounded-full bg-white shadow-sm transition-transform",
          checked ? "translate-x-5" : "translate-x-0",
        )}
      />
    </button>
  );
}
