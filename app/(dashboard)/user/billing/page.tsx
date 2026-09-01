import Link from "next/link";
import { ArrowRight, CreditCard, FileText, Search, X } from "lucide-react";

import { PageHeader } from "@/components/customer-portal/PageHeader";
import { StatusBadge } from "@/components/customer-portal/StatusBadge";
import { TypeBadge } from "@/components/customer-portal/TypeBadge";
import { Button } from "@/components/ui/Button";
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
    <div className="min-h-screen">
      <PageHeader
        description="Invoices and payments for product purchases and service orders share one financial center."
        eyebrow="Billing"
        title="Billing"
      />

      <div className="mb-6 flex flex-col gap-4 rounded-3xl border border-teal-100 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex gap-2">
            <Button asChild variant={tab === "invoices" ? "default" : "ghost"}>
              <Link href={`/user/billing?tab=invoices&type=${type}${query ? `&q=${encodeURIComponent(query)}` : ""}`}>
                <FileText size={16} />
                Invoices
              </Link>
            </Button>
            <Button asChild variant={tab === "payments" ? "default" : "ghost"}>
              <Link href={`/user/billing?tab=payments&type=${type}${query ? `&q=${encodeURIComponent(query)}` : ""}`}>
                <CreditCard size={16} />
                Payments
              </Link>
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {typeFilters.map((filter) => (
              <Button
                asChild
                key={filter}
                size="sm"
                variant={type === filter ? "soft" : "outline"}
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
          <Search size={16} className="pointer-events-none absolute left-4 text-slate-400" />
          <Input
            name="q"
            defaultValue={params.q ?? ""}
            placeholder={tab === "invoices" ? "Search invoices by ID, description, or order..." : "Search payments by ID, order, or invoice..."}
            className="h-11 rounded-2xl border-teal-100 bg-slate-50/50 pl-11 pr-10 text-sm focus-visible:bg-white"
          />
          {query ? (
            <Link
              href={`/user/billing?tab=${tab}&type=${type}`}
              aria-label="Clear search"
              className="absolute right-3 flex size-6 items-center justify-center rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-600"
            >
              <X size={14} />
            </Link>
          ) : null}
        </form>
      </div>

      {tab === "invoices" ? (
        <div className="space-y-4">
          {invoices.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-teal-200 bg-teal-50/30 p-10 text-center">
              <FileText size={32} className="mx-auto text-teal-700 opacity-60" />
              <p className="mt-3 text-lg font-semibold text-slate-900">No matching invoices</p>
              <p className="mt-1 text-sm text-slate-500">
                Try adjusting your search query or type filter.
              </p>
              {(query || type !== "ALL") ? (
                <Button asChild size="sm" variant="outline" className="mt-4">
                  <Link href="/user/billing?tab=invoices">Clear all filters</Link>
                </Button>
              ) : null}
            </div>
          ) : null}
          {invoices.map((invoice) => (
            <article
              className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm"
              key={invoice.id}
            >
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <TypeBadge type={invoice.type} />
                    <StatusBadge status={invoice.status} />
                    <p className="text-sm font-semibold text-gray-500">{invoice.id}</p>
                  </div>
                  <h2 className="mt-4 text-xl font-semibold text-primary">
                    {invoice.description}
                  </h2>
                  <p className="mt-2 text-sm text-gray-600">
                    Related order {invoice.relatedOrderId} · {formatLongDate(invoice.createdAt)}
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <p className="text-2xl font-semibold text-primary">
                    {formatCurrencyUsd(invoice.totals.totalUsd)}
                  </p>
                  <Button asChild>
                    <Link href={`/user/billing/invoices/${invoice.id}`}>
                      View Invoice
                      <ArrowRight size={16} />
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
            <div className="rounded-3xl border border-dashed border-teal-200 bg-teal-50/30 p-10 text-center">
              <CreditCard size={32} className="mx-auto text-teal-700 opacity-60" />
              <p className="mt-3 text-lg font-semibold text-slate-900">No matching payments</p>
              <p className="mt-1 text-sm text-slate-500">
                Try adjusting your search query or type filter.
              </p>
              {(query || type !== "ALL") ? (
                <Button asChild size="sm" variant="outline" className="mt-4">
                  <Link href="/user/billing?tab=payments">Clear all filters</Link>
                </Button>
              ) : null}
            </div>
          ) : null}
          {payments.map((payment) => (
            <article
              className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm"
              key={payment.id}
            >
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <TypeBadge type={payment.type} />
                    <StatusBadge status={payment.status} />
                    <p className="text-sm font-semibold text-gray-500">{payment.id}</p>
                  </div>
                  <h2 className="mt-4 text-xl font-semibold text-primary">
                    {payment.title}
                  </h2>
                  <p className="mt-2 text-sm text-gray-600">
                    Order {payment.orderId} · Invoice {payment.invoiceId} · {payment.methodLabel}
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <p className="text-2xl font-semibold text-primary">
                    {formatCurrencyUsd(payment.amountUsd)}
                  </p>
                  <Button asChild variant="outline">
                    <Link href={`/user/billing/invoices/${payment.invoiceId}`}>
                      View Invoice
                    </Link>
                  </Button>
                  <Button asChild>
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

