"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  CreditCard,
  FilePlus2,
  FileText,
  Loader2,
  MoreHorizontal,
  Plus,
  Printer,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import {
  AdminPageHeader,
  AdminPageShell,
  AdminStatCard,
  AdminSurface,
} from "@/components/admin/AdminPageShell";
import { AdminSearchInput } from "@/components/admin/AdminSearchInput";
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
import { Textarea } from "@/components/ui/Textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import {
  useGetAdminInvoicesQuery,
  useCreateInvoiceMutation,
  useRecordOfflinePaymentMutation,
  useRecordInvoiceRefundMutation,
  type InvoiceDto,
  type CreateInvoiceRequest,
} from "@/redux/api/billingApi";
import {
  getBillingInvoices,
  getBillingPayments,
  getBillingRefunds,
} from "@/data/mock/shared-billing";
import { formatCurrencyUsd, formatShortDate } from "@/lib/formatters";

type BillingTab = "invoices" | "payments" | "refunds";
type TypeFilter = "ALL" | "PRODUCT" | "SERVICE";

const invoiceStatusOptions = [
  { label: "All Statuses", value: "all" },
  { label: "Sent / Pending", value: "SENT" },
  { label: "Paid", value: "PAID" },
  { label: "Overdue", value: "OVERDUE" },
  { label: "Draft", value: "DRAFT" },
  { label: "Cancelled", value: "CANCELLED" },
  { label: "Refunded", value: "REFUNDED" },
];

export function AdminFinancialsClient() {
  const [tab, setTab] = useState<BillingTab>("invoices");
  const [type, setType] = useState<TypeFilter>("ALL");
  const [query, setQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  // Create Invoice Modal State
  const [createInvoiceOpen, setCreateInvoiceOpen] = useState(false);
  const [customerId, setCustomerId] = useState("");
  const [serviceOrderId, setServiceOrderId] = useState("");
  const [lineItems, setLineItems] = useState<
    Array<{ description: string; quantity: number; unitPriceUsd: number }>
  >([{ description: "Central Vacuum Service Visit", quantity: 1, unitPriceUsd: 150 }]);
  const [taxUsd, setTaxUsd] = useState("12.00");
  const [discountUsd, setDiscountUsd] = useState("0.00");
  const [dueDays, setDueDays] = useState("14");
  const [invoiceNotes, setInvoiceNotes] = useState("");

  // Record Payment Modal State
  const [paymentTarget, setPaymentTarget] = useState<InvoiceDto | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [paymentReference, setPaymentReference] = useState("");

  // Refund Modal State
  const [refundTarget, setRefundTarget] = useState<InvoiceDto | null>(null);
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");

  // RTK Query hooks
  const queryParams = useMemo(() => {
    const p: { search?: string; status?: string } = {};
    if (query.trim()) p.search = query.trim();
    if (selectedStatus !== "all") p.status = selectedStatus;
    return p;
  }, [query, selectedStatus]);

  const { data: liveInvoicesData, isLoading: isLoadingInvoices } =
    useGetAdminInvoicesQuery(queryParams);

  const [createInvoiceMutation, { isLoading: isCreatingInvoice }] =
    useCreateInvoiceMutation();
  const [recordPaymentMutation, { isLoading: isRecordingPayment }] =
    useRecordOfflinePaymentMutation();
  const [recordRefundMutation, { isLoading: isRecordingRefund }] =
    useRecordInvoiceRefundMutation();

  // Fallback mock stores
  const mockInvoices = useMemo(() => getBillingInvoices(), []);
  const mockPayments = useMemo(() => getBillingPayments(), []);
  const mockRefunds = useMemo(() => getBillingRefunds(), []);

  // Combined Invoices
  const invoices: InvoiceDto[] = useMemo(() => {
    if (liveInvoicesData?.items && liveInvoicesData.items.length > 0) {
      return liveInvoicesData.items.filter((inv) => {
        if (type !== "ALL" && (inv.type || "SERVICE").toUpperCase() !== type)
          return false;
        if (
          selectedStatus !== "all" &&
          (inv.status || "").toUpperCase() !== selectedStatus
        )
          return false;
        return true;
      });
    }

    // Fallback to mock
    return mockInvoices
      .filter((inv) => {
        if (type !== "ALL" && inv.type !== type) return false;
        if (selectedStatus !== "all" && inv.status.toUpperCase() !== selectedStatus)
          return false;
        if (!query.trim()) return true;
        const q = query.trim().toLowerCase();
        return (
          inv.id.toLowerCase().includes(q) ||
          inv.customerName.toLowerCase().includes(q) ||
          inv.relatedOrderId.toLowerCase().includes(q) ||
          inv.description.toLowerCase().includes(q)
        );
      })
      .map((inv) => ({
        id: inv.id,
        businessId: inv.id,
        orderId: inv.relatedOrderId,
        serviceOrderId: inv.relatedOrderId,
        customerId: inv.customerId,
        type: inv.type,
        status: inv.status.toUpperCase(),
        subtotalUsd: inv.totals.subtotalUsd,
        taxUsd: inv.totals.taxUsd,
        discountUsd: inv.totals.discountUsd,
        totalUsd: inv.totals.totalUsd,
        lineItems: inv.lineItems.map((li) => ({
          description: li.label,
          quantity: li.quantity || 1,
          unitPriceUsd: li.unitPriceUsd || li.amountUsd,
          totalUsd: li.amountUsd,
        })),
        createdAt: inv.createdAt,
        dueDate: inv.dueDate,
        paidAt: inv.paymentStatus === "paid" ? inv.createdAt : undefined,
        notes: inv.description,
        customer: {
          id: inv.customerId,
          firstName: inv.customerName.split(" ")[0] || "Customer",
          lastName: inv.customerName.split(" ")[1] || "",
          email: "customer@example.com",
        },
      }));
  }, [liveInvoicesData, mockInvoices, type, selectedStatus, query]);

  // Statistics
  const stats = useMemo(() => {
    let totalInvoiced = 0;
    let totalCollected = 0;
    let pendingCount = 0;
    let overdueCount = 0;

    invoices.forEach((inv) => {
      const amt = Number(inv.totalUsd || 0);
      totalInvoiced += amt;
      const s = (inv.status || "").toLowerCase();
      if (s === "paid") {
        totalCollected += amt;
      } else if (s === "overdue") {
        overdueCount += 1;
        pendingCount += 1;
      } else {
        pendingCount += 1;
      }
    });

    return {
      totalInvoiced,
      totalCollected,
      pendingCount,
      overdueCount,
      count: invoices.length,
    };
  }, [invoices]);

  // Create Invoice Calculation
  const subtotalCalculation = useMemo(() => {
    return lineItems.reduce(
      (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPriceUsd) || 0),
      0
    );
  }, [lineItems]);

  const grandTotalCalculation = useMemo(() => {
    const tax = Number(taxUsd) || 0;
    const discount = Number(discountUsd) || 0;
    return Math.max(0, subtotalCalculation + tax - discount);
  }, [subtotalCalculation, taxUsd, discountUsd]);

  function handleAddLineItem() {
    setLineItems((prev) => [
      ...prev,
      { description: "", quantity: 1, unitPriceUsd: 0 },
    ]);
  }

  function handleRemoveLineItem(index: number) {
    setLineItems((prev) => prev.filter((_, idx) => idx !== index));
  }

  function handleLineItemChange(
    index: number,
    field: "description" | "quantity" | "unitPriceUsd",
    value: string | number
  ) {
    setLineItems((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: value,
      };
      return updated;
    });
  }

  async function handleCreateInvoice(e: React.FormEvent) {
    e.preventDefault();
    if (!customerId.trim()) {
      toast.error("Please enter a valid Customer ID.");
      return;
    }
    if (lineItems.length === 0 || !lineItems[0].description.trim()) {
      toast.error("Please add at least one line item with description.");
      return;
    }

    const toastId = toast.loading("Generating custom invoice...");
    try {
      const payload: CreateInvoiceRequest = {
        customerId: customerId.trim(),
        serviceOrderId: serviceOrderId.trim() || undefined,
        lineItems: lineItems.map((li) => ({
          description: li.description.trim(),
          quantity: Number(li.quantity) || 1,
          unitPriceUsd: Number(li.unitPriceUsd) || 0,
        })),
        taxUsd: Number(taxUsd) || 0,
        discountUsd: Number(discountUsd) || 0,
        dueDays: Number(dueDays) || 14,
        notes: invoiceNotes.trim() || undefined,
      };

      const res = await createInvoiceMutation(payload).unwrap();
      toast.success("Invoice created successfully!", {
        id: toastId,
        description: `Invoice ${res.businessId || res.id} is now active.`,
      });
      setCreateInvoiceOpen(false);
      // Reset form
      setCustomerId("");
      setServiceOrderId("");
      setInvoiceNotes("");
      setLineItems([{ description: "", quantity: 1, unitPriceUsd: 0 }]);
    } catch (err: unknown) {
      const errObj = err as { data?: { message?: string }; message?: string };
      const msg =
        errObj?.data?.message || errObj?.message || "Failed to create invoice.";
      toast.error(msg, { id: toastId });
    }
  }

  async function handleRecordPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!paymentTarget) return;
    const amount = Number(paymentAmount);
    if (!amount || amount <= 0) {
      toast.error("Please enter a valid payment amount.");
      return;
    }

    const toastId = toast.loading("Recording offline payment...");
    try {
      await recordPaymentMutation({
        id: paymentTarget.id,
        body: {
          amountUsd: amount,
          methodLabel: paymentMethod,
          transactionReference: paymentReference.trim() || "Offline settlement",
        },
      }).unwrap();

      toast.success("Payment recorded successfully!", {
        id: toastId,
        description: `Recorded ${formatCurrencyUsd(amount)} via ${paymentMethod}.`,
      });
      setPaymentTarget(null);
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
    if (!refundTarget) return;
    const amount = Number(refundAmount);
    if (!amount || amount <= 0) {
      toast.error("Please enter a valid refund amount.");
      return;
    }

    const toastId = toast.loading("Processing refund record...");
    try {
      await recordRefundMutation({
        id: refundTarget.id,
        body: {
          paymentId: refundTarget.payments?.[0]?.id || `pay_${refundTarget.id}`,
          amountUsd: amount,
          reason: refundReason.trim() || "Administrative refund adjustment",
        },
      }).unwrap();

      toast.success("Refund processed successfully!", {
        id: toastId,
        description: `Refund of ${formatCurrencyUsd(amount)} logged.`,
      });
      setRefundTarget(null);
      setRefundAmount("");
      setRefundReason("");
    } catch (err: unknown) {
      const errObj = err as { data?: { message?: string }; message?: string };
      const msg =
        errObj?.data?.message || errObj?.message || "Failed to process refund.";
      toast.error(msg, { id: toastId });
    }
  }

  function handleOpenHtmlInvoice(invoiceId: string) {
    const apiBase =
      process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";
    window.open(`${apiBase}/billing/invoices/${invoiceId}/html`, "_blank");
  }

  return (
    <AdminPageShell>
      <AdminPageHeader
        eyebrow="Financial Operations"
        title="Invoices & Payments"
        description="Comprehensive invoicing ledger, offline settlements, customer balances, and Stripe payment reconciliation."
        action={
          <div className="flex flex-wrap gap-2.5">
            <Button
              type="button"
              onClick={() => setCreateInvoiceOpen(true)}
              className="rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-medium text-xs sm:text-sm h-9 px-3.5 shadow-xs"
            >
              <FilePlus2 size={15} className="mr-1.5" />
              Create Custom Invoice
            </Button>
          </div>
        }
      />

      {/* KPI Statistic Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <AdminStatCard
          label="Total Invoiced"
          value={formatCurrencyUsd(stats.totalInvoiced)}
          tone="default"
        />
        <AdminStatCard
          label="Total Collected"
          value={formatCurrencyUsd(stats.totalCollected)}
          tone="success"
        />
        <AdminStatCard
          label="Outstanding Balance"
          value={formatCurrencyUsd(Math.max(0, stats.totalInvoiced - stats.totalCollected))}
          tone="warning"
        />
        <AdminStatCard
          label="Overdue Invoices"
          value={stats.overdueCount}
          tone={stats.overdueCount > 0 ? "warning" : "default"}
        />
      </div>

      {/* Toolbar & Filters */}
      <AdminSurface className="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setTab("invoices")}
              className={`rounded-lg px-3.5 py-1.5 text-xs sm:text-sm font-semibold transition ${
                tab === "invoices"
                  ? "bg-teal-800 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <FileText size={14} className="inline mr-1.5" />
              Invoices ({invoices.length})
            </button>
            <button
              type="button"
              onClick={() => setTab("payments")}
              className={`rounded-lg px-3.5 py-1.5 text-xs sm:text-sm font-semibold transition ${
                tab === "payments"
                  ? "bg-teal-800 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <CreditCard size={14} className="inline mr-1.5" />
              Payments ({mockPayments.length})
            </button>
            <button
              type="button"
              onClick={() => setTab("refunds")}
              className={`rounded-lg px-3.5 py-1.5 text-xs sm:text-sm font-semibold transition ${
                tab === "refunds"
                  ? "bg-teal-800 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <RotateCcw size={14} className="inline mr-1.5" />
              Refunds ({mockRefunds.length})
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Select value={type} onValueChange={(val) => setType(val as TypeFilter)}>
              <SelectTrigger className="w-36 h-9 rounded-md text-xs">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent className="rounded-md">
                <SelectItem value="ALL">All Categories</SelectItem>
                <SelectItem value="PRODUCT">Product Orders</SelectItem>
                <SelectItem value="SERVICE">Service Visits</SelectItem>
              </SelectContent>
            </Select>

            {tab === "invoices" && (
              <Select
                value={selectedStatus}
                onValueChange={(val) => setSelectedStatus(val)}
              >
                <SelectTrigger className="w-36 h-9 rounded-md text-xs">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="rounded-md">
                  {invoiceStatusOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        <AdminSearchInput
          value={query}
          onChange={setQuery}
          placeholder="Search by invoice ID, customer name, order number, or line item..."
        />
      </AdminSurface>

      {/* Tab 1: Invoices Table */}
      {tab === "invoices" && (
        <AdminSurface className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoadingInvoices ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      <Loader2 className="size-6 animate-spin mx-auto mb-2 text-teal-600" />
                      Loading invoice records...
                    </td>
                  </tr>
                ) : invoices.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      No invoices match your current filter settings.
                    </td>
                  </tr>
                ) : (
                  invoices.map((invoice) => {
                    const normStatus = (invoice.status || "").toLowerCase();
                    const isPaid = normStatus === "paid";
                    const isUnpaid = !isPaid && normStatus !== "cancelled";

                    return (
                      <tr
                        key={invoice.id}
                        className="hover:bg-teal-50/30 transition duration-150"
                      >
                        <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                          <Link
                            href={`/admin/financials/invoices/${invoice.id}`}
                            className="hover:text-teal-700 hover:underline"
                          >
                            {invoice.businessId || invoice.id}
                          </Link>
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-semibold text-slate-900">
                            {invoice.customer?.firstName
                              ? `${invoice.customer.firstName} ${invoice.customer.lastName}`
                              : "Valued Customer"}
                          </p>
                          {invoice.orderId && (
                            <p className="text-[11px] text-slate-400 font-mono">
                              Order: {invoice.orderId}
                            </p>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <TypeBadge type={invoice.type === "PRODUCT" ? "PRODUCT" : "SERVICE"} />
                        </td>
                        <td className="py-3 px-4 text-slate-500">
                          {formatShortDate(invoice.createdAt)}
                          {invoice.dueDate && (
                            <p className="text-[10px] text-slate-400">
                              Due {formatShortDate(invoice.dueDate)}
                            </p>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <StatusBadge status={invoice.status || "SENT"} />
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-slate-900">
                          {formatCurrencyUsd(Number(invoice.totalUsd))}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="size-8 p-0 rounded-md"
                              >
                                <MoreHorizontal size={16} />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 rounded-lg">
                              <DropdownMenuItem asChild>
                                <Link
                                  href={`/admin/financials/invoices/${invoice.id}`}
                                  className="flex items-center gap-2"
                                >
                                  <FileText size={14} /> View Details
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleOpenHtmlInvoice(invoice.id)}
                                className="flex items-center gap-2"
                              >
                                <Printer size={14} /> Print / HTML Invoice
                              </DropdownMenuItem>
                              {isUnpaid && (
                                <DropdownMenuItem
                                  onClick={() => {
                                    setPaymentTarget(invoice);
                                    setPaymentAmount(String(invoice.totalUsd));
                                  }}
                                  className="flex items-center gap-2 text-teal-800 font-medium"
                                >
                                  <CreditCard size={14} /> Record Offline Payment
                                </DropdownMenuItem>
                              )}
                              {isPaid && (
                                <DropdownMenuItem
                                  onClick={() => {
                                    setRefundTarget(invoice);
                                    setRefundAmount(String(invoice.totalUsd));
                                  }}
                                  className="flex items-center gap-2 text-rose-700"
                                >
                                  <RotateCcw size={14} /> Issue Refund
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </AdminSurface>
      )}

      {/* Tab 2: Payments */}
      {tab === "payments" && (
        <AdminSurface className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Receipt #</th>
                  <th className="py-3 px-4">Order / Invoice</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {mockPayments.map((pmt) => (
                  <tr key={pmt.id} className="hover:bg-teal-50/30 transition">
                    <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                      {pmt.id}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">
                      Invoice: {pmt.invoiceId}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900">
                      {pmt.customerName}
                    </td>
                    <td className="py-3 px-4">
                      <span className="rounded bg-slate-100 px-2 py-0.5 font-medium text-slate-700">
                        {pmt.methodLabel}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {formatShortDate(pmt.processedAt)}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">
                      {formatCurrencyUsd(pmt.amountUsd)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AdminSurface>
      )}

      {/* Tab 3: Refunds */}
      {tab === "refunds" && (
        <AdminSurface className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Refund #</th>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Reason</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {mockRefunds.map((rf) => (
                  <tr key={rf.id} className="hover:bg-teal-50/30 transition">
                    <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                      {rf.id}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {rf.invoiceId}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900">
                      {rf.customerName}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{rf.reason}</td>
                    <td className="py-3 px-4">
                      <StatusBadge status={rf.status} />
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-rose-700">
                      -{formatCurrencyUsd(rf.amountUsd)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AdminSurface>
      )}

      {/* MODAL 1: Create Custom Invoice (Phase 12.5) */}
      <Dialog open={createInvoiceOpen} onOpenChange={setCreateInvoiceOpen}>
        <DialogContent className="rounded-xl sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleCreateInvoice} className="space-y-4">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-slate-900">
                Create Custom or Service Invoice
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm text-slate-600">
                Generate an itemized invoice for a customer or dispatched service order.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Customer ID *
                </label>
                <Input
                  required
                  placeholder="e.g. e47b1234-5678-..."
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  className="rounded-md text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Service Order ID (Optional)
                </label>
                <Input
                  placeholder="e.g. so-uuid-777"
                  value={serviceOrderId}
                  onChange={(e) => setServiceOrderId(e.target.value)}
                  className="rounded-md text-xs sm:text-sm"
                />
              </div>
            </div>

            {/* Line Items Builder */}
            <div className="space-y-2 border-t border-slate-100 pt-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Itemized Line Items
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddLineItem}
                  className="rounded-md text-xs h-7 px-2"
                >
                  <Plus size={12} className="mr-1" /> Add Line Item
                </Button>
              </div>

              <div className="space-y-2">
                {lineItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-12 gap-2 items-center bg-slate-50 p-2.5 rounded-lg border border-slate-200"
                  >
                    <div className="col-span-6">
                      <Input
                        required
                        placeholder="Description"
                        value={item.description}
                        onChange={(e) =>
                          handleLineItemChange(idx, "description", e.target.value)
                        }
                        className="h-8 rounded text-xs bg-white"
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        min={1}
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) =>
                          handleLineItemChange(
                            idx,
                            "quantity",
                            Number(e.target.value)
                          )
                        }
                        className="h-8 rounded text-xs bg-white text-center"
                      />
                    </div>
                    <div className="col-span-3">
                      <Input
                        type="number"
                        step="0.01"
                        min={0}
                        placeholder="Price ($)"
                        value={item.unitPriceUsd}
                        onChange={(e) =>
                          handleLineItemChange(
                            idx,
                            "unitPriceUsd",
                            Number(e.target.value)
                          )
                        }
                        className="h-8 rounded text-xs bg-white text-right"
                      />
                    </div>
                    <div className="col-span-1 text-center">
                      {lineItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveLineItem(idx)}
                          className="text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Calculations and Terms */}
            <div className="grid gap-3 sm:grid-cols-3 border-t border-slate-100 pt-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Tax ($)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  value={taxUsd}
                  onChange={(e) => setTaxUsd(e.target.value)}
                  className="rounded-md text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Discount ($)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  value={discountUsd}
                  onChange={(e) => setDiscountUsd(e.target.value)}
                  className="rounded-md text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Payment Due (Days)
                </label>
                <Input
                  type="number"
                  min={1}
                  value={dueDays}
                  onChange={(e) => setDueDays(e.target.value)}
                  className="rounded-md text-xs sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Estimator / Invoice Notes
              </label>
              <Textarea
                rows={2}
                placeholder="Work description, scope notes, warranty disclaimer..."
                value={invoiceNotes}
                onChange={(e) => setInvoiceNotes(e.target.value)}
                className="rounded-md text-xs sm:text-sm"
              />
            </div>

            <div className="rounded-lg bg-teal-50/80 border border-teal-200 p-3 flex justify-between items-center text-sm">
              <span className="font-semibold text-teal-950">Grand Total:</span>
              <span className="text-lg font-bold text-teal-950">
                {formatCurrencyUsd(grandTotalCalculation)}
              </span>
            </div>

            <DialogFooter className="flex gap-2 sm:justify-end pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isCreatingInvoice}
                onClick={() => setCreateInvoiceOpen(false)}
                className="rounded-md"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isCreatingInvoice}
                className="rounded-md bg-teal-700 hover:bg-teal-800 text-white font-medium"
              >
                {isCreatingInvoice ? (
                  <>
                    <Loader2 className="mr-1.5 size-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Create & Issue Invoice"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL 2: Record Offline Payment (Phase 12.7) */}
      <Dialog
        open={Boolean(paymentTarget)}
        onOpenChange={(open) => !open && setPaymentTarget(null)}
      >
        <DialogContent className="rounded-xl sm:max-w-md">
          <form onSubmit={handleRecordPayment} className="space-y-4">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-slate-900">
                Record Offline Payment
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm text-slate-600">
                Log cash, check, or terminal settlement for Invoice{" "}
                <strong className="font-mono text-slate-900">
                  {paymentTarget?.businessId || paymentTarget?.id}
                </strong>
                .
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
                onClick={() => setPaymentTarget(null)}
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

      {/* MODAL 3: Issue Refund (Phase 12.8) */}
      <Dialog
        open={Boolean(refundTarget)}
        onOpenChange={(open) => !open && setRefundTarget(null)}
      >
        <DialogContent className="rounded-xl sm:max-w-md">
          <form onSubmit={handleRecordRefund} className="space-y-4">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-slate-900">
                Record Refund
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm text-slate-600">
                Issue a refund against Invoice{" "}
                <strong className="font-mono text-slate-900">
                  {refundTarget?.businessId || refundTarget?.id}
                </strong>
                .
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
                placeholder="e.g. Scope adjustment, goodwill discount, returned component..."
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
                onClick={() => setRefundTarget(null)}
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
                    Refunding...
                  </>
                ) : (
                  "Confirm & Process Refund"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AdminPageShell>
  );
}
