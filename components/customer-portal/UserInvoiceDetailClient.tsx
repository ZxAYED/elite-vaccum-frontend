"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  FileText,
  Loader2,
  Package,
  Printer,
  ReceiptText,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/customer-portal/PageHeader";
import { StatusBadge } from "@/components/customer-portal/StatusBadge";
import { TypeBadge } from "@/components/customer-portal/TypeBadge";
import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { readApiMessage } from "@/lib/api-error";
import { formatCurrencyUsd, formatLongDate } from "@/lib/formatters";
import {
  canPayInvoiceOnline,
  getInvoiceState,
  invoiceKind,
  lineItemTotal,
} from "@/lib/invoice-state";
import {
  useConfirmStripePaymentMutation,
  useCreateStripePaymentIntentMutation,
  useGetInvoiceByIdQuery,
  useLazyGetInvoiceHtmlQuery,
} from "@/redux/api/billingApi";

export function UserInvoiceDetailClient({ invoiceId }: { invoiceId: string }) {
  const {
    data: invoice,
    isError,
    isFetching,
    isLoading,
    refetch,
  } = useGetInvoiceByIdQuery(invoiceId);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [createStripePaymentIntent] = useCreateStripePaymentIntentMutation();
  const [confirmStripePayment] = useConfirmStripePaymentMutation();
  const [fetchInvoiceHtml, { isFetching: isOpeningHtml }] =
    useLazyGetInvoiceHtmlQuery();

  async function handlePrintHtml() {
    try {
      const html = await fetchInvoiceHtml(invoiceId).unwrap();
      const url = URL.createObjectURL(
        new Blob([html], { type: "text/html;charset=utf-8" }),
      );
      window.open(url, "_blank", "noopener");
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (error) {
      toast.error("Could not open the printable invoice", {
        description: readApiMessage(error, "The invoice view is unavailable."),
      });
    }
  }

  async function handleConfirmPayment() {
    if (!invoice) return;
    setIsProcessingPayment(true);
    const toastId = toast.loading("Connecting to secure payment gateway...");

    try {
      const intent = await createStripePaymentIntent(invoice.id).unwrap();
      if (!intent.paymentIntentId) {
        throw new Error("The payment gateway did not return a payment intent.");
      }

      const result = await confirmStripePayment({
        invoiceId: invoice.id,
        paymentIntentId: intent.paymentIntentId,
      }).unwrap();

      toast.success(result.message || "Payment completed.", {
        id: toastId,
        description: `Invoice ${invoice.businessId || invoice.id} is now marked paid.`,
      });
      setPaymentModalOpen(false);
    } catch (error) {
      toast.error("Payment could not be completed", {
        id: toastId,
        description: readApiMessage(
          error,
          "Please try again, or contact support if the problem continues.",
        ),
        duration: 6000,
      });
    } finally {
      setIsProcessingPayment(false);
    }
  }

  if (isLoading) {
    return <InvoiceDetailSkeleton />;
  }

  if (isError) {
    return (
      <EmptyState
        action={{ label: "Try Again", onClick: () => void refetch() }}
        className="py-14"
        description="We couldn't load this invoice. Please try again in a moment."
        icon={ReceiptText}
        secondaryAction={{ label: "Back to Billing", href: "/user/billing" }}
        title="Invoice unavailable"
        tone="card"
      />
    );
  }

  if (!invoice) {
    return (
      <EmptyState
        action={{ label: "Back to Billing", href: "/user/billing" }}
        className="py-14"
        description={`We couldn't find an invoice matching ID "${invoiceId}". It may have been archived or removed.`}
        icon={FileText}
        title="Invoice not found"
        tone="card"
      />
    );
  }

  const state = getInvoiceState(invoice);
  const kind = invoiceKind(invoice);
  const canPay = canPayInvoiceOnline(invoice);
  const subtotalAmount = Number(invoice.subtotalUsd || state.total);
  const taxAmount = Number(invoice.taxUsd || 0);
  const discountAmount = Number(invoice.discountUsd || 0);
  const payments = invoice.payments ?? [];

  return (
    <div className="space-y-6 pb-10 sm:space-y-7">
      <PageHeader
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild className="rounded-md" size="sm" variant="outline">
              <Link href="/user/billing">
                <ArrowLeft />
                All Invoices
              </Link>
            </Button>
            <Button
              className="rounded-md"
              disabled={isOpeningHtml}
              onClick={() => void handlePrintHtml()}
              size="sm"
              type="button"
              variant="outline"
            >
              {isOpeningHtml ? <Loader2 className="animate-spin" /> : <Printer />}
              {isOpeningHtml ? "Opening..." : "Print / HTML"}
            </Button>
          </div>
        }
        description={
          invoice.productOrderId
            ? `Connected to order ${invoice.productOrderId}.`
            : "A complete record of charges, payments, and due dates."
        }
        eyebrow="Invoice Details"
        title={`Invoice #${invoice.businessId || invoice.id}`}
      />

      <div className="grid items-start gap-5 lg:grid-cols-12 lg:gap-6">
        <main className="overflow-hidden rounded-[var(--radius-card)] border border-teal-100 bg-white shadow-[0_24px_60px_-48px_rgba(28,79,80,0.45)] lg:col-span-8">
          <div className="flex flex-col gap-4 border-b border-teal-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="flex flex-wrap items-center gap-2">
              <TypeBadge type={kind} />
              <StatusBadge label={state.label} status={state.slug} />
            </div>
            <p className="text-sm font-medium text-slate-500">
              {invoice.lineItems.length} line item{invoice.lineItems.length === 1 ? "" : "s"}
            </p>
          </div>

          <dl className="grid border-b border-teal-100 bg-slate-50/65 sm:grid-cols-3 sm:divide-x sm:divide-teal-100">
            <InvoiceFact
              icon={CalendarDays}
              label="Invoice date"
              value={invoice.issueDate ? formatLongDate(invoice.issueDate) : "Not recorded"}
            />
            <InvoiceFact
              icon={ReceiptText}
              label="Payment status"
              value={state.label}
            />
            <InvoiceFact
              icon={CalendarDays}
              label="Due date"
              value={invoice.dueDate ? formatLongDate(invoice.dueDate) : "Upon receipt"}
            />
          </dl>

          <section aria-labelledby="invoice-items-heading" className="px-5 py-6 sm:px-6 sm:py-7">
            <div className="mb-4 flex items-center gap-2.5">
              <span className="flex size-9 items-center justify-center rounded-md bg-teal-50 text-teal-700">
                {kind === "PRODUCT" ? <Package size={18} /> : <Wrench size={18} />}
              </span>
              <div>
                <h2 id="invoice-items-heading" className="text-lg font-bold text-slate-950">
                  Itemized breakdown
                </h2>
                <p className="text-sm text-slate-500">Quantity, unit rate, and line total</p>
              </div>
            </div>

            {invoice.lineItems.length > 0 ? (
              <div className="overflow-hidden rounded-lg border border-slate-200">
                <div className="hidden grid-cols-[minmax(0,1fr)_7rem_8rem] gap-4 bg-slate-50 px-4 py-2.5 text-xs font-semibold uppercase text-slate-500 sm:grid">
                  <span>Description</span>
                  <span className="text-right">Unit rate</span>
                  <span className="text-right">Amount</span>
                </div>
                <div className="divide-y divide-slate-200">
                  {invoice.lineItems.map((lineItem, index) => (
                    <div
                      className="grid gap-3 px-4 py-4 sm:grid-cols-[minmax(0,1fr)_7rem_8rem] sm:items-center sm:gap-4"
                      key={`${lineItem.description}-${index}`}
                    >
                      <div className="min-w-0">
                        <p className="text-[15px] font-semibold leading-6 text-slate-950">
                          {lineItem.description}
                        </p>
                        <p className="mt-0.5 text-sm text-slate-500">
                          Quantity {lineItem.quantity || 1}
                        </p>
                      </div>
                      <div className="flex items-center justify-between text-sm sm:block sm:text-right">
                        <span className="font-medium text-slate-500 sm:hidden">Unit rate</span>
                        <span className="font-medium tabular-nums text-slate-700">
                          {formatCurrencyUsd(Number(lineItem.unitPriceUsd))}
                        </span>
                      </div>
                      <div className="flex items-center justify-between sm:block sm:text-right">
                        <span className="text-sm font-medium text-slate-500 sm:hidden">Amount</span>
                        <span className="text-base font-bold tabular-nums text-slate-950">
                          {formatCurrencyUsd(lineItemTotal(lineItem))}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-slate-200 py-8 text-center text-sm text-slate-500">
                No line items are recorded on this invoice.
              </div>
            )}
          </section>

          {(payments.length > 0 || invoice.notes) && (
            <div className="grid border-t border-teal-100 lg:grid-cols-2 lg:divide-x lg:divide-teal-100">
              {payments.length > 0 && (
                <section aria-labelledby="payment-history-heading" className="px-5 py-5 sm:px-6">
                  <h2 id="payment-history-heading" className="text-base font-bold text-slate-950">
                    Payment history
                  </h2>
                  <div className="mt-3 space-y-3">
                    {payments.map((payment) => (
                      <div className="flex items-start justify-between gap-4" key={payment.id}>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-800">
                            {payment.methodLabel || "Payment"}
                          </p>
                          <p className="mt-0.5 truncate text-xs text-slate-500">
                            {payment.paidAt || payment.processedAt || payment.createdAt
                              ? formatLongDate(payment.paidAt || payment.processedAt || payment.createdAt || "")
                              : payment.transactionReference || "Reference not recorded"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold tabular-nums text-slate-950">
                            {formatCurrencyUsd(Number(payment.amountUsd))}
                          </p>
                          <StatusBadge className="mt-1" status={payment.status} />
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {invoice.notes && (
                <section className="px-5 py-5 sm:px-6">
                  <h2 className="text-base font-bold text-slate-950">Invoice notes</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{invoice.notes}</p>
                </section>
              )}
            </div>
          )}
        </main>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:col-span-4">
          <section className="overflow-hidden rounded-[var(--radius-card)] border border-teal-800 bg-[#174f4f] text-white shadow-[0_24px_55px_-38px_rgba(15,66,66,0.75)]">
            <div className="border-b border-white/15 px-5 py-5 sm:px-6">
              <p className="text-sm font-medium text-teal-100">Invoice total</p>
              <p className="mt-1 text-3xl font-bold tabular-nums tracking-normal text-white">
                {formatCurrencyUsd(state.total)}
              </p>
            </div>

            <dl className="space-y-3 px-5 py-5 text-sm sm:px-6">
              <SummaryRow label="Subtotal" value={formatCurrencyUsd(subtotalAmount)} />
              {discountAmount > 0 && (
                <SummaryRow label="Discount" value={`-${formatCurrencyUsd(discountAmount)}`} />
              )}
              <SummaryRow label="Tax" value={formatCurrencyUsd(taxAmount)} />
              {state.paid > 0 && (
                <SummaryRow label="Payments received" value={`-${formatCurrencyUsd(state.paid)}`} />
              )}
            </dl>

            <div className="border-t border-white/15 px-5 py-5 sm:px-6">
              <div className="flex items-end justify-between gap-4">
                <span className="text-base font-semibold text-white">
                  {state.balance > 0 ? "Balance due" : "Amount paid"}
                </span>
                <span className="text-xl font-bold tabular-nums text-teal-100">
                  {formatCurrencyUsd(state.balance > 0 ? state.balance : state.paid || state.total)}
                </span>
              </div>

              {canPay ? (
                <Button
                  className="mt-5 w-full rounded-md bg-teal-500 text-white shadow-none hover:bg-teal-400"
                  onClick={() => setPaymentModalOpen(true)}
                  type="button"
                >
                  <CreditCard />
                  Pay {formatCurrencyUsd(state.balance)}
                </Button>
              ) : state.isFullyPaid ? (
                <div className="mt-5 flex min-h-11 items-center justify-center gap-2 rounded-md border border-emerald-300/30 bg-emerald-400/15 px-4 text-sm font-semibold text-emerald-100">
                  <CheckCircle2 size={17} />
                  Paid and settled
                </div>
              ) : state.isStoreOrderInvoice ? (
                <p className="mt-4 border-t border-white/15 pt-4 text-sm leading-6 text-teal-100">
                  Payment for this product invoice is managed through the related order.
                </p>
              ) : null}
            </div>
          </section>

          {invoice.productOrderId && (
            <Button asChild className="w-full rounded-md" size="sm" variant="outline">
              <Link href={`/user/orders/${invoice.productOrderId}`}>
                View Related Order
                <ExternalLink />
              </Link>
            </Button>
          )}
        </aside>
      </div>

      <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
        <DialogContent className="rounded-xl sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 text-teal-700">
              <ShieldCheck size={20} />
              <DialogTitle className="text-lg font-bold text-slate-900">
                Secure invoice payment
              </DialogTitle>
            </div>
            <DialogDescription className="text-sm leading-6 text-slate-600">
              Complete payment for invoice{" "}
              <strong className="font-mono text-slate-900">
                {invoice.businessId || invoice.id}
              </strong>
              .
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div className="rounded-lg border border-teal-100 bg-teal-50/70 p-4">
              <div className="flex items-center justify-between gap-4 text-sm font-medium text-slate-700">
                <span>Total amount due</span>
                <span className="text-xl font-bold tabular-nums text-teal-950">
                  {formatCurrencyUsd(state.balance)}
                </span>
              </div>
            </div>

            <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600">
              <div className="flex items-center gap-2 font-semibold text-slate-800">
                <CreditCard size={17} className="text-teal-600" />
                Stripe payment processing
              </div>
              <p className="leading-6">
                Your transaction is encrypted. Confirming starts payment processing and creates your official receipt.
              </p>
            </div>
          </div>

          <DialogFooter className="flex gap-2 sm:justify-end">
            <Button
              className="rounded-md"
              disabled={isProcessingPayment}
              onClick={() => setPaymentModalOpen(false)}
              size="sm"
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              className="rounded-md bg-teal-700 text-white hover:bg-teal-800"
              disabled={isProcessingPayment}
              onClick={() => void handleConfirmPayment()}
              size="sm"
              type="button"
            >
              {isProcessingPayment ? (
                <>
                  <Loader2 className="animate-spin" />
                  Processing...
                </>
              ) : (
                `Confirm & Pay ${formatCurrencyUsd(state.balance)}`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {isFetching && !isLoading ? <span className="sr-only">Refreshing invoice</span> : null}
    </div>
  );
}

function InvoiceFact({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CalendarDays;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 px-5 py-4 sm:px-6">
      <Icon aria-hidden="true" className="mt-0.5 shrink-0 text-teal-700" size={17} />
      <div>
        <dt className="text-xs font-semibold uppercase text-slate-500">{label}</dt>
        <dd className="mt-1 text-sm font-semibold leading-5 text-slate-950">{value}</dd>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-teal-100">{label}</dt>
      <dd className="font-semibold tabular-nums text-white">{value}</dd>
    </div>
  );
}

function InvoiceDetailSkeleton() {
  return (
    <div aria-label="Loading invoice details" className="animate-pulse space-y-7" role="status">
      <div className="space-y-3">
        <div className="h-3 w-28 rounded bg-teal-100" />
        <div className="h-9 w-full max-w-xl rounded bg-slate-200" />
        <div className="h-4 w-full max-w-md rounded bg-slate-100" />
      </div>
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="h-[32rem] rounded-[var(--radius-card)] border border-slate-200 bg-white lg:col-span-8" />
        <div className="h-80 rounded-[var(--radius-card)] bg-teal-900 lg:col-span-4" />
      </div>
      <span className="sr-only">Retrieving invoice details...</span>
    </div>
  );
}
