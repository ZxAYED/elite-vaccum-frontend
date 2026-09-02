import Link from "next/link";
import { notFound } from "next/navigation";
import { Download, Package, Wrench } from "lucide-react";

import { PageHeader } from "@/components/customer-portal/PageHeader";
import { StatusBadge } from "@/components/customer-portal/StatusBadge";
import { TypeBadge } from "@/components/customer-portal/TypeBadge";
import { Button } from "@/components/ui/Button";
import { getBillingInvoiceById } from "@/data/mock/shared-billing";
import { mockCurrentCustomer } from "@/data/mock/user";
import { formatCurrencyUsd, formatLongDate } from "@/lib/formatters";

interface InvoiceDetailsPageProps {
  params: Promise<{ invoiceId: string }>;
}

export default async function InvoiceDetailsPage({ params }: InvoiceDetailsPageProps) {
  const { invoiceId } = await params;
  const invoice = getBillingInvoiceById(invoiceId);

  if (!invoice || invoice.customerId !== mockCurrentCustomer.id) {
    notFound();
  }

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm" className="rounded-md">
              <Link href="/user/billing">Back to billing</Link>
            </Button>
            <Button size="sm" className="rounded-md bg-teal-600 hover:bg-teal-500 font-medium">
              <Download size={14} className="mr-1.5" />
              Download PDF
            </Button>
          </div>
        }
        description={`Related ${invoice.type.toLowerCase()} order ${invoice.relatedOrderId}.`}
        eyebrow={`${invoice.type} Invoice`}
        title={`Invoice #${invoice.id}`}
      />

      <div className="grid gap-6 lg:grid-cols-12">
        <section className="rounded-lg border border-slate-200 bg-white p-5 sm:p-6 shadow-xs lg:col-span-8 space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <TypeBadge type={invoice.type} />
            <StatusBadge status={invoice.status} />
          </div>

          <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
            <div className="rounded-md bg-slate-50 border border-slate-200 p-3 text-xs">
              <p className="font-semibold uppercase tracking-wider text-slate-400 text-[10px]">
                Invoice Date
              </p>
              <p className="mt-1 font-semibold text-slate-900">
                {formatLongDate(invoice.createdAt)}
              </p>
            </div>
            <div className="rounded-md bg-slate-50 border border-slate-200 p-3 text-xs">
              <p className="font-semibold uppercase tracking-wider text-slate-400 text-[10px]">
                Customer
              </p>
              <p className="mt-1 font-semibold text-slate-900">{invoice.customerName}</p>
            </div>
            <div className="rounded-md bg-slate-50 border border-slate-200 p-3 text-xs">
              <p className="font-semibold uppercase tracking-wider text-slate-400 text-[10px]">
                Payment Ref
              </p>
              <p className="mt-1 font-semibold text-slate-900 font-mono">
                {invoice.paymentReference ?? invoice.paymentId ?? "Pending"}
              </p>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              {invoice.type === "PRODUCT" ? (
                <Package className="text-teal-700" size={18} />
              ) : (
                <Wrench className="text-teal-700" size={18} />
              )}
              <h2 className="text-base font-bold text-slate-900">Itemized Breakdown</h2>
            </div>
            <div className="mt-4 space-y-2.5">
              {invoice.lineItems.map((lineItem) => (
                <div
                  className="flex flex-col gap-2 rounded-md border border-slate-200 p-3.5 sm:flex-row sm:items-center sm:justify-between hover:bg-slate-50/50 transition"
                  key={lineItem.id}
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{lineItem.label}</p>
                    {lineItem.description ? (
                      <p className="mt-0.5 text-xs text-slate-500">
                        {lineItem.description}
                      </p>
                    ) : null}
                    {lineItem.quantity ? (
                      <p className="mt-1 text-[11px] font-medium text-slate-600">
                        Qty {lineItem.quantity}
                        {lineItem.unitPriceUsd
                          ? ` · ${formatCurrencyUsd(lineItem.unitPriceUsd)} each`
                          : null}
                      </p>
                    ) : null}
                  </div>
                  <p className="text-base font-bold text-slate-900">
                    {formatCurrencyUsd(lineItem.amountUsd)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <aside className="space-y-6 lg:col-span-4">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-xs">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2.5">Billing Address</h2>
            <p className="mt-3 text-xs leading-relaxed text-slate-700">
              {invoice.billingAddress.line1}
              <br />
              {invoice.billingAddress.city}, {invoice.billingAddress.state}{" "}
              {invoice.billingAddress.postalCode}
              <br />
              {invoice.billingAddress.country}
            </p>
          </section>

          <section className="rounded-lg border border-teal-800 bg-teal-900 p-5 sm:p-6 text-white shadow-xs">
            <h2 className="text-base font-bold text-white">Invoice Summary</h2>
            <div className="mt-4 space-y-2.5 text-xs sm:text-sm text-teal-100/80">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-white">{formatCurrencyUsd(invoice.totals.subtotalUsd)}</span>
              </div>
              {invoice.totals.shippingUsd !== undefined ? (
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span className="font-semibold text-white">
                    {invoice.totals.shippingUsd
                      ? formatCurrencyUsd(invoice.totals.shippingUsd)
                      : "FREE"}
                  </span>
                </div>
              ) : null}
              <div className="flex justify-between">
                <span>Estimated Tax</span>
                <span className="font-semibold text-white">{formatCurrencyUsd(invoice.totals.taxUsd)}</span>
              </div>
              {invoice.totals.discountUsd ? (
                <div className="flex justify-between text-emerald-400 font-medium">
                  <span>Discount</span>
                  <span>-{formatCurrencyUsd(invoice.totals.discountUsd)}</span>
                </div>
              ) : null}
            </div>
            <div className="mt-5 flex justify-between border-t border-white/15 pt-4 text-lg font-bold text-white">
              <span>Total Due</span>
              <span className="text-teal-200">{formatCurrencyUsd(invoice.totals.totalUsd)}</span>
            </div>
          </section>

          <Button asChild className="w-full rounded-md font-medium" variant="outline" size="sm">
            <Link href={`/user/orders/${invoice.relatedOrderId}`}>View Related Order</Link>
          </Button>
        </aside>
      </div>
    </div>
  );
}
