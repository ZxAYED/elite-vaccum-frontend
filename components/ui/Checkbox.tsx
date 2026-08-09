import * as React from "react";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

interface CheckboxProps
  extends Omit<React.ComponentProps<"input">, "type" | "children"> {
  label?: React.ReactNode;
}

function Checkbox({ className, label, ...props }: CheckboxProps) {
  return (
    <label className="inline-flex cursor-pointer items-start gap-3 text-sm leading-6 text-slate-600">
      <span className="relative mt-0.5 inline-flex size-5 shrink-0">
        <input
          type="checkbox"
          className={cn(
            "peer size-5 appearance-none rounded-md border border-teal-200 bg-white outline-none transition checked:border-primary checked:bg-primary focus-visible:ring-2 focus-visible:ring-[color:var(--focus-ring)]",
            className,
          )}
          {...props}
        />
        <Check
          aria-hidden="true"
          className="pointer-events-none absolute left-0.5 top-0.5 size-4 text-white opacity-0 transition peer-checked:opacity-100"
        />
      </span>
      {label ? <span>{label}</span> : null}
    </label>
  );
}

export { Checkbox };
