"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowRight, FileText, Loader2 } from "lucide-react";

import { PageHeader } from "@/components/customer-portal/PageHeader";
import { StatusBadge } from "@/components/customer-portal/StatusBadge";
import { Button } from "@/components/ui/Button";
import { useGetMyQuotationsQuery } from "@/redux/api/quotationsApi";
import { getCustomerQuotations, getServiceById } from "@/data/mock/customer-portal";
import { useSharedBusinessStoreVersion } from "@/hooks/useSharedBusinessStoreVersion";
import { formatCurrencyUsd, formatMonthDay } from "@/lib/formatters";

export default function UserQuotationsPage() {
  useSharedBusinessStoreVersion();
  const { data: apiQuotes, isLoading } = useGetMyQuotationsQuery();
  const mockQuotations = useMemo(() => getCustomerQuotations(), []);

  // Format quotes
  const displayQuotations = useMemo(() => {
    if (apiQuotes && apiQuotes.length > 0) {
      return apiQuotes.map((quote) => ({
        quote: {
          id: quote.id,
          totalUsd: quote.totalUsd,
          status: quote.status,
          expiresAt: quote.expiresAt || "",
        },
        request: {
          id: quote.serviceRequestId || quote.id,
          title: (quote as unknown as { serviceName?: string }).serviceName || "Central Vacuum Service",
          description: quote.notes || "Itemized service quotation prepared by Elite technicians.",
          preferredDate: undefined,
          preferredTime: undefined,
          requestedSchedule: undefined,
          serviceId: "vacuum-repair",
        },
      }));
    }
    return mockQuotations;
  }, [apiQuotes, mockQuotations]);

  return (
    <div className="min-h-screen">
      <PageHeader
        eyebrow="Quotations"
        title="Service Quotations"
        description="Review itemized pricing prepared by admin technicians. Quotations stay connected to the original service request and schedule."
        actions={
          <Button asChild size="pill">
            <Link href="/services">Start new request</Link>
          </Button>
        }
      />

      {isLoading && (
        <div className="flex items-center justify-center py-16 text-teal-700">
          <Loader2 size={32} className="animate-spin" />
          <span className="ml-3 text-sm font-medium text-slate-600">Loading quotations...</span>
        </div>
      )}

      {!isLoading && (
        <div className="space-y-5">
          {displayQuotations.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-teal-200 bg-teal-50/30 p-12 text-center">
              <FileText size={36} className="mx-auto text-teal-700 opacity-60" />
              <h2 className="mt-4 text-lg font-semibold text-slate-900">No quotations received yet</h2>
              <p className="mt-2 text-sm text-slate-600">
                Once our team reviews your service request, custom quotations will appear here for your approval.
              </p>
              <Button asChild size="pill" className="mt-6">
                <Link href="/services">Request a Service</Link>
              </Button>
            </div>
          ) : (
            displayQuotations.map(({ request, quote }) => {
              const service = getServiceById(request.serviceId);

              return (
                <article
                  key={quote.id}
                  className="rounded-3xl border border-teal-100/80 bg-white p-6 shadow-[0_12px_36px_-24px_rgba(28,79,80,0.15)] transition hover:border-teal-300"
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="flex size-11 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
                          <FileText size={20} />
                        </div>
                        <div>
                          <p className="font-mono text-sm font-bold text-teal-800">
                            {request.id}
                          </p>
                          <h2 className="text-2xl font-bold text-slate-900">
                            {service?.name ?? request.title}
                          </h2>
                        </div>
                        <StatusBadge status={quote.status} />
                      </div>
                      <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-600">
                        {request.description}
                      </p>
                      {request.requestedSchedule?.label || request.preferredDate ? (
                        <p className="mt-3 text-sm text-slate-500">
                          Requested schedule:{" "}
                          <span className="font-semibold text-slate-900">
                            {request.requestedSchedule?.label ??
                              `${formatMonthDay(request.preferredDate!)} at ${request.preferredTime}`}
                          </span>
                        </p>
                      ) : null}
                    </div>

                    <div className="w-full rounded-2xl bg-teal-50/70 p-5 lg:max-w-xs">
                      <p className="text-sm font-medium text-teal-800">Quote total</p>
                      <p className="mt-2 text-3xl font-bold tracking-[-0.04em] text-teal-900">
                        {formatCurrencyUsd(quote.totalUsd)}
                      </p>
                      {quote.expiresAt ? (
                        <p className="mt-2 text-xs text-slate-500">
                          Expires {formatMonthDay(quote.expiresAt)}
                        </p>
                      ) : null}
                      <Button asChild size="pill" className="mt-5 w-full">
                        <Link href={`/user/quotations/${request.id}`}>
                          Review Quotation
                          <ArrowRight size={16} />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
