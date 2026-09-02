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
import {
  formatCurrencyUsd,
  formatLongDate,
  formatMonthDay,
} from "@/lib/formatters";
import type { QuoteStatus } from "@/types/domain";

export default function QuotationDetailPage() {
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
  const quote = useMemo(() => {
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

  const targetRequestId = quote?.serviceRequestId || idOrRequestId;

  // Service Request Query
  const { data: request } = useGetServiceRequestByIdQuery(targetRequestId, {
    skip: !targetRequestId,
  });

  const serviceOrder = useMemo(() => {
    const orders = myOrdersResponse?.items || [];
    if (orders.length > 0) {
      return orders.find(
        (o) => o.serviceRequestId === targetRequestId || o.id === targetRequestId,
      );
    }
    return undefined;
  }, [myOrdersResponse, targetRequestId]);

  const isLoading = (isLoadingMyQuotes || isLoadingSingleQuote) && !quote;

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <PageHeader
          eyebrow="Quotation Review"
          title="Loading quotation details..."
          description="Fetching official diagnostic pricing breakdown from the server."
          actions={
            <Button asChild variant="outline" size="sm" className="rounded-md">
              <Link href="/user/quotations">
                <ArrowLeft size={14} className="mr-1.5" />
                Back to quotations
              </Link>
            </Button>
          }
        />
        <div className="flex flex-col items-center justify-center py-20 text-teal-700">
          <Loader2 size={36} className="animate-spin text-teal-600" />
          <p className="mt-3 text-sm font-medium text-slate-600">
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
              <Button asChild variant="outline" size="sm" className="rounded-md">
                <Link href="/user/quotations">
                  <ArrowLeft size={14} className="mr-1.5" />
                  Back to quotations
                </Link>
              </Button>
              <Button asChild size="sm" className="rounded-md">
                <Link href="/user/services">My Service Requests</Link>
              </Button>
            </div>
          }
        />
        <div className="rounded-xl border border-teal-100/90 bg-teal-50/30 p-8 text-center shadow-xs max-w-2xl mx-auto mt-6">
          <div className="flex size-12 items-center justify-center rounded-lg bg-teal-100 text-teal-800 mx-auto shadow-xs">
            <Sparkles size={24} />
          </div>
          <h2 className="mt-3.5 text-xl font-bold text-slate-900">
            Quotation Still In Preparation
          </h2>
          <p className="mx-auto mt-2 max-w-md text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
            Our certified central vacuum specialists are reviewing intake ticket #{idOrRequestId}. Once diagnostic calculations are completed, your full itemized estimate with parts & labor pricing will appear here.
          </p>
          <div className="mt-5 flex justify-center gap-3">
            <Button asChild size="sm" className="rounded-md">
              <Link href="/user/quotations">View All Quotations</Link>
            </Button>
            {targetRequestId && (
              <Button asChild variant="outline" size="sm" className="rounded-md">
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

  const rawTitle = request?.title ?? "Central Vacuum Quotation";
  const cleanTitle = rawTitle.includes(" - ") ? rawTitle.split(" - ")[0].trim() : rawTitle;

  const line1 = request?.serviceAddress?.line1 || reqAny?.address || "";
  const city = request?.serviceAddress?.city || reqAny?.city || "";
  const state = request?.serviceAddress?.state || reqAny?.state || "";
  const zip = request?.serviceAddress?.postalCode || reqAny?.zipCode || "";
  const cityStateZip = [city, state, zip].filter(Boolean).join(", ");
  const displayStreet = line1 || cityStateZip || "Address on file";
  const displayRegion = line1 && cityStateZip ? cityStateZip : "";

  return (
    <div className="min-h-screen space-y-6">
      <PageHeader
        eyebrow={`Quotation ID: ${quote.id}`}
        title={cleanTitle}
        description="This official quotation was generated following remote intake review and remains linked to your service ticket."
        actions={
          <div className="flex flex-wrap gap-2.5">
            <Button asChild variant="outline" size="sm" className="rounded-md">
              <Link href="/user/quotations">
                <ArrowLeft size={14} className="mr-1.5" />
                Back to quotations
              </Link>
            </Button>
            {request && (
              <Button asChild size="sm" className="rounded-md">
                <Link href={`/user/services/${request.id}`}>Open Service Request</Link>
              </Button>
            )}
          </div>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.85fr]">
        <div className="space-y-6">
          {/* Main Info Card */}
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex flex-wrap items-center gap-2.5 border-b border-slate-100 pb-4">
              <StatusBadge status={quote.status} />
              {request?.status && <StatusBadge status={request.status} />}
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-teal-100 bg-teal-50/40 p-3.5">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                  Linked Request ID
                </p>
                <p className="mt-1 font-mono text-sm font-semibold text-slate-900 truncate">
                  {request?.id || targetRequestId}
                </p>
              </div>
              <div className="rounded-lg border border-teal-100 bg-teal-50/40 p-3.5">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                  Requested Schedule
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {requestedSchedule}
                </p>
              </div>
              <div className="rounded-lg border border-teal-100 bg-teal-50/40 p-3.5">
                <p className="text-xs font-medium uppercase tracking-wider text-teal-800">
                  Current Schedule
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {currentSchedule}
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-3.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-teal-800">
                  <MapPin size={14} />
                  Service Property Address
                </div>
                <p className="mt-2 text-xs sm:text-sm font-medium leading-relaxed text-slate-800">
                  {displayStreet}
                  {displayRegion && (
                    <>
                      <br />
                      <span className="text-slate-600">{displayRegion}</span>
                    </>
                  )}
                </p>
              </div>
              <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-3.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-teal-800">
                  <CalendarDays size={14} />
                  Dispatch Note
                </div>
                <p className="mt-2 text-xs sm:text-sm font-medium leading-relaxed text-slate-800">
                  Accepting this quotation will immediately schedule the field technician for arrival.
                </p>
              </div>
            </div>
          </section>

          {/* Line items section */}
          <section className="rounded-xl border border-amber-200/80 bg-gradient-to-b from-amber-50/30 via-white to-white p-5 sm:p-6 shadow-xs">
            <div className="flex items-center gap-2.5 border-b border-amber-200/60 pb-3.5">
              <FileText className="text-amber-800" size={20} />
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Itemized Diagnostics, Parts & Labor
                </h2>
                <p className="text-xs text-slate-500 font-normal">Transparent pricing for parts and certified service hours</p>
              </div>
            </div>

            <div className="mt-5 space-y-2.5">
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
                      className="flex items-start justify-between gap-4 rounded-lg border border-amber-100 bg-white p-3.5 shadow-xs"
                    >
                      <div>
                        <p className="font-semibold text-slate-900 text-sm">{label}</p>
                        {desc && (
                          <p className="mt-0.5 text-xs text-slate-500 leading-relaxed font-normal">{desc}</p>
                        )}
                        {lineAny.quantity ? (
                          <p className="mt-1 text-xs font-medium text-amber-800">
                            Qty: {String(lineAny.quantity)}
                            {lineAny.unitPriceUsd
                              ? ` × ${formatCurrencyUsd(Number(lineAny.unitPriceUsd))}`
                              : ""}
                          </p>
                        ) : null}
                      </div>
                      <p className="font-semibold text-slate-900 text-sm">
                        {formatCurrencyUsd(amount)}
                      </p>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-lg bg-white p-3.5 text-xs text-slate-600 border border-amber-100 font-normal">
                  Standard central vacuum service diagnostics package.
                </div>
              )}
            </div>

            {(() => {
              const quoteAny = quote as unknown as Record<string, unknown>;
              const discountVal = quoteAny.discountUsd ? Number(quoteAny.discountUsd) : undefined;
              const taxVal = quoteAny.taxUsd ? Number(quoteAny.taxUsd) : undefined;

              return (
                <div className="mt-5 rounded-lg bg-white p-4 shadow-xs border border-amber-100 space-y-2 text-xs sm:text-sm">
                  {quote.subtotalUsd ? (
                    <div className="flex justify-between text-slate-600 font-medium">
                      <span>Subtotal</span>
                      <span className="font-semibold text-slate-800">{formatCurrencyUsd(quote.subtotalUsd)}</span>
                    </div>
                  ) : null}
                  {discountVal ? (
                    <div className="flex justify-between text-emerald-700 font-medium">
                      <span>Promotional Discount</span>
                      <span>-{formatCurrencyUsd(discountVal)}</span>
                    </div>
                  ) : null}
                  {taxVal ? (
                    <div className="flex justify-between text-slate-600 font-medium">
                      <span>Applicable Tax</span>
                      <span className="font-semibold text-slate-800">{formatCurrencyUsd(taxVal)}</span>
                    </div>
                  ) : null}
                  <div className="border-t border-slate-200 pt-2.5 flex justify-between text-base font-bold text-slate-900">
                    <span>Total Quotation Amount</span>
                    <span className="text-teal-900">
                      {formatCurrencyUsd(quote.totalUsd)}
                    </span>
                  </div>
                </div>
              );
            })()}

            {quote.notes ? (
              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3.5 text-xs leading-relaxed text-amber-950 font-medium">
                <span className="font-semibold text-amber-900">Estimator Technical Note:</span> {quote.notes}
              </div>
            ) : null}
          </section>

          {/* Related Media Gallery from Request (View Only) */}
          {request?.attachments && request.attachments.length > 0 && (
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
              <ServiceMediaGallery
                attachments={request.attachments}
              />
            </section>
          )}
        </div>

        {/* Right Sidebar: Summary and Decision Panel */}
        <aside className="space-y-6">
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
            <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">
              Quotation Summary
            </p>
            <p className="mt-2 text-3xl font-bold tracking-tight text-teal-900">
              {formatCurrencyUsd(quote.totalUsd)}
            </p>
            {quote.expiresAt ? (
              <p className="mt-1.5 text-xs font-medium text-slate-500">
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

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-md bg-teal-100 text-teal-800">
                <HelpCircle size={16} />
              </div>
              <div>
                <h2 className="text-xs font-semibold text-slate-900">Have Questions?</h2>
                <p className="text-[11px] text-slate-500 font-normal">Discuss quote details with our estimator</p>
              </div>
            </div>
            <div className="mt-3.5">
              <Button asChild className="w-full rounded-md" variant="outline" size="sm">
                <Link href="/contact">Message Support</Link>
              </Button>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
