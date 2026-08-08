import Link from "next/link";
import { CreditCard, RefreshCw, ShieldCheck, WalletCards } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/customer-portal/PageHeader";
import { StatusBadge } from "@/components/customer-portal/StatusBadge";
import {
  mockCustomerPaymentMethods,
  mockPaymentLedger,
} from "@/data/mock/customer-portal";
import { formatCurrencyUsd, formatLongDate } from "@/lib/formatters";

export default function PaymentsAndInvoices() {
  const outstandingBalance = mockPaymentLedger
    .filter((entry) => entry.status === "pending")
    .reduce((sum, entry) => sum + entry.amountUsd, 0);

  return (
    <div className="min-h-screen bg-gray-50/50">
      <PageHeader
        actions={
          <Button asChild variant="outline">
            <Link href="/user/orders">Open store orders</Link>
          </Button>
        }
        description="Billing history now distinguishes service invoices from product purchases so customers can review each flow clearly."
        eyebrow="Billing"
        title="Payments & Invoices"
      />

      <div className="mb-8 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-teal-700 to-teal-800 text-white shadow-xl">
          <div className="p-6 md:p-8">
            <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
              <div className="flex items-start gap-4">
                <div className="flex size-12 items-center justify-center rounded-xl border border-white/20 bg-white/15">
                  <CreditCard className="text-teal-200" size={24} />
                </div>

                <div>
                  <h2 className="mb-1 text-xl font-bold md:text-2xl">
                    Default payment method
                  </h2>
                  <div className="text-2xl font-semibold">
                    {mockCustomerPaymentMethods[0]?.brand} ending in{" "}
                    {mockCustomerPaymentMethods[0]?.last4}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-teal-100/90">
                    <span>Expires {mockCustomerPaymentMethods[0]?.expiryLabel}</span>
                    <div className="flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 backdrop-blur-sm">
                      <ShieldCheck className="text-teal-200" size={14} />
                      Secure billing profile
                    </div>
                  </div>
                </div>
              </div>

              <Button
                className="whitespace-nowrap rounded-xl border-white/30 bg-white/10 px-6 py-3 text-white shadow-sm hover:bg-white/20"
                variant="outline"
              >
                <RefreshCw size={18} />
                Update card
              </Button>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <WalletCards className="text-teal-700" size={24} />
            <StatusBadge status={outstandingBalance > 0 ? "pending" : "paid"} />
          </div>
          <p className="mt-6 text-sm uppercase tracking-[0.18em] text-gray-500">
            Outstanding balance
          </p>
          <p className="mt-2 text-3xl font-semibold text-gray-900">
            {formatCurrencyUsd(outstandingBalance)}
          </p>
          <p className="mt-3 text-sm text-gray-600">
            Pending charges are separated from completed receipts and will connect to backend processing later.
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-6 py-5">
          <h2 className="text-xl font-semibold text-gray-900">Billing history</h2>
          <p className="mt-1 text-sm text-gray-500">
            Service invoices and store purchases share one ledger but retain their own categories.
          </p>
        </div>

        <div className="divide-y divide-gray-100">
          {mockPaymentLedger.map((entry) => (
            <div
              className="flex flex-col gap-4 px-6 py-5 lg:flex-row lg:items-center lg:justify-between"
              key={entry.id}
            >
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="font-semibold text-gray-900">{entry.title}</h3>
                  <StatusBadge status={entry.status} />
                  <StatusBadge label={entry.category} status={entry.category} />
                </div>
                <p className="mt-2 text-sm text-gray-600">
                  {formatLongDate(entry.processedAt)} · {entry.detail}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4 lg:justify-end">
                <p className="font-semibold text-gray-900">
                  {formatCurrencyUsd(entry.amountUsd)}
                </p>
                <Button asChild variant="outline">
                  <Link href={entry.href}>Open</Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
