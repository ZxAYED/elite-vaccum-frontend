import Link from "next/link";
import { ArrowRight, CreditCard, FileText, Search, X } from "lucide-react";

import { PageHeader } from "@/components/customer-portal/PageHeader";
import { StatusBadge } from "@/components/customer-portal/StatusBadge";
import { TypeBadge } from "@/components/customer-portal/TypeBadge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { getBillingRecordsForCustomer } from "@/data/mock/shared-billing";
import { mockCurrentCustomer } from "@/data/mock/user";
import { formatCurrencyUsd, formatLongDate } from "@/lib/formatters";

interface BillingPageProps {
  searchParams: Promise<{
    tab?: string;
    type?: string;
    q?: string;
  }>;
}

const typeFilters = ["ALL", "PRODUCT", "SERVICE"] as const;

export default async function BillingPage({ searchParams }: BillingPageProps) {
  const params = await searchParams;
  const tab = params.tab === "payments" ? "payments" : "invoices";
  const type = params.type === "PRODUCT" || params.type === "SERVICE" ? params.type : "ALL";
  const query = (params.q ?? "").trim().toLowerCase();

  const records = getBillingRecordsForCustomer(mockCurrentCustomer.id);
  const invoices = records.invoices.filter((invoice) => {
    const typeMatch = type === "ALL" || invoice.type === type;
    const searchMatch =
      !query ||
      invoice.id.toLowerCase().includes(query) ||
      invoice.description.toLowerCase().includes(query) ||
      invoice.relatedOrderId.toLowerCase().includes(query);
    return typeMatch && searchMatch;
  });

  const payments = records.payments.filter((payment) => {
    const typeMatch = type === "ALL" || payment.type === type;
    const searchMatch =
      !query ||
      payment.id.toLowerCase().includes(query) ||
      payment.title.toLowerCase().includes(query) ||
      payment.orderId.toLowerCase().includes(query) ||
      payment.invoiceId.toLowerCase().includes(query);
    return typeMatch && searchMatch;
  });

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        description="Invoices and payments for product purchases and service orders share one financial center."
        eyebrow="Billing"
        title="Billing"
      />

      <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex gap-1.5">
            <Button
              asChild
              size="sm"
              variant={tab === "invoices" ? "default" : "outline"}
              className="rounded-md text-xs font-medium"
            >
              <Link href={`/user/billing?tab=invoices&type=${type}${query ? `&q=${encodeURIComponent(query)}` : ""}`}>
                <FileText size={14} className="mr-1.5" />
                Invoices
              </Link>
            </Button>
            <Button
              asChild
              size="sm"
              variant={tab === "payments" ? "default" : "outline"}
              className="rounded-md text-xs font-medium"
            >
              <Link href={`/user/billing?tab=payments&type=${type}${query ? `&q=${encodeURIComponent(query)}` : ""}`}>
                <CreditCard size={14} className="mr-1.5" />
                Payments
              </Link>
            </Button>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {typeFilters.map((filter) => (
              <Button
                asChild
                key={filter}
                size="sm"
                variant={type === filter ? "soft" : "outline"}
                className="rounded-md text-xs font-medium"
              >
                <Link href={`/user/billing?tab=${tab}&type=${filter}${query ? `&q=${encodeURIComponent(query)}` : ""}`}>
                  {filter === "ALL" ? "All" : filter}
                </Link>
              </Button>
            ))}
          </div>
        </div>

        <form method="GET" action="/user/billing" className="relative flex items-center">
          <input type="hidden" name="tab" value={tab} />
          <input type="hidden" name="type" value={type} />
          <Search size={15} className="pointer-events-none absolute left-3.5 text-slate-400" />
          <Input
            name="q"
            defaultValue={params.q ?? ""}
            placeholder={tab === "invoices" ? "Search invoices by ID, description, or order..." : "Search payments by ID, order, or invoice..."}
            className="h-10 rounded-md border-slate-200 bg-slate-50/50 pl-10 pr-10 text-xs sm:text-sm focus-visible:bg-white"
          />
          {query ? (
            <Link
              href={`/user/billing?tab=${tab}&type=${type}`}
              aria-label="Clear search"
              className="absolute right-3 flex size-5 items-center justify-center rounded-md text-slate-400 hover:bg-slate-200 hover:text-slate-600"
            >
              <X size={13} />
            </Link>
          ) : null}
        </form>
      </div>

      {tab === "invoices" ? (
        <div className="space-y-4">
          {invoices.length === 0 ? (
            records.invoices.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="No invoices found"
                description="Completed product orders and accepted service visits will generate downloadable invoices here."
                action={{ label: "Browse Store", href: "/store" }}
                secondaryAction={{ label: "Request Service", href: "/services" }}
                tone="card"
                className="py-12"
              />
            ) : (
              <EmptyState
                icon={Search}
                title="No matching invoices"
                description="No invoices match your current search query or type filter."
                action={{ label: "Clear all filters", href: "/user/billing?tab=invoices", variant: "outline" }}
                tone="dashed"
                className="py-10"
              />
            )
          ) : null}
          {invoices.map((invoice) => (
            <article
              className="rounded-lg border border-slate-200 bg-white p-5 sm:p-6 shadow-xs transition hover:border-teal-400 hover:shadow-sm"
              key={invoice.id}
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <TypeBadge type={invoice.type} />
                    <StatusBadge status={invoice.status} />
                    <span className="font-mono text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                      {invoice.id}
                    </span>
                  </div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900">
                    {invoice.description}
                  </h2>
                  <p className="text-xs text-slate-500">
                    Related order: <strong className="font-mono text-slate-700">{invoice.relatedOrderId}</strong> · {formatLongDate(invoice.createdAt)}
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <p className="text-xl font-bold text-slate-900">
                    {formatCurrencyUsd(invoice.totals.totalUsd)}
                  </p>
                  <Button asChild size="sm" className="rounded-md font-medium">
                    <Link href={`/user/billing/invoices/${invoice.id}`}>
                      View Invoice
                      <ArrowRight size={14} className="ml-1.5" />
                    </Link>
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {payments.length === 0 ? (
            records.payments.length === 0 ? (
              <EmptyState
                icon={CreditCard}
                title="No payments recorded"
                description="Processed payments and settlement receipts will appear here once orders are confirmed."
                tone="card"
                className="py-12"
              />
            ) : (
              <EmptyState
                icon={Search}
                title="No matching payments"
                description="No payments match your current search query or type filter."
                action={{ label: "Clear all filters", href: "/user/billing?tab=payments", variant: "outline" }}
                tone="dashed"
                className="py-10"
              />
            )
          ) : null}
          {payments.map((payment) => (
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
                    Order {payment.orderId} · Invoice {payment.invoiceId} · {payment.methodLabel}
                  </p>
                </div>

                <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
                  <p className="text-xl font-bold text-slate-900">
                    {formatCurrencyUsd(payment.amountUsd)}
                  </p>
                  <Button asChild size="sm" variant="outline" className="rounded-md font-medium">
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
          ))}
        </div>
      )}
    </div>
  );
}
