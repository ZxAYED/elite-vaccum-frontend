"use client";

import Link from "next/link";
import { ArrowRight, FileText } from "lucide-react";

import { PageHeader } from "@/components/customer-portal/PageHeader";
import { StatusBadge } from "@/components/customer-portal/StatusBadge";
import { Button } from "@/components/ui/Button";
import { getCustomerQuotations, getServiceById } from "@/data/mock/customer-portal";
import { useSharedBusinessStoreVersion } from "@/hooks/useSharedBusinessStoreVersion";
import { formatCurrencyUsd, formatMonthDay } from "@/lib/formatters";

export default function UserQuotationsPage() {
  useSharedBusinessStoreVersion();
  const quotations = getCustomerQuotations();

  return (
    <div className="min-h-screen">
      <PageHeader
        eyebrow="Quotations"
        title="Service Quotations"
        description="Review pricing prepared after admin review. Quotations stay connected to the original service request and schedule."
        actions={
          <Button asChild>
            <Link href="/services">Start new request</Link>
          </Button>
        }
      />

      <div className="space-y-5">
        {quotations.map(({ request, quote }) => {
          const service = getServiceById(request.serviceId);

          return (
            <article
              key={quote.id}
              className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm"
            >
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex size-11 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
                      <FileText size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-500">
                        {request.id}
                      </p>
                      <h2 className="text-2xl font-semibold text-gray-900">
                        {service?.name ?? request.title}
                      </h2>
                    </div>
                    <StatusBadge status={quote.status} />
                  </div>
                  <p className="mt-4 max-w-3xl text-sm leading-6 text-gray-600">
                    {request.description}
                  </p>
                  <p className="mt-3 text-sm text-gray-500">
                    Requested schedule:{" "}
                    <span className="font-semibold text-gray-900">
                      {request.requestedSchedule?.label ??
                        `${formatMonthDay(request.preferredDate)} at ${request.preferredTime}`}
                    </span>
                  </p>
                </div>

                <div className="w-full rounded-2xl bg-teal-50 p-5 lg:max-w-xs">
                  <p className="text-sm text-teal-700">Quote total</p>
                  <p className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-primary">
                    {formatCurrencyUsd(quote.totalUsd)}
                  </p>
                  {quote.expiresAt ? (
                    <p className="mt-2 text-sm text-gray-600">
                      Expires {formatMonthDay(quote.expiresAt)}
                    </p>
                  ) : null}
                  <Button asChild className="mt-5 w-full">
                    <Link href={`/user/quotations/${request.id}`}>
                      Review Quotation
                      <ArrowRight size={16} />
                    </Link>
                  </Button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
