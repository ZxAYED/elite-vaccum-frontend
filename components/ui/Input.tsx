import * as React from "react";

import { cn } from "@/lib/utils";

export const inputBaseClassName =
  "flex h-12 w-full rounded-[var(--radius-control)] border border-teal-100 bg-white px-4 text-sm text-slate-800 shadow-[0_18px_36px_-30px_rgba(28,79,80,0.25)] outline-none transition placeholder:text-slate-400 focus-visible:border-teal-200 focus-visible:ring-2 focus-visible:ring-[color:var(--focus-ring)] disabled:cursor-not-allowed disabled:opacity-60";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(inputBaseClassName, className)}
      {...props}
    />
  );
}

export { Input };
