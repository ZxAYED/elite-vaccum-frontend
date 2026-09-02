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
  PowerOff,
  ShieldAlert,
  Sparkles,
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
  formatCurrencyUsd,
  formatLongDate,
  formatMonthDay,
  formatShortDateTime,
} from "@/lib/formatters";
import { toast } from "sonner";
import type { AdminQuotation, QuoteStatus } from "@/types/domain";

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
  const params = useParams<{ requestId: string }>();
  const requestId = params.requestId;

  const [copiedId, setCopiedId] = useState(false);

  // 1. Live RTK Queries (Strictly API-driven, zero mock data)
  const { data: request, isLoading: isLoadingRequest } =
    useGetServiceRequestByIdQuery(requestId, {
      skip: !requestId,
    });

  const { data: myQuotations, isLoading: isLoadingQuotes } = useGetMyQuotationsQuery();

  const { data: singleQuote } = useGetQuotationByIdQuery(requestId, {
    skip: !requestId,
  });

  const { data: myOrdersResponse } = useGetMyServiceOrdersQuery();

  // 2. Resolve Active Quotation
  const quotation: AdminQuotation | undefined = useMemo(() => {
    const reqAny = request as unknown as Record<string, unknown>;
    if (reqAny?.quotation) return reqAny.quotation as AdminQuotation;
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
    return undefined;
  }, [request, singleQuote, myQuotations, requestId]);

  // 3. Resolve Matching Service Order
  const serviceOrder = useMemo(() => {
    const orders = myOrdersResponse?.items || [];
    return orders.find(
      (o) => o.serviceRequestId === requestId || o.id === requestId,
    );
  }, [myOrdersResponse, requestId]);

  const isLoading = isLoadingRequest || (isLoadingQuotes && !request);

  function handleCopyId() {
    if (!requestId) return;
    navigator.clipboard.writeText(requestId);
    setCopiedId(true);
    toast.success("Request ID copied to clipboard");
    setTimeout(() => setCopiedId(false), 2000);
  }

  // 4. Loading Skeleton
  if (isLoading) {
    return (
      <div className="w-full space-y-6 px-4 py-8 sm:px-6">
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" size="sm" className="rounded-md">
            <Link href="/user/services">
              <ArrowLeft size={14} className="mr-1.5" />
              Back
            </Link>
          </Button>
          <div className="h-6 w-48 animate-pulse rounded-md bg-slate-200" />
        </div>
        <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white py-20 shadow-xs">
          <Loader2 size={32} className="animate-spin text-teal-600" />
          <p className="mt-3 text-sm font-medium text-slate-600">
            Loading Service Request #{requestId}...
          </p>
        </div>
      </div>
    );
  }

  // 5. Not Found Fallback
  if (!request) {
    return (
      <div className="w-full max-w-4xl space-y-6 px-4 py-8 sm:px-6">
        <Button asChild variant="outline" size="sm" className="rounded-md">
          <Link href="/user/services">
            <ArrowLeft size={14} className="mr-1.5" />
            Back to Service Requests
          </Link>
        </Button>
        <div className="rounded-xl border border-dashed border-teal-200 bg-teal-50/40 p-10 text-center shadow-xs">
          <div className="mx-auto flex size-12 items-center justify-center rounded-lg bg-teal-100 text-teal-800 shadow-xs">
            <Wrench size={22} />
          </div>
          <h2 className="mt-3 text-lg font-semibold text-slate-900">
            Service Request Not Found
          </h2>
          <p className="mx-auto mt-1.5 max-w-md text-xs text-slate-600">
            We couldn’t find record #{requestId}. It may have been archived or belongs to another customer account.
          </p>
          <div className="mt-5 flex justify-center gap-3">
            <Button asChild size="sm" className="rounded-md">
              <Link href="/user/services">View My Requests</Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="rounded-md">
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

  // Clean Service Title (strip any appended address string)
  const rawTitle = request.title || reqAny.serviceName || "Central Vacuum Service Request";
  const cleanTitle = rawTitle.includes(" - ") ? rawTitle.split(" - ")[0].trim() : rawTitle;

  // Clean Problem Description
  const problemDesc =
    request.description ||
    reqAny.problemDescription ||
    "Customer requested inspection and diagnostic evaluation for central vacuum performance.";

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
    "Main Inlet Ports & Tubing Network";

  return (
    <div className="w-full space-y-6 pb-12">
      {/* 1. TOP HERO BANNER */}
      <section className="relative overflow-hidden rounded-xl border border-teal-900/60 bg-gradient-to-r from-teal-950 via-teal-900 to-slate-900 p-6 text-white shadow-md">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2.5">
            {/* Badges Bar */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleCopyId}
                title="Click to copy ID"
                className="group inline-flex items-center gap-1.5 rounded-md border border-teal-500/40 bg-teal-900/70 px-2.5 py-1 font-mono text-xs font-medium text-teal-200 backdrop-blur-sm transition hover:border-teal-300 hover:bg-teal-800"
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
                <span className="inline-flex items-center gap-1 rounded-md border border-amber-500/40 bg-amber-500/20 px-2.5 py-0.5 text-xs font-medium uppercase tracking-wider text-amber-300">
                  <Zap size={12} />
                  {request.urgency} Priority
                </span>
              )}
            </div>

            {/* Main Title */}
            <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl lg:text-3xl">
              {cleanTitle}
            </h1>

            {/* Quick Metadata Strip */}
            <div className="flex flex-wrap items-center gap-y-1.5 gap-x-5 text-xs text-teal-100/90 sm:text-sm">
              <div className="flex items-center gap-1.5">
                <CalendarDays size={14} className="text-teal-400" />
                <span>
                  Submitted:{" "}
                  <span className="font-semibold text-white">
                    {request.submittedAt || reqAny.createdAt
                      ? formatShortDateTime(request.submittedAt || reqAny.createdAt || "")
                      : "Recently submitted"}
                  </span>
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <Clock size={14} className="text-teal-400" />
                <span>
                  Preferred Slot:{" "}
                  <span className="font-semibold text-white">{requestedSchedule}</span>
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <MapPin size={14} className="text-teal-400" />
                <span className="truncate max-w-xs">
                  Property: <span className="font-semibold text-white">{displayStreet}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="rounded-md border-teal-500/50 bg-teal-900/50 text-white hover:bg-teal-800 hover:text-white"
            >
              <Link href="/user/services">
                <ArrowLeft size={14} className="mr-1.5" />
                All Requests
              </Link>
            </Button>
            <Button
              asChild
              size="sm"
              className="rounded-md bg-teal-600 text-white font-medium hover:bg-teal-500 shadow-sm"
            >
              <Link href="/user/billing">
                <FileText size={14} className="mr-1.5" />
                Related Invoices
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* 2. KEY METRICS HIGHLIGHT BAR */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Requested Window */}
        <div className="flex items-center gap-3.5 rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-md border border-teal-200 bg-teal-100 text-teal-800 shadow-xs">
            <Clock size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Requested Window
            </p>
            <p className="mt-0.5 text-sm font-semibold text-slate-900 truncate">
              {requestedSchedule}
            </p>
          </div>
        </div>

        {/* Card 2: Confirmed Schedule */}
        <div className="flex items-center gap-3.5 rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-md border border-emerald-200 bg-emerald-100 text-emerald-800 shadow-xs">
            <Calendar size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wider text-emerald-700">
              Confirmed Schedule
            </p>
            <p className="mt-0.5 text-sm font-semibold text-teal-950 truncate">
              {currentSchedule}
            </p>
          </div>
        </div>

        {/* Card 3: Service Type */}
        <div className="flex items-center gap-3.5 rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-md border border-sky-200 bg-sky-100 text-sky-800 shadow-xs">
            <Wrench size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Service Type
            </p>
            <p className="mt-0.5 text-sm font-semibold text-slate-900 truncate" title={cleanTitle}>
              {cleanTitle}
            </p>
          </div>
        </div>

        {/* Card 4: Quotation Amount */}
        <div className="flex items-center gap-3.5 rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-md border border-amber-200 bg-amber-100 text-amber-800 shadow-xs">
            <FileCheck2 size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Quotation Status
            </p>
            <p className="mt-0.5 text-sm font-semibold text-teal-900">
              {quotation
                ? formatCurrencyUsd(quotation.totalUsd)
                : "Under Diagnostic Review"}
            </p>
          </div>
        </div>
      </section>

      {/* 3. MAIN DASHBOARD GRID (8 Cols Left / 4 Cols Right) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* LEFT COLUMN: Main Case Details & Workflow (8 Cols) */}
        <div className="space-y-6 lg:col-span-8">
          
          {/* A. DIAGNOSTIC PIPELINE / QUOTATION SECTION */}
          <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xs">
            {quotation ? (
              /* ACTIVE QUOTATION PANEL */
              <div className="p-5 sm:p-6 bg-gradient-to-b from-amber-50/40 via-white to-white">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-amber-200/60 pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-100 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-amber-900">
                        <FileText size={13} />
                        Official Quotation
                      </span>
                      <StatusBadge status={quotation.status} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900">
                      {formatCurrencyUsd(quotation.totalUsd)}
                    </h2>
                    <p className="text-xs text-slate-500">
                      Quote Ref: <span className="font-mono font-semibold text-amber-950">{quotation.id}</span>
                      {quotation.expiresAt ? ` · Guaranteed through ${formatLongDate(quotation.expiresAt)}` : ""}
                    </p>
                  </div>

                  <Button asChild variant="outline" size="sm" className="rounded-md border-amber-300 bg-white text-amber-900 hover:bg-amber-50">
                    <Link href={`/user/quotations/${quotation.id}`}>
                      <FileText size={14} className="mr-1.5" />
                      Detailed View
                    </Link>
                  </Button>
                </div>

                {/* Line Items Table */}
                <div className="mt-5 space-y-2.5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Itemized Diagnostics, Genuine Parts & Certified Labor
                  </p>
                  {quotation.lineItems && quotation.lineItems.length > 0 ? (
                    <div className="divide-y divide-amber-100 rounded-lg border border-amber-200/60 bg-white overflow-hidden">
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
                            className="flex items-center justify-between p-3.5 hover:bg-amber-50/30 transition"
                          >
                            <div className="space-y-0.5">
                              <p className="text-sm font-semibold text-slate-900">{label}</p>
                              {desc && <p className="text-xs text-slate-500">{desc}</p>}
                              {lineAny.quantity ? (
                                <p className="text-xs font-medium text-amber-800">
                                  Qty: {String(lineAny.quantity)}
                                  {lineAny.unitPriceUsd ? ` × ${formatCurrencyUsd(Number(lineAny.unitPriceUsd))}` : ""}
                                </p>
                              ) : null}
                            </div>
                            <span className="text-sm font-semibold text-slate-900">
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
                    <div className="mt-4 rounded-lg bg-white p-4 border border-amber-200/80 space-y-2 text-xs sm:text-sm">
                      {quotation.subtotalUsd && (
                        <div className="flex justify-between text-slate-600 font-medium">
                          <span>Subtotal Parts & Labor</span>
                          <span className="font-semibold text-slate-800">{formatCurrencyUsd(quotation.subtotalUsd)}</span>
                        </div>
                      )}
                      {discountVal ? (
                        <div className="flex justify-between text-emerald-700 font-medium">
                          <span>Special Discount</span>
                          <span>-{formatCurrencyUsd(discountVal)}</span>
                        </div>
                      ) : null}
                      {taxVal ? (
                        <div className="flex justify-between text-slate-600 font-medium">
                          <span>Estimated Tax</span>
                          <span className="font-semibold text-slate-800">{formatCurrencyUsd(taxVal)}</span>
                        </div>
                      ) : null}
                      <div className="border-t border-slate-200 pt-2.5 flex justify-between text-base font-bold text-slate-900">
                        <span>Total Quotation</span>
                        <span className="text-teal-900">{formatCurrencyUsd(quotation.totalUsd)}</span>
                      </div>
                    </div>
                  );
                })()}

                {quotation.notes && (
                  <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-950 font-medium">
                    <strong className="text-amber-900 font-semibold">Estimator Note:</strong> {quotation.notes}
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
              </div>
            ) : (
              /* DIAGNOSTIC PROGRESS STEPPER (When Quotation is Under Review) */
              <div className="p-5 sm:p-6">
                <div className="flex items-start gap-3.5">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-teal-200 bg-teal-100 text-teal-800 shadow-xs">
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <span className="inline-flex items-center gap-1 rounded-md bg-teal-100 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-teal-800">
                      Phase 1: In Diagnostic Review
                    </span>
                    <h2 className="mt-1 text-lg font-bold text-slate-900 sm:text-xl">
                      Diagnostic Review & Quotation Preparation
                    </h2>
                    <p className="mt-1 text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl font-normal">
                      Our certified central vacuum specialists are reviewing your reported symptoms, equipment model specifications, and uploaded media attachments. An itemized quote with parts, labor pricing, and confirmed dispatch time slots will appear here shortly.
                    </p>
                  </div>
                </div>

                {/* High-Fidelity Step Tracker */}
                <div className="mt-6 border-t border-slate-100 pt-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                    Service Progression Workflow
                  </p>
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Step 1 */}
                    <div className="rounded-lg border border-teal-200 bg-teal-50/50 p-3.5">
                      <div className="flex items-center gap-2 text-xs font-semibold text-teal-900">
                        <CheckCircle2 size={15} className="text-teal-600" />
                        1. Intake Received
                      </div>
                      <p className="mt-1 text-xs text-slate-600">
                        Ticket submitted & queued
                      </p>
                    </div>

                    {/* Step 2 */}
                    <div className="rounded-lg border border-teal-400 bg-teal-50 p-3.5 shadow-xs relative overflow-hidden">
                      <div className="flex items-center gap-2 text-xs font-semibold text-teal-950">
                        <Loader2 size={15} className="animate-spin text-teal-700" />
                        2. Triage & Review
                      </div>
                      <p className="mt-1 text-xs font-medium text-teal-800">
                        Diagnosing symptoms & specs
                      </p>
                    </div>

                    {/* Step 3 */}
                    <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3.5 opacity-70">
                      <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                        <FileText size={15} />
                        3. Itemized Quote
                      </div>
                      <p className="mt-1 text-xs text-slate-400">
                        Pricing & scope approval
                      </p>
                    </div>

                    {/* Step 4 */}
                    <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3.5 opacity-70">
                      <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                        <Calendar size={15} />
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
          <section className="rounded-lg border border-slate-200 bg-white p-5 sm:p-6 shadow-xs">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-800">
              <MessageSquare size={16} className="text-teal-600" />
              Customer Issue Description & Malfunction Notes
            </div>

            {/* Narrative description */}
            <div className="mt-3.5 rounded-lg border border-slate-100 bg-slate-50/70 p-4">
              <p className="text-sm font-medium leading-relaxed text-slate-800">
                &ldquo;{problemDesc}&rdquo;
              </p>
            </div>

            {/* Observed Symptoms Chips */}
            {reqAny.symptoms && reqAny.symptoms.length > 0 && (
              <div className="mt-5 border-t border-slate-100 pt-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2.5">
                  Reported Malfunction Symptoms ({reqAny.symptoms.length})
                </p>
                <div className="flex flex-wrap gap-2">
                  {reqAny.symptoms.map((symptom: string, idx: number) => {
                    const SymptomIcon = getSymptomIcon(symptom);
                    return (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 rounded-md border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-950 shadow-xs"
                      >
                        <SymptomIcon size={13} className="text-teal-700" />
                        {symptom.replace(/_/g, " ")}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </section>

          {/* C. SYSTEM HARDWARE PROFILE & PROPERTY SPECS (2 Side-by-Side Cards) */}
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {/* Card 1: Equipment Profile */}
            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-xs">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3.5">
                <Cpu size={15} className="text-teal-600" />
                Central Vacuum Equipment Specs
              </div>

              <div className="space-y-2.5">
                <div className="flex justify-between rounded-md bg-slate-50 p-2.5 text-xs sm:text-sm">
                  <span className="font-medium text-slate-500">Manufacturer / Brand</span>
                  <span className="font-semibold text-slate-900">{request.equipment?.manufacturer || "Standard Central Vac"}</span>
                </div>

                <div className="flex justify-between rounded-md bg-slate-50 p-2.5 text-xs sm:text-sm">
                  <span className="font-medium text-slate-500">Model Number</span>
                  <span className="font-semibold text-slate-900">{request.equipment?.modelNumber || "Not Specified"}</span>
                </div>

                <div className="flex justify-between rounded-md bg-slate-50 p-2.5 text-xs sm:text-sm">
                  <span className="font-medium text-slate-500">Serial Number</span>
                  <span className="font-semibold text-slate-900 font-mono">{request.equipment?.serialNumber || "N/A"}</span>
                </div>

                <div className="flex justify-between rounded-md bg-slate-50 p-2.5 text-xs sm:text-sm">
                  <span className="font-medium text-slate-500">Unit Installation Location</span>
                  <span className="font-semibold text-slate-900">{request.equipment?.unitLocation || "Garage / Utility Room"}</span>
                </div>
              </div>
            </section>

            {/* Card 2: Property & Problem Location */}
            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-xs">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3.5">
                <MapPin size={15} className="text-teal-600" />
                Service Location & Problem Zone
              </div>

              <div className="space-y-2.5">
                <div className="rounded-md bg-slate-50 p-2.5 text-xs sm:text-sm">
                  <span className="block font-medium text-slate-500 text-xs">Service Property</span>
                  <p className="mt-0.5 font-semibold text-slate-900">{displayStreet}</p>
                  {displayRegion && <p className="text-xs text-slate-500">{displayRegion}</p>}
                </div>

                <div className="rounded-md bg-slate-50 p-2.5 text-xs sm:text-sm">
                  <span className="block font-medium text-slate-500 text-xs">Affected Inlet Ports / Zone</span>
                  <p className="mt-0.5 font-semibold text-teal-950">{problemLoc}</p>
                  <p className="text-xs text-slate-500">Reported trouble area</p>
                </div>
              </div>
            </section>
          </div>

          {/* D. INSPECTION MEDIA GALLERY (Reusable Component) */}
          <section className="rounded-lg border border-slate-200 bg-white p-5 sm:p-6 shadow-xs">
            <ServiceMediaGallery
              attachments={request.attachments || []}
            />
          </section>
        </div>

        {/* RIGHT COLUMN: Sidebar Hub & Concierge (4 Cols) */}
        <div className="space-y-6 lg:col-span-4">
          {/* 1. APPOINTMENT & DISPATCH SUMMARY */}
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-800">
              <CalendarDays size={15} className="text-teal-600" />
              Service Appointment Status
            </div>

            <div className="mt-3.5 rounded-md bg-teal-50/60 border border-teal-100 p-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-600">Selected Window</span>
                <span className="rounded-md bg-white px-2 py-0.5 text-xs font-semibold text-teal-900 shadow-xs border border-teal-200/50">
                  {requestedSchedule.split(" · ")[1] || "Flexible"}
                </span>
              </div>
              <p className="mt-2 text-base font-bold text-slate-900">
                {requestedSchedule.split(" · ")[0] || requestedSchedule}
              </p>
              <p className="mt-1 text-xs text-slate-500 font-normal">
                A technician will confirm dispatch 30 minutes prior to arrival.
              </p>
            </div>
          </section>

          {/* 2. ACTIVITY LIFECYCLE TIMELINE */}
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-xs">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Request Activity Timeline
            </h3>

            <div className="mt-4 relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-teal-100">
              {/* Event 1: Submission */}
              <div className="relative">
                <div className="absolute -left-6 top-0 flex size-5 items-center justify-center rounded-full bg-teal-600 text-white ring-4 ring-white">
                  <Check size={11} strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-900">Intake Request Submitted</p>
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
                    <p className="text-xs font-semibold text-slate-900">Quotation Issued</p>
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
                    <p className="text-xs font-semibold text-slate-700">Awaiting Quotation</p>
                    <p className="text-[11px] text-slate-400">Technical diagnostics in review</p>
                  </div>
                </div>
              )}

              {/* Event 3: Service Order */}
              {serviceOrder ? (
                <div className="relative">
                  <div className="absolute -left-6 top-0 flex size-5 items-center justify-center rounded-full bg-emerald-600 text-white ring-4 ring-white">
                    <Check size={11} strokeWidth={2.5} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-900">Service Order Dispatched</p>
                    <p className="text-[11px] text-slate-500">Appointment locked with technician</p>
                  </div>
                </div>
              ) : null}
            </div>
          </section>

          {/* 3. CONCIERGE & SUPPORT CARD */}
          <section className="rounded-lg border border-teal-900/20 bg-gradient-to-br from-teal-900 to-slate-900 p-5 text-white shadow-sm">
            <div className="flex items-center gap-2">
              <HelpCircle size={16} className="text-emerald-400" />
              <h3 className="text-sm font-semibold text-white">Need Dedicated Assistance?</h3>
            </div>
            <p className="mt-1.5 text-xs text-teal-100/80 leading-relaxed font-normal">
              Have questions regarding your service intake ticket, hardware compatibility, or quotation? Our concierge support team is ready to help.
            </p>
            <div className="mt-4 space-y-2">
              <Button
                asChild
                className="w-full rounded-md bg-white text-teal-950 font-semibold hover:bg-teal-50"
                size="sm"
              >
                <Link href="/contact">
                  <MessageSquare size={14} className="mr-1.5 text-teal-800" />
                  Message Support Team
                </Link>
              </Button>
              <Button
                asChild
                className="w-full rounded-md border-teal-700 bg-teal-800/40 text-teal-100 hover:bg-teal-800 hover:text-white"
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
