"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowRight, FileText, Loader2 } from "lucide-react";

import { PageHeader } from "@/components/customer-portal/PageHeader";
import { StatusBadge } from "@/components/customer-portal/StatusBadge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
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
    <div className="space-y-6 pb-8">
      <PageHeader
        eyebrow="Quotations"
        title="Service Quotations"
        description="Review itemized pricing prepared by admin technicians. Quotations stay connected to the original service request and schedule."
        actions={
          <Button asChild size="sm" className="rounded-md font-medium">
            <Link href="/services">Start new request</Link>
          </Button>
        }
      />

      {isLoading && (
        <div className="flex items-center justify-center rounded-lg border border-slate-200 bg-white py-16 text-teal-700 shadow-xs">
          <Loader2 size={24} className="animate-spin" />
          <span className="ml-3 text-xs sm:text-sm font-medium text-slate-600">Loading quotations...</span>
        </div>
      )}

      {!isLoading && (
        <div className="space-y-4">
          {displayQuotations.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No quotations received yet"
              description="Once our team reviews your service request, custom itemized quotations will appear here for your review and approval."
              action={{
                label: "Request a Service",
                href: "/services",
              }}
              tone="card"
              className="py-12"
            />
          ) : (
            displayQuotations.map(({ request, quote }) => {
              const service = getServiceById(request.serviceId);

              return (
                <article
                  key={quote.id}
                  className="rounded-lg border border-slate-200 bg-white p-5 sm:p-6 shadow-xs transition hover:border-teal-400 hover:shadow-sm"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0 flex-1 space-y-2.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="flex size-8 items-center justify-center rounded-md border border-teal-200 bg-teal-50 text-teal-800 shadow-xs">
                          <FileText size={15} />
                        </div>
                        <span className="font-mono text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                          {request.id}
                        </span>
                        <StatusBadge status={quote.status} />
                      </div>

                      <h2 className="text-base sm:text-lg font-bold text-slate-900">
                        {service?.name ?? request.title}
                      </h2>

                      <p className="line-clamp-2 text-xs sm:text-sm leading-relaxed text-slate-600 font-normal">
                        {request.description}
                      </p>

                      {request.requestedSchedule?.label || request.preferredDate ? (
                        <p className="text-xs text-slate-500 pt-1">
                          Requested schedule:{" "}
                          <span className="font-semibold text-slate-800">
                            {request.requestedSchedule?.label ??
                              `${formatMonthDay(request.preferredDate!)} at ${request.preferredTime}`}
                          </span>
                        </p>
                      ) : null}
                    </div>

                    <div className="w-full rounded-md border border-amber-200/80 bg-amber-50/40 p-4 lg:max-w-xs space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wider text-amber-900">Quote Total</p>
                      <p className="text-2xl font-bold tracking-tight text-teal-950">
                        {formatCurrencyUsd(quote.totalUsd)}
                      </p>
                      {quote.expiresAt ? (
                        <p className="text-[11px] text-slate-500">
                          Guaranteed through {formatMonthDay(quote.expiresAt)}
                        </p>
                      ) : null}
                      <Button asChild size="sm" className="mt-3 w-full rounded-md font-medium">
                        <Link href={`/user/quotations/${request.id}`}>
                          Review Quotation
                          <ArrowRight size={14} className="ml-1.5" />
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
