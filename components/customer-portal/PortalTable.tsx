"use client";

import Link from "next/link";
import type { ComponentType, ReactNode } from "react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import { cn } from "@/lib/utils";

/**
 * The customer portal's shared table vocabulary.
 *
 * The list screens (service requests, orders, invoices, receipts) are ledgers:
 * many records, the same handful of comparable fields on each, scanned down a
 * column rather than read one at a time. These components own that shape so
 * the screens can't drift apart.
 *
 * Conventions enforced here:
 * - The first column is the record's identity and carries the link out.
 * - Amounts, dates and reference numbers use tabular figures so they align
 *   down the column.
 * - A missing value renders a muted placeholder, never an empty cell.
 * - Row actions sit in the last column, right-aligned, low to high emphasis.
 */

/* -------------------------------------------------------------------------- */
/* Shell                                                                      */
/* -------------------------------------------------------------------------- */

export interface PortalColumn {
  key: string;
  label: string;
  /** Right-align numeric columns; the actions column uses "actions". */
  align?: "left" | "right" | "actions";
  /** Hide on narrow viewports; the value stays in the detail screen. */
  hideBelow?: "sm" | "md" | "lg";
  className?: string;
}

const HIDE_BELOW: Record<NonNullable<PortalColumn["hideBelow"]>, string> = {
  sm: "hidden sm:table-cell",
  md: "hidden md:table-cell",
  lg: "hidden lg:table-cell",
};

/** Matches a column's responsive/alignment rules onto its body cells. */
export function columnClass(column: PortalColumn) {
  return cn(
    column.hideBelow && HIDE_BELOW[column.hideBelow],
    column.align === "right" && "text-right",
    column.align === "actions" && "text-right",
    column.className,
  );
}

export function PortalTable({
  columns,
  children,
  isRefreshing = false,
  caption,
  footer,
}: {
  columns: ReadonlyArray<PortalColumn>;
  children: ReactNode;
  /** Dims the body while a background refetch is in flight. */
  isRefreshing?: boolean;
  /** Screen-reader description of what the table lists. */
  caption: string;
  footer?: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200/80 bg-white shadow-xs">
      <Table>
        <caption className="sr-only">{caption}</caption>
        <TableHeader className="bg-slate-50/70">
          <TableRow className="hover:bg-transparent focus-within:bg-transparent">
            {columns.map((column) => (
              <TableHead className={columnClass(column)} key={column.key}>
                {column.align === "actions" ? (
                  <span className="sr-only">{column.label}</span>
                ) : (
                  column.label
                )}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody
          className={cn(isRefreshing && "opacity-60 transition-opacity")}
        >
          {children}
        </TableBody>
      </Table>
      {footer ? (
        <div className="border-t border-slate-100 bg-slate-50/40 px-4 py-3">
          {footer}
        </div>
      ) : null}
    </div>
  );
}

export { TableCell as PortalCell, TableRow as PortalRow };

/* -------------------------------------------------------------------------- */
/* Cell contents                                                              */
/* -------------------------------------------------------------------------- */

/**
 * The identity cell: an optional thumbnail, the record's name as the link out,
 * and a muted second line. This is the only cell that carries a link, so the
 * row has exactly one obvious target.
 */
export function PortalRecordCell({
  href,
  title,
  subtitle,
  media,
  accent,
}: {
  href: string;
  title: ReactNode;
  subtitle?: ReactNode;
  media?: ReactNode;
  /** Left rail marking a row that needs the customer's attention. */
  accent?: "brand" | "warning" | "danger";
}) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      {accent ? (
        <span
          aria-hidden="true"
          className={cn(
            "h-9 w-1 shrink-0 rounded-full",
            accent === "brand" && "bg-teal-500",
            accent === "warning" && "bg-amber-500",
            accent === "danger" && "bg-rose-500",
          )}
        />
      ) : null}
      {media}
      <div className="min-w-0">
        <Link
          className={cn(
            "block truncate rounded-sm font-semibold text-primary transition-colors",
            "hover:text-teal-700",
            // No underline; the focus ring is what makes the link's keyboard
            // state visible, so it must stay.
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600",
          )}
          href={href}
          title={typeof title === "string" ? title : undefined}
        >
          {title}
        </Link>
        {subtitle ? (
          <span className="mt-0.5 block truncate text-sm font-medium text-slate-500">
            {subtitle}
          </span>
        ) : null}
      </div>
    </div>
  );
}

/**
 * A plain value cell. A nullish or blank value renders the muted placeholder
 * so a column never contains a silently empty gap, and anything truncated
 * keeps its full text reachable as a tooltip.
 */
export function PortalValue({
  value,
  placeholder = "Not set",
  icon: Icon,
  emphasis = false,
  tone = "neutral",
  truncate = false,
  className,
}: {
  value?: ReactNode;
  placeholder?: string;
  icon?: ComponentType<{ size?: number; className?: string }>;
  emphasis?: boolean;
  tone?: "neutral" | "brand" | "warning" | "danger" | "success";
  truncate?: boolean;
  className?: string;
}) {
  const isEmpty =
    value === null ||
    value === undefined ||
    value === "" ||
    (typeof value === "number" && Number.isNaN(value));

  if (isEmpty) {
    return (
      <span className={cn("text-slate-400", className)}>{placeholder}</span>
    );
  }

  return (
    <span
      className={cn(
        // Tabular figures so amounts, dates and reference numbers line up
        // down the column instead of jittering with glyph widths.
        "inline-flex items-center gap-1.5 tabular-nums",
        emphasis ? "font-semibold" : "font-medium",
        tone === "neutral" && "text-slate-800",
        tone === "brand" && "text-teal-800",
        tone === "warning" && "text-amber-800",
        tone === "danger" && "text-rose-700",
        tone === "success" && "text-emerald-700",
        truncate && "max-w-[200px]",
        className,
      )}
      title={truncate && typeof value === "string" ? value : undefined}
    >
      {Icon ? (
        <Icon aria-hidden="true" className="shrink-0 text-slate-400" size={14} />
      ) : null}
      <span className={cn(truncate && "truncate")}>{value}</span>
    </span>
  );
}

/**
 * A stacked value: the figure on top, a qualifier under it. Used where one
 * column has to carry both a number and what the number means (a balance and
 * how much of the total is already paid, say).
 */
export function PortalStackedValue({
  primary,
  secondary,
  tone = "neutral",
  align = "left",
}: {
  primary: ReactNode;
  secondary?: ReactNode;
  tone?: "neutral" | "brand" | "warning" | "danger" | "success";
  align?: "left" | "right";
}) {
  return (
    <div className={cn("min-w-0", align === "right" && "text-right")}>
      <span
        className={cn(
          "block font-semibold tabular-nums",
          tone === "neutral" && "text-slate-900",
          tone === "brand" && "text-teal-800",
          tone === "warning" && "text-amber-800",
          tone === "danger" && "text-rose-700",
          tone === "success" && "text-emerald-700",
        )}
      >
        {primary}
      </span>
      {secondary ? (
        <span className="mt-0.5 block text-sm font-medium tabular-nums text-slate-500">
          {secondary}
        </span>
      ) : null}
    </div>
  );
}

/** Right-aligned action group for the last column, low to high emphasis. */
export function PortalRowActions({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center justify-end gap-1.5">{children}</div>
  );
}

/* -------------------------------------------------------------------------- */
/* Async states                                                               */
/* -------------------------------------------------------------------------- */

/**
 * Loading placeholder shaped like the table itself, so the page reserves the
 * real layout and nothing jumps when the rows land.
 */
export function PortalTableSkeleton({
  columns,
  rows = 6,
}: {
  columns: ReadonlyArray<PortalColumn>;
  rows?: number;
}) {
  return (
    <div
      aria-busy="true"
      aria-live="polite"
      className="overflow-hidden rounded-lg border border-slate-200/80 bg-white shadow-xs"
    >
      <span className="sr-only">Loading records</span>
      <Table>
        <TableHeader className="bg-slate-50/70">
          <TableRow className="hover:bg-transparent">
            {columns.map((column) => (
              <TableHead className={columnClass(column)} key={column.key}>
                {column.align === "actions" ? (
                  <span className="sr-only">{column.label}</span>
                ) : (
                  column.label
                )}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rows }, (_, rowIndex) => (
            <TableRow className="hover:bg-transparent" key={rowIndex}>
              {columns.map((column, columnIndex) => (
                <TableCell className={columnClass(column)} key={column.key}>
                  <div
                    className={cn(
                      "h-4 animate-pulse rounded bg-slate-100",
                      columnIndex === 0 ? "w-40 bg-slate-200/70" : "w-20",
                      column.align !== "left" && "ml-auto",
                    )}
                  />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
