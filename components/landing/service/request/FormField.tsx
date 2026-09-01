import type { PropsWithChildren } from "react";

import { cn } from "@/lib/utils";

interface FormFieldProps extends PropsWithChildren {
  label: string;
  htmlFor?: string;
  error?: string;
  helper?: string;
  className?: string;
  required?: boolean;
}

export function FormField({
  label,
  htmlFor,
  error,
  helper,
  className,
  required,
  children,
}: FormFieldProps) {
  return (
    <div className={cn("block text-sm font-semibold text-slate-950", className)}>
      {htmlFor ? (
        <label htmlFor={htmlFor} className="block mb-2">
          {label}
          {required ? <span className="ml-1 text-red-600">*</span> : null}
        </label>
      ) : (
        <div className="mb-2">
          {label}
          {required ? <span className="ml-1 text-red-600">*</span> : null}
        </div>
      )}
      <div>{children}</div>
      {helper ? (
        <p className="mt-2 text-xs font-normal leading-5 text-slate-500">{helper}</p>
      ) : null}
      {error ? (
        <p className="mt-2 text-xs font-semibold text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
