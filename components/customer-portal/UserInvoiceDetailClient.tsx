"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  FileText,
  Loader2,
  Package,
  Printer,
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
import {
  useGetInvoiceByIdQuery,
  useCreateStripePaymentIntentMutation,
  useConfirmStripePaymentMutation,
} from "@/redux/api/billingApi";
import { getBillingInvoiceById } from "@/data/mock/shared-billing";
import { formatCurrencyUsd, formatLongDate } from "@/lib/formatters";

export function UserInvoiceDetailClient({ invoiceId }: { invoiceId: string }) {
  const { data: apiInvoice, isLoading } = useGetInvoiceByIdQuery(invoiceId);
  const mockInvoice = useMemo(() => getBillingInvoiceById(invoiceId), [invoiceId]);

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const [createStripePaymentIntent] = useCreateStripePaymentIntentMutation();
  const [confirmStripePayment] = useConfirmStripePaymentMutation();

  const invoice = useMemo(() => {
    if (apiInvoice) return apiInvoice;
    if (mockInvoice) {
      return {
        id: mockInvoice.id,
        businessId: mockInvoice.id,
        orderId: mockInvoice.relatedOrderId,
        serviceOrderId: mockInvoice.relatedOrderId,
        customerId: mockInvoice.customerId,
        type: mockInvoice.type,
        status: mockInvoice.status.toUpperCase(),
        subtotalUsd: mockInvoice.totals.subtotalUsd,
        taxUsd: mockInvoice.totals.taxUsd,
        discountUsd: mockInvoice.totals.discountUsd,
        totalUsd: mockInvoice.totals.totalUsd,
        lineItems: mockInvoice.lineItems.map((li) => ({
          description: li.label,
          quantity: li.quantity || 1,
          unitPriceUsd: li.unitPriceUsd || li.amountUsd,
          totalUsd: li.amountUsd,
        })),
        createdAt: mockInvoice.createdAt,
        dueDate: mockInvoice.dueDate,
        paidAt: mockInvoice.paymentStatus === "paid" ? mockInvoice.createdAt : undefined,
        notes: mockInvoice.description,
        customer: {
          id: mockInvoice.customerId,
          firstName: mockInvoice.customerName.split(" ")[0] || "Valued",
          lastName: mockInvoice.customerName.split(" ")[1] || "Customer",
          email: "customer@example.com",
        },
      };
    }
    return null;
  }, [apiInvoice, mockInvoice]);

  function handlePrintHtml() {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";
    window.open(`${apiBase}/billing/invoices/${invoiceId}/html`, "_blank");
  }

  async function handleConfirmPayment() {
    if (!invoice) return;
    setIsProcessingPayment(true);
    const toastId = toast.loading("Processing payment gateway confirmation...");

    try {
      const intentRes = await createStripePaymentIntent(invoice.id).unwrap();
      const intentId =
        intentRes.clientSecret?.split("_secret_")[0] ||
        `pi_sim_${Date.now()}`;

      const confirmRes = await confirmStripePayment({
        invoiceId: invoice.id,
        paymentIntentId: intentId,
      }).unwrap();

      toast.success(confirmRes.message || "Payment completed successfully!", {
        id: toastId,
        description: `Invoice ${invoice.businessId || invoice.id} is now PAID.`,
      });
      setPaymentModalOpen(false);
    } catch (err: unknown) {
      const errObj = err as { data?: { message?: string }; message?: string };
      const msg =
        errObj?.data?.message ||
        errObj?.message ||
        "Payment could not be processed. Please try again.";
      toast.error(msg, { id: toastId, duration: 6000 });
    } finally {
      setIsProcessingPayment(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500">
        <Loader2 className="size-8 animate-spin text-teal-600 mb-3" />
        <p className="text-sm font-medium">Retrieving invoice details...</p>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-xs">
        <FileText size={48} className="mx-auto text-slate-400 mb-4" />
        <h2 className="text-lg font-bold text-slate-900">Invoice Not Found</h2>
        <p className="mt-1 text-sm text-slate-500 max-w-md mx-auto">
          We couldn&apos;t find an invoice matching ID &ldquo;{invoiceId}&rdquo;. It may have been archived or removed.
        </p>
        <Button asChild variant="outline" size="sm" className="mt-6 rounded-md">
          <Link href="/user/billing">
            <ArrowLeft size={14} className="mr-1.5" />
            Back to Billing
          </Link>
        </Button>
      </div>
    );
  }

  const normStatus = (invoice.status || "").toLowerCase();
  const isPaid = normStatus === "paid";
  const isUnpaid =
    normStatus === "sent" ||
    normStatus === "overdue" ||
    normStatus === "pending" ||
    normStatus === "draft";

  const totalAmount = Number(invoice.totalUsd || 0);
  const subtotalAmount = Number(invoice.subtotalUsd || totalAmount);
  const taxAmount = Number(invoice.taxUsd || 0);
  const discountAmount = Number(invoice.discountUsd || 0);

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="outline" size="sm" className="rounded-md">
              <Link href="/user/billing">
                <ArrowLeft size={14} className="mr-1.5" />
                All Invoices
              </Link>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePrintHtml}
              className="rounded-md font-medium"
            >
              <Printer size={14} className="mr-1.5" />
              Print / HTML
            </Button>
            {isUnpaid && (
              <Button
                type="button"
                size="sm"
                onClick={() => setPaymentModalOpen(true)}
                className="rounded-md bg-teal-700 hover:bg-teal-800 text-white font-medium shadow-xs"
              >
                <CreditCard size={14} className="mr-1.5" />
                Pay Invoice ({formatCurrencyUsd(totalAmount)})
              </Button>
            )}
          </div>
        }
        description={
          invoice.orderId
            ? `Connected to order ${invoice.orderId}.`
            : "Itemized billing document."
        }
        eyebrow="Invoice Details"
        title={`Invoice #${invoice.businessId || invoice.id}`}
      />

      <div className="grid gap-6 lg:grid-cols-12">
        <section className="rounded-lg border border-slate-200 bg-white p-5 sm:p-6 shadow-xs lg:col-span-8 space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <TypeBadge type={invoice.type === "PRODUCT" ? "PRODUCT" : "SERVICE"} />
            <StatusBadge status={invoice.status || "SENT"} />
          </div>

          <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
            <div className="rounded-md bg-slate-50 border border-slate-200 p-3 text-xs">
              <p className="font-semibold uppercase tracking-wider text-slate-400 text-[10px]">
                Invoice Date
              </p>
              <p className="mt-1 font-semibold text-slate-900">
                {formatLongDate(invoice.createdAt)}
              </p>
            </div>
            <div className="rounded-md bg-slate-50 border border-slate-200 p-3 text-xs">
              <p className="font-semibold uppercase tracking-wider text-slate-400 text-[10px]">
                Status
              </p>
              <p className="mt-1 font-semibold text-slate-900 capitalize">
                {invoice.status.toLowerCase()}
              </p>
            </div>
            <div className="rounded-md bg-slate-50 border border-slate-200 p-3 text-xs">
              <p className="font-semibold uppercase tracking-wider text-slate-400 text-[10px]">
                Due Date
              </p>
              <p className="mt-1 font-semibold text-slate-900">
                {invoice.dueDate ? formatLongDate(invoice.dueDate) : "Upon Receipt"}
              </p>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              {(invoice.type || "").toUpperCase() === "PRODUCT" ? (
                <Package className="text-teal-700" size={18} />
              ) : (
                <Wrench className="text-teal-700" size={18} />
              )}
              <h2 className="text-base font-bold text-slate-900">Itemized Breakdown</h2>
            </div>
            <div className="mt-4 space-y-2.5">
              {invoice.lineItems && invoice.lineItems.length > 0 ? (
                invoice.lineItems.map((lineItem, idx) => (
                  <div
                    className="flex flex-col gap-2 rounded-md border border-slate-200 p-3.5 sm:flex-row sm:items-center sm:justify-between hover:bg-slate-50/50 transition"
                    key={idx}
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{lineItem.description}</p>
                      {lineItem.quantity ? (
                        <p className="mt-1 text-[11px] font-medium text-slate-600">
                          Qty {lineItem.quantity}
                          {lineItem.unitPriceUsd
                            ? ` · ${formatCurrencyUsd(lineItem.unitPriceUsd)} each`
                            : null}
                        </p>
                      ) : null}
                    </div>
                    <p className="text-base font-bold text-slate-900">
                      {formatCurrencyUsd(
                        Number(lineItem.totalUsd ?? lineItem.unitPriceUsd * lineItem.quantity)
                      )}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 py-3">No line items recorded on this invoice.</p>
              )}
            </div>
          </div>

          {invoice.notes && (
            <div className="rounded-md bg-slate-50 p-4 border border-slate-200 text-xs text-slate-600">
              <span className="font-semibold text-slate-800">Invoice Notes:</span> {invoice.notes}
            </div>
          )}
        </section>

        <aside className="space-y-6 lg:col-span-4">
          <section className="rounded-lg border border-teal-800 bg-teal-900 p-5 sm:p-6 text-white shadow-xs">
            <h2 className="text-base font-bold text-white">Invoice Summary</h2>
            <div className="mt-4 space-y-2.5 text-xs sm:text-sm text-teal-100/80">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-white">{formatCurrencyUsd(subtotalAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax</span>
                <span className="font-semibold text-white">{formatCurrencyUsd(taxAmount)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-300 font-medium">
                  <span>Discount</span>
                  <span>-{formatCurrencyUsd(discountAmount)}</span>
                </div>
              )}
            </div>
            <div className="mt-5 flex justify-between border-t border-white/15 pt-4 text-lg font-bold text-white">
              <span>Total Amount</span>
              <span className="text-teal-200">{formatCurrencyUsd(totalAmount)}</span>
            </div>

            {isPaid ? (
              <div className="mt-4 rounded-md bg-emerald-500/20 border border-emerald-400/30 p-2.5 text-center text-xs font-semibold text-emerald-200 flex items-center justify-center gap-1.5">
                <CheckCircle2 size={14} /> Paid &amp; Settled
              </div>
            ) : (
              <Button
                type="button"
                size="sm"
                onClick={() => setPaymentModalOpen(true)}
                className="mt-4 w-full bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs shadow-xs"
              >
                <CreditCard size={14} className="mr-1.5" />
                Pay Now
              </Button>
            )}
          </section>

          {invoice.orderId && (
            <Button asChild className="w-full rounded-md font-medium" variant="outline" size="sm">
              <Link href={`/user/orders/${invoice.orderId}`}>
                View Related Order
                <ExternalLink size={13} className="ml-1.5" />
              </Link>
            </Button>
          )}
        </aside>
      </div>

      {/* Online Stripe Payment Dialog */}
      <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
        <DialogContent className="rounded-xl sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 text-teal-700">
              <ShieldCheck size={20} />
              <DialogTitle className="text-lg font-bold text-slate-900">
                Secure Invoice Payment
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs sm:text-sm text-slate-600">
              Authorize card payment for Invoice{" "}
              <strong className="font-mono text-slate-900">
                {invoice.businessId || invoice.id}
              </strong>
              .
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div className="rounded-lg bg-teal-50/70 border border-teal-100 p-4">
              <div className="flex justify-between items-center text-sm font-medium text-slate-700">
                <span>Total Due:</span>
                <span className="text-lg font-bold text-teal-950">
                  {formatCurrencyUsd(totalAmount)}
                </span>
              </div>
            </div>

            <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-3.5 text-xs text-slate-600">
              <div className="flex items-center gap-2 font-medium text-slate-800">
                <CreditCard size={16} className="text-teal-600" />
                Stripe Payment Processing
              </div>
              <p className="leading-relaxed">
                Securely encrypted via SSL. Confirming this step will process the card charge and immediately update your invoice status to PAID.
              </p>
            </div>
          </div>

          <DialogFooter className="flex gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isProcessingPayment}
              onClick={() => setPaymentModalOpen(false)}
              className="rounded-md"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={isProcessingPayment}
              onClick={handleConfirmPayment}
              className="rounded-md bg-teal-700 hover:bg-teal-800 text-white font-medium"
            >
              {isProcessingPayment ? (
                <>
                  <Loader2 className="mr-1.5 size-4 animate-spin" />
                  Processing...
                </>
              ) : (
                `Confirm & Pay ${formatCurrencyUsd(totalAmount)}`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
