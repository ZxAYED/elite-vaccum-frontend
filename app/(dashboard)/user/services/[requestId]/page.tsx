"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Calendar,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Cpu,
  FileCheck2,
  FileText,
  HelpCircle,
  Loader2,
  MapPin,
  MessageSquare,
  Phone,
  PowerOff,
  ShieldAlert,
  Sparkles,
  Star,
  Tag,
  Volume2,
  Wind,
  Wrench,
  Zap,
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
import { toast } from "sonner";
import type { QuoteStatus, ServiceRequest } from "@/types/domain";

// Helper to get an icon for common central vacuum symptoms
function getSymptomIcon(symptom: string) {
  const s = symptom.toLowerCase();
  if (s.includes("suction") || s.includes("clog") || s.includes("air")) return Wind;
  if (s.includes("shut off") || s.includes("turn on") || s.includes("power") || s.includes("electrical")) return PowerOff;
  if (s.includes("inlet") || s.includes("wall") || s.includes("valve")) return ShieldAlert;
  if (s.includes("hose") || s.includes("pipe") || s.includes("wand")) return Wrench;
  if (s.includes("noise") || s.includes("sound") || s.includes("motor")) return Volume2;
  return Tag;
}

export default function ServiceRequestDetailPage() {
  useSharedBusinessStoreVersion();
  const params = useParams<{ requestId: string }>();
  const requestId = params.requestId;

  const [copiedId, setCopiedId] = useState(false);

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

  function handleCopyId() {
    if (!requestId) return;
    navigator.clipboard.writeText(requestId);
    setCopiedId(true);
    toast.success("Request ID copied to clipboard");
    setTimeout(() => setCopiedId(false), 2000);
  }

  // 3. Loading Skeleton
  if (isLoading) {
    return (
      <div className="w-full space-y-8 px-4 py-8 sm:px-6 lg:px-8">
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
      <div className="w-full max-w-4xl space-y-6 px-4 py-8 sm:px-6">
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
  const rawTitle = request.title || reqAny.serviceName || service?.name || "Central Vacuum Maintenance & Repair";
  const cleanTitle = rawTitle.includes(" - ") ? rawTitle.split(" - ")[0].trim() : rawTitle;

  // Clean Problem Description
  const problemDesc =
    request.description ||
    reqAny.problemDescription ||
    "Customer requested inspection and comprehensive diagnostic check for system efficiency and air power restoration.";

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
    "Main Inlet Ports & Vacuum Tubing Network";

  return (
    <div className="w-full space-y-8 pb-12">
      {/* 1. TOP LUXURY HERO BANNER */}
      <section className="relative overflow-hidden rounded-3xl border border-teal-100 bg-gradient-to-br from-teal-950 via-teal-900 to-slate-900 p-6 text-white shadow-xl sm:p-8">
        {/* Subtle decorative background circles */}
        <div className="pointer-events-none absolute -right-20 -top-20 size-80 rounded-full bg-teal-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 left-1/3 size-64 rounded-full bg-emerald-500/10 blur-3xl" />

        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            {/* Badges Bar */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={handleCopyId}
                title="Click to copy ID"
                className="group inline-flex items-center gap-1.5 rounded-full border border-teal-500/30 bg-teal-900/60 px-3 py-1 font-mono text-xs font-semibold text-teal-200 backdrop-blur-md transition hover:border-teal-400 hover:bg-teal-800"
              >
                <span>ID: {request.id.slice(0, 18)}...</span>
                {copiedId ? (
                  <Check size={12} className="text-emerald-400" />
                ) : (
                  <Copy size={12} className="opacity-70 group-hover:opacity-100" />
                )}
              </button>

              <StatusBadge status={request.status} />

              {request.urgency && (
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/20 px-3 py-0.5 text-xs font-bold uppercase tracking-wider text-amber-300">
                  <Zap size={12} />
                  {request.urgency} Priority
                </span>
              )}
            </div>

            {/* Main Title */}
            <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl lg:text-4xl">
              {cleanTitle}
            </h1>

            {/* Quick Metadata Strip */}
            <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-teal-100/80 sm:text-sm">
              <div className="flex items-center gap-2">
                <CalendarDays size={16} className="text-teal-400" />
                <span>
                  Submitted:{" "}
                  <strong className="text-white">
                    {request.submittedAt || reqAny.createdAt
                      ? formatShortDateTime(request.submittedAt || reqAny.createdAt || "")
                      : "Recently submitted"}
                  </strong>
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Clock size={16} className="text-teal-400" />
                <span>
                  Preferred Slot:{" "}
                  <strong className="text-white">{requestedSchedule}</strong>
                </span>
              </div>

              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-teal-400" />
                <span className="truncate max-w-xs">
                  Property: <strong className="text-white">{displayStreet}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-3">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="rounded-full border-teal-500/40 bg-teal-900/40 text-white backdrop-blur-sm hover:bg-teal-800 hover:text-white"
            >
              <Link href="/user/services">
                <ArrowLeft size={15} className="mr-1.5" />
                All Requests
              </Link>
            </Button>
            <Button
              asChild
              size="sm"
              className="rounded-full bg-emerald-500 text-teal-950 font-bold hover:bg-emerald-400 shadow-lg shadow-emerald-950/40"
            >
              <Link href="/user/billing">
                <FileText size={15} className="mr-1.5" />
                Related Invoices
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* 2. KEY METRICS HIGHLIGHT BAR */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Requested Window */}
        <div className="flex items-center gap-4 rounded-2xl border border-teal-100/80 bg-white p-5 shadow-[0_4px_20px_-8px_rgba(20,80,80,0.08)]">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
            <Clock size={22} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Requested Window
            </p>
            <p className="mt-0.5 text-sm font-extrabold text-slate-900 truncate">
              {requestedSchedule}
            </p>
          </div>
        </div>

        {/* Card 2: Confirmed Schedule */}
        <div className="flex items-center gap-4 rounded-2xl border border-teal-100/80 bg-white p-5 shadow-[0_4px_20px_-8px_rgba(20,80,80,0.08)]">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
            <Calendar size={22} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">
              Confirmed Schedule
            </p>
            <p className="mt-0.5 text-sm font-extrabold text-teal-950 truncate">
              {currentSchedule}
            </p>
          </div>
        </div>

        {/* Card 3: Service Type */}
        <div className="flex items-center gap-4 rounded-2xl border border-teal-100/80 bg-white p-5 shadow-[0_4px_20px_-8px_rgba(20,80,80,0.08)]">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
            <Wrench size={22} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Service Type
            </p>
            <p className="mt-0.5 text-sm font-extrabold text-slate-900 truncate" title={cleanTitle}>
              {cleanTitle}
            </p>
          </div>
        </div>

        {/* Card 4: Quotation Amount */}
        <div className="flex items-center gap-4 rounded-2xl border border-teal-100/80 bg-white p-5 shadow-[0_4px_20px_-8px_rgba(20,80,80,0.08)]">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
            <FileCheck2 size={22} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Quotation Status
            </p>
            <p className="mt-0.5 text-sm font-extrabold text-teal-900">
              {quotation
                ? formatCurrencyUsd(quotation.totalUsd)
                : "Under Diagnostic Review"}
            </p>
          </div>
        </div>
      </section>

      {/* 3. MAIN DASHBOARD GRID (8 Cols Left / 4 Cols Right) */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* LEFT COLUMN: Main Case Details & Workflow (8 Cols) */}
        <div className="space-y-8 lg:col-span-8">
          
          {/* A. DIAGNOSTIC PIPELINE / QUOTATION SECTION */}
          <section className="overflow-hidden rounded-3xl border border-teal-100 bg-white shadow-[0_6px_30px_-12px_rgba(20,80,80,0.1)]">
            {quotation ? (
              /* ACTIVE QUOTATION PANEL */
              <div className="p-6 sm:p-8 bg-gradient-to-b from-amber-50/50 via-white to-white">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-amber-200/70 pb-5">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-900">
                        <FileText size={13} />
                        Official Quotation
                      </span>
                      <StatusBadge status={quotation.status} />
                    </div>
                    <h2 className="text-3xl font-black text-slate-900">
                      {formatCurrencyUsd(quotation.totalUsd)}
                    </h2>
                    <p className="text-xs text-slate-500">
                      Quote Ref: <span className="font-mono font-bold text-amber-950">{quotation.id}</span>
                      {quotation.expiresAt ? ` · Guaranteed through ${formatLongDate(quotation.expiresAt)}` : ""}
                    </p>
                  </div>

                  <Button asChild variant="outline" size="sm" className="rounded-full border-amber-300 bg-white text-amber-900 hover:bg-amber-50">
                    <Link href={`/user/quotations/${quotation.id}`}>
                      <FileText size={14} className="mr-1.5" />
                      Detailed View
                    </Link>
                  </Button>
                </div>

                {/* Line Items Table */}
                <div className="mt-6 space-y-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Itemized Diagnostics, Genuine Parts & Certified Labor
                  </p>
                  {quotation.lineItems && quotation.lineItems.length > 0 ? (
                    <div className="divide-y divide-amber-100 rounded-2xl border border-amber-200/60 bg-amber-50/30 overflow-hidden">
                      {quotation.lineItems.map((item, idx) => {
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
                            className="flex items-center justify-between p-4 bg-white hover:bg-amber-50/40 transition"
                          >
                            <div className="space-y-0.5">
                              <p className="text-sm font-bold text-slate-900">{label}</p>
                              {desc && <p className="text-xs text-slate-500">{desc}</p>}
                              {lineAny.quantity ? (
                                <p className="text-xs font-semibold text-amber-800">
                                  Qty: {String(lineAny.quantity)}
                                  {lineAny.unitPriceUsd ? ` × ${formatCurrencyUsd(Number(lineAny.unitPriceUsd))}` : ""}
                                </p>
                              ) : null}
                            </div>
                            <span className="text-sm font-extrabold text-slate-900">
                              {formatCurrencyUsd(amount)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">Standard system diagnostic service package.</p>
                  )}
                </div>

                {/* Totals Calculation */}
                {(() => {
                  const quoteAny = quotation as unknown as Record<string, unknown>;
                  const discountVal = quoteAny.discountUsd ? Number(quoteAny.discountUsd) : undefined;
                  const taxVal = quoteAny.taxUsd ? Number(quoteAny.taxUsd) : undefined;

                  return (
                    <div className="mt-5 rounded-2xl bg-white p-5 border border-amber-200/80 space-y-2.5 text-xs sm:text-sm">
                      {quotation.subtotalUsd && (
                        <div className="flex justify-between text-slate-600">
                          <span>Subtotal Parts & Labor</span>
                          <span className="font-semibold">{formatCurrencyUsd(quotation.subtotalUsd)}</span>
                        </div>
                      )}
                      {discountVal ? (
                        <div className="flex justify-between text-emerald-600 font-bold">
                          <span>Special Discount</span>
                          <span>-{formatCurrencyUsd(discountVal)}</span>
                        </div>
                      ) : null}
                      {taxVal ? (
                        <div className="flex justify-between text-slate-600">
                          <span>Estimated Tax</span>
                          <span className="font-semibold">{formatCurrencyUsd(taxVal)}</span>
                        </div>
                      ) : null}
                      <div className="border-t border-slate-200 pt-3 flex justify-between text-base font-black text-slate-900">
                        <span>Total Quotation</span>
                        <span className="text-teal-900">{formatCurrencyUsd(quotation.totalUsd)}</span>
                      </div>
                    </div>
                  );
                })()}

                {quotation.notes && (
                  <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-950">
                    <strong className="text-amber-900">Estimator Note:</strong> {quotation.notes}
                  </div>
                )}

                {/* Decision Panel */}
                <div className="mt-6">
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
              </div>
            ) : (
              /* DIAGNOSTIC PROGRESS STEPPER (When Quotation is Under Review) */
              <div className="p-6 sm:p-8">
                <div className="flex items-start gap-4">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-teal-100 text-teal-800 shadow-sm">
                    <Sparkles size={24} />
                  </div>
                  <div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-teal-100 px-3 py-0.5 text-xs font-bold uppercase tracking-wider text-teal-800">
                      Phase 1: In Diagnostic Review
                    </span>
                    <h2 className="mt-1 text-xl font-extrabold text-slate-900 sm:text-2xl">
                      Diagnostic Review & Quotation Preparation
                    </h2>
                    <p className="mt-1 text-sm text-slate-600 leading-relaxed max-w-2xl">
                      Our certified central vacuum specialists are reviewing your reported symptoms, equipment model specifications, and uploaded media attachments. An itemized quote with parts, labor pricing, and confirmed dispatch time slots will appear here shortly.
                    </p>
                  </div>
                </div>

                {/* High-Fidelity Step Tracker */}
                <div className="mt-8 border-t border-slate-100 pt-6">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
                    Service Progression Workflow
                  </p>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Step 1 */}
                    <div className="rounded-2xl border border-teal-200 bg-teal-50/50 p-4">
                      <div className="flex items-center gap-2 text-xs font-bold text-teal-900">
                        <CheckCircle2 size={16} className="text-teal-600" />
                        1. Intake Received
                      </div>
                      <p className="mt-1 text-xs text-slate-600">
                        Ticket submitted & queued
                      </p>
                    </div>

                    {/* Step 2 */}
                    <div className="rounded-2xl border-2 border-teal-500 bg-teal-50/90 p-4 shadow-sm relative overflow-hidden">
                      <div className="flex items-center gap-2 text-xs font-bold text-teal-950">
                        <Loader2 size={16} className="animate-spin text-teal-700" />
                        2. Triage & Review
                      </div>
                      <p className="mt-1 text-xs font-medium text-teal-800">
                        Diagnosing symptoms & specs
                      </p>
                    </div>

                    {/* Step 3 */}
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 opacity-70">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                        <FileText size={16} />
                        3. Itemized Quote
                      </div>
                      <p className="mt-1 text-xs text-slate-400">
                        Pricing & scope approval
                      </p>
                    </div>

                    {/* Step 4 */}
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 opacity-70">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                        <Calendar size={16} />
                        4. On-Site Dispatch
                      </div>
                      <p className="mt-1 text-xs text-slate-400">
                        Technician service visit
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* B. REPORTED ISSUE & SYMPTOMS */}
          <section className="rounded-3xl border border-teal-100/80 bg-white p-6 sm:p-8 shadow-[0_6px_30px_-12px_rgba(20,80,80,0.08)]">
            <div className="flex items-center gap-2.5 text-xs font-bold uppercase tracking-wider text-teal-800">
              <MessageSquare size={18} className="text-teal-600" />
              Customer Issue Description & Malfunction Notes
            </div>

            {/* Narrative description */}
            <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50/70 p-5">
              <p className="text-sm font-medium leading-relaxed text-slate-800 sm:text-base">
                &ldquo;{problemDesc}&rdquo;
              </p>
            </div>

            {/* Observed Symptoms Chips */}
            {reqAny.symptoms && reqAny.symptoms.length > 0 && (
              <div className="mt-6 border-t border-slate-100 pt-5">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Reported Malfunction Symptoms ({reqAny.symptoms.length})
                </p>
                <div className="flex flex-wrap gap-2.5">
                  {reqAny.symptoms.map((symptom: string, idx: number) => {
                    const SymptomIcon = getSymptomIcon(symptom);
                    return (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-2 rounded-xl border border-teal-200/70 bg-teal-50/80 px-3.5 py-2 text-xs font-bold text-teal-950 shadow-xs"
                      >
                        <SymptomIcon size={14} className="text-teal-700" />
                        {symptom.replace(/_/g, " ")}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </section>

          {/* C. SYSTEM HARDWARE PROFILE & PROPERTY SPECS (2 Side-by-Side Cards) */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Card 1: Equipment Profile */}
            <section className="rounded-3xl border border-teal-100/80 bg-white p-6 shadow-[0_6px_30px_-12px_rgba(20,80,80,0.08)]">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">
                <Cpu size={16} className="text-teal-600" />
                Central Vacuum Equipment Specs
              </div>

              <div className="space-y-3">
                <div className="flex justify-between rounded-xl bg-slate-50 p-3 text-xs sm:text-sm">
                  <span className="font-medium text-slate-500">Manufacturer / Brand</span>
                  <strong className="text-slate-900">{request.equipment?.manufacturer || "Generic Central Vac"}</strong>
                </div>

                <div className="flex justify-between rounded-xl bg-slate-50 p-3 text-xs sm:text-sm">
                  <span className="font-medium text-slate-500">Model Number</span>
                  <strong className="text-slate-900">{request.equipment?.modelNumber || "Not Specified"}</strong>
                </div>

                <div className="flex justify-between rounded-xl bg-slate-50 p-3 text-xs sm:text-sm">
                  <span className="font-medium text-slate-500">Serial Number</span>
                  <strong className="text-slate-900 font-mono">{request.equipment?.serialNumber || "N/A"}</strong>
                </div>

                <div className="flex justify-between rounded-xl bg-slate-50 p-3 text-xs sm:text-sm">
                  <span className="font-medium text-slate-500">Unit Installation Location</span>
                  <strong className="text-slate-900">{request.equipment?.unitLocation || "Garage / Utility Room"}</strong>
                </div>
              </div>
            </section>

            {/* Card 2: Property & Problem Location */}
            <section className="rounded-3xl border border-teal-100/80 bg-white p-6 shadow-[0_6px_30px_-12px_rgba(20,80,80,0.08)]">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">
                <MapPin size={16} className="text-teal-600" />
                Service Location & Problem Zone
              </div>

              <div className="space-y-3">
                <div className="rounded-xl bg-slate-50 p-3 text-xs sm:text-sm">
                  <span className="block font-medium text-slate-500 text-xs">Service Property</span>
                  <p className="mt-0.5 font-bold text-slate-900">{displayStreet}</p>
                  {displayRegion && <p className="text-xs text-slate-500">{displayRegion}</p>}
                </div>

                <div className="rounded-xl bg-slate-50 p-3 text-xs sm:text-sm">
                  <span className="block font-medium text-slate-500 text-xs">Affected Inlet Ports / Zone</span>
                  <p className="mt-0.5 font-bold text-teal-950">{problemLoc}</p>
                  <p className="text-xs text-slate-500">Reported trouble area</p>
                </div>
              </div>
            </section>
          </div>

          {/* D. INSPECTION MEDIA GALLERY (Reusable Component) */}
          <section className="rounded-3xl border border-teal-100/80 bg-white p-6 sm:p-8 shadow-[0_6px_30px_-12px_rgba(20,80,80,0.08)]">
            <ServiceMediaGallery
              attachments={request.attachments || []}
            />
          </section>
        </div>

        {/* RIGHT COLUMN: Sidebar Hub & Concierge (4 Cols) */}
        <div className="space-y-8 lg:col-span-4">
          {/* 1. APPOINTMENT & DISPATCH SUMMARY */}
          <section className="rounded-3xl border border-teal-100/80 bg-white p-6 shadow-[0_6px_30px_-12px_rgba(20,80,80,0.08)]">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-teal-800">
              <CalendarDays size={16} className="text-teal-600" />
              Service Appointment Status
            </div>

            <div className="mt-4 rounded-2xl bg-teal-50/60 border border-teal-100 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600">Selected Window</span>
                <span className="rounded-md bg-white px-2 py-0.5 text-xs font-bold text-teal-900 shadow-xs">
                  {requestedSchedule.split(" · ")[1] || "Flexible"}
                </span>
              </div>
              <p className="mt-2 text-base font-black text-slate-900">
                {requestedSchedule.split(" · ")[0] || requestedSchedule}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                A technician will confirm dispatch 30 minutes prior to arrival.
              </p>
            </div>
          </section>

          {/* 2. ASSIGNED TECHNICIAN CARD (if available) */}
          {technician && (
            <section className="rounded-3xl border border-teal-100/80 bg-white p-6 shadow-[0_6px_30px_-12px_rgba(20,80,80,0.08)]">
              <p className="text-xs font-bold uppercase tracking-wider text-teal-700">
                Assigned Central Vac Specialist
              </p>
              <div className="mt-3 flex items-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-teal-800 text-white font-black text-lg">
                  {technician.displayName.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    {technician.displayName}
                  </h3>
                  <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                    <Star className="size-3.5 fill-amber-400 text-amber-500" />
                    <strong className="text-slate-800">{technician.rating}</strong>
                    <span>({technician.completedJobs} completed jobs)</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-2 border-t border-slate-100 pt-3 text-xs">
                <div className="flex items-center gap-2 font-semibold text-slate-700">
                  <Phone size={14} className="text-teal-600" />
                  {technician.phone}
                </div>
                <div className="rounded-xl bg-teal-50 p-2.5 font-medium text-teal-900">
                  Certified: {technician.specializations.join(" · ")}
                </div>
              </div>
            </section>
          )}

          {/* 3. ACTIVITY LIFECYCLE TIMELINE */}
          <section className="rounded-3xl border border-teal-100/80 bg-white p-6 shadow-[0_6px_30px_-12px_rgba(20,80,80,0.08)]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Request Activity Timeline
            </h3>

            <div className="mt-5 relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-teal-100">
              {/* Event 1: Submission */}
              <div className="relative">
                <div className="absolute -left-6 top-0 flex size-5 items-center justify-center rounded-full bg-teal-600 text-white ring-4 ring-white">
                  <Check size={11} strokeWidth={3} />
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

              {/* Event 2: Quotation */}
              {quotation ? (
                <div className="relative">
                  <div className="absolute -left-6 top-0 flex size-5 items-center justify-center rounded-full bg-amber-500 text-white ring-4 ring-white">
                    <FileText size={11} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">Quotation Issued</p>
                    <p className="text-[11px] text-slate-500">
                      Total: {formatCurrencyUsd(quotation.totalUsd)} ({quotation.status})
                    </p>
                  </div>
                </div>
              ) : (
                <div className="relative opacity-60">
                  <div className="absolute -left-6 top-0 flex size-5 items-center justify-center rounded-full bg-slate-300 text-white ring-4 ring-white">
                    <Clock size={11} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-700">Awaiting Quotation</p>
                    <p className="text-[11px] text-slate-400">Technical diagnostics in review</p>
                  </div>
                </div>
              )}

              {/* Event 3: Service Order */}
              {serviceOrder ? (
                <div className="relative">
                  <div className="absolute -left-6 top-0 flex size-5 items-center justify-center rounded-full bg-emerald-600 text-white ring-4 ring-white">
                    <Check size={11} strokeWidth={3} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">Service Order Dispatched</p>
                    <p className="text-[11px] text-slate-500">Appointment locked with technician</p>
                  </div>
                </div>
              ) : null}
            </div>
          </section>

          {/* 4. CONCIERGE & SUPPORT CARD */}
          <section className="rounded-3xl border border-teal-900/20 bg-gradient-to-br from-teal-900 to-slate-900 p-6 text-white shadow-lg">
            <div className="flex items-center gap-2">
              <HelpCircle size={18} className="text-emerald-400" />
              <h3 className="text-sm font-extrabold text-white">Need Dedicated Assistance?</h3>
            </div>
            <p className="mt-2 text-xs text-teal-100/80 leading-relaxed">
              Have questions regarding your service intake ticket, hardware compatibility, or quotation? Our concierge support team is ready to help.
            </p>
            <div className="mt-5 space-y-2.5">
              <Button
                asChild
                className="w-full rounded-full bg-white text-teal-950 font-bold hover:bg-teal-50"
                size="sm"
              >
                <Link href="/contact">
                  <MessageSquare size={14} className="mr-1.5 text-teal-800" />
                  Message Support Team
                </Link>
              </Button>
              <Button
                asChild
                className="w-full rounded-full border-teal-700 bg-teal-800/40 text-teal-100 hover:bg-teal-800 hover:text-white"
                variant="outline"
                size="sm"
              >
                <Link href="/user/schedule">
                  <Calendar size={14} className="mr-1.5 text-teal-300" />
                  View All Appointments
                </Link>
              </Button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
