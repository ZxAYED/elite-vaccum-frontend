import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface AdminPageShellProps {
  children: ReactNode;
  className?: string;
}

export function AdminPageShell({ children, className }: AdminPageShellProps) {
  return (
    <section
      className={cn(
        "flex w-full flex-col gap-3 lg:gap-4",
        className,
      )}
    >
      {children}
    </section>
  );
}

interface AdminPageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function AdminPageHeader({
  eyebrow,
  title,
  description,
  action,
  className,
}: AdminPageHeaderProps) {
  return (
    <header
      className={cn(
        "flex flex-col gap-3 rounded-lg border border-teal-100 bg-white px-4 py-4 shadow-[0_20px_48px_-42px_rgba(28,79,80,0.35)] md:flex-row md:items-center md:justify-between lg:px-5",
        className,
      )}
    >
      <div className="min-w-0">
        {eyebrow ? (
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.42em] text-teal-700">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-3xl font-semibold tracking-[-0.04em] text-primary">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 md:text-base">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}

interface AdminSurfaceProps {
  children: ReactNode;
  className?: string;
}

export function AdminSurface({
  children,
  className,
  ...props
}: AdminSurfaceProps & React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "rounded-lg border border-teal-100 bg-white p-4 shadow-[0_20px_48px_-42px_rgba(28,79,80,0.34)] lg:p-5",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

interface AdminStatCardProps {
  label: string;
  value: ReactNode;
  helper?: ReactNode;
  tone?: "default" | "soft" | "warning" | "success";
}

const statToneClassName = {
  default: "bg-white",
  soft: "bg-teal-50/70",
  warning: "bg-amber-50/80",
  success: "bg-emerald-50/70",
};

export function AdminStatCard({
  label,
  value,
  helper,
  tone = "default",
}: AdminStatCardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-teal-100 p-4",
        statToneClassName[tone],
      )}
    >
      <p className="text-sm text-slate-500">{label}</p>
      <div className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-primary">
        {value}
      </div>
      {helper ? <div className="mt-2 text-xs text-slate-500">{helper}</div> : null}
    </div>
  );
}
