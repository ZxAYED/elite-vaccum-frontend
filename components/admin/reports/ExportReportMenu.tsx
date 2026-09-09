"use client";

import { useState } from "react";
import { Download, FileSpreadsheet, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { readApiMessage } from "@/lib/api-error";
import { saveBlobAsFile } from "@/lib/download-file";
import {
  useExportCustomersCsvMutation,
  useExportInvoicesCsvMutation,
  useExportOrdersCsvMutation,
  useExportServiceRequestsCsvMutation,
  type ReportPeriod,
} from "@/redux/api/reportsApi";

/**
 * CSV exports are generated **server-side** and streamed back as a
 * `text/csv` attachment. They are authenticated, so the file has to be fetched
 * as a blob and saved — a plain link would drop the bearer token and 401.
 */

type ExportKind = "orders" | "service-requests" | "invoices" | "customers";

const EXPORTS: Array<{
  kind: ExportKind;
  label: string;
  /** The customers export takes no date parameters. */
  ranged: boolean;
}> = [
  { kind: "orders", label: "Orders", ranged: true },
  { kind: "service-requests", label: "Service Requests", ranged: true },
  { kind: "invoices", label: "Invoices", ranged: true },
  { kind: "customers", label: "Customers", ranged: false },
];

export function ExportReportMenu({ period }: { period?: ReportPeriod }) {
  const [pending, setPending] = useState<ExportKind | null>(null);

  const [exportOrders] = useExportOrdersCsvMutation();
  const [exportServiceRequests] = useExportServiceRequestsCsvMutation();
  const [exportInvoices] = useExportInvoicesCsvMutation();
  const [exportCustomers] = useExportCustomersCsvMutation();

  async function handleExport(kind: ExportKind, ranged: boolean) {
    setPending(kind);
    const params = ranged && period ? { period } : undefined;

    try {
      const blob = await (kind === "orders"
        ? exportOrders(params).unwrap()
        : kind === "service-requests"
          ? exportServiceRequests(params).unwrap()
          : kind === "invoices"
            ? exportInvoices(params).unwrap()
            : exportCustomers().unwrap());

      const suffix = ranged && period ? `-${period}` : "";
      const stamp = new Date().toISOString().slice(0, 10);
      saveBlobAsFile(blob, `${kind}${suffix}-${stamp}.csv`);
      toast.success(`${kind.replace(/-/g, " ")} exported.`);
    } catch (err) {
      toast.error("Export failed", {
        description: readApiMessage(
          err,
          "The report could not be generated. Please try again.",
        ),
      });
    } finally {
      setPending(null);
    }
  }

  const isBusy = pending !== null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          className="flex items-center gap-2 border-teal-200 font-semibold text-teal-900 shadow-sm hover:border-teal-300"
          disabled={isBusy}
          size="sm"
          variant="outline"
        >
          {isBusy ? (
            <Loader2 className="animate-spin text-teal-700" size={14} />
          ) : (
            <Download className="text-teal-700" size={14} />
          )}
          {isBusy ? "Exporting..." : "Export CSV"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Download report</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {EXPORTS.map((entry) => (
          <DropdownMenuItem
            disabled={isBusy}
            key={entry.kind}
            onSelect={(event) => {
              // Keep the menu from closing before the request is issued.
              event.preventDefault();
              void handleExport(entry.kind, entry.ranged);
            }}
          >
            {pending === entry.kind ? (
              <Loader2 className="animate-spin" size={15} />
            ) : (
              <FileSpreadsheet size={15} />
            )}
            <span className="flex-1">{entry.label}</span>
            {entry.ranged && period ? (
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                {period}
              </span>
            ) : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
