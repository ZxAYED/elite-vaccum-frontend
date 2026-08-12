import Link from "next/link";
import { notFound } from "next/navigation";
import { Download, FileText, Package, Receipt, Wrench } from "lucide-react";

import {
  AdminPageHeader,
  AdminPageShell,
  AdminSurface,
} from "@/components/admin/AdminPageShell";
import { StatusBadge } from "@/components/customer-portal/StatusBadge";
import { TypeBadge } from "@/components/customer-portal/TypeBadge";
import { Button } from "@/components/ui/Button";
import { getBillingInvoiceById } from "@/data/mock/shared-billing";
import { formatCurrencyUsd, formatLongDate } from "@/lib/formatters";

interface AdminInvoiceDetailPageProps {
  params: Promise<{ invoiceId: string }>;
}

export default async function AdminInvoiceDetailPage({
  params,
}: AdminInvoiceDetailPageProps) {
  const { invoiceId } = await params;
  const invoice = getBillingInvoiceById(invoiceId);

  if (!invoice) {
    notFound();
  }

  return (
    <AdminPageShell>
      <AdminPageHeader
        eyebrow="Billing"
        title={invoice.id}
        description={`Related ${invoice.type.toLowerCase()} order ${invoice.relatedOrderId}.`}
        action={
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="outline">
              <Link href="/admin/financials">Back to billing</Link>
            </Button>
            <Button>
              <Download size={16} />
              Download Invoice
            </Button>
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <TypeBadge type={invoice.type} />
        <StatusBadge status={invoice.status} />
        <StatusBadge status={invoice.paymentStatus} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.25fr_0.9fr]">
        <AdminSurface className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                Created
              </p>
              <p className="mt-2 text-sm font-medium text-slate-900">
                {formatLongDate(invoice.createdAt)}
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                Customer
              </p>
              <p className="mt-2 text-sm font-medium text-slate-900">
                {invoice.customerName}
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                Related Order
              </p>
              <Link
                href={`/admin/orders/${invoice.relatedOrderId}`}
                className="mt-2 inline-flex text-sm font-medium text-primary hover:text-teal-700"
              >
                {invoice.relatedOrderId}
              </Link>
            </div>
          </div>

          <section>
            <div className="flex items-center gap-3">
              {invoice.type === "PRODUCT" ? (
                <Package className="text-teal-700" size={20} />
              ) : (
                <Wrench className="text-teal-700" size={20} />
              )}
              <h2 className="text-xl font-semibold text-slate-950">
                {invoice.type === "PRODUCT" ? "Product Items" : "Service Charges"}
              </h2>
            </div>

            <div className="mt-5 space-y-3">
              {invoice.lineItems.map((lineItem) => (
                <div
                  key={lineItem.id}
                  className="flex flex-col gap-3 rounded-xl border border-teal-100 p-4 sm:flex-row sm:items-start sm:justify-between"
                >
                  <div>
                    <p className="font-medium text-slate-900">{lineItem.label}</p>
                    {lineItem.description ? (
                      <p className="mt-1 text-sm text-slate-600">
                        {lineItem.description}
                      </p>
                    ) : null}
                    <div className="mt-2 flex flex-wrap gap-3 text-xs font-medium text-slate-500">
                      {lineItem.sku ? <span>SKU {lineItem.sku}</span> : null}
                      {lineItem.quantity ? <span>Qty {lineItem.quantity}</span> : null}
                      {lineItem.unitPriceUsd !== undefined ? (
                        <span>{formatCurrencyUsd(lineItem.unitPriceUsd)} each</span>
                      ) : null}
                    </div>
                  </div>
                  <p className="text-lg font-semibold text-primary">
                    {formatCurrencyUsd(lineItem.amountUsd)}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {invoice.type === "SERVICE" ? (
            <section className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                  Quoted Amount
                </p>
                <p className="mt-2 text-lg font-semibold text-slate-900">
                  {formatCurrencyUsd(invoice.quotedAmountUsd ?? 0)}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                  Final Invoice Amount
                </p>
                <p className="mt-2 text-lg font-semibold text-slate-900">
                  {formatCurrencyUsd(invoice.finalInvoiceAmountUsd ?? invoice.totals.totalUsd)}
                </p>
              </div>
            </section>
          ) : null}
        </AdminSurface>

        <div className="space-y-4">
          <AdminSurface className="space-y-4">
            <div className="flex items-center gap-3">
              <FileText className="text-teal-700" size={20} />
              <h2 className="text-xl font-semibold text-slate-950">Invoice Summary</h2>
            </div>

            <div className="space-y-3 text-sm text-slate-600">
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
              {invoice.totals.discountUsd ? (
                <div className="flex justify-between">
                  <span>Discount</span>
                  <span>-{formatCurrencyUsd(invoice.totals.discountUsd)}</span>
                </div>
              ) : null}
              <div className="flex justify-between border-t border-teal-100 pt-3 text-lg font-semibold text-slate-950">
                <span>Total</span>
                <span>{formatCurrencyUsd(invoice.totals.totalUsd)}</span>
              </div>
            </div>
          </AdminSurface>

          <AdminSurface className="space-y-4">
            <div className="flex items-center gap-3">
              <Receipt className="text-teal-700" size={20} />
              <h2 className="text-xl font-semibold text-slate-950">Billing Details</h2>
            </div>

            <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                Billing Address
              </p>
              <p className="mt-2 leading-6">
                {invoice.billingAddress.line1}
                <br />
                {invoice.billingAddress.city}, {invoice.billingAddress.state}{" "}
                {invoice.billingAddress.postalCode}
                <br />
                {invoice.billingAddress.country}
              </p>
            </div>

            <div className="grid gap-4">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                  Payment Reference
                </p>
                <p className="mt-2 text-sm font-medium text-slate-900">
                  {invoice.paymentReference ?? invoice.paymentId ?? "Pending payment"}
                </p>
              </div>
              {invoice.dueDate ? (
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                    Due Date
                  </p>
                  <p className="mt-2 text-sm font-medium text-slate-900">
                    {formatLongDate(invoice.dueDate)}
                  </p>
                </div>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-3">
              <Button asChild variant="outline">
                <Link href={`/admin/orders/${invoice.relatedOrderId}`}>View Order</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href={`/admin/customers/${invoice.customerId}`}>View Customer</Link>
              </Button>
            </div>
          </AdminSurface>
        </div>
      </div>
    </AdminPageShell>
  );
}

