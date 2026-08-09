import type { PropsWithChildren } from "react";

import { cn } from "@/lib/utils";

interface FormFieldProps extends PropsWithChildren {
  label: string;
  error?: string;
  helper?: string;
  className?: string;
}

export function FormField({
  label,
  error,
  helper,
  className,
  children,
}: FormFieldProps) {
  return (
    <label className={cn("block text-sm font-semibold text-slate-950", className)}>
      {label}
      <div className="mt-2">{children}</div>
      {helper ? (
        <p className="mt-2 text-xs leading-5 text-slate-500">{helper}</p>
      ) : null}
      {error ? (
        <p className="mt-2 text-xs font-semibold text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </label>
  );
}
