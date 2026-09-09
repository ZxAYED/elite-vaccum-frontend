import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description: string;
  eyebrow?: string;
  actions?: ReactNode;
}

export function PageHeader({
  title,
  description,
  eyebrow,
  actions,
}: PageHeaderProps) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-2">
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-700">
            {eyebrow}
          </p>
        ) : null}
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-primary">{title}</h1>
          <p className="mt-1 max-w-3xl text-xs sm:text-sm font-medium text-slate-600">{description}</p>
        </div>
      </div>

      {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
    </div>
  );
}
