import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

const widthClasses = {
  sm: "max-w-md",
  md: "max-w-xl",
  lg: "max-w-3xl",
  full: "max-w-none",
};

interface PageStateShellProps {
  /** The block to centre — a not-found card, an error state, a spinner. */
  children: ReactNode;
  /** Optional content pinned to the top (page header, back link). */
  header?: ReactNode;
  width?: keyof typeof widthClasses;
  className?: string;
}

/**
 * Vertically and horizontally centres a whole-page state (not found, error,
 * loading) inside a dashboard route. Dashboard `<main>` elements do not pass a
 * height down through `DashboardPageTransition`, so the viewport-minus-chrome
 * min-height here is what makes the centring work in every role's portal.
 */
export function PageStateShell({
  children,
  header,
  width = "md",
  className,
}: PageStateShellProps) {
  return (
    <div
      className={cn(
        "flex min-h-[calc(100dvh-9rem)] w-full flex-col gap-4",
        className,
      )}
    >
      {header ? <div className="w-full shrink-0">{header}</div> : null}
      <div className="flex w-full flex-1 items-center justify-center">
        <div className={cn("w-full", widthClasses[width])}>{children}</div>
      </div>
    </div>
  );
}
