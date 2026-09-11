"use client";

import { useMemo, useState } from "react";
import {
  CreditCard,
  FileText,
  Loader2,
  Printer,
  Receipt,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/customer-portal/PageHeader";
import {
  columnClass,
  PortalCell,
  PortalRecordCell,
  PortalRow,
  PortalRowActions,
  PortalStackedValue,
  PortalTable,
  PortalTableSkeleton,
  PortalValue,
  type PortalColumn,
} from "@/components/customer-portal/PortalTable";
import {
  PortalCardAction,
  PortalDetailAction,
  PortalFilterBar,
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
import { canPayInvoiceOnline, getInvoiceState, invoiceKind } from "@/lib/invoice-state";
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

/**
 * Both column sets are ordered to match their cells; the indices are
 * referenced directly so a column and its cells can never drift apart.
 */
const INVOICE_COLUMNS: ReadonlyArray<PortalColumn> = [
  { key: "invoice", label: "Invoice" },
  { key: "status", label: "Status" },
  { key: "type", label: "Type", hideBelow: "lg" },
  { key: "issued", label: "Issued", hideBelow: "lg" },
  { key: "due", label: "Due / Paid", hideBelow: "md" },
  { key: "amount", label: "Amount", align: "right" },
  { key: "actions", label: "Actions", align: "actions" },
];

const RECEIPT_COLUMNS: ReadonlyArray<PortalColumn> = [
  { key: "payment", label: "Payment" },
  { key: "status", label: "Status" },
  { key: "invoice", label: "Invoice", hideBelow: "md" },
  { key: "paid", label: "Paid On", hideBelow: "lg" },
  { key: "method", label: "Method", hideBelow: "lg" },
  { key: "reference", label: "Reference", hideBelow: "lg" },
  { key: "actions", label: "Actions", align: "actions" },
];

type BillingView = "invoices" | "receipts";

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
      // The API returns the intent id directly — never parse it out of
      // the client secret.
      if (!intent.paymentIntentId) {
        throw new Error("The payment gateway did not return a payment intent.");
      }

      // Confirming server-side is what makes the payment real; the client
      // result alone never marks an invoice paid.
      const result = await confirmStripePayment({
        invoiceId: payTarget.id,
        paymentIntentId: intent.paymentIntentId,
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
        <PortalTableSkeleton
          columns={view === "invoices" ? INVOICE_COLUMNS : RECEIPT_COLUMNS}
        />
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
      ) : view === "invoices" ? (
        <PortalTable
          caption="Your invoices, with balance, due date and payment status"
          columns={INVOICE_COLUMNS}
          footer={
            totalPages > 1 ? (
              <PortalPager
                isBusy={isFetching}
                onPageChange={setPage}
                page={meta?.page ?? page}
                total={meta?.total}
                totalLabel="invoices"
                totalPages={totalPages}
              />
            ) : null
          }
          isRefreshing={isFetching}
        >
          {invoices.map((invoice) => (
            <InvoiceTableRow
              invoice={invoice}
              isPrinting={isOpeningHtml}
              key={invoice.id}
              onPay={() => setPayTarget(invoice)}
              onPrint={() => void handlePrint(invoice.id)}
            />
          ))}
        </PortalTable>
      ) : (
        <PortalTable
          caption="Payments recorded against your invoices"
          columns={RECEIPT_COLUMNS}
          isRefreshing={isFetching}
        >
          {receipts.map(({ payment, invoice }) => (
            <PortalRow key={payment.id}>
              <PortalCell className={columnClass(RECEIPT_COLUMNS[0])}>
                <PortalRecordCell
                  href={`/user/billing/invoices/${invoice.id}`}
                  subtitle={
                    invoice.lineItems?.[0]?.description ||
                    invoice.notes ||
                    undefined
                  }
                  title={`${formatCurrencyUsd(Number(payment.amountUsd))} received`}
                />
              </PortalCell>

              <PortalCell className={columnClass(RECEIPT_COLUMNS[1])}>
                <StatusBadge status={toStatusSlug(payment.status)} />
              </PortalCell>

              <PortalCell className={columnClass(RECEIPT_COLUMNS[2])}>
                <span className="inline-flex items-center gap-2">
                  <PortalRef>{invoice.businessId || invoice.id}</PortalRef>
                  <TypeBadge type={invoiceKind(invoice)} />
                </span>
              </PortalCell>

              <PortalCell className={columnClass(RECEIPT_COLUMNS[3])}>
                <PortalValue
                  placeholder="Not recorded"
                  value={
                    payment.paidAt || payment.createdAt
                      ? formatLongDate(payment.paidAt || payment.createdAt || "")
                      : undefined
                  }
                />
              </PortalCell>

              <PortalCell className={columnClass(RECEIPT_COLUMNS[4])}>
                <PortalValue
                  icon={CreditCard}
                  placeholder="Not recorded"
                  value={payment.methodLabel}
                />
              </PortalCell>

              <PortalCell className={columnClass(RECEIPT_COLUMNS[5])}>
                <PortalValue
                  icon={Receipt}
                  placeholder="Not provided"
                  truncate
                  value={payment.transactionReference}
                />
              </PortalCell>

              <PortalCell className={columnClass(RECEIPT_COLUMNS[6])}>
                <PortalRowActions>
                  {invoice.productOrderId ? (
                    <PortalDetailAction
                      href={`/user/orders/${invoice.productOrderId}`}
                      label="Order"
                    />
                  ) : null}
                  <PortalDetailAction
                    href={`/user/billing/invoices/${invoice.id}`}
                    label="Invoice"
                  />
                </PortalRowActions>
              </PortalCell>
            </PortalRow>
          ))}
        </PortalTable>
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
 * One invoice as a table row. The balance column carries the figure the
 * customer cares about (what is still owed, or what was paid) with the
 * qualifier under it, so the amount column stays scannable while the "of
 * $X total" detail stays available.
 */
function InvoiceTableRow({
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
  const state = getInvoiceState(invoice);
  // Billing refuses card payment for a store order — that rail is store
  // checkout. DRAFT, VOID and settled invoices are never payable either.
  const canPay = canPayInvoiceOnline(invoice);
  const lineItem = invoice.lineItems?.[0]?.description;
  const extraLines = Math.max(0, (invoice.lineItems?.length ?? 0) - 1);
  const isOverdue = state.balance > 0 && state.slug === "overdue";

  /*
    The balance is derived, never stored:
    total − Σ(SUCCEEDED payments) + Σ(COMPLETED refunds).
  */
  const amountLabel = state.hasRefund
    ? "Refunded"
    : state.balance > 0
      ? "Balance due"
      : "Amount paid";
  const amount = state.hasRefund
    ? state.refunded
    : state.balance > 0
      ? state.balance
      : state.paid || state.total;

  return (
    <PortalRow>
      <PortalCell className={columnClass(INVOICE_COLUMNS[0])}>
        <PortalRecordCell
          // Only an outstanding balance needs the customer to act, and the
          // status badge plus the "Pay Now" action say so in words too.
          accent={isOverdue ? "danger" : state.balance > 0 ? "warning" : undefined}
          href={`/user/billing/invoices/${invoice.id}`}
          subtitle={
            lineItem
              ? extraLines > 0
                ? `${lineItem} +${extraLines} more item${extraLines === 1 ? "" : "s"}`
                : lineItem
              : invoice.notes || undefined
          }
          title={invoice.businessId || invoice.id}
        />
      </PortalCell>

      <PortalCell className={columnClass(INVOICE_COLUMNS[1])}>
        <StatusBadge label={state.label} status={state.slug} />
      </PortalCell>

      <PortalCell className={columnClass(INVOICE_COLUMNS[2])}>
        <TypeBadge type={invoiceKind(invoice)} />
      </PortalCell>

      <PortalCell className={columnClass(INVOICE_COLUMNS[3])}>
        <PortalValue
          placeholder="Not issued"
          value={invoice.issueDate ? formatLongDate(invoice.issueDate) : undefined}
        />
      </PortalCell>

      <PortalCell className={columnClass(INVOICE_COLUMNS[4])}>
        <PortalStackedValue
          primary={
            <PortalValue
              placeholder={state.balance > 0 ? "No due date" : "Not recorded"}
              tone={isOverdue ? "danger" : "neutral"}
              value={
                state.balance > 0
                  ? invoice.dueDate
                    ? formatLongDate(invoice.dueDate)
                    : undefined
                  : invoice.paidAt
                    ? formatLongDate(invoice.paidAt)
                    : undefined
              }
            />
          }
          secondary={state.balance > 0 ? "Due" : "Paid on"}
        />
      </PortalCell>

      <PortalCell className={columnClass(INVOICE_COLUMNS[5])}>
        <PortalStackedValue
          align="right"
          primary={formatCurrencyUsd(amount)}
          secondary={
            state.balance > 0 && state.paid > 0
              ? `${amountLabel} · ${formatCurrencyUsd(state.paid)} of ${formatCurrencyUsd(state.total)} paid`
              : amountLabel
          }
          tone={
            state.hasRefund
              ? "neutral"
              : state.balance > 0
                ? isOverdue
                  ? "danger"
                  : "warning"
                : "success"
          }
        />
      </PortalCell>

      <PortalCell className={columnClass(INVOICE_COLUMNS[6])}>
        <PortalRowActions>
          <PortalCardAction
            icon={Printer}
            label="Print"
            loading={isPrinting}
            onClick={onPrint}
          />
          <PortalDetailAction
            href={`/user/billing/invoices/${invoice.id}`}
            label="View"
          />
          {canPay ? (
            <PortalCardAction
              icon={CreditCard}
              label="Pay Now"
              onClick={onPay}
              tone="brand"
            />
          ) : null}
        </PortalRowActions>
      </PortalCell>
    </PortalRow>
  );
}
