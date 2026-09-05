"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  FileText,
  Loader2,
  Package,
  Printer,
  RotateCcw,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";

import {
  AdminPageHeader,
  AdminPageShell,
  AdminSurface,
} from "@/components/admin/AdminPageShell";
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
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import {
  useGetInvoiceByIdQuery,
  useRecordOfflinePaymentMutation,
  useRecordInvoiceRefundMutation,
} from "@/redux/api/billingApi";
import { getBillingInvoiceById } from "@/data/mock/shared-billing";
import { formatCurrencyUsd, formatLongDate } from "@/lib/formatters";

export function AdminInvoiceDetailClient({ invoiceId }: { invoiceId: string }) {
  const { data: apiInvoice, isLoading } = useGetInvoiceByIdQuery(invoiceId);
  const mockInvoice = useMemo(() => getBillingInvoiceById(invoiceId), [invoiceId]);

  // Payment Modal State
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [paymentReference, setPaymentReference] = useState("");

  // Refund Modal State
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");

  const [recordPaymentMutation, { isLoading: isRecordingPayment }] =
    useRecordOfflinePaymentMutation();
  const [recordRefundMutation, { isLoading: isRecordingRefund }] =
    useRecordInvoiceRefundMutation();

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
    const apiBase =
      process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";
    window.open(`${apiBase}/billing/invoices/${invoiceId}/html`, "_blank");
  }

  async function handleRecordPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!invoice) return;
    const amount = Number(paymentAmount);
    if (!amount || amount <= 0) {
      toast.error("Please enter a valid payment amount.");
      return;
    }

    const toastId = toast.loading("Recording offline payment...");
    try {
      await recordPaymentMutation({
        id: invoice.id,
        body: {
          amountUsd: amount,
          methodLabel: paymentMethod,
          transactionReference: paymentReference.trim() || "Offline settlement",
        },
      }).unwrap();

      toast.success("Payment recorded successfully!", {
        id: toastId,
        description: `Logged ${formatCurrencyUsd(amount)} payment via ${paymentMethod}.`,
      });
      setPaymentModalOpen(false);
      setPaymentAmount("");
      setPaymentReference("");
    } catch (err: unknown) {
      const errObj = err as { data?: { message?: string }; message?: string };
      const msg =
        errObj?.data?.message || errObj?.message || "Failed to record payment.";
      toast.error(msg, { id: toastId });
    }
  }

  async function handleRecordRefund(e: React.FormEvent) {
    e.preventDefault();
    if (!invoice) return;
    const amount = Number(refundAmount);
    if (!amount || amount <= 0) {
      toast.error("Please enter a valid refund amount.");
      return;
    }

    const toastId = toast.loading("Recording refund...");
    try {
      await recordRefundMutation({
        id: invoice.id,
        body: {
          paymentId: invoice.payments?.[0]?.id || `pay_${invoice.id}`,
          amountUsd: amount,
          reason: refundReason.trim() || "Administrative refund adjustment",
        },
      }).unwrap();

      toast.success("Refund processed successfully!", {
        id: toastId,
        description: `Refund of ${formatCurrencyUsd(amount)} logged against invoice.`,
      });
      setRefundModalOpen(false);
      setRefundAmount("");
      setRefundReason("");
    } catch (err: unknown) {
      const errObj = err as { data?: { message?: string }; message?: string };
      const msg =
        errObj?.data?.message || errObj?.message || "Failed to process refund.";
      toast.error(msg, { id: toastId });
    }
  }

  if (isLoading) {
    return (
      <AdminPageShell>
        <div className="flex flex-col items-center justify-center py-24 text-slate-500">
          <Loader2 className="size-8 animate-spin text-teal-600 mb-3" />
          <p className="text-sm font-medium">Loading invoice record...</p>
        </div>
      </AdminPageShell>
    );
  }

  if (!invoice) {
    return (
      <AdminPageShell>
        <AdminSurface className="text-center py-16">
          <FileText size={48} className="mx-auto text-slate-400 mb-4" />
          <h2 className="text-lg font-bold text-slate-900">Invoice Not Found</h2>
          <p className="mt-1 text-sm text-slate-500 max-w-md mx-auto">
            No invoice was found with ID &ldquo;{invoiceId}&rdquo;.
          </p>
          <Button asChild variant="outline" size="sm" className="mt-6 rounded-md">
            <Link href="/admin/financials">
              <ArrowLeft size={14} className="mr-1.5" />
              Back to Financials
            </Link>
          </Button>
        </AdminSurface>
      </AdminPageShell>
    );
  }

  const normStatus = (invoice.status || "").toLowerCase();
  const isPaid = normStatus === "paid";
  const isUnpaid = !isPaid && normStatus !== "cancelled";

  const totalAmount = Number(invoice.totalUsd || 0);
  const subtotalAmount = Number(invoice.subtotalUsd || totalAmount);
  const taxAmount = Number(invoice.taxUsd || 0);
  const discountAmount = Number(invoice.discountUsd || 0);

  return (
    <AdminPageShell>
      <AdminPageHeader
        eyebrow="Invoice Management"
        title={`Invoice #${invoice.businessId || invoice.id}`}
        description={
          invoice.orderId
            ? `Connected to order ${invoice.orderId}.`
            : "General ledger billing record."
        }
        action={
          <div className="flex flex-wrap gap-2.5">
            <Button asChild variant="outline" size="sm" className="rounded-md">
              <Link href="/admin/financials">
                <ArrowLeft size={14} className="mr-1.5" />
                Back to Financials
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
                onClick={() => {
                  setPaymentAmount(String(totalAmount));
                  setPaymentModalOpen(true);
                }}
                className="rounded-md bg-teal-700 hover:bg-teal-800 text-white font-medium"
              >
                <CreditCard size={14} className="mr-1.5" />
                Record Payment
              </Button>
            )}
            {isPaid && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setRefundAmount(String(totalAmount));
                  setRefundModalOpen(true);
                }}
                className="rounded-md text-rose-700 border-rose-200 hover:bg-rose-50 font-medium"
              >
                <RotateCcw size={14} className="mr-1.5" />
                Issue Refund
              </Button>
            )}
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-2.5">
        <TypeBadge type={invoice.type === "PRODUCT" ? "PRODUCT" : "SERVICE"} />
        <StatusBadge status={invoice.status || "SENT"} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <AdminSurface className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Created
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {formatLongDate(invoice.createdAt)}
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Customer
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {invoice.customer?.firstName
                  ? `${invoice.customer.firstName} ${invoice.customer.lastName}`
                  : "Customer"}
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Payment Status
              </p>
              <p className="mt-1 text-sm font-semibold capitalize text-slate-900">
                {invoice.status.toLowerCase()}
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
                    key={idx}
                    className="flex flex-col gap-2 rounded-lg border border-slate-200 p-3.5 sm:flex-row sm:items-center sm:justify-between hover:bg-slate-50/50 transition"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{lineItem.description}</p>
                      {lineItem.quantity ? (
                        <p className="mt-1 text-[11px] font-medium text-slate-500">
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
                <p className="text-xs text-slate-500 py-3">No line items attached.</p>
              )}
            </div>
          </div>

          {invoice.notes && (
            <div className="rounded-lg bg-slate-50 p-4 border border-slate-200 text-xs text-slate-600">
              <span className="font-semibold text-slate-800">Admin Notes:</span> {invoice.notes}
            </div>
          )}
        </AdminSurface>

        <aside className="space-y-6">
          <section className="rounded-xl border border-teal-800 bg-teal-900 p-5 sm:p-6 text-white shadow-xs">
            <h2 className="text-base font-bold text-white">Financial Summary</h2>
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
                <CheckCircle2 size={14} /> Fully Settled
              </div>
            ) : (
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  setPaymentAmount(String(totalAmount));
                  setPaymentModalOpen(true);
                }}
                className="mt-4 w-full bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs shadow-xs"
              >
                <CreditCard size={14} className="mr-1.5" />
                Record Payment
              </Button>
            )}
          </section>

          {invoice.orderId && (
            <Button asChild className="w-full rounded-md font-medium" variant="outline" size="sm">
              <Link href={`/admin/orders/${invoice.orderId}`}>
                View Linked Order
              </Link>
            </Button>
          )}
        </aside>
      </div>

      {/* MODAL 1: Record Offline Payment */}
      <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
        <DialogContent className="rounded-xl sm:max-w-md">
          <form onSubmit={handleRecordPayment} className="space-y-4">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-slate-900">
                Record Offline Payment
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm text-slate-600">
                Log cash, check, or POS terminal settlement for this invoice.
              </DialogDescription>
            </DialogHeader>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Settlement Amount ($) *
              </label>
              <Input
                type="number"
                step="0.01"
                min={0.01}
                required
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                className="rounded-md text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Payment Method *
              </label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className="rounded-md text-xs sm:text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-md">
                  <SelectItem value="Cash">Cash (Received on Site)</SelectItem>
                  <SelectItem value="Check">Check / Money Order</SelectItem>
                  <SelectItem value="Bank Transfer">Wire / Bank Transfer</SelectItem>
                  <SelectItem value="POS Terminal">Card Swiped via Mobile Terminal</SelectItem>
                  <SelectItem value="Other">Other Offline Method</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Transaction Reference / Receipt Note
              </label>
              <Input
                placeholder="e.g. Check #4029 or Cash collected by Tech"
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                className="rounded-md text-xs sm:text-sm"
              />
            </div>

            <DialogFooter className="flex gap-2 sm:justify-end pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isRecordingPayment}
                onClick={() => setPaymentModalOpen(false)}
                className="rounded-md"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isRecordingPayment}
                className="rounded-md bg-teal-700 hover:bg-teal-800 text-white font-medium"
              >
                {isRecordingPayment ? (
                  <>
                    <Loader2 className="mr-1.5 size-4 animate-spin" />
                    Recording...
                  </>
                ) : (
                  "Confirm Offline Payment"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL 2: Issue Refund */}
      <Dialog open={refundModalOpen} onOpenChange={setRefundModalOpen}>
        <DialogContent className="rounded-xl sm:max-w-md">
          <form onSubmit={handleRecordRefund} className="space-y-4">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-slate-900">
                Record Refund
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm text-slate-600">
                Log a customer refund against this invoice.
              </DialogDescription>
            </DialogHeader>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Refund Amount ($) *
              </label>
              <Input
                type="number"
                step="0.01"
                min={0.01}
                required
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                className="rounded-md text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Reason for Refund *
              </label>
              <Textarea
                required
                rows={3}
                placeholder="e.g. Returned part, discount adjustment..."
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                className="rounded-md text-xs sm:text-sm"
              />
            </div>

            <DialogFooter className="flex gap-2 sm:justify-end pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isRecordingRefund}
                onClick={() => setRefundModalOpen(false)}
                className="rounded-md"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                variant="destructive"
                disabled={isRecordingRefund}
                className="rounded-md"
              >
                {isRecordingRefund ? (
                  <>
                    <Loader2 className="mr-1.5 size-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Confirm Refund"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AdminPageShell>
  );
}
