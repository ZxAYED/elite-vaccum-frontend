"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  CreditCard,
  FileText,
  MoreHorizontal,
  Receipt,
  RotateCcw,
  Search,
} from "lucide-react";

import {
  AdminPageHeader,
  AdminPageShell,
  AdminStatCard,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { Input } from "@/components/ui/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import {
  approveBillingRefund,
  completeBillingRefund,
  createBillingRefundRequest,
  getBillingInvoices,
  getBillingPayments,
  getBillingRefunds,
  markBillingInvoicePaid,
  rejectBillingRefund,
  type BillingInvoiceRecord,
  type BillingInvoiceStatus,
  type BillingPaymentRecord,
  type BillingRefundRecord,
  type BillingRefundStatus,
} from "@/data/mock/shared-billing";
import { formatCurrencyUsd, formatShortDate } from "@/lib/formatters";

type BillingTab = "invoices" | "payments" | "refunds";
type TypeFilter = "ALL" | "PRODUCT" | "SERVICE";
type PaymentFilter =
  | "all"
  | "pending"
  | "authorized"
  | "paid"
  | "failed"
  | "refunded";

const invoiceStatuses: Array<{ label: string; value: BillingInvoiceStatus | "all" }> = [
  { label: "All statuses", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Paid", value: "paid" },
  { label: "Refunded", value: "refunded" },
  { label: "Cancelled", value: "cancelled" },
];

const paymentStatuses: Array<{ label: string; value: PaymentFilter }> = [
  { label: "All statuses", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Authorized", value: "authorized" },
  { label: "Paid", value: "paid" },
  { label: "Failed", value: "failed" },
  { label: "Refunded", value: "refunded" },
];

const refundStatuses: Array<{ label: string; value: BillingRefundStatus | "all" }> = [
  { label: "All statuses", value: "all" },
  { label: "Requested", value: "requested" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
  { label: "Completed", value: "completed" },
];

function matchesType(type: TypeFilter, recordType: "PRODUCT" | "SERVICE") {
  return type === "ALL" || recordType === type;
}

function BillingTabButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white"
          : "rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-teal-50 hover:text-primary"
      }
    >
      {children}
    </button>
  );
}

function TypeFilterButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white"
          : "rounded-xl border border-teal-100 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-teal-200 hover:bg-teal-50 hover:text-primary"
      }
    >
      {label}
    </button>
  );
}

export default function AdminFinancialsPage() {
  const [, setRefreshTick] = useState(0);

  const [tab, setTab] = useState<BillingTab>("invoices");
  const [type, setType] = useState<TypeFilter>("ALL");
  const [query, setQuery] = useState("");
  const [invoiceStatus, setInvoiceStatus] = useState<BillingInvoiceStatus | "all">("all");
  const [paymentStatus, setPaymentStatus] = useState<PaymentFilter>("all");
  const [refundStatus, setRefundStatus] = useState<BillingRefundStatus | "all">("all");
  const [refundTarget, setRefundTarget] = useState<BillingInvoiceRecord | null>(null);
  const [refundReason, setRefundReason] = useState("");
  const [confirmRefund, setConfirmRefund] = useState<BillingRefundRecord | null>(null);
  const [rejectTarget, setRejectTarget] = useState<BillingRefundRecord | null>(null);
  const [rejectNotes, setRejectNotes] = useState("");

  const invoices = getBillingInvoices();
  const payments = getBillingPayments();
  const refunds = getBillingRefunds();

  const stats = useMemo(() => {
    const paidInvoices = invoices.filter((invoice) => invoice.status === "paid");
    const totalPaid = paidInvoices.reduce((sum, invoice) => sum + invoice.totals.totalUsd, 0);

    return {
      invoices: invoices.length,
      payments: payments.length,
      refunds: refunds.length,
      revenue: totalPaid,
    };
  }, [invoices, payments, refunds]);

  const normalizedQuery = query.trim().toLowerCase();

  const filteredInvoices = useMemo(
    () =>
      invoices.filter((invoice) => {
        if (!matchesType(type, invoice.type)) return false;
        if (invoiceStatus !== "all" && invoice.status !== invoiceStatus) return false;
        if (!normalizedQuery) return true;

        return [
          invoice.id,
          invoice.relatedOrderId,
          invoice.customerName,
          invoice.description,
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);
      }),
    [invoiceStatus, invoices, normalizedQuery, type],
  );

  const filteredPayments = useMemo(
    () =>
      payments.filter((payment) => {
        if (!matchesType(type, payment.type)) return false;
        if (paymentStatus !== "all" && payment.status !== paymentStatus) return false;
        if (!normalizedQuery) return true;

        return [
          payment.id,
          payment.orderId,
          payment.invoiceId,
          payment.customerName,
          payment.title,
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);
      }),
    [normalizedQuery, paymentStatus, payments, type],
  );

  const filteredRefunds = useMemo(
    () =>
      refunds.filter((refund) => {
        if (!matchesType(type, refund.type)) return false;
        if (refundStatus !== "all" && refund.status !== refundStatus) return false;
        if (!normalizedQuery) return true;

        return [
          refund.id,
          refund.orderId,
          refund.invoiceId,
          refund.customerName,
          refund.reason,
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);
      }),
    [normalizedQuery, refundStatus, refunds, type],
  );

  function submitRefundRequest() {
    if (!refundTarget || !refundReason.trim()) return;

    createBillingRefundRequest({
      type: refundTarget.type,
      orderId: refundTarget.relatedOrderId,
      invoiceId: refundTarget.id,
      paymentId: refundTarget.paymentId,
      customerId: refundTarget.customerId,
      customerName: refundTarget.customerName,
      amountUsd: refundTarget.totals.totalUsd,
      reason: refundReason.trim(),
    });

    setRefundTarget(null);
    setRefundReason("");
    setTab("refunds");
    setRefreshTick((current) => current + 1);
  }

  function markPaid(invoiceId: string) {
    markBillingInvoicePaid(invoiceId);
    setRefreshTick((current) => current + 1);
  }

  function approveRefund(refundId: string) {
    approveBillingRefund(refundId);
    setRefreshTick((current) => current + 1);
  }

  function completeRefund(refundId: string) {
    completeBillingRefund(refundId);
    setRefreshTick((current) => current + 1);
  }

  function rejectRefundAction() {
    if (!rejectTarget) return;
    rejectBillingRefund(rejectTarget.id, rejectNotes.trim() || undefined);
    setRejectTarget(null);
    setRejectNotes("");
    setRefreshTick((current) => current + 1);
  }

  return (
    <AdminPageShell>
      <AdminPageHeader
        eyebrow="Billing"
        title="Unified Billing"
        description="One workspace for product and service invoices, payment states, and refund approvals tied to shared orders."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard label="Invoices" value={stats.invoices} />
        <AdminStatCard label="Payments" value={stats.payments} tone="soft" />
        <AdminStatCard label="Refund Requests" value={stats.refunds} tone="warning" />
        <AdminStatCard
          label="Paid Revenue"
          value={formatCurrencyUsd(stats.revenue)}
          tone="success"
        />
      </div>

      <AdminSurface className="space-y-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap gap-2">
            <BillingTabButton active={tab === "invoices"} onClick={() => setTab("invoices")}>
              Invoices
            </BillingTabButton>
            <BillingTabButton active={tab === "payments"} onClick={() => setTab("payments")}>
              Payments
            </BillingTabButton>
            <BillingTabButton active={tab === "refunds"} onClick={() => setTab("refunds")}>
              Refunds
            </BillingTabButton>
          </div>

          <div className="flex flex-wrap gap-2">
            {(["ALL", "PRODUCT", "SERVICE"] as const).map((value) => (
              <TypeFilterButton
                key={value}
                active={type === value}
                label={value === "ALL" ? "All" : value === "PRODUCT" ? "Products" : "Services"}
                onClick={() => setType(value)}
              />
            ))}
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-[1fr_12rem] xl:grid-cols-[1fr_12rem_12rem]">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              className="pl-11"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by ID, order, customer, or description..."
            />
          </div>

          {tab === "invoices" ? (
            <Select
              value={invoiceStatus}
              onValueChange={(value) => setInvoiceStatus(value as BillingInvoiceStatus | "all")}
            >
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Invoice status" />
              </SelectTrigger>
              <SelectContent>
                {invoiceStatuses.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}

          {tab === "payments" ? (
            <Select
              value={paymentStatus}
              onValueChange={(value) => setPaymentStatus(value as PaymentFilter)}
            >
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Payment status" />
              </SelectTrigger>
              <SelectContent>
                {paymentStatuses.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}

          {tab === "refunds" ? (
            <Select
              value={refundStatus}
              onValueChange={(value) => setRefundStatus(value as BillingRefundStatus | "all")}
            >
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Refund status" />
              </SelectTrigger>
              <SelectContent>
                {refundStatuses.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}
        </div>
      </AdminSurface>

      {tab === "invoices" ? (
        <InvoiceTable
          invoices={filteredInvoices}
          onMarkPaid={markPaid}
          onRequestRefund={setRefundTarget}
        />
      ) : null}

      {tab === "payments" ? <PaymentTable payments={filteredPayments} /> : null}

      {tab === "refunds" ? (
        <RefundTable
          refunds={filteredRefunds}
          onApprove={approveRefund}
          onComplete={setConfirmRefund}
          onReject={setRejectTarget}
        />
      ) : null}

      <Dialog open={Boolean(refundTarget)} onOpenChange={() => setRefundTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create refund request</DialogTitle>
            <DialogDescription>
              Create a billing refund request tied to the existing invoice and payment record.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
              {refundTarget?.id} · {refundTarget?.description} ·{" "}
              {refundTarget ? formatCurrencyUsd(refundTarget.totals.totalUsd) : ""}
            </div>
            <Input
              value={refundReason}
              onChange={(event) => setRefundReason(event.target.value)}
              placeholder="Refund reason"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRefundTarget(null)}>
              Cancel
            </Button>
            <Button onClick={submitRefundRequest}>Create Refund</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(confirmRefund)} onOpenChange={() => setConfirmRefund(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark refund completed?</DialogTitle>
            <DialogDescription>
              This moves the refund into completed state and updates the linked billing records.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmRefund(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (confirmRefund) completeRefund(confirmRefund.id);
                setConfirmRefund(null);
              }}
            >
              Confirm Completion
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(rejectTarget)} onOpenChange={() => setRejectTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject refund request?</DialogTitle>
            <DialogDescription>
              This keeps the financial record intact and updates only the refund workflow state.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={rejectNotes}
            onChange={(event) => setRejectNotes(event.target.value)}
            placeholder="Optional rejection note"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={rejectRefundAction}>
              Reject Refund
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminPageShell>
  );
}

function InvoiceTable({
  invoices,
  onMarkPaid,
  onRequestRefund,
}: {
  invoices: BillingInvoiceRecord[];
  onMarkPaid: (invoiceId: string) => void;
  onRequestRefund: (invoice: BillingInvoiceRecord) => void;
}) {
  if (!invoices.length) {
    return (
      <AdminSurface className="py-10 text-center">
        <FileText className="mx-auto size-8 text-teal-700" />
        <h2 className="mt-3 text-xl font-semibold text-primary">No invoices found</h2>
        <p className="mt-2 text-sm text-slate-500">
          Adjust the billing filters or payment states.
        </p>
      </AdminSurface>
    );
  }

  return (
    <AdminSurface className="overflow-hidden p-0">
      <div className="hidden grid-cols-[0.9fr_0.8fr_1fr_1.2fr_1.2fr_0.8fr_0.8fr_1.1fr] gap-4 border-b border-teal-100 bg-teal-50/60 px-5 py-4 text-xs font-bold uppercase tracking-[0.2em] text-slate-500 xl:grid">
        <span>Invoice</span>
        <span>Type</span>
        <span>Order</span>
        <span>Customer</span>
        <span>Description</span>
        <span>Amount</span>
        <span>Status</span>
        <span className="text-right">Actions</span>
      </div>

      <div className="divide-y divide-teal-100">
        {invoices.map((invoice) => (
          <article
            key={invoice.id}
            className="grid gap-4 px-5 py-5 xl:grid-cols-[0.9fr_0.8fr_1fr_1.2fr_1.2fr_0.8fr_0.8fr_1.1fr] xl:items-center"
          >
            <div>
              <p className="font-semibold text-primary">{invoice.id}</p>
              <p className="text-sm text-slate-500">{formatShortDate(invoice.createdAt)}</p>
            </div>
            <TypeBadge type={invoice.type} />
            <div>
              <p className="font-medium text-slate-900">{invoice.relatedOrderId}</p>
              <Link
                href={`/admin/orders/${invoice.relatedOrderId}`}
                className="text-sm font-medium text-teal-800 hover:text-primary"
              >
                View Order
              </Link>
            </div>
            <div>
              <p className="font-medium text-slate-900">{invoice.customerName}</p>
              <Link
                href={`/admin/customers/${invoice.customerId}`}
                className="text-sm font-medium text-teal-800 hover:text-primary"
              >
                Customer
              </Link>
            </div>
            <div>
              <p className="font-medium text-slate-900">{invoice.description}</p>
              {invoice.type === "SERVICE" && invoice.quotedAmountUsd !== undefined ? (
                <p className="text-sm text-slate-500">
                  Quote {formatCurrencyUsd(invoice.quotedAmountUsd)} · Final{" "}
                  {formatCurrencyUsd(invoice.finalInvoiceAmountUsd ?? invoice.totals.totalUsd)}
                </p>
              ) : null}
            </div>
            <strong className="text-primary">{formatCurrencyUsd(invoice.totals.totalUsd)}</strong>
            <StatusBadge status={invoice.status} />
            <div className="flex items-center justify-start gap-2 xl:justify-end">
              <Button asChild size="sm" variant="outline">
                <Link href={`/admin/financials/invoices/${invoice.id}`}>
                  View Invoice
                  <ArrowRight size={14} />
                </Link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="icon-sm" variant="outline">
                    <MoreHorizontal size={16} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {invoice.status === "pending" ? (
                    <DropdownMenuItem onClick={() => onMarkPaid(invoice.id)}>
                      <CheckCircle2 size={15} />
                      Mark Paid
                    </DropdownMenuItem>
                  ) : null}
                  {invoice.status === "paid" ? (
                    <DropdownMenuItem onClick={() => onRequestRefund(invoice)}>
                      <RotateCcw size={15} />
                      Refund
                    </DropdownMenuItem>
                  ) : null}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </article>
        ))}
      </div>
    </AdminSurface>
  );
}

function PaymentTable({ payments }: { payments: BillingPaymentRecord[] }) {
  if (!payments.length) {
    return (
      <AdminSurface className="py-10 text-center">
        <CreditCard className="mx-auto size-8 text-teal-700" />
        <h2 className="mt-3 text-xl font-semibold text-primary">No payments found</h2>
        <p className="mt-2 text-sm text-slate-500">
          Adjust the payment filters to inspect another set of transactions.
        </p>
      </AdminSurface>
    );
  }

  return (
    <AdminSurface className="overflow-hidden p-0">
      <div className="hidden grid-cols-[0.9fr_0.8fr_1fr_1fr_1.1fr_0.9fr_1fr_0.8fr_1fr] gap-4 border-b border-teal-100 bg-teal-50/60 px-5 py-4 text-xs font-bold uppercase tracking-[0.2em] text-slate-500 xl:grid">
        <span>Payment</span>
        <span>Type</span>
        <span>Order</span>
        <span>Invoice</span>
        <span>Customer</span>
        <span>Amount</span>
        <span>Method</span>
        <span>Status</span>
        <span className="text-right">Links</span>
      </div>

      <div className="divide-y divide-teal-100">
        {payments.map((payment) => (
          <article
            key={payment.id}
            className="grid gap-4 px-5 py-5 xl:grid-cols-[0.9fr_0.8fr_1fr_1fr_1.1fr_0.9fr_1fr_0.8fr_1fr] xl:items-center"
          >
            <div>
              <p className="font-semibold text-primary">{payment.id}</p>
              <p className="text-sm text-slate-500">{formatShortDate(payment.processedAt)}</p>
            </div>
            <TypeBadge type={payment.type} />
            <Link
              href={`/admin/orders/${payment.orderId}`}
              className="font-medium text-slate-900 hover:text-primary"
            >
              {payment.orderId}
            </Link>
            <Link
              href={`/admin/financials/invoices/${payment.invoiceId}`}
              className="font-medium text-slate-900 hover:text-primary"
            >
              {payment.invoiceId}
            </Link>
            <Link
              href={`/admin/customers/${payment.customerId}`}
              className="font-medium text-slate-900 hover:text-primary"
            >
              {payment.customerName}
            </Link>
            <strong className="text-primary">{formatCurrencyUsd(payment.amountUsd)}</strong>
            <span className="text-sm text-slate-600">{payment.methodLabel}</span>
            <StatusBadge status={payment.status} />
            <div className="flex justify-start gap-2 xl:justify-end">
              <Button asChild size="sm" variant="outline">
                <Link href={`/admin/orders/${payment.orderId}`}>Order</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href={`/admin/financials/invoices/${payment.invoiceId}`}>Invoice</Link>
              </Button>
            </div>
          </article>
        ))}
      </div>
    </AdminSurface>
  );
}

function RefundTable({
  refunds,
  onApprove,
  onComplete,
  onReject,
}: {
  refunds: BillingRefundRecord[];
  onApprove: (refundId: string) => void;
  onComplete: (refund: BillingRefundRecord) => void;
  onReject: (refund: BillingRefundRecord) => void;
}) {
  if (!refunds.length) {
    return (
      <AdminSurface className="py-10 text-center">
        <Receipt className="mx-auto size-8 text-teal-700" />
        <h2 className="mt-3 text-xl font-semibold text-primary">No refunds found</h2>
        <p className="mt-2 text-sm text-slate-500">
          Refund requests will appear here after invoice or customer actions.
        </p>
      </AdminSurface>
    );
  }

  return (
    <AdminSurface className="overflow-hidden p-0">
      <div className="hidden grid-cols-[0.9fr_0.8fr_1fr_1fr_1fr_0.8fr_1.2fr_0.8fr_1fr] gap-4 border-b border-teal-100 bg-teal-50/60 px-5 py-4 text-xs font-bold uppercase tracking-[0.2em] text-slate-500 xl:grid">
        <span>Refund</span>
        <span>Type</span>
        <span>Order</span>
        <span>Invoice / Payment</span>
        <span>Customer</span>
        <span>Amount</span>
        <span>Reason</span>
        <span>Status</span>
        <span className="text-right">Actions</span>
      </div>

      <div className="divide-y divide-teal-100">
        {refunds.map((refund) => (
          <article
            key={refund.id}
            className="grid gap-4 px-5 py-5 xl:grid-cols-[0.9fr_0.8fr_1fr_1fr_1fr_0.8fr_1.2fr_0.8fr_1fr] xl:items-center"
          >
            <div>
              <p className="font-semibold text-primary">{refund.id}</p>
              <p className="text-sm text-slate-500">{formatShortDate(refund.requestedAt)}</p>
            </div>
            <TypeBadge type={refund.type} />
            <Link
              href={`/admin/orders/${refund.orderId}`}
              className="font-medium text-slate-900 hover:text-primary"
            >
              {refund.orderId}
            </Link>
            <div className="text-sm text-slate-600">
              <p>{refund.invoiceId}</p>
              <p>{refund.paymentId ?? "No payment ref"}</p>
            </div>
            <Link
              href={`/admin/customers/${refund.customerId}`}
              className="font-medium text-slate-900 hover:text-primary"
            >
              {refund.customerName}
            </Link>
            <strong className="text-primary">{formatCurrencyUsd(refund.amountUsd)}</strong>
            <span className="text-sm text-slate-600">{refund.reason}</span>
            <StatusBadge status={refund.status} />
            <div className="flex flex-wrap justify-start gap-2 xl:justify-end">
              {refund.status === "requested" ? (
                <>
                  <Button size="sm" onClick={() => onApprove(refund.id)}>
                    Approve
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => onReject(refund)}>
                    Reject
                  </Button>
                </>
              ) : null}
              {refund.status === "approved" ? (
                <Button size="sm" onClick={() => onComplete(refund)}>
                  Mark Completed
                </Button>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </AdminSurface>
  );
}
