"use client";

import Link from "next/link";
import type { ComponentType, ReactNode } from "react";
import { ArrowRight, Loader2, Search, X } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";

/**
 * The customer portal's shared list-screen vocabulary.
 *
 * Every "my <things>" screen — orders, service requests, quotations, schedule,
 * billing, reviews — is the same shape: a filter bar, then a stack of record
 * cards with a badge row, a primary-coloured title, a row of labelled facts,
 * and a right-aligned action group. These components own that shape so the
 * screens can't drift apart again.
 *
 * Conventions enforced here:
 * - Titles are `text-primary`, never near-black, so the eye lands on the record.
 * - Facts use an icon chip + uppercase micro-label + value; a missing value
 *   renders a muted placeholder rather than an empty gap.
 * - Actions read low-emphasis to high-emphasis, left to right, and every button
 *   is `size="sm"` with the same radius.
 */

/* -------------------------------------------------------------------------- */
/* Filter bar                                                                 */
/* -------------------------------------------------------------------------- */

export interface PortalFilterOption<T extends string = string> {
  label: string;
  value: T;
  /** Optional count shown after the label. */
  count?: number;
}

interface PortalFilterBarProps<T extends string> {
  filters: ReadonlyArray<PortalFilterOption<T>>;
  value: T;
  onChange: (value: T) => void;
  /** Omit both search props to render filters only. */
  search?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  /** Optional trailing control (a sort select, say). */
  trailing?: ReactNode;
  /** Label prefix for the filter row, e.g. "Status:". */
  filterLabel?: string;
  className?: string;
}

export function PortalFilterBar<T extends string>({
  filters,
  value,
  onChange,
  search,
  onSearchChange,
  searchPlaceholder = "Search...",
  trailing,
  filterLabel,
  className,
}: PortalFilterBarProps<T>) {
  const hasSearch = typeof search === "string" && Boolean(onSearchChange);

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-lg border border-slate-200/80 bg-white p-4 shadow-xs sm:p-5",
        className,
      )}
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {filterLabel ? (
            <span className="mr-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              {filterLabel}
            </span>
          ) : null}
          {filters.map((filter) => {
            const isSelected = value === filter.value;
            return (
              <Button
                key={filter.value}
                size="sm"
                variant={isSelected ? "default" : "outline"}
                onClick={() => onChange(filter.value)}
                aria-pressed={isSelected}
                className={cn(
                  "h-9 rounded-md px-4 text-xs font-medium transition-colors sm:text-sm",
                  isSelected
                    ? "bg-teal-700 text-white shadow-xs hover:bg-teal-800"
                    : "border-slate-200/80 text-slate-700 hover:bg-slate-100 hover:text-slate-900",
                )}
              >
                {filter.label}
                {typeof filter.count === "number" ? (
                  <span
                    className={cn(
                      "ml-1.5 tabular-nums",
                      isSelected ? "text-white/70" : "text-slate-400",
                    )}
                  >
                    {filter.count}
                  </span>
                ) : null}
              </Button>
            );
          })}
        </div>

        {trailing ? (
          <div className="flex shrink-0 items-center gap-2">{trailing}</div>
        ) : null}
      </div>

      {hasSearch ? (
        <div className="relative flex items-center pt-1">
          <Search
            size={16}
            className="pointer-events-none absolute left-3.5 text-slate-400"
          />
          <Input
            value={search}
            onChange={(event) => onSearchChange?.(event.target.value)}
            placeholder={searchPlaceholder}
            className="h-11 rounded-md border-slate-200/80 bg-slate-50/60 pl-10 pr-10 text-xs font-medium focus-visible:bg-white focus-visible:ring-teal-600 sm:text-sm"
          />
          {search ? (
            <button
              type="button"
              onClick={() => onSearchChange?.("")}
              aria-label="Clear search"
              className="absolute right-3 flex size-6 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-200 hover:text-slate-600"
            >
              <X size={14} />
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Record card                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Left-edge accent rail. Purely supplementary: every state it marks is also
 * spelled out by the card's StatusBadge, so the colour never carries meaning
 * on its own. Its job is to make the one card that needs action findable in a
 * stack of ten without reading any of them.
 */
const CARD_ACCENTS = {
  brand: "before:bg-teal-500",
  warning: "before:bg-amber-500",
  danger: "before:bg-rose-500",
  success: "before:bg-emerald-500",
} as const;

export function PortalCard({
  children,
  className,
  accent,
}: {
  children: ReactNode;
  className?: string;
  /** Marks a card that needs the customer's attention. Omit for the default. */
  accent?: keyof typeof CARD_ACCENTS;
}) {
  return (
    <article
      className={cn(
        "group relative rounded-lg border border-slate-200/80 bg-white p-5 shadow-xs",
        "transition duration-200 hover:-translate-y-px hover:border-teal-300",
        "hover:shadow-[0_10px_28px_-16px_rgba(28,79,80,0.45)]",
        // The card is not itself a link; the ring follows whichever control
        // inside it takes keyboard focus so the row still reads as active.
        "focus-within:border-teal-400 focus-within:ring-2 focus-within:ring-teal-600/20",
        "motion-reduce:transform-none motion-reduce:transition-none",
        accent && [
          "before:absolute before:inset-y-0 before:left-0 before:w-1",
          "before:rounded-l-lg before:content-['']",
          CARD_ACCENTS[accent],
        ],
        "sm:p-6",
        className,
      )}
    >
      {children}
    </article>
  );
}

/** Badge row on the left, a timestamp or reference on the right. */
export function PortalCardTop({
  badges,
  meta,
}: {
  badges: ReactNode;
  meta?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3">
      <div className="flex flex-wrap items-center gap-2">{badges}</div>
      {meta ? (
        <span className="text-xs font-medium text-slate-500">{meta}</span>
      ) : null}
    </div>
  );
}

/**
 * The record's headline. Rendered in the brand colour so it reads as the
 * primary target on the card; links keep the same colour and only shift
 * opacity on hover.
 */
export function PortalCardTitle({
  href,
  children,
  subtitle,
  className,
}: {
  href?: string;
  children: ReactNode;
  subtitle?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("pb-4 pt-1", className)}>
      <h2 className="wrap-break-word text-balance text-lg font-semibold tracking-tight text-primary sm:text-xl">
        {href ? (
          <Link
            className={cn(
              "rounded-sm transition-colors hover:text-teal-700",
              // No underline; the focus ring is what makes the link's keyboard
              // state visible, so it must stay.
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600",
            )}
            href={href}
          >
            {children}
          </Link>
        ) : (
          children
        )}
      </h2>
      {subtitle ? (
        <p className="mt-1.5 text-xs font-medium text-slate-500 sm:text-sm">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}

/** Small inline reference chip, e.g. an order or invoice number. */
export function PortalRef({ children }: { children: ReactNode }) {
  return (
    // `select-all` because these are the strings customers actually copy out
    // of the list (order and invoice numbers they paste into support chats).
    <span className="select-all rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 font-mono text-[11px] font-semibold tabular-nums text-slate-700">
      {children}
    </span>
  );
}

const FACT_TONES = {
  neutral: "bg-slate-100 text-slate-600",
  brand: "bg-teal-50 text-teal-700",
  warning: "bg-amber-50 text-amber-800",
  danger: "bg-rose-50 text-rose-700",
  success: "bg-emerald-50 text-emerald-700",
} as const;

export interface PortalFactProps {
  icon: ComponentType<{ size?: number; className?: string }>;
  label: string;
  /** A nullish or blank value renders the muted placeholder instead. */
  value?: ReactNode;
  tone?: keyof typeof FACT_TONES;
  /** Shown when `value` is missing. */
  placeholder?: string;
  /** Truncate long values (addresses) rather than wrapping the row. */
  truncate?: boolean;
  emphasis?: boolean;
}

export function PortalFact({
  icon: Icon,
  label,
  value,
  tone = "neutral",
  placeholder = "Not set",
  truncate = false,
  emphasis = false,
}: PortalFactProps) {
  const isEmpty =
    value === null ||
    value === undefined ||
    value === "" ||
    (typeof value === "number" && Number.isNaN(value));

  // A truncated value is only acceptable if the full string stays reachable,
  // so anything clipped carries it as a title tooltip.
  const fullText =
    truncate && !isEmpty && typeof value === "string" ? value : undefined;

  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <div
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-md ring-1 ring-inset ring-black/5",
          FACT_TONES[tone],
        )}
      >
        <Icon size={15} />
      </div>
      <div className="min-w-0">
        <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          {label}
        </span>
        <span
          className={cn(
            // Tabular figures so amounts and dates line up down a stack of
            // cards instead of jittering with the glyph widths.
            "block tabular-nums",
            isEmpty
              ? "font-medium text-slate-500"
              : emphasis
                ? "font-semibold text-slate-900"
                : "font-medium text-slate-800",
            truncate && "max-w-[180px] truncate sm:max-w-[220px]",
          )}
          title={fullText}
        >
          {isEmpty ? placeholder : value}
        </span>
      </div>
    </div>
  );
}

/**
 * Facts on the left, actions on the right. Actions are expected in
 * low-to-high emphasis order so the primary call sits furthest right, nearest
 * the reader's thumb.
 */
export function PortalCardFooter({
  facts,
  actions,
}: {
  facts?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
      {/*
        Two columns on phones so three or four facts stay on a readable grid
        instead of wrapping into a ragged one-and-a-half-row block; free-
        flowing from `sm` up, where there is room for them on one line.
      */}
      <div className="grid grid-cols-2 items-center gap-x-4 gap-y-4 text-xs sm:flex sm:flex-wrap sm:gap-x-8 sm:text-sm">
        {facts}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {actions}
        </div>
      ) : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Actions                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * The canonical "open this record" action. Every list screen uses this so the
 * label, size, radius and arrow are identical everywhere.
 */
export function PortalDetailAction({
  href,
  label = "View Details",
}: {
  href: string;
  label?: string;
}) {
  return (
    <Button
      asChild
      className="group/action rounded-md text-xs font-medium text-slate-800 transition hover:border-teal-300 hover:bg-teal-50/60 active:translate-y-px motion-reduce:active:translate-y-0 sm:text-sm"
      size="sm"
      variant="outline"
    >
      <Link href={href}>
        {label}
        <ArrowRight
          className="ml-1 text-teal-700 transition-transform group-hover/action:translate-x-0.5 motion-reduce:transform-none"
          size={14}
        />
      </Link>
    </Button>
  );
}

/**
 * A secondary card action (Print, Download, Pay). `tone="accent"` marks the one
 * action that needs the customer's attention, e.g. an unpaid invoice.
 */
export function PortalCardAction({
  href,
  onClick,
  icon: Icon,
  label,
  tone = "neutral",
  disabled,
  loading,
}: {
  href?: string;
  onClick?: () => void;
  icon?: ComponentType<{ size?: number; className?: string }>;
  label: string;
  tone?: "neutral" | "accent" | "brand";
  disabled?: boolean;
  loading?: boolean;
}) {
  // amber-600 and teal-600 both sit near 3:1 against white, under the 4.5:1
  // WCAG AA floor for the label. The -700 steps clear it (5.0:1 and 5.5:1)
  // without changing the hue the rest of the portal uses.
  const className = cn(
    "rounded-md text-xs font-medium transition active:translate-y-px motion-reduce:active:translate-y-0 sm:text-sm",
    tone === "accent" && "bg-amber-700 text-white shadow-xs hover:bg-amber-800",
    tone === "brand" && "bg-teal-700 text-white shadow-xs hover:bg-teal-800",
    tone === "neutral" && "text-slate-800 hover:bg-slate-50",
  );
  const variant = tone === "neutral" ? "outline" : "default";

  const content = (
    <>
      {loading ? (
        <Loader2 className="mr-1 animate-spin" size={14} />
      ) : Icon ? (
        <Icon className="mr-1" size={14} />
      ) : null}
      {label}
    </>
  );

  if (href) {
    return (
      <Button asChild className={className} size="sm" variant={variant}>
        <Link href={href}>{content}</Link>
      </Button>
    );
  }

  return (
    <Button
      className={className}
      disabled={disabled || loading}
      onClick={onClick}
      size="sm"
      type="button"
      variant={variant}
    >
      {content}
    </Button>
  );
}

/* -------------------------------------------------------------------------- */
/* Async states                                                               */
/* -------------------------------------------------------------------------- */

/**
 * Loading placeholder shaped like `PortalCard` itself: badge row, title, and a
 * fact/action footer. Reserving the real layout keeps the list from jumping
 * when the data lands, which a centred spinner cannot do.
 */
export function PortalCardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div aria-busy="true" aria-live="polite" className="space-y-4 sm:space-y-5">
      <span className="sr-only">Loading records</span>
      {Array.from({ length: count }, (_, index) => (
        <div
          className="rounded-lg border border-slate-200/80 bg-white p-5 shadow-xs sm:p-6"
          key={index}
        >
          <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3">
            <div className="flex items-center gap-2">
              <div className="h-6 w-24 animate-pulse rounded-md bg-slate-200/70" />
              <div className="h-6 w-20 animate-pulse rounded-md bg-slate-100" />
            </div>
            <div className="h-4 w-32 animate-pulse rounded bg-slate-100" />
          </div>

          <div className="pb-4 pt-1">
            <div className="h-6 w-3/5 animate-pulse rounded bg-slate-200/70" />
            <div className="mt-2 h-3.5 w-2/5 animate-pulse rounded bg-slate-100" />
          </div>

          <div className="flex flex-col gap-4 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="grid grid-cols-2 gap-x-4 gap-y-4 sm:flex sm:gap-x-8">
              {[0, 1, 2].map((fact) => (
                <div className="flex items-center gap-2.5" key={fact}>
                  <div className="size-8 shrink-0 animate-pulse rounded-md bg-slate-100" />
                  <div className="space-y-1.5">
                    <div className="h-2.5 w-16 animate-pulse rounded bg-slate-100" />
                    <div className="h-3.5 w-20 animate-pulse rounded bg-slate-200/70" />
                  </div>
                </div>
              ))}
            </div>
            <div className="h-9 w-28 animate-pulse rounded-md bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function PortalLoading({ label = "Loading..." }: { label?: string }) {
  return (
    <div
      aria-busy="true"
      className="flex flex-col items-center justify-center rounded-lg border border-slate-200/80 bg-white py-20 text-teal-700 shadow-xs"
      role="status"
    >
      <Loader2 className="animate-spin text-teal-600" size={28} />
      <span className="mt-3 text-xs font-medium text-slate-700 sm:text-sm">
        {label}
      </span>
    </div>
  );
}

/** Page controls for a server-paginated list. */
export function PortalPager({
  page,
  totalPages,
  total,
  totalLabel,
  isBusy,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  total?: number;
  totalLabel: string;
  isBusy?: boolean;
  onPageChange: (updater: (current: number) => number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200/80 bg-white px-4 py-3 text-xs shadow-xs">
      <span className="text-slate-500">
        Page {page} of {totalPages}
        {total ? ` · ${total} ${totalLabel}` : ""}
      </span>
      <div className="flex gap-2">
        <Button
          className="rounded-md"
          disabled={page <= 1 || isBusy}
          onClick={() => onPageChange((current) => Math.max(1, current - 1))}
          size="sm"
          variant="outline"
        >
          Previous
        </Button>
        <Button
          className="rounded-md"
          disabled={page >= totalPages || isBusy}
          onClick={() => onPageChange((current) => current + 1)}
          size="sm"
          variant="outline"
        >
          Next
        </Button>
      </div>
    </div>
  );
}

/** A list that dims while a background refetch is in flight. */
export function PortalList({
  children,
  isRefreshing = false,
}: {
  children: ReactNode;
  isRefreshing?: boolean;
}) {
  return (
    <div
      className={cn(
        "space-y-4 sm:space-y-5",
        isRefreshing && "opacity-60 transition-opacity",
      )}
    >
      {children}
    </div>
  );
}
