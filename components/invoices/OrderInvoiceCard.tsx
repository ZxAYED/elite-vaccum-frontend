"use client";

import { useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  Loader2,
  Receipt,
  RefreshCw,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";

import { StatusBadge } from "@/components/customer-portal/StatusBadge";
import { Button } from "@/components/ui/Button";
import { readApiMessage } from "@/lib/api-error";
import { toStatusSlug } from "@/lib/customer-orders";
import { invoiceFileName, saveBlobAsFile } from "@/lib/download-file";
import { formatCurrencyUsd, formatLongDate } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { isOrderTerminalFailure } from "@/lib/invoice-state";
import type {
  StoreOrderInvoiceDto,
  StoreOrderStatus,
} from "@/redux/api/ordersApi";
import {
  useDownloadStoreOrderInvoiceMutation,
  useGenerateStoreOrderInvoiceMutation,
} from "@/redux/api/storeInvoicesApi";

interface OrderInvoiceCardProps {
  /** Order id or businessId — the invoice endpoints are keyed by order. */
  orderId: string;
  /** Absent until the order's payment has resolved. */
  invoice?: StoreOrderInvoiceDto;
  /** Drives the pre-invoice states — payment status is read from here. */
  orderStatus: StoreOrderStatus;
  paymentMethod?: string;
  /** Admin-only: re-render the stored PDF after editing the order. */
  canRegenerate?: boolean;
  className?: string;
}

/**
 * The invoice attached to a product order, as shown to both the customer (on
 * their order detail) and an admin.
 *
 * Downloading needs the bearer token, so the PDF is fetched as a blob and
 * saved client-side rather than linked with an `<a href>`.
 */
export function OrderInvoiceCard({
  orderId,
  invoice,
  orderStatus,
  paymentMethod,
  canRegenerate = false,
  className,
}: OrderInvoiceCardProps) {
  const [downloadInvoice, { isLoading: isDownloading }] =
    useDownloadStoreOrderInvoiceMutation();
  const [generateInvoice, { isLoading: isGenerating }] =
    useGenerateStoreOrderInvoiceMutation();
  const [hasDownloaded, setHasDownloaded] = useState(false);

  /*
   * An invoice only exists once the payment resolved. While a card order is
   * PENDING there is no invoice and no payment row, and both the JSON and
   * PDF endpoints reject the request — so the download button stays hidden
   * and the state is read from the order instead.
   */
  if (!invoice) {
    const isAwaitingPayment =
      orderStatus === "PENDING" && paymentMethod !== "COD";
    const isFailed = isOrderTerminalFailure(orderStatus);

    return (
      <section
        className={cn(
          "rounded-lg border bg-white p-5 shadow-xs",
          isFailed
            ? "border-rose-200"
            : "border-slate-200",
          className,
        )}
      >
        <div className="flex items-center gap-2.5">
          {isFailed ? (
            <AlertCircle className="text-rose-500" size={18} />
          ) : isAwaitingPayment ? (
            <Clock className="text-amber-500" size={18} />
          ) : (
            <FileText className="text-slate-400" size={18} />
          )}
          <h2 className="text-sm font-bold text-slate-900">Invoice</h2>
        </div>
        <p className="mt-2.5 text-xs leading-relaxed text-slate-600">
          {isFailed
            ? "This order's payment did not complete, so no invoice was issued. Nothing was charged."
            : isAwaitingPayment
              ? "Your invoice is issued as soon as payment clears. It will appear here with a PDF to download."
              : "No invoice has been issued for this order."}
        </p>
      </section>
    );
  }
  const reference = invoice.businessId || invoice.id;
  const isPaid = invoice.status === "PAID" || Boolean(invoice.paidAt);
  const discount = Number(invoice.discountUsd);
  const refunds = invoice.refunds ?? [];
  const payments = invoice.payments ?? [];

  async function handleDownload() {
    try {
      const blob = await downloadInvoice(orderId).unwrap();
      saveBlobAsFile(blob, invoiceFileName(reference));
      setHasDownloaded(true);
    } catch (err) {
      toast.error("Could not download the invoice", {
        description: readApiMessage(
          err,
          "The invoice PDF isn't available right now. Please try again.",
        ),
      });
    }
  }

  async function handleRegenerate() {
    try {
      const result = await generateInvoice(orderId).unwrap();
      toast.success("Invoice PDF regenerated", {
        description: result.message || `${reference} is ready to download.`,
      });
    } catch (err) {
      toast.error("Could not regenerate the invoice", {
        description: readApiMessage(err, "The PDF could not be rendered."),
      });
    }
  }

  return (
    <section
      className={cn(
        "overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xs",
        className,
      )}
    >
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 bg-slate-50/70 px-5 py-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Receipt className="shrink-0 text-teal-700" size={16} />
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
              Invoice
            </span>
          </div>
          <p className="mt-1 truncate font-mono text-sm font-bold text-slate-900">
            {reference}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <StatusBadge
              label={refunds.length > 0 ? "Refunded" : undefined}
              status={refunds.length > 0 ? "refunded" : toStatusSlug(invoice.status)}
            />
            {isPaid && invoice.paidAt ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700">
                <CheckCircle2 size={12} />
                Paid {formatLongDate(invoice.paidAt)}
              </span>
            ) : invoice.dueDate ? (
              <span className="text-[11px] font-medium text-slate-500">
                Due {formatLongDate(invoice.dueDate)}
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          {canRegenerate ? (
            <Button
              disabled={isGenerating}
              onClick={handleRegenerate}
              size="sm"
              variant="outline"
              className="rounded-md"
            >
              {isGenerating ? (
                <Loader2 className="animate-spin" size={14} />
              ) : (
                <RefreshCw size={14} />
              )}
              {isGenerating ? "Rendering..." : "Regenerate PDF"}
            </Button>
          ) : null}
          <Button
            disabled={isDownloading}
            onClick={handleDownload}
            size="sm"
            className="rounded-md bg-teal-600 font-medium text-white hover:bg-teal-500"
          >
            {isDownloading ? (
              <Loader2 className="animate-spin" size={14} />
            ) : hasDownloaded ? (
              <CheckCircle2 size={14} />
            ) : (
              <Download size={14} />
            )}
            {isDownloading ? "Preparing..." : "Download PDF"}
          </Button>
        </div>
      </header>

      <div className="px-5 py-4">
        {invoice.lineItems.length > 0 ? (
          <ul className="divide-y divide-slate-100">
            {invoice.lineItems.map((item, index) => (
              <li
                className="flex items-start justify-between gap-4 py-2.5 first:pt-0"
                key={item.id || `${item.description}-${index}`}
              >
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-900">
                    {item.description}
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    {item.quantity} ×{" "}
                    {formatCurrencyUsd(Number(item.unitPriceUsd))}
                  </p>
                </div>
                <p className="shrink-0 text-xs font-semibold tabular-nums text-slate-900">
                  {formatCurrencyUsd(Number(item.totalUsd))}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-slate-500">
            This invoice has no itemised lines.
          </p>
        )}

        <dl className="mt-4 space-y-1.5 border-t border-slate-100 pt-3.5 text-xs">
          <Row label="Subtotal" value={Number(invoice.subtotalUsd)} />
          <Row label="Tax" value={Number(invoice.taxUsd)} />
          {discount > 0 ? <Row label="Discount" value={-discount} /> : null}
          <div className="flex items-center justify-between border-t border-slate-100 pt-2.5 text-sm">
            <dt className="font-bold text-slate-900">Total</dt>
            <dd className="font-bold tabular-nums text-teal-800">
              {formatCurrencyUsd(Number(invoice.totalUsd))}
            </dd>
          </div>
        </dl>

        {payments.length > 0 ? (
          <div className="mt-4 border-t border-slate-100 pt-3.5">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
              Payments
            </p>
            <ul className="mt-2 space-y-1.5">
              {payments.map((payment) => (
                <li
                  className="flex items-center justify-between gap-3 text-[11px]"
                  key={payment.id}
                >
                  <span className="min-w-0 truncate text-slate-600">
                    {payment.methodLabel || "Payment"}
                    {payment.transactionReference ? (
                      <span className="ml-1.5 font-mono text-slate-400">
                        {payment.transactionReference}
                      </span>
                    ) : null}
                  </span>
                  <span className="shrink-0 font-semibold tabular-nums text-slate-900">
                    {formatCurrencyUsd(Number(payment.amountUsd))}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {/*
          An invoice stays PAID after a refund — that record is the proof
          payment happened. The reversal is listed separately here.
        */}
        {refunds.length > 0 ? (
          <div className="mt-4 border-t border-slate-100 pt-3.5">
            <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
              <RotateCcw size={11} />
              Refunds
            </p>
            <ul className="mt-2 space-y-1.5">
              {refunds.map((refund) => (
                <li
                  className="flex items-center justify-between gap-3 text-[11px]"
                  key={refund.id}
                >
                  <span className="min-w-0 truncate text-slate-600">
                    {refund.status}
                    {refund.reason ? ` · ${refund.reason}` : ""}
                  </span>
                  <span className="shrink-0 font-semibold tabular-nums text-slate-900">
                    -{formatCurrencyUsd(Number(refund.amountUsd))}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {invoice.notes ? (
          <p className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-3 text-[11px] leading-relaxed text-slate-600">
            {invoice.notes}
          </p>
        ) : null}
      </div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-medium tabular-nums text-slate-900">
        {formatCurrencyUsd(value)}
      </dd>
    </div>
  );
}
