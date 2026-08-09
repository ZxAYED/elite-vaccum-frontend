import type { PropsWithChildren } from "react";

import { cn } from "@/lib/utils";

interface FormSectionProps extends PropsWithChildren {
  title: string;
  description: string;
  className?: string;
}

export function FormSection({
  title,
  description,
  className,
  children,
}: FormSectionProps) {
  return (
    <section className={cn("border-t border-teal-100 pt-8", className)}>
      <div className="mb-6 max-w-2xl">
        <h2 className="text-2xl font-semibold tracking-[-0.035em] text-slate-950">
          {title}
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
      </div>
      {children}
    </section>
  );
}
