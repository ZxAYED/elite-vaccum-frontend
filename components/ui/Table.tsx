"use client";

import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

/**
 * shadcn/ui table primitives, styled for this portal's slate/teal surface.
 *
 * `Table` renders inside its own horizontally scrollable container so a wide
 * table never pushes the page body sideways — the scroll stays local to the
 * data. Wrap it in `PortalTableShell` for the bordered card surface the
 * customer portal uses.
 */

function Table({ className, ...props }: ComponentProps<"table">) {
  return (
    <div
      className="relative w-full overflow-x-auto"
      data-slot="table-container"
    >
      <table
        className={cn("w-full caption-bottom border-collapse text-base", className)}
        data-slot="table"
        {...props}
      />
    </div>
  );
}

function TableHeader({ className, ...props }: ComponentProps<"thead">) {
  return (
    <thead
      className={cn("[&_tr]:border-b [&_tr]:border-slate-200", className)}
      data-slot="table-header"
      {...props}
    />
  );
}

function TableBody({ className, ...props }: ComponentProps<"tbody">) {
  return (
    <tbody
      className={cn("[&_tr:last-child]:border-0", className)}
      data-slot="table-body"
      {...props}
    />
  );
}

function TableFooter({ className, ...props }: ComponentProps<"tfoot">) {
  return (
    <tfoot
      className={cn(
        "border-t border-slate-200 bg-slate-50/60 font-medium [&>tr]:last:border-b-0",
        className,
      )}
      data-slot="table-footer"
      {...props}
    />
  );
}

function TableRow({ className, ...props }: ComponentProps<"tr">) {
  return (
    <tr
      className={cn(
        "border-b border-slate-100 transition-colors",
        "hover:bg-teal-50/40 data-[state=selected]:bg-teal-50/60",
        // Keyboard focus anywhere in the row lights the whole row, so tabbing
        // through row actions never loses the reader's place.
        "focus-within:bg-teal-50/50",
        className,
      )}
      data-slot="table-row"
      {...props}
    />
  );
}

function TableHead({ className, ...props }: ComponentProps<"th">) {
  return (
    <th
      className={cn(
        "h-11 whitespace-nowrap px-4 text-left align-middle",
        "text-xs font-semibold uppercase tracking-wider text-slate-500",
        "[&:has([role=checkbox])]:pr-0",
        className,
      )}
      data-slot="table-head"
      {...props}
    />
  );
}

function TableCell({ className, ...props }: ComponentProps<"td">) {
  return (
    <td
      className={cn(
        "px-4 py-3.5 align-middle text-slate-700",
        "[&:has([role=checkbox])]:pr-0",
        className,
      )}
      data-slot="table-cell"
      {...props}
    />
  );
}

function TableCaption({ className, ...props }: ComponentProps<"caption">) {
  return (
    <caption
      className={cn("mt-4 text-sm text-slate-500", className)}
      data-slot="table-caption"
      {...props}
    />
  );
}

export {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
};
