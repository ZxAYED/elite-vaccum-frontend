import * as React from "react";

import { cn } from "@/lib/utils";

export const textareaBaseClassName =
  "flex min-h-32 w-full resize-y rounded-[var(--radius-control)] border border-teal-100 bg-white px-4 py-3 text-sm leading-6 text-slate-800 shadow-[0_18px_36px_-30px_rgba(28,79,80,0.25)] outline-none transition placeholder:text-slate-400 focus-visible:border-teal-200 focus-visible:ring-2 focus-visible:ring-[color:var(--focus-ring)] disabled:cursor-not-allowed disabled:opacity-60";

function Textarea({
  className,
  ...props
}: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(textareaBaseClassName, className)}
      {...props}
    />
  );
}

export { Textarea };
