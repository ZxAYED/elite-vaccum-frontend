"use client";

import { useMemo, useState } from "react";
import {
  CalendarClock,
  CreditCard,
  FileText,
  Loader2,
  Printer,
  Receipt,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/customer-portal/PageHeader";
import {
  PortalCard,
  PortalCardAction,
  PortalCardFooter,
  PortalCardTitle,
  PortalCardTop,
  PortalDetailAction,
  PortalFact,
  PortalFilterBar,
  PortalList,
  PortalLoading,
  PortalPager,
  PortalRef,
  type PortalFilterOption,
} from "@/components/customer-portal/PortalUI";
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
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { readApiMessage } from "@/lib/api-error";
import { toStatusSlug } from "@/lib/customer-orders";
import { formatCurrencyUsd, formatLongDate } from "@/lib/formatters";
import {
  useConfirmStripePaymentMutation,
  useCreateStripePaymentIntentMutation,
  useGetMyInvoicesQuery,
  useLazyGetInvoiceHtmlQuery,
  type InvoiceDto,
} from "@/redux/api/billingApi";

/**
 * The customer's invoice ledger — every invoice raised against them, whether
 * it came from a store order or a service visit, plus the receipts for what
 * they've paid. Product-order invoices are also shown inline on the order
 * itself; this screen is the only place service invoices appear and the only
 * place an invoice can be paid online (Phase 12.13).
 */

const PAGE_SIZE = 10;

type BillingView = "invoices" | "receipts";

/** Statuses that still owe money, so the pay action is worth surfacing. */
const PAYABLE_STATUSES = ["ISSUED", "SENT", "OVERDUE", "PARTIALLY_PAID"];

export function UserBillingClient({
  initialTab = "invoices",
  initialQuery = "",
}: {
  initialTab?: BillingView;
  initialQuery?: string;
}) {
  const [view, setView] = useState<BillingView>(initialTab);
  const [searchInput, setSearchInput] = useState(initialQuery);
  const [page, setPage] = useState(1);

  const [payTarget, setPayTarget] = useState<InvoiceDto | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const [createStripePaymentIntent] = useCreateStripePaymentIntentMutation();
  const [confirmStripePayment] = useConfirmStripePaymentMutation();
  const [fetchInvoiceHtml, { isFetching: isOpeningHtml }] =
    useLazyGetInvoiceHtmlQuery();

  const search = useDebouncedValue(searchInput.trim());

  const { data, isLoading, isFetching, isError, refetch } = useGetMyInvoicesQuery(
    useMemo(
      () => ({
        page,
        limit: PAGE_SIZE,
        ...(search ? { search } : {}),
      }),
      [page, search],
    ),
  );

  const invoices = useMemo(() => data?.items ?? [], [data?.items]);
  const meta = data?.meta;
  const totalPages = Math.max(1, meta?.totalPages ?? 1);

  /**
   * There is no customer payments endpoint — each invoice carries its own
   * records (Phase 12.7) — so receipts are flattened out of the invoices on
   * this page.
   */
  const receipts = useMemo(
    () =>
      invoices.flatMap((invoice) =>
        (invoice.payments ?? []).map((payment) => ({
          payment,
          invoice,
        })),
      ),
    [invoices],
  );

  const views: ReadonlyArray<PortalFilterOption<BillingView>> = [
    { label: "Invoices", value: "invoices", count: invoices.length },
    { label: "Payment Receipts", value: "receipts", count: receipts.length },
  ];

  function changeSearch(next: string) {
    setSearchInput(next);
    setPage(1);
  }

  /** Phase 12.13: create a PaymentIntent, then confirm it server-side. */
  async function handleConfirmPayment() {
    if (!payTarget) return;
    setIsProcessingPayment(true);
    const toastId = toast.loading("Connecting to secure payment gateway...");

    try {
      const intent = await createStripePaymentIntent(payTarget.id).unwrap();
      const paymentIntentId = intent.clientSecret?.split("_secret_")[0];
      if (!paymentIntentId) {
        throw new Error("The payment gateway did not return a payment intent.");
      }

      const result = await confirmStripePayment({
        invoiceId: payTarget.id,
        paymentIntentId,
      }).unwrap();

      toast.success(result.message || "Payment completed.", {
        id: toastId,
        description: `Invoice ${payTarget.businessId || payTarget.id} is now marked paid.`,
      });
      setPayTarget(null);
    } catch (err) {
      toast.error("Payment could not be completed", {
        id: toastId,
        description: readApiMessage(
          err,
          "Please try again, or contact support if the problem continues.",
        ),
        duration: 6000,
      });
    } finally {
      setIsProcessingPayment(false);
    }
  }

  /**
   * The printable invoice route is authenticated, so opening its URL directly
   * would 401 — the bearer token never travels with a new tab. Fetch it and
   * hand the browser a blob instead.
   */
  async function handlePrint(invoiceId: string) {
    try {
      const html = await fetchInvoiceHtml(invoiceId).unwrap();
      const url = URL.createObjectURL(
        new Blob([html], { type: "text/html;charset=utf-8" }),
      );
      window.open(url, "_blank", "noopener");
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (err) {
      toast.error("Could not open the printable invoice", {
        description: readApiMessage(err, "The invoice view is unavailable."),
      });
    }
  }

  const isEmpty = view === "invoices" ? invoices.length === 0 : receipts.length === 0;

  return (
    <div className="space-y-6 pb-12 sm:space-y-7">
      <PageHeader
        description="Invoices, itemised statements, and payment receipts for your orders and service visits."
        eyebrow="Financial Center"
        title="Billing & Invoices"
      />

      <PortalFilterBar
        filters={views}
        onChange={(next) => {
          setView(next);
          setPage(1);
        }}
        onSearchChange={changeSearch}
        search={searchInput}
        searchPlaceholder="Search by invoice number, item, or order..."
        value={view}
      />

      {isLoading ? (
        <PortalLoading label="Loading your billing history..." />
      ) : isError ? (
        <EmptyState
          action={{ label: "Try Again", onClick: () => void refetch() }}
          className="py-12"
          description="We couldn't load your billing history just now. Please try again in a moment."
          icon={Receipt}
          title="Billing unavailable"
          tone="card"
        />
      ) : isEmpty ? (
        <EmptyState
          action={
            search
              ? { label: "Clear Search", onClick: () => changeSearch("") }
              : { label: "Browse Store Catalog", href: "/store" }
          }
          className="py-12"
          description={
            search
              ? `Nothing matched "${search}". Try a different invoice number or item.`
              : view === "invoices"
                ? "Invoices are raised when you place an order or accept a service quotation."
                : "Receipts appear here once a payment has been recorded against one of your invoices."
          }
          icon={view === "invoices" ? FileText : CreditCard}
          title={
            search
              ? "No matching records"
              : view === "invoices"
                ? "No invoices yet"
                : "No payments recorded"
          }
          tone="card"
        />
      ) : (
        <PortalList isRefreshing={isFetching}>
          {view === "invoices"
            ? invoices.map((invoice) => (
                <InvoiceCardRow
                  invoice={invoice}
                  isPrinting={isOpeningHtml}
                  key={invoice.id}
                  onPay={() => setPayTarget(invoice)}
                  onPrint={() => void handlePrint(invoice.id)}
                />
              ))
            : receipts.map(({ payment, invoice }) => (
                <PortalCard key={payment.id}>
                  <PortalCardTop
                    badges={
                      <>
                        <StatusBadge status={toStatusSlug(payment.status)} />
                        <PortalRef>{invoice.businessId || invoice.id}</PortalRef>
                        <TypeBadge type={resolveInvoiceType(invoice)} />
                      </>
                    }
                    meta={
                      payment.paidAt || payment.createdAt ? (
                        <>
                          Paid:{" "}
                          <span className="font-medium text-slate-700">
                            {formatLongDate(
                              payment.paidAt || payment.createdAt || "",
                            )}
                          </span>
                        </>
                      ) : null
                    }
                  />

                  <PortalCardTitle
                    subtitle={
                      invoice.lineItems?.[0]?.description ||
                      invoice.notes ||
                      undefined
                    }
                  >
                    {formatCurrencyUsd(Number(payment.amountUsd))} received
                  </PortalCardTitle>

                  <PortalCardFooter
                    actions={
                      <>
                        {invoice.orderId ? (
                          <PortalDetailAction
                            href={`/user/orders/${invoice.orderId}`}
                            label="View Order"
                          />
                        ) : null}
                        <PortalDetailAction
                          href={`/user/billing/invoices/${invoice.id}`}
                          label="View Invoice"
                        />
                      </>
                    }
                    facts={
                      <>
                        <PortalFact
                          icon={CreditCard}
                          label="Method"
                          placeholder="Not recorded"
                          value={payment.methodLabel}
                        />
                        <PortalFact
                          icon={Receipt}
                          label="Reference"
                          placeholder="Not provided"
                          truncate
                          value={payment.transactionReference}
                        />
                      </>
                    }
                  />
                </PortalCard>
              ))}

          {view === "invoices" && totalPages > 1 ? (
            <PortalPager
              isBusy={isFetching}
              onPageChange={setPage}
              page={meta?.page ?? page}
              total={meta?.total}
              totalLabel="invoices"
              totalPages={totalPages}
            />
          ) : null}
        </PortalList>
      )}

      <Dialog
        onOpenChange={(open) => {
          if (!open) setPayTarget(null);
        }}
        open={Boolean(payTarget)}
      >
        <DialogContent className="rounded-xl sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 text-teal-700">
              <ShieldCheck size={20} />
              <DialogTitle className="text-lg font-bold text-slate-900">
                Secure Invoice Payment
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-slate-600 sm:text-sm">
              Complete payment for invoice{" "}
              <strong className="font-mono text-slate-900">
                {payTarget?.businessId || payTarget?.id}
              </strong>
              .
            </DialogDescription>
          </DialogHeader>

          {payTarget ? (
            <div className="space-y-4 py-3">
              <div className="rounded-lg border border-teal-100 bg-teal-50/70 p-4">
                <div className="mb-1.5 flex items-center justify-between text-sm font-medium text-slate-700">
                  <span>Total amount due</span>
                  <span className="text-lg font-bold tabular-nums text-teal-950">
                    {formatCurrencyUsd(Number(payTarget.totalUsd))}
                  </span>
                </div>
                {payTarget.notes ? (
                  <p className="truncate text-xs text-slate-500">
                    {payTarget.notes}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-3.5 text-xs text-slate-600">
                <div className="flex items-center gap-2 font-medium text-slate-800">
                  <CreditCard className="text-teal-600" size={16} />
                  Stripe payment processing
                </div>
                <p className="leading-relaxed">
                  Your transaction is protected with 256-bit encryption.
                  Confirming starts payment processing and generates your
                  official receipt.
                </p>
              </div>
            </div>
          ) : null}

          <DialogFooter className="flex gap-2 sm:justify-end">
            <Button
              className="rounded-md"
              disabled={isProcessingPayment}
              onClick={() => setPayTarget(null)}
              size="sm"
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              className="rounded-md bg-teal-700 font-medium text-white hover:bg-teal-800"
              disabled={isProcessingPayment}
              onClick={handleConfirmPayment}
              size="sm"
              type="button"
            >
              {isProcessingPayment ? (
                <>
                  <Loader2 className="mr-1.5 size-4 animate-spin" />
                  Processing...
                </>
              ) : (
                `Confirm & Pay ${payTarget ? formatCurrencyUsd(Number(payTarget.totalUsd)) : ""}`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/**
 * A store-order invoice is identified by carrying an `orderId`, not by its
 * `type` field — the backend currently labels product-order invoices
 * `SERVICE`, so trusting `type` mislabels them in the UI.
 */
function resolveInvoiceType(invoice: InvoiceDto): "PRODUCT" | "SERVICE" {
  if (invoice.orderId) return "PRODUCT";
  if (invoice.serviceOrderId) return "SERVICE";
  return String(invoice.type ?? "SERVICE").toUpperCase() === "PRODUCT"
    ? "PRODUCT"
    : "SERVICE";
}

function InvoiceCardRow({
  invoice,
  onPay,
  onPrint,
  isPrinting,
}: {
  invoice: InvoiceDto;
  onPay: () => void;
  onPrint: () => void;
  isPrinting: boolean;
}) {
  const status = String(invoice.status ?? "").toUpperCase();
  const isPaid = status === "PAID" || Boolean(invoice.paidAt);
  const canPay = !isPaid && PAYABLE_STATUSES.includes(status);
  const lineItem = invoice.lineItems?.[0]?.description;
  const extraLines = Math.max(0, (invoice.lineItems?.length ?? 0) - 1);

  return (
    <PortalCard>
      <PortalCardTop
        badges={
          <>
            <StatusBadge status={toStatusSlug(invoice.status ?? "issued")} />
            <PortalRef>{invoice.businessId || invoice.id}</PortalRef>
            <TypeBadge type={resolveInvoiceType(invoice)} />
          </>
        }
        meta={
          <>
            Issued:{" "}
            <span className="font-medium text-slate-700">
              {invoice.createdAt ? formatLongDate(invoice.createdAt) : "—"}
            </span>
          </>
        }
      />

      <PortalCardTitle
        href={`/user/billing/invoices/${invoice.id}`}
        subtitle={
          lineItem
            ? extraLines > 0
              ? `${lineItem} +${extraLines} more item${extraLines === 1 ? "" : "s"}`
              : lineItem
            : invoice.notes || undefined
        }
      >
        {formatCurrencyUsd(Number(invoice.totalUsd))}
      </PortalCardTitle>

      <PortalCardFooter
        actions={
          <>
            <PortalCardAction
              icon={Printer}
              label="Print"
              loading={isPrinting}
              onClick={onPrint}
            />
            <PortalDetailAction
              href={`/user/billing/invoices/${invoice.id}`}
            />
            {canPay ? (
              <PortalCardAction
                icon={CreditCard}
                label="Pay Now"
                onClick={onPay}
                tone="brand"
              />
            ) : null}
          </>
        }
        facts={
          <>
            <PortalFact
              emphasis
              icon={Wallet}
              label={isPaid ? "Amount Paid" : "Balance Due"}
              tone={isPaid ? "success" : "warning"}
              value={formatCurrencyUsd(Number(invoice.totalUsd))}
            />
            <PortalFact
              icon={CalendarClock}
              label={isPaid ? "Paid On" : "Due Date"}
              placeholder={isPaid ? "Not recorded" : "No due date"}
              tone={!isPaid && status === "OVERDUE" ? "danger" : "neutral"}
              value={
                isPaid
                  ? invoice.paidAt
                    ? formatLongDate(invoice.paidAt)
                    : undefined
                  : invoice.dueDate
                    ? formatLongDate(invoice.dueDate)
                    : undefined
              }
            />
            {invoice.orderId ? (
              <PortalFact
                icon={Receipt}
                label="Linked Order"
                truncate
                value={invoice.orderId}
              />
            ) : null}
          </>
        }
      />
    </PortalCard>
  );
}
