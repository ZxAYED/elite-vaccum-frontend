"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
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
} from "@/redux/api/quotationsApi";
import { useGetMyServiceOrdersQuery } from "@/redux/api/serviceOrdersApi";
import {
  formatCurrencyUsd,
  formatLongDate,
  formatMonthDay,
  formatShortDateTime,
} from "@/lib/formatters";
import { formatStatusLabel } from "@/lib/status-labels";
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
  const searchParams = useSearchParams();
  const requestId = params.requestId;
  const paymentSuccess = searchParams.get("payment") === "success";
  const paymentCancelled =
    searchParams.get("payment") === "cancelled" ||
    searchParams.get("payment") === "cancel" ||
    searchParams.get("payment") === "failed";

  const [copiedId, setCopiedId] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

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

  const [cancelRequestMutation, { isLoading: isCancellingRequest }] = useCancelServiceRequestMutation();

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

  // Show only service ID as requested by user (never REQ-20260903-XXXX)
  const displayId = request?.id || requestId;

  function handleCopyId() {
    if (!displayId) return;
    navigator.clipboard.writeText(displayId);
    setCopiedId(true);
    toast.success("Service ID copied to clipboard");
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

      {/* PAYMENT SUCCESS BANNER (Shown when returning from Stripe checkout) */}
      {paymentSuccess && (
        <section className="rounded-xl border border-emerald-300 bg-emerald-50/90 p-5 sm:p-6 shadow-xs">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3.5">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
                <CheckCircle2 size={24} />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base sm:text-lg font-bold text-emerald-950">
                    Payment Successful — Service Appointment Scheduled!
                  </h2>
                  <span className="rounded-md bg-emerald-200/80 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-emerald-900">
                    Paid &amp; Confirmed
                  </span>
                </div>
                <p className="text-xs sm:text-sm font-medium text-emerald-800 leading-relaxed max-w-2xl">
                  Thank you for your payment. Your quotation is confirmed, your appointment schedule has been locked, and your service order is active.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <Button
                asChild
                size="sm"
                className="rounded-lg bg-emerald-700 text-white hover:bg-emerald-800 font-semibold text-xs sm:text-sm shadow-xs h-9 px-4"
              >
                <Link href="/user/billing">
                  <FileText size={14} className="mr-1.5" />
                  View Paid Receipt
                </Link>
              </Button>
              {serviceOrder && (
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="rounded-lg border-emerald-300 text-emerald-900 hover:bg-emerald-100/60 font-semibold text-xs sm:text-sm h-9 px-4"
                >
                  <Link href={`/user/orders/${serviceOrder.id}`}>
                    View Service Order
                    <ExternalLink size={13} className="ml-1.5" />
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </section>
      )}

      {/* PAYMENT CANCELLED / INCOMPLETE BANNER */}
      {paymentCancelled && (
        <section className="rounded-xl border border-amber-300 bg-amber-50/90 p-5 sm:p-6 shadow-xs">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3.5">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-amber-600 text-white shadow-xs">
                <Clock size={24} />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base sm:text-lg font-bold text-amber-950">
                    Payment Incomplete or Cancelled
                  </h2>
                  <span className="rounded-md bg-amber-200/80 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-amber-900">
                    Checkout Incomplete
                  </span>
                </div>
                <p className="text-xs sm:text-sm font-medium text-amber-800 leading-relaxed max-w-2xl">
                  Your checkout session was cancelled or could not be completed. You can review the quotation breakdown below and click &ldquo;Accept &amp; Confirm&rdquo; whenever you are ready to retry.
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

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
                  <h3 className="text-base font-semibold text-primary mt-1">
                    Active Service Order Dispatched
                  </h3>
                  <p className="text-xs sm:text-sm font-medium text-slate-600">
                    Scheduled for: <span className="font-semibold text-primary">{soScheduledAt ? formatShortDateTime(soScheduledAt) : currentSchedule}</span>
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

      {/* 3. KEY METRICS HIGHLIGHT BAR - 4 ENHANCED PILLARS (2-LINE EYE-CATCHING LAYOUT) */}
      {(() => {
        const isCancelled = normStatus === "cancelled";
        const normQuoteStatus = (quotation?.status || "").toLowerCase().replace(/_/g, "-");
        const isQuoteAccepted = normQuoteStatus === "accepted" || Boolean(serviceOrder);
        const isQuoteRejected = normQuoteStatus === "rejected" || normStatus === "rejected";
        const isQuotationReady = Boolean(quotation) && (normQuoteStatus === "sent" || normQuoteStatus === "quoted" || normQuoteStatus === "viewed");

        // Specialist display logic:
        // ONLY quotation accept will show "Admin will assign a technician soon" (when no technician is assigned yet).
        // Rest of statuses show meaningful status copy.
        let specialistTitle = "Specialist In Queue";
        let specialistSubtitle = "Admin will assign a technician soon";

        if (assignedTech) {
          specialistTitle = assignedTech.displayName;
          specialistSubtitle = assignedTech.phone ? `Direct: ${assignedTech.phone}` : "Certified Technician Assigned";
        } else if (isCancelled) {
          specialistTitle = "No Specialist Assigned";
          specialistSubtitle = "Service request cancelled";
        } else if (isQuoteRejected) {
          specialistTitle = "Quote Declined";
          specialistSubtitle = "No specialist assigned";
        } else if (isQuoteAccepted) {
          specialistTitle = "Specialist In Queue";
          specialistSubtitle = "Admin will assign a technician soon";
        } else if (isQuotationReady) {
          specialistTitle = "Pending Approval";
          specialistSubtitle = "Awaiting quote decision";
        } else {
          specialistTitle = "Diagnostic Review";
          specialistSubtitle = "Evaluating service scope";
        }

        const scheduleSubtitle = isCancelled
          ? "Dispatch Slot Released"
          : primaryAppointment
          ? "Confirmed Dispatch Slot"
          : "Requested Arrival Window";

        const quoteTitle = isCancelled
          ? (quotation ? formatCurrencyUsd(Number(quotation.totalUsd)) : "Cancelled")
          : quotation
          ? formatCurrencyUsd(Number(quotation.totalUsd))
          : "Diagnostic Review";

        const quoteSubtitle = isCancelled
          ? "Request Cancelled"
          : quotation
          ? `Status: ${formatStatusLabel(quotation.status)}`
          : "Scope & Parts In Preparation";

        const workflowTitle = isCancelled
          ? "Request Cancelled"
          : serviceOrder
          ? "Order Dispatched"
          : quotation
          ? "Quotation Ready"
          : "Intake Review";

        const workflowSubtitle = isCancelled
          ? "Case Closed"
          : serviceOrder
          ? "Stage 4 of 4: On-Site"
          : quotation
          ? "Stage 3 of 4: Decision"
          : "Stage 2 of 4: Triage";

        return (
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Metric 1: Authoritative Service Schedule */}
            <div className="flex items-center gap-4 rounded-xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs hover:shadow-md transition-all duration-200">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-800">
                <Calendar size={22} />
              </div>
              <div className="min-w-0">
                <p className="text-base sm:text-lg font-bold text-primary truncate">
                  {currentSchedule}
                </p>
                <p className={`mt-1 text-xs sm:text-sm font-medium truncate ${isCancelled ? "text-rose-600" : "text-teal-700"}`}>
                  {scheduleSubtitle}
                </p>
              </div>
            </div>

            {/* Metric 2: Assigned Specialist */}
            <div className="flex items-center gap-4 rounded-xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs hover:shadow-md transition-all duration-200">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-800">
                <User size={22} />
              </div>
              <div className="min-w-0">
                <p className="text-base sm:text-lg font-bold text-primary truncate">
                  {specialistTitle}
                </p>
                <p className={`mt-1 text-xs sm:text-sm font-medium truncate ${isCancelled || isQuoteRejected ? "text-slate-500" : "text-slate-600"}`}>
                  {specialistSubtitle}
                </p>
              </div>
            </div>

            {/* Metric 3: Quotation Status */}
            <div className="flex items-center gap-4 rounded-xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs hover:shadow-md transition-all duration-200">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-800">
                <FileCheck2 size={22} />
              </div>
              <div className="min-w-0">
                <p className="text-base sm:text-lg font-bold text-primary truncate">
                  {quoteTitle}
                </p>
                <p className={`mt-1 text-xs sm:text-sm font-medium truncate ${isCancelled ? "text-rose-600" : "text-amber-800"}`}>
                  {quoteSubtitle}
                </p>
              </div>
            </div>

            {/* Metric 4: Case Progression Stage */}
            <div className="flex items-center gap-4 rounded-xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs hover:shadow-md transition-all duration-200">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800">
                <CheckCircle2 size={22} />
              </div>
              <div className="min-w-0">
                <p className="text-base sm:text-lg font-bold text-primary truncate">
                  {workflowTitle}
                </p>
                <p className={`mt-1 text-xs sm:text-sm font-medium ${isCancelled ? "text-slate-500" : "text-emerald-700"}`}>
                  {workflowSubtitle}
                </p>
              </div>
            </div>
          </section>
        );
      })()}

      {/* 4. MAIN DASHBOARD GRID (8 Cols Left / 4 Cols Right) */}
      <div className="grid grid-cols-1 gap-6 sm:gap-7 lg:grid-cols-12">
        {/* LEFT COLUMN: Main Case Details & Workflow (8 Cols) */}
        <div className="space-y-6 sm:space-y-7 lg:col-span-8">
          
          {/* A. DIAGNOSTIC PIPELINE / QUOTATIONS SECTION */}
          <section id="quotation" className="scroll-mt-20 overflow-hidden rounded-lg border border-slate-200/80 bg-white shadow-xs">
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
                    <h2 className="text-2xl sm:text-3xl font-semibold text-primary">
                      {formatCurrencyUsd(Number(quotation.totalUsd))}
                    </h2>
                    <p className="text-xs sm:text-sm font-medium text-slate-500">
                      Quote Ref: <span className="font-mono font-semibold text-primary">{quotation.businessId || quotation.id}</span>
                      {quotation.expiresAt ? ` · Guaranteed through ${formatLongDate(quotation.expiresAt)}` : ""}
                    </p>
                  </div>

                  {/* Action / Links */}
                  <div className="flex flex-wrap items-center gap-2">
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
                      Service Breakdown
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
                              <p className="text-sm font-semibold text-primary">{label}</p>
                              {desc && <p className="text-xs text-slate-500 font-medium">{desc}</p>}
                              {lineAny.quantity ? (
                                <p className="text-xs font-medium text-amber-800">
                                  Qty: {String(lineAny.quantity)}
                                  {lineAny.unitPriceUsd ? ` × ${formatCurrencyUsd(Number(lineAny.unitPriceUsd))}` : ""}
                                </p>
                              ) : null}
                            </div>
                            <span className="text-sm sm:text-base font-semibold text-primary">
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
                          <span>Subtotal Parts &amp; Labor</span>
                          <span className="font-semibold text-primary">{formatCurrencyUsd(Number(quotation.subtotalUsd))}</span>
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
                          <span className="font-semibold text-primary">{formatCurrencyUsd(taxVal)}</span>
                        </div>
                      ) : null}
                      <div className="border-t border-slate-200 pt-3 flex justify-between text-base sm:text-lg font-semibold text-primary">
                        <span>Total Quotation</span>
                        <span className="text-primary font-bold">{formatCurrencyUsd(Number(quotation.totalUsd))}</span>
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
                  <span className="font-semibold text-primary">{request.equipment?.manufacturer || "Standard Central Vac"}</span>
                </div>

                <div className="flex justify-between rounded-md bg-slate-50 p-3 text-xs sm:text-sm font-medium">
                  <span className="text-slate-500">Model Number</span>
                  <span className="font-semibold text-primary">{request.equipment?.modelNumber || "Not Specified"}</span>
                </div>

                <div className="flex justify-between rounded-md bg-slate-50 p-3 text-xs sm:text-sm font-medium">
                  <span className="text-slate-500">Serial Number</span>
                  <span className="font-semibold text-primary font-mono">{request.equipment?.serialNumber || "N/A"}</span>
                </div>

                <div className="flex justify-between rounded-md bg-slate-50 p-3 text-xs sm:text-sm font-medium">
                  <span className="text-slate-500">Unit Installation Location</span>
                  <span className="font-semibold text-primary">{request.equipment?.unitLocation || "Garage / Utility Room"}</span>
                </div>
              </div>
            </section>

            {/* Card 2: Property & Problem Location */}
            <section className="rounded-lg border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4">
                <MapPin size={15} className="text-teal-600" />
                Service Location &amp; Contact Info
              </div>

              <div className="space-y-2.5">
                <div className="rounded-md bg-slate-50 p-3 text-xs sm:text-sm font-medium">
                  <span className="block text-slate-500 text-xs">Service Property</span>
                  <p className="mt-0.5 font-semibold text-primary">{displayStreet}</p>
                  {displayRegion && <p className="text-xs text-slate-500">{displayRegion}</p>}
                </div>

                <div className="rounded-md bg-slate-50 p-3 text-xs sm:text-sm font-medium">
                  <span className="block text-slate-500 text-xs">Problem Location / Inlets</span>
                  <p className="mt-0.5 font-semibold text-primary">{problemLoc}</p>
                </div>

                {(contactName || contactPhone || contactEmail) && (
                  <div className="rounded-md bg-slate-50 p-3 text-xs sm:text-sm space-y-1 text-slate-600 font-medium">
                    {contactName && <p className="font-semibold text-primary">Contact: {contactName}</p>}
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
              <h3 className="text-base font-semibold text-primary">
                Customer Inspection Photos &amp; Videos
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
            <section className="rounded-xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs">
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-teal-700 mb-3.5">
                <User size={14} className="text-teal-600" />
                Assigned Service Specialist
              </div>

              <div className="flex items-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-xl bg-teal-800 text-white font-bold text-base shadow-xs">
                  {assignedTech.displayName.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-primary">
                    {assignedTech.displayName}
                  </h3>
                  {assignedTech.rating ? (
                    <div className="flex items-center gap-1 text-xs text-slate-600 mt-0.5 font-medium">
                      <Star className="size-3.5 fill-amber-400 text-amber-500" />
                      <span className="font-semibold text-primary">{assignedTech.rating}</span>
                      <span>rating</span>
                    </div>
                  ) : (
                    <p className="text-xs text-teal-700 font-medium mt-0.5">Certified Field Specialist</p>
                  )}
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
            <section className="rounded-xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs">
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-teal-700 mb-2">
                <Wrench size={14} className="text-teal-600" />
                Technician Dispatch Status
              </div>
              <p className="text-sm sm:text-base font-bold text-primary">
                Technician Assignment Pending
              </p>
              <p className="mt-1 text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
                Admin will assign a technician soon. Once assigned, their credentials and direct contact details will be shown here.
              </p>
            </section>
          )}

          {/* 2. ACTIVITY LIFECYCLE TIMELINE (DYNAMIC BASED ON ACTUAL STATUS) */}
          <section className="rounded-xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">
              Request Activity Timeline
            </h3>

            <div className="relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {/* Event 1: Intake Submission */}
              <div className="relative">
                <div className="absolute -left-6 top-0 flex size-5 items-center justify-center rounded-full bg-teal-600 text-white ring-4 ring-white shadow-2xs">
                  <Check size={11} strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-semibold text-primary">Intake Request Submitted</p>
                  <p className="text-[11px] font-medium text-slate-500">
                    {request.submittedAt || reqAny.createdAt
                      ? formatShortDateTime(request.submittedAt || reqAny.createdAt || "")
                      : "Recently submitted"}
                  </p>
                </div>
              </div>

              {/* Event 2: Quotation Issued */}
              {quotation ? (
                <div className="relative">
                  <div className="absolute -left-6 top-0 flex size-5 items-center justify-center rounded-full bg-teal-600 text-white ring-4 ring-white shadow-2xs">
                    <Check size={11} strokeWidth={2.5} />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-semibold text-primary">Quotation Issued</p>
                    <p className="text-[11px] font-medium text-slate-500">
                      Total: {formatCurrencyUsd(Number(quotation.totalUsd))} ({formatStatusLabel(quotation.status)})
                    </p>
                  </div>
                </div>
              ) : (
                <div className="relative opacity-60">
                  <div className="absolute -left-6 top-0 flex size-5 items-center justify-center rounded-full bg-slate-300 text-white ring-4 ring-white">
                    <Clock size={11} />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-semibold text-primary">Quotation Preparation</p>
                    <p className="text-[11px] font-medium text-slate-400">Technical diagnostics in review</p>
                  </div>
                </div>
              )}

              {/* Event 3: Quotation Acceptance & Payment */}
              {quotation ? (() => {
                const qNorm = (quotation.status || "").toLowerCase().replace(/_/g, "-");
                if (qNorm === "accepted") {
                  return (
                    <div className="relative">
                      <div className="absolute -left-6 top-0 flex size-5 items-center justify-center rounded-full bg-emerald-600 text-white ring-4 ring-white shadow-2xs">
                        <Check size={11} strokeWidth={2.5} />
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm font-semibold text-primary">Quotation Accepted &amp; Paid</p>
                        <p className="text-[11px] font-medium text-slate-500">
                          {quotation.paidAt ? `Paid · ${formatShortDateTime(quotation.paidAt)}` : "Payment confirmed · Scope locked"}
                        </p>
                      </div>
                    </div>
                  );
                }
                if (qNorm === "awaiting-payment") {
                  return (
                    <div className="relative">
                      <div className="absolute -left-6 top-0 flex size-5 items-center justify-center rounded-full bg-amber-500 text-white ring-4 ring-white shadow-2xs">
                        <Clock size={11} />
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm font-semibold text-primary">Awaiting Payment</p>
                        <p className="text-[11px] font-medium text-amber-700">Stripe checkout session in progress</p>
                      </div>
                    </div>
                  );
                }
                if (qNorm === "rejected") {
                  return (
                    <div className="relative">
                      <div className="absolute -left-6 top-0 flex size-5 items-center justify-center rounded-full bg-rose-500 text-white ring-4 ring-white shadow-2xs">
                        <XCircle size={11} />
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm font-semibold text-primary">Quotation Declined</p>
                        <p className="text-[11px] font-medium text-rose-600">Scope revision requested</p>
                      </div>
                    </div>
                  );
                }
                return (
                  <div className="relative opacity-70">
                    <div className="absolute -left-6 top-0 flex size-5 items-center justify-center rounded-full bg-slate-300 text-white ring-4 ring-white">
                      <Clock size={11} />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-semibold text-primary">Awaiting Customer Acceptance</p>
                      <p className="text-[11px] font-medium text-slate-400">Click &ldquo;Accept &amp; Pay&rdquo; to schedule</p>
                    </div>
                  </div>
                );
              })() : null}

              {/* Event 4: Service Order Provisioned */}
              {serviceOrder ? (
                <div className="relative">
                  <div className="absolute -left-6 top-0 flex size-5 items-center justify-center rounded-full bg-teal-600 text-white ring-4 ring-white shadow-2xs">
                    <Check size={11} strokeWidth={2.5} />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-semibold text-primary">Service Order Dispatched</p>
                    <p className="text-[11px] font-medium text-slate-500">
                      Order {(serviceOrder as unknown as Record<string, unknown>).businessId as string || serviceOrder.id} · Scheduled
                    </p>
                  </div>
                </div>
              ) : (
                <div className="relative opacity-60">
                  <div className="absolute -left-6 top-0 flex size-5 items-center justify-center rounded-full bg-slate-300 text-white ring-4 ring-white">
                    <Clock size={11} />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-semibold text-primary">Service Order Provisioning</p>
                    <p className="text-[11px] font-medium text-slate-400">Auto-created upon quote acceptance</p>
                  </div>
                </div>
              )}

              {/* Event 5: Technician Assignment (Admin will assign technician) */}
              {assignedTech ? (
                <div className="relative">
                  <div className="absolute -left-6 top-0 flex size-5 items-center justify-center rounded-full bg-teal-600 text-white ring-4 ring-white shadow-2xs">
                    <Check size={11} strokeWidth={2.5} />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-semibold text-primary">Technician Assigned</p>
                    <p className="text-[11px] font-medium text-slate-500">
                      {assignedTech.displayName} assigned for service
                    </p>
                  </div>
                </div>
              ) : (
                <div className="relative opacity-75">
                  <div className="absolute -left-6 top-0 flex size-5 items-center justify-center rounded-full bg-sky-500 text-white ring-4 ring-white shadow-2xs">
                    <User size={11} />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-semibold text-primary">Technician Assignment</p>
                    <p className="text-[11px] font-medium text-slate-500">
                      Admin will assign a technician soon
                    </p>
                  </div>
                </div>
              )}
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
    </div>
  );
}
