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
  ExternalLink,
  FileCheck2,
  FileText,
  HelpCircle,
  Loader2,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  PowerOff,
  ShieldAlert,
  Star,
  Tag,
  Truck,
  User,
  Volume2,
  Wind,
  Wrench,
  XCircle,
  Zap,
} from "lucide-react";

import { QuotationDecisionPanel } from "@/components/customer-portal/QuotationDecisionPanel";
import { MediaGalleryPreview } from "@/components/shared/MediaGalleryPreview";
import { StatusBadge } from "@/components/customer-portal/StatusBadge";
import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import {
  useGetServiceRequestByIdQuery,
  useCancelServiceRequestMutation,
} from "@/redux/api/serviceRequestsApi";
import {
  useGetMyQuotationsQuery,
  useGetQuotationByIdQuery,
  useAcceptQuotationMutation,
  useRejectQuotationMutation,
} from "@/redux/api/quotationsApi";
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
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [rejectQuoteOpen, setRejectQuoteOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

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

  // Mutations
  const [cancelRequestMutation, { isLoading: isCancellingRequest }] = useCancelServiceRequestMutation();
  const [acceptQuoteMutation, { isLoading: isAcceptingQuote }] = useAcceptQuotationMutation();
  const [rejectQuoteMutation, { isLoading: isRejectingQuote }] = useRejectQuotationMutation();

  // 2. Resolve Active Quotation from request relation or standalone APIs
  const quotation: AdminQuotation | undefined = useMemo(() => {
    if (request?.quotations && request.quotations.length > 0) {
      return request.quotations[0];
    }
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

  // 3. Resolve Matching Service Order from request relation or standalone APIs
  const serviceOrder = useMemo(() => {
    if (request?.serviceOrder) {
      return request.serviceOrder;
    }
    const orders = myOrdersResponse?.items || [];
    return orders.find(
      (o) => o.serviceRequestId === requestId || o.id === requestId,
    );
  }, [request, myOrdersResponse, requestId]);

  // 4. Resolve Primary Assigned Technician from appointments
  const primaryAppointment = request?.appointments?.[0];
  const assignedTech = primaryAppointment?.technician;

  const isLoading = isLoadingRequest || (isLoadingQuotes && !request);

  const displayId = request?.businessId || request?.id || requestId;

  function handleCopyId() {
    if (!displayId) return;
    navigator.clipboard.writeText(displayId);
    setCopiedId(true);
    toast.success("Request ID copied to clipboard");
    setTimeout(() => setCopiedId(false), 2000);
  }

  // Handle Cancel Request Action
  async function handleConfirmCancel() {
    if (!requestId) return;
    try {
      const res = await cancelRequestMutation({
        id: requestId,
        reason: cancelReason.trim() || undefined,
      }).unwrap();
      toast.success(res.message || "Service request has been cancelled.");
      setCancelModalOpen(false);
      setCancelReason("");
    } catch {
      toast.error("Failed to cancel request. Please reach out to customer support.");
    }
  }

  // Handle Accept Quotation Direct Action
  async function handleAcceptQuoteDirect() {
    if (!quotation) return;
    try {
      const res = await acceptQuoteMutation({ id: quotation.id }).unwrap();
      toast.success(res.message || "Quotation accepted!", {
        description: "Your service order has been generated.",
      });
    } catch {
      toast.error("Failed to accept quotation. Please try again.");
    }
  }

  // Handle Reject Quotation Direct Action
  async function handleRejectQuoteDirect() {
    if (!quotation || !rejectReason.trim()) return;
    try {
      await rejectQuoteMutation({
        id: quotation.id,
        reason: rejectReason.trim(),
      }).unwrap();
      toast.success("Quotation declined", {
        description: "Our team will evaluate updated estimates.",
      });
      setRejectQuoteOpen(false);
      setRejectReason("");
    } catch {
      toast.error("Failed to decline quotation.");
    }
  }

  // 5. Loading Skeleton
  if (isLoading) {
    return (
      <div className="w-full space-y-6 px-2 py-6 sm:px-4">
        <div className="h-36 w-full animate-pulse rounded-lg bg-white" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-24 animate-pulse rounded-lg bg-white" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="h-96 animate-pulse rounded-lg bg-white lg:col-span-8" />
          <div className="h-96 animate-pulse rounded-lg bg-white lg:col-span-4" />
        </div>
      </div>
    );
  }

  // 6. Not Found Fallback
  if (!request) {
    return (
      <div className="w-full max-w-4xl space-y-6 px-4 py-8 sm:px-6">
        <Button asChild variant="outline" size="sm" className="rounded-md font-medium">
          <Link href="/user/services">
            <ArrowLeft size={14} className="mr-1.5" />
            Back to Service Requests
          </Link>
        </Button>
        <div className="rounded-lg bg-teal-50/60 p-10 text-center shadow-xs">
          <div className="mx-auto flex size-12 items-center justify-center rounded-lg bg-teal-100 text-teal-800 shadow-xs">
            <Wrench size={22} />
          </div>
          <h2 className="mt-3 text-lg font-semibold text-slate-800">
            Service Request Not Found
          </h2>
          <p className="mx-auto mt-1.5 max-w-md text-xs sm:text-sm font-medium text-slate-600">
            We couldn’t find record #{displayId}. It may have been archived or belongs to another customer account.
          </p>
          <div className="mt-5 flex justify-center gap-3">
            <Button asChild size="sm" className="rounded-md font-medium">
              <Link href="/user/services">View My Requests</Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="rounded-md font-medium">
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
    additionalNotes?: string;
    cancellationReason?: string;
  };

  // Service Title
  const serviceName = request.service?.name || reqAny.serviceName || "Central Vacuum Service";
  const displayTitle = request.title || serviceName;

  // Clean Problem Description
  const problemDesc =
    request.description ||
    reqAny.problemDescription ||
    "Customer requested inspection and diagnostic evaluation for central vacuum performance.";

  // Clean Schedule formatting
  const reqRecord = reqAny as unknown as Record<string, unknown>;
  const sched = ((request.requestedSchedule || reqRecord.requestedSchedule || {}) as unknown) as Record<string, unknown>;
  const prefDate =
    (typeof sched.preferredDate === "string" && sched.preferredDate) ||
    (typeof sched.date === "string" && sched.date) ||
    request.preferredDate ||
    (typeof reqRecord.preferredDate === "string" ? reqRecord.preferredDate : undefined);
  const prefTime =
    (typeof sched.timeWindow === "string" && sched.timeWindow) ||
    (typeof sched.time === "string" && sched.time) ||
    request.preferredTime ||
    (typeof reqRecord.timeWindow === "string" ? reqRecord.timeWindow : undefined) ||
    (typeof reqRecord.preferredTime === "string" ? reqRecord.preferredTime : undefined);

  const requestedSchedule =
    request.requestedSchedule?.label ??
    (prefDate
      ? `${formatMonthDay(prefDate)}${prefTime ? ` · ${prefTime}` : ""}`
      : prefTime || "Pending schedule");

  const currentSchedule =
    request.currentSchedule?.label ?? requestedSchedule;

  // Clean Address
  const line1 = request.serviceAddress?.address || request.serviceAddress?.line1 || reqAny.address || "";
  const city = request.serviceAddress?.city || reqAny.city || "";
  const state = request.serviceAddress?.state || reqAny.state || "";
  const zip = request.serviceAddress?.zipCode || request.serviceAddress?.postalCode || reqAny.zipCode || "";
  const cityStateZip = [city, state, zip].filter(Boolean).join(", ");
  const displayStreet = line1 || cityStateZip || "Address on file";
  const displayRegion = line1 && cityStateZip ? cityStateZip : "";

  // Contact Info
  const contactName = request.serviceAddress?.contactName || "";
  const contactPhone = request.serviceAddress?.contactPhone || "";
  const contactEmail = request.serviceAddress?.contactEmail || "";

  // Problem Location
  const problemLoc =
    request.problemLocation ||
    request.serviceAddress?.problemLocation ||
    reqAny.problemLocation ||
    reqAny.otherProblemLocation ||
    "Basement / Main Unit Inlets";

  // Check if cancellation is allowed
  const normStatus = (request.status || "").toLowerCase().replace(/_/g, "-");
  const canCancel = normStatus === "submitted" || normStatus === "under-review";

  // Quote status checks
  const quoteStatusNorm = (quotation?.status || "").toLowerCase().replace(/_/g, "-");
  const isQuoteSent = quoteStatusNorm === "sent" || quoteStatusNorm === "under-review" || quoteStatusNorm === "draft" || quoteStatusNorm === "quoted";

  // Cancellation Reason extraction & cleaning
  const rawNotes = request.additionalNotes || reqAny.additionalNotes || "";
  const cancelMatch = rawNotes.match(/\[Cancellation Reason:\s*([^\]]+)\]/i);
  const cancellationReason =
    (request as unknown as { cancellationReason?: string }).cancellationReason ||
    (reqAny.cancellationReason as string) ||
    (cancelMatch ? cancelMatch[1].trim() : null);

  const cleanAdditionalNotes = rawNotes
    .replace(/\[Cancellation Reason:\s*[^\]]+\]/gi, "")
    .trim();

  return (
    <div className="w-full space-y-6 sm:space-y-7 pb-16">
      {/* 1. TOP HEADER SECTION - CLEAN WHITE CARD (PRIMARY COLOR TITLE, ZERO SCHEDULE REPETITION) */}
      <section className="rounded-lg border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            {/* Badges Bar */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleCopyId}
                title="Click to copy Request ID"
                className="group inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2.5 py-1 font-mono text-xs font-semibold text-slate-700 transition hover:bg-slate-200"
              >
                <span>ID: {displayId}</span>
                {copiedId ? (
                  <Check size={12} className="text-emerald-600" />
                ) : (
                  <Copy size={12} className="opacity-60 group-hover:opacity-100" />
                )}
              </button>

              <StatusBadge status={request.status} />

              {request.urgency && (
                <span className="inline-flex items-center gap-1 rounded-md bg-amber-100/80 px-2.5 py-0.5 text-xs font-medium uppercase tracking-wider text-amber-900">
                  <Zap size={12} className="text-amber-700" />
                  {request.urgency} Priority
                </span>
              )}

              {request.service?.category && (
                <span className="inline-flex items-center gap-1 rounded-md bg-teal-50 px-2.5 py-0.5 text-xs font-medium text-teal-800">
                  {request.service.category.replace(/_/g, " ")}
                </span>
              )}
            </div>

            {/* Main Title: 2xl/3xl font-semibold in primary brand color */}
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-primary">
              {displayTitle}
            </h1>

            {/* Metadata Strip: Submitted time & Property address (Schedule declared cleanly in metric card below) */}
            <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-xs sm:text-sm text-slate-600 font-medium pt-0.5">
              <div className="flex items-center gap-1.5">
                <CalendarDays size={15} className="text-teal-600 shrink-0" />
                <span>
                  Submitted:{" "}
                  <span className="text-slate-800 font-medium">
                    {request.submittedAt || reqAny.createdAt
                      ? formatShortDateTime(request.submittedAt || reqAny.createdAt || "")
                      : "Recently submitted"}
                  </span>
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <MapPin size={15} className="text-teal-600 shrink-0" />
                <span className="truncate max-w-sm">
                  Property: <span className="text-slate-800 font-medium">{displayStreet}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="rounded-md font-medium text-xs sm:text-sm text-slate-800 hover:bg-slate-50"
            >
              <Link href="/user/services">
                <ArrowLeft size={14} className="mr-1.5" />
                All Requests
              </Link>
            </Button>

            <Button
              asChild
              size="sm"
              className="rounded-md bg-teal-600 text-white font-medium hover:bg-teal-500 shadow-xs text-xs sm:text-sm"
            >
              <Link href="/user/billing">
                <FileText size={14} className="mr-1.5" />
                Related Invoices
              </Link>
            </Button>

            {canCancel && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCancelModalOpen(true)}
                className="rounded-md border-rose-200 bg-rose-50/80 text-rose-700 hover:bg-rose-100 text-xs sm:text-sm font-medium"
              >
                <XCircle size={14} className="mr-1.5 text-rose-600" />
                Cancel Request
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* 2. CANCELLATION REASON SHOWCASE BANNER (Dedicated high-impact UI/UX) */}
      {(cancellationReason || normStatus === "cancelled") && (
        <section className="rounded-lg border border-rose-200 bg-rose-50/70 p-5 sm:p-6 shadow-xs">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3.5">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-rose-100 text-rose-700 shadow-xs">
                <XCircle size={22} />
              </div>
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-base sm:text-lg font-semibold text-rose-950">
                    Service Request Cancelled
                  </span>
                  <span className="rounded-md bg-rose-200/80 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-rose-900">
                    Cancelled
                  </span>
                </div>
                <p className="text-xs sm:text-sm font-medium text-rose-800 leading-relaxed max-w-2xl">
                  This intake ticket was officially cancelled and all associated dispatch slots have been released.
                </p>
                {cancellationReason && (
                  <div className="mt-3 rounded-md border border-rose-200/80 bg-white/95 p-4 text-xs sm:text-sm shadow-2xs">
                    <span className="block text-[11px] font-semibold uppercase tracking-wider text-rose-700">
                      Official Cancellation Reason
                    </span>
                    <p className="mt-1 font-medium text-slate-800 leading-relaxed text-sm sm:text-base">
                      &ldquo;{cancellationReason}&rdquo;
                    </p>
                  </div>
                )}
              </div>
            </div>

            <Button
              asChild
              size="sm"
              className="rounded-md bg-rose-700 text-white hover:bg-rose-800 font-medium text-xs sm:text-sm shrink-0 shadow-xs"
            >
              <Link href="/services">
                Book New Service
              </Link>
            </Button>
          </div>
        </section>
      )}

      {/* 2. ACTIVE SERVICE ORDER BANNER (If Converted / Scheduled) */}
      {serviceOrder && (() => {
        const soAny = serviceOrder as unknown as Record<string, unknown>;
        const soBusinessId = (soAny?.businessId as string) || serviceOrder.id;
        const soScheduledAt = (soAny?.scheduledAt as string) || (soAny?.scheduledFor as string) || currentSchedule;
        const soTotal = soAny?.totalUsd ?? soAny?.totalAmountUsd;

        return (
          <section className="rounded-lg border border-purple-200/80 bg-purple-50/60 p-5 sm:p-6 shadow-xs">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3.5">
                <div className="flex size-11 items-center justify-center rounded-lg bg-purple-100 text-purple-800 shadow-xs">
                  <Truck size={22} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-purple-900 bg-purple-100 px-2 py-0.5 rounded-md">
                      Order ID: {soBusinessId}
                    </span>
                    <StatusBadge status={serviceOrder.status} />
                  </div>
                  <h3 className="text-base font-semibold text-slate-800 mt-1">
                    Active Service Order Dispatched
                  </h3>
                  <p className="text-xs sm:text-sm font-medium text-slate-600">
                    Scheduled for: <span className="font-semibold text-purple-950">{soScheduledAt ? formatShortDateTime(soScheduledAt) : currentSchedule}</span>
                    {soTotal ? ` · Total: ${formatCurrencyUsd(Number(soTotal))}` : ""}
                  </p>
                </div>
              </div>

              <Button asChild size="sm" className="rounded-md bg-purple-700 text-white hover:bg-purple-800 font-medium text-xs sm:text-sm">
                <Link href={`/user/orders/${serviceOrder.id}`}>
                  View Service Order & Tracking
                  <ExternalLink size={14} className="ml-1.5" />
                </Link>
              </Button>
            </div>
          </section>
        );
      })()}

      {/* 3. KEY METRICS HIGHLIGHT BAR - 4 DISTINCT PILLARS (ZERO DUPLICATION) */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Metric 1: Authoritative Service Schedule */}
        <div className="flex items-center gap-3.5 rounded-lg border border-slate-200/80 bg-white p-5 shadow-xs">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-800">
            <Calendar size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Service Schedule
            </p>
            <p className="mt-0.5 text-sm sm:text-base font-semibold text-slate-800 truncate">
              {currentSchedule}
            </p>
            <p className="text-[11px] font-medium text-teal-700">
              {primaryAppointment ? "Confirmed Dispatch Slot" : "Requested Arrival Window"}
            </p>
          </div>
        </div>

        {/* Metric 2: Assigned Specialist */}
        <div className="flex items-center gap-3.5 rounded-lg border border-slate-200/80 bg-white p-5 shadow-xs">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-800">
            <User size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Field Specialist
            </p>
            <p className="mt-0.5 text-sm sm:text-base font-semibold text-slate-800 truncate">
              {assignedTech ? assignedTech.displayName : "Specialist In Queue"}
            </p>
            <p className="text-[11px] font-medium text-slate-500">
              {assignedTech ? "Certified Technician Assigned" : "Auto-dispatching specialist"}
            </p>
          </div>
        </div>

        {/* Metric 3: Quotation Status */}
        <div className="flex items-center gap-3.5 rounded-lg border border-slate-200/80 bg-white p-5 shadow-xs">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-800">
            <FileCheck2 size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Official Quotation
            </p>
            <p className="mt-0.5 text-sm sm:text-base font-semibold text-teal-950 truncate">
              {quotation
                ? formatCurrencyUsd(Number(quotation.totalUsd))
                : "Diagnostic Review"}
            </p>
            <p className="text-[11px] font-medium text-amber-800">
              {quotation ? `Status: ${quotation.status}` : "Scope & Parts In Preparation"}
            </p>
          </div>
        </div>

        {/* Metric 4: Case Progression Stage */}
        <div className="flex items-center gap-3.5 rounded-lg border border-slate-200/80 bg-white p-5 shadow-xs">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-800">
            <CheckCircle2 size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Workflow Stage
            </p>
            <p className="mt-0.5 text-sm sm:text-base font-semibold text-slate-800 truncate">
              {serviceOrder ? "Order Dispatched" : quotation ? "Quotation Ready" : "Intake Review"}
            </p>
            <p className="text-[11px] font-medium text-emerald-700">
              {serviceOrder ? "Stage 4 of 4: On-Site" : quotation ? "Stage 3 of 4: Decision" : "Stage 2 of 4: Triage"}
            </p>
          </div>
        </div>
      </section>

      {/* 4. MAIN DASHBOARD GRID (8 Cols Left / 4 Cols Right) */}
      <div className="grid grid-cols-1 gap-6 sm:gap-7 lg:grid-cols-12">
        {/* LEFT COLUMN: Main Case Details & Workflow (8 Cols) */}
        <div className="space-y-6 sm:space-y-7 lg:col-span-8">
          
          {/* A. DIAGNOSTIC PIPELINE / QUOTATIONS SECTION */}
          <section className="overflow-hidden rounded-lg border border-slate-200/80 bg-white shadow-xs">
            {quotation ? (
              /* ACTIVE QUOTATION PANEL */
              <div className="p-5 sm:p-6 bg-white">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-100/80 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-amber-900">
                        <FileText size={13} />
                        Official Quotation
                      </span>
                      <StatusBadge status={quotation.status} />
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-semibold text-slate-800">
                      {formatCurrencyUsd(Number(quotation.totalUsd))}
                    </h2>
                    <p className="text-xs sm:text-sm font-medium text-slate-500">
                      Quote Ref: <span className="font-mono font-semibold text-amber-950">{quotation.businessId || quotation.id}</span>
                      {quotation.expiresAt ? ` · Guaranteed through ${formatLongDate(quotation.expiresAt)}` : ""}
                    </p>
                  </div>

                  {/* Action / Links */}
                  <div className="flex flex-wrap items-center gap-2">
                    {isQuoteSent && (
                      <>
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleAcceptQuoteDirect}
                          disabled={isAcceptingQuote}
                          className="rounded-md bg-emerald-600 text-white font-medium hover:bg-emerald-700 shadow-xs text-xs sm:text-sm"
                        >
                          {isAcceptingQuote ? (
                            <Loader2 size={14} className="animate-spin mr-1.5" />
                          ) : (
                            <CheckCircle2 size={14} className="mr-1.5" />
                          )}
                          Accept Quote
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setRejectQuoteOpen(true)}
                          className="rounded-md border-rose-200 text-rose-700 hover:bg-rose-50 font-medium text-xs sm:text-sm"
                        >
                          <XCircle size={14} className="mr-1.5" />
                          Decline
                        </Button>
                      </>
                    )}
                    <Button asChild variant="outline" size="sm" className="rounded-md text-slate-800 hover:bg-slate-50 font-medium text-xs sm:text-sm">
                      <Link href={`/user/quotations/${quotation.id}`}>
                        <FileText size={14} className="mr-1.5" />
                        View Full Breakdown
                      </Link>
                    </Button>
                  </div>
                </div>

                {/* Line Items Table if present */}
                {quotation.lineItems && quotation.lineItems.length > 0 && (
                  <div className="mt-5 space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Itemized Diagnostics, Genuine Parts & Certified Labor
                    </p>
                    <div className="divide-y divide-slate-100 rounded-lg bg-slate-50/60 overflow-hidden">
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
                            className="flex items-center justify-between p-4 hover:bg-slate-100/60 transition"
                          >
                            <div className="space-y-0.5">
                              <p className="text-sm font-semibold text-slate-800">{label}</p>
                              {desc && <p className="text-xs text-slate-500 font-medium">{desc}</p>}
                              {lineAny.quantity ? (
                                <p className="text-xs font-medium text-amber-800">
                                  Qty: {String(lineAny.quantity)}
                                  {lineAny.unitPriceUsd ? ` × ${formatCurrencyUsd(Number(lineAny.unitPriceUsd))}` : ""}
                                </p>
                              ) : null}
                            </div>
                            <span className="text-sm sm:text-base font-semibold text-slate-800">
                              {formatCurrencyUsd(amount)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Totals Summary */}
                {(() => {
                  const quoteAny = quotation as unknown as Record<string, unknown>;
                  const discountVal = quoteAny.discountUsd ? Number(quoteAny.discountUsd) : undefined;
                  const taxVal = quoteAny.taxUsd ? Number(quoteAny.taxUsd) : undefined;

                  return (
                    <div className="mt-5 rounded-lg bg-slate-50/80 p-4 sm:p-5 space-y-2.5 text-xs sm:text-sm">
                      {quotation.subtotalUsd && (
                        <div className="flex justify-between text-slate-600 font-medium">
                          <span>Subtotal Parts & Labor</span>
                          <span className="font-semibold text-slate-800">{formatCurrencyUsd(Number(quotation.subtotalUsd))}</span>
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
                      <div className="border-t border-slate-200 pt-3 flex justify-between text-base sm:text-lg font-semibold text-slate-800">
                        <span>Total Quotation</span>
                        <span className="text-teal-900 font-semibold">{formatCurrencyUsd(Number(quotation.totalUsd))}</span>
                      </div>
                    </div>
                  );
                })()}

                {quotation.notes && (
                  <div className="mt-4 rounded-md bg-amber-50/80 p-3.5 text-xs text-amber-950 font-medium">
                    <span className="text-amber-900 font-semibold">Estimator Note:</span> {quotation.notes}
                  </div>
                )}

                {/* Decision Panel (Interactive Accept/Reject) */}
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
                <div>
                  <h2 className="text-xl sm:text-2xl font-semibold text-slate-800">
                    Diagnostic Review & Quotation Preparation
                  </h2>
                  <p className="mt-1.5 text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl font-medium">
                    Our certified central vacuum specialists are reviewing your reported symptoms, equipment model specifications, and uploaded media attachments. An itemized quote with parts, labor pricing, and confirmed dispatch time slots will appear here shortly.
                  </p>
                </div>

                {/* Step Tracker */}
                <div className="mt-6 border-t border-slate-100 pt-5">
                  <p className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-slate-500 mb-3.5">
                    Service Progression Workflow
                  </p>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Step 1 */}
                    <div className="rounded-lg bg-teal-50/80 p-4">
                      <div className="flex items-center gap-2 text-sm sm:text-base font-semibold text-teal-950">
                        <CheckCircle2 size={18} className="text-teal-700 shrink-0" />
                        1. Intake Received
                      </div>
                      <p className="mt-1.5 text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                        Ticket submitted & queued
                      </p>
                    </div>

                    {/* Step 2 */}
                    <div className="rounded-lg bg-teal-100/70 p-4 shadow-xs relative overflow-hidden">
                      <div className="flex items-center gap-2 text-sm sm:text-base font-semibold text-teal-950">
                        <Loader2 size={18} className="animate-spin text-teal-700 shrink-0" />
                        2. Triage & Review
                      </div>
                      <p className="mt-1.5 text-xs sm:text-sm font-medium text-teal-900 leading-relaxed">
                        Diagnosing symptoms & specs
                      </p>
                    </div>

                    {/* Step 3 */}
                    <div className="rounded-lg bg-slate-50/80 p-4 opacity-75">
                      <div className="flex items-center gap-2 text-sm sm:text-base font-semibold text-slate-600">
                        <FileText size={18} className="shrink-0 text-slate-400" />
                        3. Itemized Quote
                      </div>
                      <p className="mt-1.5 text-xs sm:text-sm text-slate-500 leading-relaxed font-medium">
                        Pricing & scope approval
                      </p>
                    </div>

                    {/* Step 4 */}
                    <div className="rounded-lg bg-slate-50/80 p-4 opacity-75">
                      <div className="flex items-center gap-2 text-sm sm:text-base font-semibold text-slate-600">
                        <Calendar size={18} className="shrink-0 text-slate-400" />
                        4. On-Site Dispatch
                      </div>
                      <p className="mt-1.5 text-xs sm:text-sm text-slate-500 leading-relaxed font-medium">
                        Technician service visit
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* B. REPORTED ISSUE & SYMPTOMS - UNIFIED COHESIVE SECTION */}
          <section className="rounded-lg border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-800">
              <MessageSquare size={16} className="text-teal-600" />
              Reported Malfunction & Diagnostic Notes
            </div>

            {/* Problem narrative */}
            <div className="pt-1">
              <p className="text-sm sm:text-base leading-relaxed text-slate-700 font-medium">
                &ldquo;{problemDesc}&rdquo;
              </p>
            </div>

            {/* Observed Symptoms Chips */}
            {request.symptoms && request.symptoms.length > 0 && (
              <div className="border-t border-slate-100 pt-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
                  Reported Malfunction Symptoms ({request.symptoms.length})
                </p>
                <div className="flex flex-wrap gap-2">
                  {request.symptoms.map((symptom: string, idx: number) => {
                    const SymptomIcon = getSymptomIcon(symptom);
                    return (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 rounded-md bg-teal-50 px-3 py-1.5 text-xs font-medium text-teal-950"
                      >
                        <SymptomIcon size={13} className="text-teal-700" />
                        {symptom.replace(/_/g, " ")}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Access notes (cleaned of cancellation text) */}
            {cleanAdditionalNotes ? (
              <div className="rounded-md bg-slate-50 p-3.5 text-xs sm:text-sm text-slate-700 font-medium">
                <span className="font-semibold text-slate-900">Access & Property Notes:</span> {cleanAdditionalNotes}
              </div>
            ) : null}
          </section>

          {/* C. SYSTEM HARDWARE PROFILE & PROPERTY SPECS (Side-by-Side) */}
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {/* Card 1: Equipment Profile */}
            <section className="rounded-lg border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4">
                <Cpu size={15} className="text-teal-600" />
                Central Vacuum Equipment Specs
              </div>

              <div className="space-y-2.5">
                <div className="flex justify-between rounded-md bg-slate-50 p-3 text-xs sm:text-sm font-medium">
                  <span className="text-slate-500">Manufacturer / Brand</span>
                  <span className="font-semibold text-slate-800">{request.equipment?.manufacturer || "Standard Central Vac"}</span>
                </div>

                <div className="flex justify-between rounded-md bg-slate-50 p-3 text-xs sm:text-sm font-medium">
                  <span className="text-slate-500">Model Number</span>
                  <span className="font-semibold text-slate-800">{request.equipment?.modelNumber || "Not Specified"}</span>
                </div>

                <div className="flex justify-between rounded-md bg-slate-50 p-3 text-xs sm:text-sm font-medium">
                  <span className="text-slate-500">Serial Number</span>
                  <span className="font-semibold text-slate-800 font-mono">{request.equipment?.serialNumber || "N/A"}</span>
                </div>

                <div className="flex justify-between rounded-md bg-slate-50 p-3 text-xs sm:text-sm font-medium">
                  <span className="text-slate-500">Unit Installation Location</span>
                  <span className="font-semibold text-slate-800">{request.equipment?.unitLocation || "Garage / Utility Room"}</span>
                </div>
              </div>
            </section>

            {/* Card 2: Property & Problem Location */}
            <section className="rounded-lg border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4">
                <MapPin size={15} className="text-teal-600" />
                Service Location & Contact Info
              </div>

              <div className="space-y-2.5">
                <div className="rounded-md bg-slate-50 p-3 text-xs sm:text-sm font-medium">
                  <span className="block text-slate-500 text-xs">Service Property</span>
                  <p className="mt-0.5 font-semibold text-slate-800">{displayStreet}</p>
                  {displayRegion && <p className="text-xs text-slate-500">{displayRegion}</p>}
                </div>

                <div className="rounded-md bg-slate-50 p-3 text-xs sm:text-sm font-medium">
                  <span className="block text-slate-500 text-xs">Problem Location / Inlets</span>
                  <p className="mt-0.5 font-semibold text-teal-950">{problemLoc}</p>
                </div>

                {(contactName || contactPhone || contactEmail) && (
                  <div className="rounded-md bg-slate-50 p-3 text-xs sm:text-sm space-y-1 text-slate-600 font-medium">
                    {contactName && <p className="font-semibold text-slate-800">Contact: {contactName}</p>}
                    {contactPhone && <p className="flex items-center gap-1.5"><Phone size={12} className="text-teal-600" /> {contactPhone}</p>}
                    {contactEmail && <p className="flex items-center gap-1.5"><Mail size={12} className="text-teal-600" /> {contactEmail}</p>}
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* D. INSPECTION MEDIA GALLERY (Clean Read-Only Display) */}
          <section className="rounded-lg border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs">
            <div className="border-b border-slate-100 pb-4 mb-5">
              <h3 className="text-base font-semibold text-slate-800">
                Customer Inspection Photos & Videos
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                Visual evidence submitted with your central vacuum intake ticket.
              </p>
            </div>

            <MediaGalleryPreview
              attachments={request.attachments || []}
              emptyMessage="No customer media submitted"
              emptyDescription="No photos or videos were attached to this service request."
            />
          </section>
        </div>

        {/* RIGHT COLUMN: Sidebar Hub & Concierge (4 Cols, ZERO DUPLICATE SCHEDULES) */}
        <div className="space-y-6 sm:space-y-7 lg:col-span-4">
          {/* 1. FIELD TECHNICIAN / DISPATCH STATUS CARD */}
          {assignedTech ? (
            <section className="rounded-lg border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs">
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-teal-700 mb-3.5">
                <User size={14} className="text-teal-600" />
                Assigned Service Specialist
              </div>

              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-lg bg-teal-800 text-white font-semibold text-base">
                  {assignedTech.displayName.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-semibold text-slate-800">
                    {assignedTech.displayName}
                  </h3>
                  {assignedTech.rating ? (
                    <div className="flex items-center gap-1 text-xs text-slate-600 mt-0.5 font-medium">
                      <Star className="size-3.5 fill-amber-400 text-amber-500" />
                      <span className="font-semibold text-slate-800">{assignedTech.rating}</span>
                      <span>rating</span>
                    </div>
                  ) : null}
                </div>
              </div>

              {assignedTech.phone && (
                <div className="mt-3.5 border-t border-slate-100 pt-3 text-xs sm:text-sm">
                  <div className="flex items-center gap-1.5 font-medium text-slate-700">
                    <Phone size={13} className="text-teal-600" />
                    <span>Direct: {assignedTech.phone}</span>
                  </div>
                </div>
              )}
            </section>
          ) : (
            <section className="rounded-lg border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs">
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-teal-700 mb-2">
                <Wrench size={14} className="text-teal-600" />
                Technician Dispatch Status
              </div>
              <p className="text-sm font-semibold text-slate-800">
                Dispatch Assignment In Queue
              </p>
              <p className="mt-1 text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
                A certified field technician will be assigned to your service appointment 24–48 hours prior to arrival.
              </p>
            </section>
          )}

          {/* 2. ACTIVITY LIFECYCLE TIMELINE */}
          <section className="rounded-lg border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs">
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
                  <p className="text-xs sm:text-sm font-medium text-slate-800">Intake Request Submitted</p>
                  <p className="text-[11px] font-medium text-slate-500">
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
                    <p className="text-xs sm:text-sm font-medium text-slate-800">Quotation Issued</p>
                    <p className="text-[11px] font-medium text-slate-500">
                      Total: {formatCurrencyUsd(Number(quotation.totalUsd))} ({quotation.status})
                    </p>
                  </div>
                </div>
              ) : (
                <div className="relative opacity-60">
                  <div className="absolute -left-6 top-0 flex size-5 items-center justify-center rounded-full bg-slate-300 text-white ring-4 ring-white">
                    <Clock size={11} />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-slate-700">Awaiting Quotation</p>
                    <p className="text-[11px] font-medium text-slate-400">Technical diagnostics in review</p>
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
                    <p className="text-xs sm:text-sm font-medium text-slate-800">Service Order Dispatched</p>
                    <p className="text-[11px] font-medium text-slate-500">Appointment locked with technician</p>
                  </div>
                </div>
              ) : null}
            </div>
          </section>

          {/* 3. CONCIERGE & SUPPORT CARD - CLEAN SOLID CARD */}
          <section className="rounded-lg bg-teal-900 p-5 sm:p-6 text-white shadow-xs">
            <div className="flex items-center gap-2">
              <HelpCircle size={17} className="text-teal-300" />
              <h3 className="text-base font-semibold text-white">Need Dedicated Assistance?</h3>
            </div>
            <p className="mt-2 text-xs sm:text-sm text-teal-100/90 leading-relaxed font-medium">
              Have questions regarding your service intake ticket, hardware compatibility, or quotation? Our concierge support team is ready to help.
            </p>
            <div className="mt-4 space-y-2.5">
              <Button
                asChild
                className="w-full rounded-md bg-white text-teal-950 font-medium hover:bg-teal-50 text-xs sm:text-sm"
                size="sm"
              >
                <Link href="/contact">
                  <Mail size={14} className="mr-1.5" />
                  Message Support Team
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="w-full rounded-md border-teal-700 bg-teal-800/80 text-white hover:bg-teal-800 font-medium text-xs sm:text-sm"
                size="sm"
              >
                <Link href="/user/schedule">
                  <CalendarDays size={14} className="mr-1.5 text-teal-300" />
                  View All Appointments
                </Link>
              </Button>
            </div>
          </section>
        </div>
      </div>

      {/* MODAL: CANCEL REQUEST CONFIRMATION */}
      <Dialog open={cancelModalOpen} onOpenChange={setCancelModalOpen}>
        <DialogContent className="sm:max-w-md rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-slate-800">
              Cancel Service Request?
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm font-medium text-slate-600">
              Are you sure you want to cancel request #{displayId}? This will immediately release your reserved schedule slot and update our dispatch team.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-3">
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Reason for cancellation (optional)..."
              className="w-full min-h-20 rounded-md border border-slate-200 p-2.5 text-xs sm:text-sm font-medium focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>
          <DialogFooter className="mt-4 flex gap-2 sm:justify-end">
            <Button
              variant="outline"
              size="sm"
              className="rounded-md font-medium"
              onClick={() => setCancelModalOpen(false)}
            >
              Keep Request
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="rounded-md font-medium"
              disabled={isCancellingRequest}
              onClick={handleConfirmCancel}
            >
              {isCancellingRequest ? (
                <Loader2 size={14} className="animate-spin mr-1.5" />
              ) : null}
              Confirm Cancellation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL: DECLINE QUOTATION CONFIRMATION */}
      <Dialog open={rejectQuoteOpen} onOpenChange={setRejectQuoteOpen}>
        <DialogContent className="sm:max-w-md rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-slate-800">
              Decline Official Quotation?
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm font-medium text-slate-600">
              Please tell our estimating team why you are declining so we can provide revised pricing or alternative maintenance packages.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-3">
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Budget constraints, seeking second opinion, or requested parts clarification..."
              className="w-full min-h-24 rounded-md border border-slate-200 p-3 text-xs sm:text-sm font-medium focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>
          <DialogFooter className="mt-4 flex gap-2 sm:justify-end">
            <Button
              variant="outline"
              size="sm"
              className="rounded-md font-medium"
              onClick={() => setRejectQuoteOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="rounded-md font-medium"
              disabled={!rejectReason.trim() || isRejectingQuote}
              onClick={handleRejectQuoteDirect}
            >
              {isRejectingQuote ? (
                <Loader2 size={14} className="animate-spin mr-1.5" />
              ) : null}
              Confirm Decline
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
