import type { FormSubmissionState } from "@/lib/use-schema-form";

import { cn } from "@/lib/utils";

const toneClasses: Record<Exclude<FormSubmissionState["type"], "idle">, string> =
  {
    ready:
      "border border-emerald-200 bg-emerald-50 text-emerald-900",
    success:
      "border border-emerald-200 bg-emerald-50 text-emerald-900",
    error: "border border-red-200 bg-red-50 text-red-900",
  };

export function FormStatus({ status }: { status: FormSubmissionState }) {
  if (status.type === "idle" || !status.message) {
    return null;
  }

  const isError = status.type === "error";

  return (
    <div
      aria-live="polite"
      className={cn("rounded-2xl px-4 py-3 text-sm", toneClasses[status.type])}
      role={isError ? "alert" : "status"}
    >
      {status.message}
    </div>
  );
}
