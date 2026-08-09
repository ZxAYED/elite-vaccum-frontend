import Link from "next/link";
import { notFound } from "next/navigation";
import { Download, Package } from "lucide-react";

import { PageHeader } from "@/components/customer-portal/PageHeader";
import { StatusBadge } from "@/components/customer-portal/StatusBadge";
import { TypeBadge } from "@/components/customer-portal/TypeBadge";
import { Button } from "@/components/ui/Button";
import { getDashboardInvoiceById } from "@/data/mock/customer-dashboard";
import { formatCurrencyUsd, formatLongDate } from "@/lib/formatters";

interface InvoiceDetailsPageProps {
  params: Promise<{ invoiceId: string }>;
}

export default async function InvoiceDetailsPage({ params }: InvoiceDetailsPageProps) {
  const { invoiceId } = await params;
  const invoice = getDashboardInvoiceById(invoiceId);

  if (!invoice) {
    notFound();
  }

  return (
    <div className="min-h-screen">
      <PageHeader
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/user/billing">Back to billing</Link>
            </Button>
            <Button>
              <Download size={16} />
              Download Invoice
            </Button>
          </>
        }
        description={`Related ${invoice.type.toLowerCase()} order ${invoice.relatedOrderId}.`}
        eyebrow={`${invoice.type} Invoice`}
        title={invoice.id}
      />

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.85fr]">
        <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <TypeBadge type={invoice.type} />
            <StatusBadge status={invoice.status} />
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-gray-50 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-gray-400">
                Invoice Date
              </p>
              <p className="mt-2 font-semibold text-gray-900">
                {formatLongDate(invoice.invoiceDate)}
              </p>
            </div>
            <div className="rounded-2xl bg-gray-50 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-gray-400">
                Customer
              </p>
              <p className="mt-2 font-semibold text-gray-900">{invoice.customerName}</p>
            </div>
            <div className="rounded-2xl bg-gray-50 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-gray-400">
                Payment
              </p>
              <p className="mt-2 font-semibold text-gray-900">
                {invoice.paymentMethodLabel}
              </p>
            </div>
          </div>

          <div className="mt-8">
            <div className="flex items-center gap-3">
              <Package className="text-teal-700" size={22} />
              <h2 className="text-xl font-semibold text-primary">Line Items</h2>
            </div>
            <div className="mt-5 space-y-3">
              {invoice.lineItems.map((lineItem) => (
                <div
                  className="flex flex-col gap-3 rounded-2xl border border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between"
                  key={lineItem.id}
                >
                  <div>
                    <p className="font-semibold text-gray-900">{lineItem.label}</p>
                    {lineItem.description ? (
                      <p className="mt-1 text-sm text-gray-600">
                        {lineItem.description}
                      </p>
                    ) : null}
                    {lineItem.quantity ? (
                      <p className="mt-2 text-xs font-semibold text-gray-500">
                        Qty {lineItem.quantity}
                        {lineItem.unitPriceUsd
                          ? ` · ${formatCurrencyUsd(lineItem.unitPriceUsd)} each`
                          : null}
                      </p>
                    ) : null}
                  </div>
                  <p className="text-lg font-semibold text-primary">
                    {formatCurrencyUsd(lineItem.amountUsd)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <aside className="space-y-6">
          <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-primary">Billing Address</h2>
            <p className="mt-4 text-sm leading-6 text-gray-700">
              {invoice.billingAddress.line1}
              <br />
              {invoice.billingAddress.city}, {invoice.billingAddress.state}{" "}
              {invoice.billingAddress.postalCode}
              <br />
              {invoice.billingAddress.country}
            </p>
          </section>

          <section className="rounded-3xl bg-primary p-6 text-white shadow-sm">
            <h2 className="text-xl font-semibold">Invoice Total</h2>
            <div className="mt-5 space-y-3 text-sm text-white/75">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatCurrencyUsd(invoice.totals.subtotalUsd)}</span>
              </div>
              {invoice.totals.shippingUsd !== undefined ? (
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>
                    {invoice.totals.shippingUsd
                      ? formatCurrencyUsd(invoice.totals.shippingUsd)
                      : "FREE"}
                  </span>
                </div>
              ) : null}
              <div className="flex justify-between">
                <span>Tax</span>
                <span>{formatCurrencyUsd(invoice.totals.taxUsd)}</span>
              </div>
            </div>
            <div className="mt-5 flex justify-between border-t border-white/15 pt-5 text-2xl font-semibold">
              <span>Total</span>
              <span>{formatCurrencyUsd(invoice.totals.totalUsd)}</span>
            </div>
          </section>

          <Button asChild className="w-full" variant="outline">
            <Link href={`/user/orders/${invoice.relatedOrderId}`}>View Related Order</Link>
          </Button>
        </aside>
      </div>
    </div>
  );
}
