"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import {
  ArrowLeft,
  CalendarDays,
  FileText,
  Loader2,
  MapPin,
} from "lucide-react";

import { PageHeader } from "@/components/customer-portal/PageHeader";
import { QuotationDecisionPanel } from "@/components/customer-portal/QuotationDecisionPanel";
import { StatusBadge } from "@/components/customer-portal/StatusBadge";
import { Button } from "@/components/ui/Button";
import { useGetMyQuotationsQuery, useGetQuotationByIdQuery } from "@/redux/api/quotationsApi";
import { useGetServiceRequestByIdQuery } from "@/redux/api/serviceRequestsApi";
import { useGetMyServiceOrdersQuery } from "@/redux/api/serviceOrdersApi";
import { getDashboardServiceOrderByRequestId } from "@/data/mock/customer-dashboard";
import {
  getCustomerQuotationByRequestId,
  getServiceById,
} from "@/data/mock/customer-portal";
import { useSharedBusinessStoreVersion } from "@/hooks/useSharedBusinessStoreVersion";
import {
  formatCurrencyUsd,
  formatLongDate,
  formatMonthDay,
} from "@/lib/formatters";
import type { QuoteStatus } from "@/types/domain";

export default function QuotationDetailPage() {
  useSharedBusinessStoreVersion();
  const params = useParams<{ requestId: string }>();
  const idOrRequestId = params.requestId;

  // 1. Live RTK Queries
  const { data: myQuotations, isLoading: isLoadingMyQuotes } =
    useGetMyQuotationsQuery();
  const { data: singleQuote, isLoading: isLoadingSingleQuote } =
    useGetQuotationByIdQuery(idOrRequestId, {
      skip: !idOrRequestId,
    });
  const { data: myOrdersResponse } = useGetMyServiceOrdersQuery();

  // Find matching quotation from API
  const apiQuotation = useMemo(() => {
    if (singleQuote) return singleQuote;
    if (myQuotations && myQuotations.length > 0) {
      return myQuotations.find(
        (q) => q.id === idOrRequestId || q.serviceRequestId === idOrRequestId,
      );
    }
    return undefined;
  }, [singleQuote, myQuotations, idOrRequestId]);

  const targetRequestId = apiQuotation?.serviceRequestId || idOrRequestId;

  // Service Request Query
  const { data: apiRequest } = useGetServiceRequestByIdQuery(targetRequestId, {
    skip: !targetRequestId,
  });

  // Mock Fallback
  const mockRecord = useMemo(
    () => getCustomerQuotationByRequestId(idOrRequestId),
    [idOrRequestId],
  );

  const quote = apiQuotation || mockRecord?.quote;
  const request = apiRequest || mockRecord?.request;

  const mockOrder = useMemo(
    () => getDashboardServiceOrderByRequestId(targetRequestId),
    [targetRequestId],
  );

  const serviceOrder = useMemo(() => {
    const orders = myOrdersResponse?.items || [];
    if (orders.length > 0) {
      const match = orders.find(
        (o) => o.serviceRequestId === targetRequestId || o.id === targetRequestId,
      );
      if (match) return match;
    }
    return mockOrder;
  }, [myOrdersResponse, targetRequestId, mockOrder]);

  const isLoading = (isLoadingMyQuotes || isLoadingSingleQuote) && !mockRecord;

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <PageHeader
          eyebrow="Quotation Review"
          title="Loading quotation..."
          description="Fetching live itemized quote details from the server."
          actions={
            <Button asChild variant="outline">
              <Link href="/user/quotations">
                <ArrowLeft size={16} />
                Back to quotations
              </Link>
            </Button>
          }
        />
        <div className="flex flex-col items-center justify-center py-24 text-teal-700">
          <Loader2 size={40} className="animate-spin" />
          <p className="mt-4 text-sm font-medium text-slate-600">
            Loading quote #{idOrRequestId}...
          </p>
        </div>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="min-h-screen">
        <PageHeader
          eyebrow="Quotation Review"
          title="Quotation Not Found"
          description="We could not locate the requested quotation record."
          actions={
            <Button asChild variant="outline">
              <Link href="/user/quotations">
                <ArrowLeft size={16} />
                Back to quotations
              </Link>
            </Button>
          }
        />
        <div className="rounded-3xl border border-dashed border-teal-200 bg-teal-50/30 p-12 text-center">
          <FileText size={40} className="mx-auto text-teal-700 opacity-60" />
          <h2 className="mt-4 text-xl font-bold text-slate-900">
            No Quotation Available
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
            Quotation #{idOrRequestId} was not found or is still being prepared by Elite technicians.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button asChild size="pill">
              <Link href="/user/quotations">View All Quotations</Link>
            </Button>
            <Button asChild variant="outline" size="pill">
              <Link href="/user/services">My Service Requests</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const reqAny = request as unknown as {
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  };

  const service = request ? getServiceById(request.serviceId) : null;
  const currentSchedule =
    request?.currentSchedule?.label ??
    request?.requestedSchedule?.label ??
    (request?.preferredDate
      ? `${formatMonthDay(request.preferredDate)}${request.preferredTime ? ` at ${request.preferredTime}` : ""}`
      : "Pending scheduling");

  const requestedSchedule =
    request?.requestedSchedule?.label ??
    (request?.preferredDate
      ? `${formatMonthDay(request.preferredDate)}${request.preferredTime ? ` at ${request.preferredTime}` : ""}`
      : "Pending scheduling");

  const addressLine =
    request?.serviceAddress?.line1 || reqAny?.address || "Address on file";
  const cityStateZip =
    request?.serviceAddress
      ? `${request.serviceAddress.city}, ${request.serviceAddress.state} ${request.serviceAddress.postalCode}`
      : reqAny?.city
        ? `${reqAny.city}, ${reqAny.state || ""} ${reqAny.zipCode || ""}`.trim()
        : "";

  return (
    <div className="min-h-screen">
      <PageHeader
        eyebrow={`Quotation ${quote.id}`}
        title={service?.name ?? request?.title ?? "Central Vacuum Quotation"}
        description="This quotation was prepared after diagnostic intake review and remains connected to the active service request."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="pill">
              <Link href="/user/quotations">
                <ArrowLeft size={16} />
                Back to quotations
              </Link>
            </Button>
            {request && (
              <Button asChild size="pill">
                <Link href={`/user/services/${request.id}`}>Open Service Request</Link>
              </Button>
            )}
          </div>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.85fr]">
        <div className="space-y-6">
          <section className="rounded-3xl border border-teal-100/80 bg-white p-6 shadow-[0_12px_36px_-24px_rgba(28,79,80,0.15)]">
            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge status={quote.status} />
              {request?.status && <StatusBadge status={request.status} />}
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl bg-teal-50/50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Request ID
                </p>
                <p className="mt-2 font-mono font-semibold text-slate-900">
                  {request?.id || targetRequestId}
                </p>
              </div>
              <div className="rounded-2xl bg-teal-50/50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Requested Schedule
                </p>
                <p className="mt-2 font-semibold text-slate-900">
                  {requestedSchedule}
                </p>
              </div>
              <div className="rounded-2xl bg-teal-50/50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-teal-800">
                  Current Schedule
                </p>
                <p className="mt-2 font-semibold text-slate-900">
                  {currentSchedule}
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-teal-100 p-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-teal-800">
                  <MapPin size={16} />
                  Service Location
                </div>
                <p className="mt-3 text-sm leading-relaxed text-slate-700">
                  {addressLine}
                  {cityStateZip && (
                    <>
                      <br />
                      {cityStateZip}
                    </>
                  )}
                </p>
              </div>
              <div className="rounded-2xl border border-teal-100 p-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-teal-800">
                  <CalendarDays size={16} />
                  Schedule Note
                </div>
                <p className="mt-3 text-sm leading-relaxed text-slate-700">
                  Accepting this quotation will automatically confirm the technician dispatch order.
                </p>
              </div>
            </div>
          </section>

          {/* Line items section */}
          <section className="rounded-3xl border border-teal-100/80 bg-white p-6 shadow-[0_12px_36px_-24px_rgba(28,79,80,0.15)]">
            <div className="flex items-center gap-3">
              <FileText className="text-teal-700" size={22} />
              <h2 className="text-xl font-bold text-slate-900">
                Itemized Services & Parts
              </h2>
            </div>
            <div className="mt-6 space-y-3">
              {quote.lineItems && quote.lineItems.length > 0 ? (
                quote.lineItems.map((item, idx) => {
                  const lineAny = item as Record<string, unknown>;
                  const label = String(lineAny.label || lineAny.description || `Item #${idx + 1}`);
                  const desc = typeof lineAny.description === "string" && lineAny.label ? lineAny.description : null;
                  const amount = Number(lineAny.amountUsd || (Number(lineAny.unitPriceUsd || 0) * Number(lineAny.quantity || 1)));

                  return (
                    <div
                      key={String(lineAny.id || idx)}
                      className="flex items-start justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50/50 px-4 py-4"
                    >
                      <div>
                        <p className="font-semibold text-slate-900">{label}</p>
                        {desc && (
                          <p className="mt-1 text-xs text-slate-500">{desc}</p>
                        )}
                        {lineAny.quantity ? (
                          <p className="mt-1 text-xs font-medium text-teal-700">
                            Qty: {String(lineAny.quantity)}
                            {lineAny.unitPriceUsd ? ` × ${formatCurrencyUsd(Number(lineAny.unitPriceUsd))}` : ""}
                          </p>
                        ) : null}
                      </div>
                      <p className="font-bold text-slate-900">
                        {formatCurrencyUsd(amount)}
                      </p>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                  Standard central vacuum service diagnostics package.
                </div>
              )}
            </div>

            {(() => {
              const quoteAny = quote as unknown as Record<string, unknown>;
              const discountVal = quoteAny.discountUsd ? Number(quoteAny.discountUsd) : undefined;
              const taxVal = quoteAny.taxUsd ? Number(quoteAny.taxUsd) : undefined;

              return (
                <div className="mt-6 border-t border-slate-100 pt-5 space-y-2 text-sm">
                  {quote.subtotalUsd ? (
                    <div className="flex justify-between text-slate-600">
                      <span>Subtotal</span>
                      <span>{formatCurrencyUsd(quote.subtotalUsd)}</span>
                    </div>
                  ) : null}
                  {discountVal ? (
                    <div className="flex justify-between text-emerald-600 font-medium">
                      <span>Discount</span>
                      <span>-{formatCurrencyUsd(discountVal)}</span>
                    </div>
                  ) : null}
                  {taxVal ? (
                    <div className="flex justify-between text-slate-600">
                      <span>Tax</span>
                      <span>{formatCurrencyUsd(taxVal)}</span>
                    </div>
                  ) : null}
                  <div className="mt-3 flex justify-between text-lg font-bold text-slate-900 border-t border-slate-100 pt-2">
                    <span>Total Amount</span>
                    <span className="text-teal-800">
                      {formatCurrencyUsd(quote.totalUsd)}
                    </span>
                  </div>
                </div>
              );
            })()}

            {quote.notes ? (
              <div className="mt-5 rounded-2xl border border-dashed border-teal-200 bg-teal-50/30 px-4 py-4 text-xs leading-relaxed text-teal-900">
                <span className="font-bold">Estimator Note:</span> {quote.notes}
              </div>
            ) : null}
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-3xl border border-teal-100/80 bg-white p-6 shadow-[0_12px_36px_-24px_rgba(28,79,80,0.15)]">
            <p className="text-xs font-bold uppercase tracking-wider text-teal-700">
              Quotation Summary
            </p>
            <p className="mt-3 text-4xl font-bold tracking-tight text-teal-900">
              {formatCurrencyUsd(quote.totalUsd)}
            </p>
            {quote.expiresAt ? (
              <p className="mt-2 text-xs text-slate-500">
                Valid until {formatLongDate(quote.expiresAt)}
              </p>
            ) : null}
          </section>

          <QuotationDecisionPanel
            quotationId={quote.id}
            requestId={request?.id || targetRequestId}
            initialStatus={quote.status as QuoteStatus}
            currentScheduleLabel={currentSchedule}
            serviceOrderHref={
              serviceOrder ? `/user/orders/${String((serviceOrder as unknown as Record<string, unknown>).id)}` : undefined
            }
          />
        </aside>
      </div>
    </div>
  );
}
