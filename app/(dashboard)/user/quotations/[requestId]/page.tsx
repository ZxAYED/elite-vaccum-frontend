"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import {
  ArrowLeft,
  CalendarDays,
  FileText,
  HelpCircle,
  Loader2,
  MapPin,
  Sparkles,
} from "lucide-react";

import { PageHeader } from "@/components/customer-portal/PageHeader";
import { QuotationDecisionPanel } from "@/components/customer-portal/QuotationDecisionPanel";
import { ServiceMediaGallery } from "@/components/customer-portal/ServiceMediaGallery";
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
        (q) =>
          q.id === idOrRequestId ||
          q.serviceRequestId === idOrRequestId ||
          (q as unknown as { businessId?: string }).businessId === idOrRequestId,
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
          title="Loading quotation details..."
          description="Fetching official diagnostic pricing breakdown from the server."
          actions={
            <Button asChild variant="outline" size="pill">
              <Link href="/user/quotations">
                <ArrowLeft size={16} />
                Back to quotations
              </Link>
            </Button>
          }
        />
        <div className="flex flex-col items-center justify-center py-28 text-teal-700">
          <Loader2 size={44} className="animate-spin text-teal-600" />
          <p className="mt-4 text-sm font-semibold text-slate-700">
            Loading Quotation #{idOrRequestId}...
          </p>
        </div>
      </div>
    );
  }

  // Proper empty state if quote does not exist
  if (!quote) {
    return (
      <div className="min-h-screen">
        <PageHeader
          eyebrow="Quotation Review"
          title="Quotation In Preparation"
          description="We are preparing an itemized quote for your service intake request."
          actions={
            <div className="flex flex-wrap gap-2.5">
              <Button asChild variant="outline" size="pill">
                <Link href="/user/quotations">
                  <ArrowLeft size={16} />
                  Back to quotations
                </Link>
              </Button>
              <Button asChild size="pill">
                <Link href="/user/services">My Service Requests</Link>
              </Button>
            </div>
          }
        />
        <div className="rounded-3xl border border-teal-100/90 bg-[linear-gradient(180deg,#F0FDFA_0%,#FFFFFF_100%)] p-10 text-center shadow-sm max-w-2xl mx-auto mt-6">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-teal-100 text-teal-800 mx-auto shadow-sm">
            <Sparkles size={28} />
          </div>
          <h2 className="mt-4 text-2xl font-bold text-slate-900">
            Quotation Still In Preparation
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-600 leading-relaxed">
            Our certified central vacuum specialists are reviewing intake ticket #{idOrRequestId}. Once diagnostic calculations are completed, your full itemized estimate with parts & labor pricing will appear here.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button asChild size="pill">
              <Link href="/user/quotations">View All Quotations</Link>
            </Button>
            {targetRequestId && (
              <Button asChild variant="outline" size="pill">
                <Link href={`/user/services/${targetRequestId}`}>View Service Request</Link>
              </Button>
            )}
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
    problemLocation?: string;
    otherProblemLocation?: string;
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

  const streetAddress =
    request?.serviceAddress?.line1 || reqAny?.address || "Address on file";

  const cityVal = request?.serviceAddress?.city || reqAny?.city || "";
  const stateVal = request?.serviceAddress?.state || reqAny?.state || "";
  const zipVal = request?.serviceAddress?.postalCode || reqAny?.zipCode || "";
  const cityStateZip = [cityVal, stateVal, zipVal].filter(Boolean).join(", ");

  return (
    <div className="min-h-screen">
      <PageHeader
        eyebrow={`Quotation ID: ${quote.id}`}
        title={service?.name ?? request?.title ?? "Central Vacuum Quotation"}
        description="This official quotation was generated following remote intake review and remains linked to your service ticket."
        actions={
          <div className="flex flex-wrap gap-2.5">
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
          {/* Main Info Card */}
          <section className="rounded-3xl border border-teal-100/90 bg-white p-6 shadow-[0_12px_36px_-24px_rgba(28,79,80,0.15)]">
            <div className="flex flex-wrap items-center gap-2.5 border-b border-slate-100 pb-5">
              <StatusBadge status={quote.status} />
              {request?.status && <StatusBadge status={request.status} />}
            </div>

            <div className="mt-5 grid gap-3.5 sm:grid-cols-3">
              <div className="rounded-2xl border border-teal-50 bg-[linear-gradient(180deg,#F0FDFA_0%,#F8FAFC_100%)] p-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Linked Request ID
                </p>
                <p className="mt-1.5 font-mono text-sm font-bold text-slate-900">
                  {request?.id || targetRequestId}
                </p>
              </div>
              <div className="rounded-2xl border border-teal-50 bg-[linear-gradient(180deg,#F0FDFA_0%,#F8FAFC_100%)] p-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Requested Schedule
                </p>
                <p className="mt-1.5 text-sm font-bold text-slate-900">
                  {requestedSchedule}
                </p>
              </div>
              <div className="rounded-2xl border border-teal-50 bg-[linear-gradient(180deg,#F0FDFA_0%,#F8FAFC_100%)] p-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-teal-800">
                  Current Schedule
                </p>
                <p className="mt-1.5 text-sm font-bold text-slate-900">
                  {currentSchedule}
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-teal-800">
                  <MapPin size={15} />
                  Service Property Address
                </div>
                <p className="mt-2.5 text-sm font-medium leading-relaxed text-slate-800">
                  {streetAddress}
                  {cityStateZip && (
                    <>
                      <br />
                      <span className="text-slate-600">{cityStateZip}</span>
                    </>
                  )}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-teal-800">
                  <CalendarDays size={15} />
                  Dispatch Note
                </div>
                <p className="mt-2.5 text-sm font-medium leading-relaxed text-slate-800">
                  Accepting this quotation will immediately schedule the field technician for arrival.
                </p>
              </div>
            </div>
          </section>

          {/* Line items section */}
          <section className="rounded-3xl border-2 border-amber-300/80 bg-[linear-gradient(180deg,#FFFDF7_0%,#FEFBF2_100%)] p-6 shadow-sm">
            <div className="flex items-center gap-3 border-b border-amber-100 pb-4">
              <FileText className="text-amber-800" size={22} />
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Itemized Diagnostics, Parts & Labor
                </h2>
                <p className="text-xs text-slate-500">Transparent pricing for parts and certified service hours</p>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {quote.lineItems && quote.lineItems.length > 0 ? (
                quote.lineItems.map((item, idx) => {
                  const lineAny = item as unknown as Record<string, unknown>;
                  const label = String(lineAny.label || lineAny.description || `Service Item #${idx + 1}`);
                  const desc = typeof lineAny.description === "string" && lineAny.label ? lineAny.description : null;
                  const amount = Number(
                    lineAny.amountUsd ||
                      Number(lineAny.unitPriceUsd || 0) * Number(lineAny.quantity || 1),
                  );

                  return (
                    <div
                      key={String(lineAny.id || idx)}
                      className="flex items-start justify-between gap-4 rounded-2xl border border-amber-100/90 bg-white p-4 shadow-sm"
                    >
                      <div>
                        <p className="font-bold text-slate-900 text-sm">{label}</p>
                        {desc && (
                          <p className="mt-0.5 text-xs text-slate-500 leading-relaxed">{desc}</p>
                        )}
                        {lineAny.quantity ? (
                          <p className="mt-1.5 text-xs font-semibold text-amber-800">
                            Qty: {String(lineAny.quantity)}
                            {lineAny.unitPriceUsd
                              ? ` × ${formatCurrencyUsd(Number(lineAny.unitPriceUsd))}`
                              : ""}
                          </p>
                        ) : null}
                      </div>
                      <p className="font-bold text-slate-900 text-base">
                        {formatCurrencyUsd(amount)}
                      </p>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-2xl bg-white p-4 text-sm text-slate-600 border border-amber-100">
                  Standard central vacuum service diagnostics package.
                </div>
              )}
            </div>

            {(() => {
              const quoteAny = quote as unknown as Record<string, unknown>;
              const discountVal = quoteAny.discountUsd ? Number(quoteAny.discountUsd) : undefined;
              const taxVal = quoteAny.taxUsd ? Number(quoteAny.taxUsd) : undefined;

              return (
                <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm border border-amber-100 space-y-2.5 text-sm">
                  {quote.subtotalUsd ? (
                    <div className="flex justify-between text-slate-600 font-medium">
                      <span>Subtotal</span>
                      <span>{formatCurrencyUsd(quote.subtotalUsd)}</span>
                    </div>
                  ) : null}
                  {discountVal ? (
                    <div className="flex justify-between text-emerald-600 font-bold">
                      <span>Promotional Discount</span>
                      <span>-{formatCurrencyUsd(discountVal)}</span>
                    </div>
                  ) : null}
                  {taxVal ? (
                    <div className="flex justify-between text-slate-600 font-medium">
                      <span>Applicable Tax</span>
                      <span>{formatCurrencyUsd(taxVal)}</span>
                    </div>
                  ) : null}
                  <div className="border-t border-slate-100 pt-3 flex justify-between text-lg font-bold text-slate-900">
                    <span>Total Quotation Amount</span>
                    <span className="text-teal-800 font-extrabold">
                      {formatCurrencyUsd(quote.totalUsd)}
                    </span>
                  </div>
                </div>
              );
            })()}

            {quote.notes ? (
              <div className="mt-4 rounded-2xl border border-dashed border-amber-200 bg-amber-50/60 p-4 text-xs leading-relaxed text-amber-950">
                <span className="font-bold">Estimator Technical Note:</span> {quote.notes}
              </div>
            ) : null}
          </section>

          {/* Related Media Gallery from Request (View Only) */}
          {request?.attachments && request.attachments.length > 0 && (
            <section className="rounded-3xl border border-teal-100/90 bg-white p-6 shadow-[0_12px_36px_-24px_rgba(28,79,80,0.15)]">
              <ServiceMediaGallery
                attachments={request.attachments}
              />
            </section>
          )}
        </div>

        {/* Right Sidebar: Summary and Decision Panel */}
        <aside className="space-y-6">
          <section className="rounded-3xl border border-teal-100/90 bg-white p-6 shadow-[0_12px_36px_-24px_rgba(28,79,80,0.15)]">
            <p className="text-xs font-bold uppercase tracking-wider text-teal-700">
              Quotation Summary
            </p>
            <p className="mt-3 text-4xl font-bold tracking-tight text-teal-900">
              {formatCurrencyUsd(quote.totalUsd)}
            </p>
            {quote.expiresAt ? (
              <p className="mt-2 text-xs font-medium text-slate-500">
                Valid through {formatLongDate(quote.expiresAt)}
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

          <section className="rounded-3xl border border-teal-100 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                <HelpCircle size={18} />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Have Questions?</h2>
                <p className="text-xs text-slate-500">Discuss quote details with our estimator</p>
              </div>
            </div>
            <div className="mt-4">
              <Button asChild className="w-full" variant="outline" size="pill">
                <Link href="/contact">Message Support</Link>
              </Button>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
