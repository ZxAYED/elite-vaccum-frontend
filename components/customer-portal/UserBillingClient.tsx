"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  CreditCard,
  FileText,
  Loader2,
  Printer,
  Search,
  ShieldCheck,
  X,
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
import { Input } from "@/components/ui/Input";
import {
  useGetMyInvoicesQuery,
  useCreateStripePaymentIntentMutation,
  useConfirmStripePaymentMutation,
  type InvoiceDto,
} from "@/redux/api/billingApi";
import { getBillingRecordsForCustomer } from "@/data/mock/shared-billing";
import { mockCurrentCustomer } from "@/data/mock/user";
import { formatCurrencyUsd, formatLongDate } from "@/lib/formatters";

const typeFilters = ["ALL", "PRODUCT", "SERVICE"] as const;

export function UserBillingClient({
  initialTab = "invoices",
  initialType = "ALL",
  initialQuery = "",
}: {
  initialTab?: "invoices" | "payments";
  initialType?: string;
  initialQuery?: string;
}) {
  const [tab, setTab] = useState<"invoices" | "payments">(initialTab);
  const [selectedType, setSelectedType] = useState<string>(
    initialType === "PRODUCT" || initialType === "SERVICE" ? initialType : "ALL"
  );
  const [searchQuery, setSearchQuery] = useState(initialQuery);

  // Stripe Payment Modal State
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] =
    useState<InvoiceDto | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const [createStripePaymentIntent] = useCreateStripePaymentIntentMutation();
  const [confirmStripePayment] = useConfirmStripePaymentMutation();

  const queryParams = useMemo(() => {
    const p: { search?: string } = {};
    if (searchQuery.trim()) {
      p.search = searchQuery.trim();
    }
    return p;
  }, [searchQuery]);

  const { data: liveInvoicesResponse, isLoading: isLoadingInvoices } =
    useGetMyInvoicesQuery(queryParams);

  // Mock records for seamless offline/dev fallback
  const mockRecords = useMemo(
    () => getBillingRecordsForCustomer(mockCurrentCustomer.id),
    []
  );

  // Normalize invoices
  const invoices = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (liveInvoicesResponse?.items && liveInvoicesResponse.items.length > 0) {
      return liveInvoicesResponse.items.filter((inv) => {
        const typeMatch =
          selectedType === "ALL" ||
          (inv.type || "SERVICE").toUpperCase() === selectedType;
        const searchMatch =
          !query ||
          inv.id.toLowerCase().includes(query) ||
          inv.businessId?.toLowerCase().includes(query) ||
          inv.notes?.toLowerCase().includes(query) ||
          inv.lineItems?.some((li) =>
            li.description.toLowerCase().includes(query)
          );
        return typeMatch && searchMatch;
      });
    }

    // Fallback to mock data mapped to InvoiceDto format
    return mockRecords.invoices
      .filter((invoice) => {
        const typeMatch =
          selectedType === "ALL" || invoice.type === selectedType;
        const searchMatch =
          !query ||
          invoice.id.toLowerCase().includes(query) ||
          invoice.description.toLowerCase().includes(query) ||
          invoice.relatedOrderId.toLowerCase().includes(query);
        return typeMatch && searchMatch;
      })
      .map((inv) => ({
        id: inv.id,
        businessId: inv.id,
        orderId: inv.relatedOrderId,
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
      }));
  }, [liveInvoicesResponse, mockRecords, selectedType, searchQuery]);

  // Normalized payments
  const payments = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return mockRecords.payments.filter((payment) => {
      const typeMatch = selectedType === "ALL" || payment.type === selectedType;
      const searchMatch =
        !query ||
        payment.id.toLowerCase().includes(query) ||
        payment.title.toLowerCase().includes(query) ||
        payment.orderId.toLowerCase().includes(query) ||
        payment.invoiceId.toLowerCase().includes(query);
      return typeMatch && searchMatch;
    });
  }, [mockRecords, selectedType, searchQuery]);

  async function handlePayOnline(invoice: InvoiceDto) {
    setSelectedInvoiceForPayment(invoice);
  }

  async function handleConfirmPayment() {
    if (!selectedInvoiceForPayment) return;
    setIsProcessingPayment(true);
    const toastId = toast.loading("Connecting to secure payment gateway...");

    try {
      // Step 1: Create Stripe payment intent
      const intentRes = await createStripePaymentIntent(
        selectedInvoiceForPayment.id
      ).unwrap();

      const intentId =
        intentRes.clientSecret?.split("_secret_")[0] ||
        `pi_simulated_${Date.now()}`;

      // Step 2: Confirm payment on backend
      const confirmRes = await confirmStripePayment({
        invoiceId: selectedInvoiceForPayment.id,
        paymentIntentId: intentId,
      }).unwrap();

      toast.success(confirmRes.message || "Payment completed successfully!", {
        id: toastId,
        description: `Invoice ${selectedInvoiceForPayment.businessId || selectedInvoiceForPayment.id} has been marked PAID.`,
      });

      setSelectedInvoiceForPayment(null);
    } catch (err: unknown) {
      const errObj = err as { data?: { message?: string }; message?: string };
      const msg =
        errObj?.data?.message ||
        errObj?.message ||
        "Payment could not be completed. Please try again.";
      toast.error(msg, { id: toastId, duration: 6000 });
    } finally {
      setIsProcessingPayment(false);
    }
  }

  function handleOpenHtmlInvoice(invoiceId: string) {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";
    window.open(`${apiBase}/billing/invoices/${invoiceId}/html`, "_blank");
  }

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        description="Invoices, itemized breakdown statements, and payment receipts for all your orders and service visits."
        eyebrow="Financial Center"
        title="Billing & Invoices"
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex gap-1.5">
            <Button
              type="button"
              size="sm"
              variant={tab === "invoices" ? "default" : "outline"}
              onClick={() => setTab("invoices")}
              className="rounded-md text-xs font-medium"
            >
              <FileText size={14} className="mr-1.5" />
              Invoices ({invoices.length})
            </Button>
            <Button
              type="button"
              size="sm"
              variant={tab === "payments" ? "default" : "outline"}
              onClick={() => setTab("payments")}
              className="rounded-md text-xs font-medium"
            >
              <CreditCard size={14} className="mr-1.5" />
              Payment Receipts ({payments.length})
            </Button>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {typeFilters.map((filter) => (
              <Button
                type="button"
                key={filter}
                size="sm"
                variant={selectedType === filter ? "soft" : "outline"}
                onClick={() => setSelectedType(filter)}
                className="rounded-md text-xs font-medium"
              >
                {filter === "ALL" ? "All Types" : filter}
              </Button>
            ))}
          </div>
        </div>

        <div className="relative flex items-center">
          <Search
            size={15}
            className="pointer-events-none absolute left-3.5 text-slate-400"
          />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              tab === "invoices"
                ? "Search invoices by ID, item description, or order..."
                : "Search receipts by ID, order, or invoice..."
            }
            className="h-10 rounded-md border-slate-200 bg-slate-50/50 pl-10 pr-10 text-xs sm:text-sm focus-visible:bg-white"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              aria-label="Clear search"
              className="absolute right-3 flex size-5 items-center justify-center rounded-md text-slate-400 hover:bg-slate-200 hover:text-slate-600"
            >
              <X size={13} />
            </button>
          ) : null}
        </div>
      </div>

      {isLoadingInvoices && (
        <div className="flex items-center justify-center py-12 text-slate-500">
          <Loader2 className="size-6 animate-spin mr-2.5 text-teal-600" />
          <span className="text-sm font-medium">Loading invoices...</span>
        </div>
      )}

      {/* Tab 1: Invoices */}
      {!isLoadingInvoices && tab === "invoices" && (
        <div className="space-y-4">
          {invoices.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No invoices found"
              description="Completed product orders and accepted service visits will generate itemized invoices here."
              action={{ label: "Browse Store", href: "/store" }}
              secondaryAction={{ label: "Request Service", href: "/services" }}
              tone="card"
              className="py-12"
            />
          ) : (
            invoices.map((invoice) => {
              const normStatus = (invoice.status || "").toLowerCase();
              const isPaid = normStatus === "paid";
              const isUnpaid =
                normStatus === "sent" ||
                normStatus === "overdue" ||
                normStatus === "pending" ||
                normStatus === "draft";

              return (
                <article
                  className="rounded-lg border border-slate-200 bg-white p-5 sm:p-6 shadow-xs transition hover:border-teal-400 hover:shadow-sm"
                  key={invoice.id}
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <TypeBadge type={invoice.type === "PRODUCT" ? "PRODUCT" : "SERVICE"} />
                        <StatusBadge status={invoice.status || "SENT"} />
                        <span className="font-mono text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                          {invoice.businessId || invoice.id}
                        </span>
                      </div>
                      <h2 className="text-base sm:text-lg font-bold text-slate-900">
                        {invoice.notes ||
                          (invoice.lineItems?.[0]?.description
                            ? `${invoice.lineItems[0].description}${
                                invoice.lineItems.length > 1
                                  ? ` +${invoice.lineItems.length - 1} more items`
                                  : ""
                              }`
                            : "Itemized Invoice")}
                      </h2>
                      <p className="text-xs text-slate-500">
                        {invoice.orderId ? (
                          <>
                            Related order:{" "}
                            <strong className="font-mono text-slate-700">
                              {invoice.orderId}
                            </strong>{" "}
                            ·{" "}
                          </>
                        ) : null}
                        Issued on {formatLongDate(invoice.createdAt)}
                        {invoice.dueDate && !isPaid ? (
                          <span className="text-amber-700 font-medium">
                            {" "}
                            · Due {formatLongDate(invoice.dueDate)}
                          </span>
                        ) : null}
                      </p>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                      <div className="text-left sm:text-right">
                        <p className="text-xl font-bold text-slate-900">
                          {formatCurrencyUsd(Number(invoice.totalUsd))}
                        </p>
                        {isPaid ? (
                          <p className="text-xs font-semibold text-emerald-600 flex items-center sm:justify-end gap-1">
                            <CheckCircle2 size={12} /> Paid
                          </p>
                        ) : (
                          <p className="text-xs font-semibold text-amber-600">
                            Balance Due
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {isUnpaid && (
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => handlePayOnline(invoice)}
                            className="rounded-md bg-teal-700 hover:bg-teal-800 text-white font-medium text-xs sm:text-sm h-9 px-3.5 shadow-xs"
                          >
                            <CreditCard size={14} className="mr-1.5" />
                            Pay Now
                          </Button>
                        )}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenHtmlInvoice(invoice.id)}
                          className="rounded-md border-slate-200 text-slate-700 hover:bg-slate-50 text-xs sm:text-sm h-9 px-3"
                          title="Print / View HTML Invoice"
                        >
                          <Printer size={14} className="mr-1.5" />
                          Print
                        </Button>
                        <Button
                          asChild
                          size="sm"
                          variant="outline"
                          className="rounded-md font-medium text-xs sm:text-sm h-9 px-3"
                        >
                          <Link href={`/user/billing/invoices/${invoice.id}`}>
                            View Details
                            <ArrowRight size={13} className="ml-1" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>
      )}

      {/* Tab 2: Payments */}
      {!isLoadingInvoices && tab === "payments" && (
        <div className="space-y-4">
          {payments.length === 0 ? (
            <EmptyState
              icon={CreditCard}
              title="No payments recorded"
              description="Processed payments and settlement receipts will appear here once orders are confirmed."
              tone="card"
              className="py-12"
            />
          ) : (
            payments.map((payment) => (
              <article
                className="rounded-lg border border-slate-200 bg-white p-5 sm:p-6 shadow-xs transition hover:border-teal-400 hover:shadow-sm"
                key={payment.id}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <TypeBadge type={payment.type} />
                      <StatusBadge status={payment.status} />
                      <span className="font-mono text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                        {payment.id}
                      </span>
                    </div>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900">
                      {payment.title}
                    </h2>
                    <p className="text-xs text-slate-500">
                      Order {payment.orderId} · Invoice {payment.invoiceId} ·{" "}
                      {payment.methodLabel}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
                    <p className="text-xl font-bold text-slate-900">
                      {formatCurrencyUsd(payment.amountUsd)}
                    </p>
                    <Button
                      asChild
                      size="sm"
                      variant="outline"
                      className="rounded-md font-medium"
                    >
                      <Link href={`/user/billing/invoices/${payment.invoiceId}`}>
                        View Invoice
                      </Link>
                    </Button>
                    <Button asChild size="sm" className="rounded-md font-medium">
                      <Link href={`/user/orders/${payment.orderId}`}>
                        View Order
                      </Link>
                    </Button>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      )}

      {/* Online Stripe Payment Dialog */}
      <Dialog
        open={Boolean(selectedInvoiceForPayment)}
        onOpenChange={(open) => !open && setSelectedInvoiceForPayment(null)}
      >
        <DialogContent className="rounded-xl sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 text-teal-700">
              <ShieldCheck size={20} />
              <DialogTitle className="text-lg font-bold text-slate-900">
                Secure Invoice Payment
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs sm:text-sm text-slate-600">
              Complete payment for Invoice{" "}
              <strong className="font-mono text-slate-900">
                {selectedInvoiceForPayment?.businessId ||
                  selectedInvoiceForPayment?.id}
              </strong>
              .
            </DialogDescription>
          </DialogHeader>

          {selectedInvoiceForPayment && (
            <div className="space-y-4 py-3">
              <div className="rounded-lg bg-teal-50/70 border border-teal-100 p-4">
                <div className="flex justify-between items-center text-sm font-medium text-slate-700 mb-1.5">
                  <span>Total Amount Due:</span>
                  <span className="text-lg font-bold text-teal-950">
                    {formatCurrencyUsd(
                      Number(selectedInvoiceForPayment.totalUsd)
                    )}
                  </span>
                </div>
                {selectedInvoiceForPayment.notes && (
                  <p className="text-xs text-slate-500 truncate">
                    {selectedInvoiceForPayment.notes}
                  </p>
                )}
              </div>

              <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-3.5 text-xs text-slate-600">
                <div className="flex items-center gap-2 font-medium text-slate-800">
                  <CreditCard size={16} className="text-teal-600" />
                  Stripe Payment Processing
                </div>
                <p className="leading-relaxed">
                  Your transaction is protected with 256-bit encryption. Clicking
                  confirm will initiate payment processing and generate your
                  official receipt.
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isProcessingPayment}
              onClick={() => setSelectedInvoiceForPayment(null)}
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
                  Processing Payment...
                </>
              ) : (
                `Confirm & Pay ${
                  selectedInvoiceForPayment
                    ? formatCurrencyUsd(
                        Number(selectedInvoiceForPayment.totalUsd)
                      )
                    : ""
                }`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
