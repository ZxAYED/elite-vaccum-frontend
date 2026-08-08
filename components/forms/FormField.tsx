import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface FormFieldProps {
  label: string;
  htmlFor: string;
  required?: boolean;
  hint?: string;
  error?: string;
  className?: string;
  children: ReactNode;
}

export function FormField({
  label,
  htmlFor,
  required = false,
  hint,
  error,
  className,
  children,
}: FormFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <label
        htmlFor={htmlFor}
        className="block text-sm font-medium text-slate-900"
      >
        {label}
        {required ? <span className="ml-1 text-red-600">*</span> : null}
      </label>
      {children}
      {hint ? (
        <p className="text-xs text-slate-500" id={`${htmlFor}-hint`}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p
          id={`${htmlFor}-error`}
          className="text-sm text-red-700"
          role="alert"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
