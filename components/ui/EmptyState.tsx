import Link from "next/link";
import type { ComponentType, ReactNode } from "react";
import { FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export interface EmptyStateAction {
  label: string;
  href?: string;
  onClick?: () => void;
  icon?: ComponentType<{ className?: string; size?: number }>;
  variant?: "default" | "outline" | "ghost";
}

export interface EmptyStateProps {
  icon?: ComponentType<{ className?: string; size?: number; "aria-hidden"?: boolean | "true" | "false" }>;
  title: string;
  description?: string;
  action?: EmptyStateAction;
  secondaryAction?: EmptyStateAction;
  tone?: "card" | "dashed" | "neutral" | "minimal";
  className?: string;
  children?: ReactNode;
}

const toneClasses = {
  card: "rounded-xl border border-slate-200 bg-white p-8 sm:p-12 shadow-xs",
  dashed: "rounded-xl border border-dashed border-teal-200 bg-teal-50/20 p-8 sm:p-12",
  neutral: "rounded-xl border border-slate-100 bg-slate-50/60 p-8 sm:p-10",
  minimal: "p-6 sm:p-8",
};

export function EmptyState({
  icon: Icon = FolderOpen,
  title,
  description,
  action,
  secondaryAction,
  tone = "dashed",
  className,
  children,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        toneClasses[tone],
        className,
      )}
      role="status"
    >
      <div className="flex size-14 items-center justify-center rounded-2xl bg-teal-50 border border-teal-200/80 text-teal-700 shadow-xs ring-4 ring-teal-50/50">
        <Icon size={26} aria-hidden="true" />
      </div>

      <h3 className="mt-4 text-base font-bold text-slate-900 sm:text-lg">
        {title}
      </h3>

      {description ? (
        <p className="mt-1.5 max-w-md text-xs leading-relaxed text-slate-500 sm:text-sm">
          {description}
        </p>
      ) : null}

      {children ? <div className="mt-4">{children}</div> : null}

      {(action || secondaryAction) ? (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
          {action ? (
            action.href ? (
              <Button
                asChild
                size="sm"
                variant={action.variant ?? "default"}
                className="rounded-lg font-medium"
              >
                <Link href={action.href} className="inline-flex items-center gap-1.5">
                  {action.icon ? <action.icon size={15} /> : null}
                  {action.label}
                </Link>
              </Button>
            ) : (
              <Button
                size="sm"
                variant={action.variant ?? "default"}
                onClick={action.onClick}
                className="rounded-lg font-medium inline-flex items-center gap-1.5"
              >
                {action.icon ? <action.icon size={15} /> : null}
                {action.label}
              </Button>
            )
          ) : null}

          {secondaryAction ? (
            secondaryAction.href ? (
              <Button
                asChild
                size="sm"
                variant="outline"
                className="rounded-lg font-medium border-slate-200 hover:border-teal-300 text-slate-700 hover:text-teal-900"
              >
                <Link href={secondaryAction.href} className="inline-flex items-center gap-1.5">
                  {secondaryAction.icon ? <secondaryAction.icon size={15} /> : null}
                  {secondaryAction.label}
                </Link>
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={secondaryAction.onClick}
                className="rounded-lg font-medium border-slate-200 hover:border-teal-300 text-slate-700 hover:text-teal-900 inline-flex items-center gap-1.5"
              >
                {secondaryAction.icon ? <secondaryAction.icon size={15} /> : null}
                {secondaryAction.label}
              </Button>
            )
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
