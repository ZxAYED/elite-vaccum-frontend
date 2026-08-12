import Link from "next/link";
import { ArrowRight, CreditCard, FileText } from "lucide-react";

import { PageHeader } from "@/components/customer-portal/PageHeader";
import { StatusBadge } from "@/components/customer-portal/StatusBadge";
import { TypeBadge } from "@/components/customer-portal/TypeBadge";
import { Button } from "@/components/ui/Button";
import { getBillingRecordsForCustomer } from "@/data/mock/shared-billing";
import { mockCurrentCustomer } from "@/data/mock/user";
import { formatCurrencyUsd, formatLongDate } from "@/lib/formatters";

interface BillingPageProps {
  searchParams: Promise<{
    tab?: string;
    type?: string;
  }>;
}

const typeFilters = ["ALL", "PRODUCT", "SERVICE"] as const;

export default async function BillingPage({ searchParams }: BillingPageProps) {
  const params = await searchParams;
  const tab = params.tab === "payments" ? "payments" : "invoices";
  const type = params.type === "PRODUCT" || params.type === "SERVICE" ? params.type : "ALL";
  const records = getBillingRecordsForCustomer(mockCurrentCustomer.id);
  const invoices = records.invoices.filter(
    (invoice) => type === "ALL" || invoice.type === type,
  );
  const payments = records.payments.filter(
    (payment) => type === "ALL" || payment.type === type,
  );

  return (
    <div className="min-h-screen">
      <PageHeader
        description="Invoices and payments for product purchases and service orders share one financial center."
        eyebrow="Billing"
        title="Billing"
      />

      <div className="mb-6 flex flex-col gap-4 rounded-3xl border border-teal-100 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="flex gap-2">
          <Button asChild variant={tab === "invoices" ? "default" : "ghost"}>
            <Link href={`/user/billing?tab=invoices&type=${type}`}>
              <FileText size={16} />
              Invoices
            </Link>
          </Button>
          <Button asChild variant={tab === "payments" ? "default" : "ghost"}>
            <Link href={`/user/billing?tab=payments&type=${type}`}>
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
              <Link href={`/user/billing?tab=${tab}&type=${filter}`}>
                {filter === "ALL" ? "All" : filter}
              </Link>
            </Button>
          ))}
        </div>
      </div>

      {tab === "invoices" ? (
        <div className="space-y-4">
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

