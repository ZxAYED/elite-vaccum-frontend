"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Cpu,
  FileText,
  HelpCircle,
  Loader2,
  MapPin,
  MessageSquare,
  Phone,
  Sparkles,
  Star,
  Tag,
  Wrench,
} from "lucide-react";

import { QuotationDecisionPanel } from "@/components/customer-portal/QuotationDecisionPanel";
import { ServiceMediaGallery } from "@/components/customer-portal/ServiceMediaGallery";
import { StatusBadge } from "@/components/customer-portal/StatusBadge";
import { Button } from "@/components/ui/Button";
import { useGetServiceRequestByIdQuery } from "@/redux/api/serviceRequestsApi";
import { useGetMyQuotationsQuery, useGetQuotationByIdQuery } from "@/redux/api/quotationsApi";
import { useGetMyServiceOrdersQuery } from "@/redux/api/serviceOrdersApi";
import {
  getServiceById,
  getServiceDetailByRequestId,
  getServiceRequestById,
  getTechnicianById,
} from "@/data/mock/customer-portal";
import { getDashboardServiceOrderByRequestId } from "@/data/mock/customer-dashboard";
import { getSharedServiceRequestById } from "@/data/mock/shared-business-store";
import { useSharedBusinessStoreVersion } from "@/hooks/useSharedBusinessStoreVersion";
import {
  formatCurrencyUsd,
  formatLongDate,
  formatMonthDay,
  formatShortDateTime,
} from "@/lib/formatters";
import type { QuoteStatus, ServiceRequest } from "@/types/domain";

export default function ServiceRequestDetailPage() {
  useSharedBusinessStoreVersion();
  const params = useParams<{ requestId: string }>();
  const requestId = params.requestId;

  // 1. Live RTK Queries
  const { data: apiRequest, isLoading: isLoadingRequest } =
    useGetServiceRequestByIdQuery(requestId, {
      skip: !requestId,
    });

  const { data: myQuotations } = useGetMyQuotationsQuery();

  const { data: singleQuote } = useGetQuotationByIdQuery(requestId, {
    skip: !requestId,
  });

  const { data: myOrdersResponse } = useGetMyServiceOrdersQuery();

  // 2. Mock Fallbacks
  const mockRequest = useMemo(
    () => getSharedServiceRequestById(requestId) || getServiceRequestById(requestId),
    [requestId],
  );
  const mockDetail = useMemo(
    () => getServiceDetailByRequestId(requestId),
    [requestId],
  );
  const mockOrder = useMemo(
    () => getDashboardServiceOrderByRequestId(requestId),
    [requestId],
  );

  // Active Request Object
  const request: ServiceRequest | undefined = useMemo(() => {
    if (apiRequest) return apiRequest;
    return mockRequest;
  }, [apiRequest, mockRequest]);

  // Matching Quotation
  const quotation = useMemo(() => {
    if (singleQuote) return singleQuote;
    if (myQuotations && myQuotations.length > 0) {
      const match = myQuotations.find(
        (q) =>
          q.serviceRequestId === requestId ||
          q.id === requestId ||
          (q as unknown as { businessId?: string }).businessId === requestId,
      );
      if (match) return match;
    }
    return mockDetail?.quote;
  }, [singleQuote, myQuotations, requestId, mockDetail]);

  // Matching Service Order
  const serviceOrder = useMemo(() => {
    const orders = myOrdersResponse?.items || [];
    if (orders.length > 0) {
      const match = orders.find(
        (o) => o.serviceRequestId === requestId || o.id === requestId,
      );
      if (match) return match;
    }
    return mockOrder;
  }, [myOrdersResponse, requestId, mockOrder]);

  const isLoading = isLoadingRequest && !mockRequest;

  // 3. Loading Skeleton
  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" size="sm" className="rounded-full">
            <Link href="/user/services">
              <ArrowLeft size={15} />
              Back
            </Link>
          </Button>
          <div className="h-6 w-48 animate-pulse rounded-lg bg-slate-200" />
        </div>
        <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white py-24 shadow-sm">
          <Loader2 size={36} className="animate-spin text-teal-600" />
          <p className="mt-4 text-sm font-semibold text-slate-700">
            Loading Service Request #{requestId}...
          </p>
        </div>
      </div>
    );
  }

  // 4. Not Found Fallback
  if (!request) {
    return (
      <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6">
        <Button asChild variant="outline" size="sm" className="rounded-full">
          <Link href="/user/services">
            <ArrowLeft size={15} />
            Back to Service Requests
          </Link>
        </Button>
        <div className="rounded-3xl border border-dashed border-teal-200 bg-teal-50/30 p-12 text-center shadow-sm">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-teal-100 text-teal-800 shadow-sm">
            <Wrench size={24} />
          </div>
          <h2 className="mt-4 text-xl font-bold text-slate-900">
            Service Request Not Found
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
            We couldn’t find record #{requestId}. It may have been archived or belongs to another customer account.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button asChild size="pill">
              <Link href="/user/services">View My Requests</Link>
            </Button>
            <Button asChild variant="outline" size="pill">
              <Link href="/services">Book New Service</Link>
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
    problemLocation?: string;
    otherProblemLocation?: string;
    createdAt?: string;
    problemDescription?: string;
    symptoms?: string[];
    serviceName?: string;
  };

  const service = getServiceById(request.serviceId);
  const technician = getTechnicianById(
    mockDetail?.appointment?.technicianId ?? request.assignedTechnicianId,
  );

  // Clean Service Title (strip any appended address string)
  const rawTitle = request.title || reqAny.serviceName || service?.name || "Central Vacuum Service";
  const cleanTitle = rawTitle.includes(" - ") ? rawTitle.split(" - ")[0].trim() : rawTitle;

  // Clean Problem Description
  const problemDesc =
    request.description ||
    reqAny.problemDescription ||
    "No specific malfunction notes provided.";

  // Clean Schedule formatting
  const requestedSchedule =
    request.requestedSchedule?.label ??
    (request.preferredDate
      ? `${formatMonthDay(request.preferredDate)}${request.preferredTime ? ` · ${request.preferredTime}` : ""}`
      : "Pending schedule");

  const currentSchedule =
    request.currentSchedule?.label ?? requestedSchedule;

  // Clean Address (no "undefined" or weird placeholders)
  const line1 = request.serviceAddress?.line1 || reqAny.address || "";
  const city = request.serviceAddress?.city || reqAny.city || "";
  const state = request.serviceAddress?.state || reqAny.state || "";
  const zip = request.serviceAddress?.postalCode || reqAny.zipCode || "";
  const cityStateZip = [city, state, zip].filter(Boolean).join(", ");
  const displayStreet = line1 || cityStateZip || "Address on file";
  const displayRegion = line1 && cityStateZip ? cityStateZip : "";

  // Problem Location
  const problemLoc =
    request.problemLocation ||
    reqAny.problemLocation ||
    reqAny.otherProblemLocation ||
    "Main Inlet Ports / Whole System";

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6">
      {/* Top Header Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-5">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-md border border-teal-200/60">
              ID: {request.id}
            </span>
            <StatusBadge status={request.status} />
            {request.urgency && (
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                {request.urgency} Priority
              </span>
            )}
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            {cleanTitle}
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Submitted: {request.submittedAt || reqAny.createdAt ? formatShortDateTime(request.submittedAt || reqAny.createdAt || "") : "Recent"}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Button asChild variant="outline" size="sm" className="rounded-full">
            <Link href="/user/services">
              <ArrowLeft size={14} className="mr-1.5" />
              All Requests
            </Link>
          </Button>
          <Button asChild size="sm" className="rounded-full bg-teal-700 text-white hover:bg-teal-800">
            <Link href="/user/billing">
              <FileText size={14} className="mr-1.5" />
              Related Invoices
            </Link>
          </Button>
        </div>
      </div>

      {/* Main Grid: Left Primary Content (65%) | Right Sidebar (35%) */}
      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Key Metrics Row */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Requested Time
              </p>
              <p className="mt-1 text-sm font-bold text-slate-900 leading-snug">
                {requestedSchedule}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
              <p className="text-[11px] font-bold uppercase tracking-wider text-teal-700">
                Active Schedule
              </p>
              <p className="mt-1 text-sm font-bold text-teal-950 leading-snug">
                {currentSchedule}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Service Type
              </p>
              <p className="mt-1 text-sm font-bold text-slate-900 truncate" title={cleanTitle}>
                {cleanTitle}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Quotation Status
              </p>
              <p className="mt-1 text-sm font-bold text-teal-800">
                {quotation
                  ? formatCurrencyUsd(quotation.totalUsd)
                  : "Under Review"}
              </p>
            </div>
          </div>

          {/* Reported Issue Description Card */}
          <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-teal-800">
              <MessageSquare size={16} className="text-teal-600" />
              Reported Issue & Diagnostics Notes
            </div>
            <div className="mt-3 rounded-2xl bg-slate-50 border border-slate-100 p-4">
              <p className="text-sm font-medium leading-relaxed text-slate-800">
                {problemDesc}
              </p>
            </div>

            {/* Reported Symptoms Tags */}
            {reqAny.symptoms && reqAny.symptoms.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Observed Malfunction Symptoms
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {reqAny.symptoms.map((symptom: string, idx: number) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 rounded-full border border-teal-100 bg-teal-50/70 px-3 py-1 text-xs font-semibold text-teal-900"
                    >
                      <Tag size={12} className="text-teal-600" />
                      {symptom.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Service Property & Unit Location Card */}
          <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600">
                  <MapPin size={15} className="text-teal-600" />
                  Service Property Address
                </div>
                <p className="mt-2 text-sm font-semibold text-slate-900">
                  {displayStreet}
                </p>
                {displayRegion && (
                  <p className="text-xs text-slate-500 mt-0.5">{displayRegion}</p>
                )}
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600">
                  <Wrench size={15} className="text-teal-600" />
                  Problem Location / Inlets
                </div>
                <p className="mt-2 text-sm font-semibold text-slate-900">
                  {problemLoc}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">Reported inlet zone</p>
              </div>
            </div>

            {/* Equipment Specs */}
            {request.equipment && (
              <div className="mt-4 border-t border-slate-100 pt-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600 mb-3">
                  <Cpu size={15} className="text-teal-600" />
                  Vacuum System Equipment Specifications
                </div>
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                  <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Manufacturer</span>
                    <p className="text-xs font-bold text-slate-900 mt-0.5">{request.equipment.manufacturer || "Unknown"}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Model</span>
                    <p className="text-xs font-bold text-slate-900 mt-0.5">{request.equipment.modelNumber || "N/A"}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Serial</span>
                    <p className="text-xs font-bold text-slate-900 mt-0.5">{request.equipment.serialNumber || "N/A"}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Unit Location</span>
                    <p className="text-xs font-bold text-slate-900 mt-0.5">{request.equipment.unitLocation || "Garage / Basement"}</p>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Inspection Photos & Videos Gallery (View Only) */}
          <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs">
            <ServiceMediaGallery
              attachments={request.attachments || []}
            />
          </section>

          {/* QUOTATION SECTION (Live Quotation or Polished Diagnostic Stepper) */}
          <div id="quotation-section">
            {quotation ? (
              <section className="rounded-3xl border-2 border-amber-300/80 bg-[linear-gradient(180deg,#FFFDF7_0%,#FEFBF2_100%)] p-6 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-amber-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-amber-100 px-3 py-0.5 text-xs font-bold uppercase tracking-wider text-amber-800">
                        Official Service Quotation
                      </span>
                      <StatusBadge status={quotation.status} />
                    </div>
                    <h2 className="mt-2 text-3xl font-extrabold text-slate-900">
                      {formatCurrencyUsd(quotation.totalUsd)}
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Quote ID: <span className="font-mono font-bold text-amber-900">{quotation.id}</span>
                      {quotation.expiresAt ? ` · Valid through ${formatLongDate(quotation.expiresAt)}` : ""}
                    </p>
                  </div>
                  <Button asChild variant="outline" size="sm" className="rounded-full border-amber-200 bg-white text-amber-900 hover:bg-amber-50">
                    <Link href={`/user/quotations/${quotation.id}`}>
                      <FileText size={14} className="mr-1.5" />
                      Full Quotation View
                    </Link>
                  </Button>
                </div>

                {/* Line items */}
                <div className="mt-5 space-y-2.5">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Itemized Diagnostics, Parts & Labor
                  </p>
                  {quotation.lineItems && quotation.lineItems.length > 0 ? (
                    quotation.lineItems.map((item, idx) => {
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
                          className="flex items-center justify-between rounded-xl border border-amber-100 bg-white p-3.5 shadow-xs"
                        >
                          <div>
                            <p className="text-sm font-bold text-slate-900">{label}</p>
                            {desc && <p className="text-xs text-slate-500">{desc}</p>}
                            {lineAny.quantity ? (
                              <p className="text-[11px] font-semibold text-amber-800">
                                Qty: {String(lineAny.quantity)}
                                {lineAny.unitPriceUsd ? ` × ${formatCurrencyUsd(Number(lineAny.unitPriceUsd))}` : ""}
                              </p>
                            ) : null}
                          </div>
                          <span className="text-sm font-bold text-slate-900">
                            {formatCurrencyUsd(amount)}
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-xs text-slate-500">Standard system diagnostic service.</p>
                  )}
                </div>

                {/* Totals */}
                {(() => {
                  const quoteAny = quotation as unknown as Record<string, unknown>;
                  const discountVal = quoteAny.discountUsd ? Number(quoteAny.discountUsd) : undefined;
                  const taxVal = quoteAny.taxUsd ? Number(quoteAny.taxUsd) : undefined;

                  return (
                    <div className="mt-5 rounded-2xl bg-white p-4 border border-amber-100 space-y-2 text-xs">
                      {quotation.subtotalUsd && (
                        <div className="flex justify-between text-slate-600">
                          <span>Subtotal</span>
                          <span className="font-semibold">{formatCurrencyUsd(quotation.subtotalUsd)}</span>
                        </div>
                      )}
                      {discountVal ? (
                        <div className="flex justify-between text-emerald-600 font-bold">
                          <span>Promotional Discount</span>
                          <span>-{formatCurrencyUsd(discountVal)}</span>
                        </div>
                      ) : null}
                      {taxVal ? (
                        <div className="flex justify-between text-slate-600">
                          <span>Applicable Tax</span>
                          <span className="font-semibold">{formatCurrencyUsd(taxVal)}</span>
                        </div>
                      ) : null}
                      <div className="border-t border-slate-100 pt-2.5 flex justify-between text-base font-extrabold text-slate-900">
                        <span>Total Quotation</span>
                        <span className="text-teal-800">{formatCurrencyUsd(quotation.totalUsd)}</span>
                      </div>
                    </div>
                  );
                })()}

                {quotation.notes && (
                  <div className="mt-4 rounded-xl border border-dashed border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-950">
                    <span className="font-bold">Estimator Note:</span> {quotation.notes}
                  </div>
                )}

                {/* Decision Panel */}
                <div className="mt-5">
                  <QuotationDecisionPanel
                    quotationId={quotation.id}
                    requestId={request.id}
                    initialStatus={quotation.status as QuoteStatus}
                    currentScheduleLabel={currentSchedule}
                    serviceOrderHref={
                      serviceOrder ? `/user/orders/${String((serviceOrder as unknown as Record<string, unknown>).id)}` : undefined
                    }
                  />
                </div>
              </section>
            ) : (
              /* Quotation in Preparation (Clean Diagnostic Stepper) */
              <section className="rounded-3xl border border-teal-100/90 bg-[linear-gradient(180deg,#F0FDFA_0%,#FFFFFF_100%)] p-6 shadow-xs">
                <div className="flex items-start gap-3.5">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-teal-100 text-teal-800 shadow-xs">
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <span className="rounded-full bg-teal-100/80 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-teal-800">
                      Diagnostics In Progress
                    </span>
                    <h2 className="mt-1.5 text-lg font-bold text-slate-900">
                      Quotation In Preparation
                    </h2>
                    <p className="mt-1 text-xs text-slate-600 leading-relaxed max-w-xl">
                      Our certified central vacuum specialists are reviewing your reported symptoms, equipment model details, and media attachments. An itemized quote with confirmed pricing and dispatch time slot options will appear right here.
                    </p>
                  </div>
                </div>

                {/* Refined Horizontal Step Progress */}
                <div className="mt-6 border-t border-teal-100/70 pt-5">
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <div className="rounded-xl border border-teal-200/70 bg-white p-3 shadow-xs">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-teal-800">
                        <CheckCircle2 size={14} className="text-teal-600" />
                        1. Submitted
                      </div>
                      <p className="mt-0.5 text-[11px] text-slate-500">Intake received</p>
                    </div>

                    <div className="rounded-xl border border-teal-300 bg-teal-50 p-3 shadow-xs">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-teal-950">
                        <Loader2 size={14} className="animate-spin text-teal-700" />
                        2. Reviewing
                      </div>
                      <p className="mt-0.5 text-[11px] text-teal-800">Diagnostic triage</p>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 shadow-xs opacity-75">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                        <FileText size={14} />
                        3. Quote
                      </div>
                      <p className="mt-0.5 text-[11px] text-slate-400">Parts & labor estimate</p>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 shadow-xs opacity-75">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                        <Calendar size={14} />
                        4. Dispatch
                      </div>
                      <p className="mt-0.5 text-[11px] text-slate-400">Technician visit</p>
                    </div>
                  </div>
                </div>
              </section>
            )}
          </div>
        </div>

        {/* Right Column: Timeline, Tech, Support */}
        <div className="space-y-6">
          {/* Assigned Field Tech Card */}
          {technician && (
            <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs">
              <p className="text-xs font-bold uppercase tracking-wider text-teal-700">
                Assigned Technician
              </p>
              <h3 className="mt-1 text-lg font-bold text-slate-900">
                {technician.displayName}
              </h3>
              <div className="mt-3 space-y-2 text-xs text-slate-700">
                <div className="flex items-center gap-2 font-medium">
                  <Phone size={14} className="text-teal-600" />
                  {technician.phone}
                </div>
                <div className="flex items-center gap-2 font-medium">
                  <Star className="fill-current text-amber-500" size={14} />
                  {technician.rating} rating · {technician.completedJobs} completed jobs
                </div>
                <div className="rounded-xl bg-teal-50/80 p-2.5 font-semibold text-teal-900">
                  {technician.specializations.join(" · ")}
                </div>
              </div>
            </section>
          )}

          {/* Activity Lifecycle Timeline */}
          <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Request Activity Timeline
            </h3>
            <div className="mt-4 space-y-4">
              <div className="flex gap-3">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-teal-100 text-teal-800 mt-0.5">
                  <CheckCircle2 size={14} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">Intake Request Submitted</p>
                  <p className="text-[11px] text-slate-500">
                    {request.submittedAt || reqAny.createdAt
                      ? formatShortDateTime(request.submittedAt || reqAny.createdAt || "")
                      : "Recently submitted"}
                  </p>
                </div>
              </div>

              {quotation ? (
                <div className="flex gap-3">
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-800 mt-0.5">
                    <FileText size={14} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">Quotation Issued</p>
                    <p className="text-[11px] text-slate-500">
                      Total: {formatCurrencyUsd(quotation.totalUsd)} ({quotation.status})
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex gap-3 opacity-60">
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-400 mt-0.5">
                    <Clock size={14} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-700">Awaiting Quotation</p>
                    <p className="text-[11px] text-slate-400">Diagnostics in review</p>
                  </div>
                </div>
              )}

              {serviceOrder ? (
                <div className="flex gap-3">
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 mt-0.5">
                    <CheckCircle2 size={14} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">Service Order Dispatched</p>
                    <p className="text-[11px] text-slate-500">Appointment locked with technician</p>
                  </div>
                </div>
              ) : null}
            </div>
          </section>

          {/* Need Help / Customer Support */}
          <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs">
            <div className="flex items-center gap-2">
              <HelpCircle size={16} className="text-teal-700" />
              <h3 className="text-sm font-bold text-slate-900">Need Assistance?</h3>
            </div>
            <p className="mt-1 text-xs text-slate-500 leading-relaxed">
              Have questions regarding your service intake ticket or quotation? Our support team is here to assist.
            </p>
            <div className="mt-4 space-y-2">
              <Button asChild className="w-full rounded-full" variant="outline" size="sm">
                <Link href="/contact">Message Support Team</Link>
              </Button>
              <Button asChild className="w-full rounded-full" variant="outline" size="sm">
                <Link href="/user/schedule">View Complete Schedule</Link>
              </Button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
