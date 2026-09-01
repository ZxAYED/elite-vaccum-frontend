"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileCheck2,
  FileText,
  HelpCircle,
  Loader2,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
  Star,
  Wrench,
} from "lucide-react";

import { PageHeader } from "@/components/customer-portal/PageHeader";
import { QuotationDecisionPanel } from "@/components/customer-portal/QuotationDecisionPanel";
import { ServiceMediaGallery } from "@/components/customer-portal/ServiceMediaGallery";
import { StatusBadge } from "@/components/customer-portal/StatusBadge";
import { Button } from "@/components/ui/Button";
import {
  useGetServiceRequestByIdQuery,
  useAppendServiceRequestAttachmentsMutation,
} from "@/redux/api/serviceRequestsApi";
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

export default function ServiceRequestDetailPage() {
  useSharedBusinessStoreVersion();
  const params = useParams<{ requestId: string }>();
  const requestId = params.requestId;

  const [isUploading, setIsUploading] = useState(false);

  // 1. Live RTK Queries
  const { data: apiRequest, isLoading: isLoadingRequest } =
    useGetServiceRequestByIdQuery(requestId, {
      skip: !requestId,
    });

  const { data: myQuotations } = useGetMyQuotationsQuery();

  // Try direct single quote query as well in case requestId is a quotation ID
  const { data: singleQuote } = useGetQuotationByIdQuery(requestId, {
    skip: !requestId,
  });

  const { data: myOrdersResponse } = useGetMyServiceOrdersQuery();

  const [appendAttachmentsMutation] = useAppendServiceRequestAttachmentsMutation();

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

  // Matching Quotation for this specific service request
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

  // Handle File Upload for Photos and Videos
  const handleUploadFiles = async (files: FileList) => {
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append("attachments", files[i]);
    }

    try {
      setIsUploading(true);
      await appendAttachmentsMutation({ id: requestId, formData }).unwrap();
      toast.success("Photos/videos uploaded successfully", {
        description: "Your files have been attached to this service request.",
      });
    } catch (err: unknown) {
      const errorMessage =
        err &&
        typeof err === "object" &&
        "data" in err &&
        err.data &&
        typeof (err.data as Record<string, unknown>).message === "string"
          ? String((err.data as Record<string, unknown>).message)
          : "Failed to upload attachments. Please ensure files are images or videos.";
      toast.error(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const isLoading = isLoadingRequest && !mockRequest;

  // 3. Loading Skeleton State
  if (isLoading) {
    return (
      <div className="min-h-screen">
        <PageHeader
          eyebrow="Customer Portal"
          title="Loading service request..."
          description="Fetching live diagnostic intake and quotation records from the server."
          actions={
            <Button asChild variant="outline" size="pill">
              <Link href="/user/services">
                <ArrowLeft size={16} />
                Back to requests
              </Link>
            </Button>
          }
        />
        <div className="flex flex-col items-center justify-center py-28 text-teal-700">
          <Loader2 size={44} className="animate-spin text-teal-600" />
          <p className="mt-4 text-sm font-semibold text-slate-700">
            Loading Request #{requestId}...
          </p>
        </div>
      </div>
    );
  }

  // 4. Not Found Fallback State (Friendly UI)
  if (!request) {
    return (
      <div className="min-h-screen">
        <PageHeader
          eyebrow="Customer Portal"
          title="Service Request Not Found"
          description="We could not locate the requested service intake ticket."
          actions={
            <Button asChild variant="outline" size="pill">
              <Link href="/user/services">
                <ArrowLeft size={16} />
                Back to requests
              </Link>
            </Button>
          }
        />
        <div className="rounded-3xl border border-dashed border-teal-200 bg-teal-50/20 p-12 text-center shadow-sm">
          <Wrench size={40} className="mx-auto text-teal-700 opacity-60" />
          <h2 className="mt-4 text-xl font-bold text-slate-900">
            Request #{requestId} Not Found
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
            This request might have been moved or is not associated with your logged-in customer account.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button asChild size="pill">
              <Link href="/user/services">View My Requests</Link>
            </Button>
            <Button asChild variant="outline" size="pill">
              <Link href="/services">Start New Request</Link>
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
  };

  const service = getServiceById(request.serviceId);
  const technician = getTechnicianById(
    mockDetail?.appointment?.technicianId ?? request.assignedTechnicianId,
  );

  const requestedSchedule =
    request.requestedSchedule?.label ??
    (request.preferredDate
      ? `${formatMonthDay(request.preferredDate)}${request.preferredTime ? ` at ${request.preferredTime}` : ""}`
      : "Pending scheduling");

  const currentSchedule =
    request.currentSchedule?.label ?? requestedSchedule;

  // Clean Address Formatting (No undefined!)
  const streetAddress =
    request.serviceAddress?.line1 || reqAny.address || "Address on file";

  const cityVal = request.serviceAddress?.city || reqAny.city || "";
  const stateVal = request.serviceAddress?.state || reqAny.state || "";
  const zipVal = request.serviceAddress?.postalCode || reqAny.zipCode || "";
  const cityStateZip = [cityVal, stateVal, zipVal].filter(Boolean).join(", ");

  const problemLoc =
    request.problemLocation ||
    reqAny.problemLocation ||
    reqAny.otherProblemLocation ||
    "Central Vacuum Unit / Whole House";

  return (
    <div className="min-h-screen">
      <PageHeader
        actions={
          <div className="flex flex-wrap gap-2.5">
            <Button asChild variant="outline" size="pill">
              <Link href="/user/services">
                <ArrowLeft size={16} />
                Back to requests
              </Link>
            </Button>
            {quotation && (
              <Button
                asChild
                size="pill"
                className="bg-amber-600 text-white shadow-sm hover:bg-amber-700"
              >
                <a href="#quotation-section">
                  <FileText size={16} />
                  Review Quotation
                </a>
              </Button>
            )}
            <Button asChild size="pill">
              <Link href="/user/billing">Related Billing</Link>
            </Button>
          </div>
        }
        description={
          request.description ||
          reqAny.problemDescription ||
          "Central vacuum diagnostic evaluation and service intake ticket."
        }
        eyebrow={`Request ID: ${request.id}`}
        title={request.title || service?.name || "Central Vacuum Service Request"}
      />

      <div className="grid gap-6 xl:grid-cols-[1.45fr_1fr]">
        {/* Left Column: Primary Details, Symptoms, Location, Media & Quotation */}
        <div className="space-y-6">
          {/* Main Info Card */}
          <section className="rounded-3xl border border-teal-100/90 bg-white p-6 shadow-[0_12px_36px_-24px_rgba(28,79,80,0.15)]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-5">
              <div className="flex flex-wrap items-center gap-2.5">
                <StatusBadge status={request.status} />
                {request.urgency && (
                  <StatusBadge label={request.urgency} status={request.urgency} />
                )}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <Clock3 size={14} className="text-teal-600" />
                Submitted: {request.submittedAt || reqAny.createdAt ? formatShortDateTime(request.submittedAt || reqAny.createdAt || "") : "Recent"}
              </div>
            </div>

            {/* 4 Metrics Row */}
            <div className="mt-5 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-teal-50 bg-[linear-gradient(180deg,#F0FDFA_0%,#F8FAFC_100%)] p-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Requested Schedule
                </p>
                <p className="mt-1.5 text-sm font-bold text-slate-900">{requestedSchedule}</p>
              </div>
              <div className="rounded-2xl border border-teal-50 bg-[linear-gradient(180deg,#F0FDFA_0%,#F8FAFC_100%)] p-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Active Schedule
                </p>
                <p className="mt-1.5 text-sm font-bold text-slate-900">{currentSchedule}</p>
              </div>
              <div className="rounded-2xl border border-teal-50 bg-[linear-gradient(180deg,#F0FDFA_0%,#F8FAFC_100%)] p-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Service Category
                </p>
                <p className="mt-1.5 text-sm font-bold text-slate-900">
                  {service?.name ?? request.title ?? "Maintenance"}
                </p>
              </div>
              <div className="rounded-2xl border border-teal-50 bg-[linear-gradient(180deg,#F0FDFA_0%,#F8FAFC_100%)] p-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Estimated Total
                </p>
                <p className="mt-1.5 text-sm font-bold text-teal-800">
                  {quotation
                    ? formatCurrencyUsd(quotation.totalUsd)
                    : request.estimatedAmountUsd
                      ? formatCurrencyUsd(request.estimatedAmountUsd)
                      : "Pending Review"}
                </p>
              </div>
            </div>

            {/* Reported Symptoms */}
            {reqAny.symptoms && reqAny.symptoms.length > 0 && (
              <div className="mt-5 rounded-2xl border border-teal-100/70 bg-teal-50/30 p-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-teal-800">
                  Reported Malfunction Symptoms
                </p>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {reqAny.symptoms.map((symptom: string, idx: number) => (
                    <span
                      key={idx}
                      className="rounded-full border border-teal-100 bg-white px-3 py-1 text-xs font-semibold text-teal-900 shadow-sm"
                    >
                      {symptom.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Service Location and Problem Area */}
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
                  <Wrench size={15} />
                  Problem Area / Inlets
                </div>
                <p className="mt-2.5 text-sm font-medium leading-relaxed text-slate-800">
                  {problemLoc}
                </p>
              </div>
            </div>

            {/* Equipment Information if available */}
            {request.equipment && (
              <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Vacuum System Equipment Specifications
                </p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    ["Manufacturer", request.equipment.manufacturer],
                    ["Model", request.equipment.modelNumber],
                    ["Serial", request.equipment.serialNumber],
                    ["Unit Location", request.equipment.unitLocation],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-xl bg-white p-3 border border-slate-100">
                      <p className="text-[10px] uppercase font-bold text-slate-400">{label}</p>
                      <p className="mt-1 text-xs font-semibold text-slate-900">
                        {value || "Not provided"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* MEDIA & ATTACHMENTS (Images & Videos Gallery with Lightbox) */}
          <section className="rounded-3xl border border-teal-100/90 bg-white p-6 shadow-[0_12px_36px_-24px_rgba(28,79,80,0.15)]">
            <ServiceMediaGallery
              attachments={request.attachments || []}
              onUploadFiles={handleUploadFiles}
              isUploading={isUploading}
              canUpload={true}
            />
          </section>

          {/* QUOTATION SECTION (Live Itemized Quote or Dynamic In-Progress UI) */}
          <div id="quotation-section">
            {quotation ? (
              <section className="rounded-3xl border-2 border-amber-300/80 bg-[linear-gradient(180deg,#FFFDF7_0%,#FEFBF2_100%)] p-6 shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between border-b border-amber-100 pb-5">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-800">
                        Official Service Quotation
                      </span>
                      <StatusBadge status={quotation.status} />
                    </div>
                    <h2 className="mt-3 text-3xl font-bold text-slate-900">
                      {formatCurrencyUsd(quotation.totalUsd)}
                    </h2>
                    <p className="mt-1 text-xs text-slate-600">
                      Quote ID: <span className="font-mono font-bold text-amber-900">{quotation.id}</span>
                      {quotation.expiresAt && ` · Valid through ${formatLongDate(quotation.expiresAt)}`}
                    </p>
                  </div>

                  <div className="flex shrink-0 gap-2">
                    <Button asChild variant="outline" size="sm" className="rounded-full border-amber-200 bg-white text-amber-900 hover:bg-amber-50">
                      <Link href={`/user/quotations/${quotation.id}`}>
                        <FileText size={14} />
                        Full Quotation View
                      </Link>
                    </Button>
                  </div>
                </div>

                {/* Line Items Table */}
                <div className="mt-6 space-y-3">
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
                          className="flex items-start justify-between gap-4 rounded-2xl border border-amber-100/90 bg-white p-4 shadow-sm"
                          key={String(lineAny.id || idx)}
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
                    <div className="rounded-2xl border border-amber-100 bg-white p-4 text-sm text-slate-600">
                      Standard central vacuum diagnosis and repair service package.
                    </div>
                  )}
                </div>

                {/* Totals Breakdown */}
                {(() => {
                  const quoteAny = quotation as unknown as Record<string, unknown>;
                  const discountVal = quoteAny.discountUsd ? Number(quoteAny.discountUsd) : undefined;
                  const taxVal = quoteAny.taxUsd ? Number(quoteAny.taxUsd) : undefined;

                  return (
                    <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm border border-amber-100 space-y-2.5 text-sm">
                      {quotation.subtotalUsd ? (
                        <div className="flex justify-between text-slate-600 font-medium">
                          <span>Subtotal</span>
                          <span>{formatCurrencyUsd(quotation.subtotalUsd)}</span>
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
                        <span className="text-teal-800 font-extrabold">{formatCurrencyUsd(quotation.totalUsd)}</span>
                      </div>
                    </div>
                  );
                })()}

                {quotation.notes && (
                  <div className="mt-4 rounded-2xl border border-dashed border-amber-200 bg-amber-50/60 p-4 text-xs leading-relaxed text-amber-950">
                    <span className="font-bold">Estimator Technical Note:</span> {quotation.notes}
                  </div>
                )}

                {/* Quotation Action & Decision Panel */}
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
              </section>
            ) : (
              /* Quotation in Preparation / Empty State */
              <section className="rounded-3xl border border-teal-100/90 bg-[linear-gradient(180deg,#F0FDFA_0%,#FFFFFF_100%)] p-6 shadow-sm">
                <div className="flex items-start gap-3.5">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-teal-100 text-teal-800 shadow-sm">
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <span className="rounded-full bg-teal-100/80 px-3 py-0.5 text-[11px] font-bold uppercase tracking-wider text-teal-800">
                      Diagnostics In Progress
                    </span>
                    <h2 className="mt-2 text-xl font-bold text-slate-900">
                      Quotation In Preparation
                    </h2>
                    <p className="mt-1 text-sm text-slate-600 leading-relaxed max-w-xl">
                      Our certified central vacuum specialists are reviewing your reported symptoms, equipment model details, and media attachments. An itemized quote with confirmed pricing and dispatch time slot options will appear right here.
                    </p>
                  </div>
                </div>

                {/* Stepper Progress */}
                <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 border-t border-teal-100/80 pt-5">
                  <div className="rounded-xl bg-white p-3 border border-teal-100/60 shadow-xs">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-teal-800">
                      <CheckCircle2 size={14} className="text-teal-600" />
                      1. Submitted
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500">Intake received</p>
                  </div>
                  <div className="rounded-xl bg-teal-50 p-3 border border-teal-200/80 shadow-xs">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-teal-900">
                      <Loader2 size={14} className="animate-spin text-teal-700" />
                      2. Diagnostic Review
                    </div>
                    <p className="mt-1 text-[11px] text-slate-600">Technician triage</p>
                  </div>
                  <div className="rounded-xl bg-white/70 p-3 border border-slate-100 shadow-xs opacity-75">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                      <FileCheck2 size={14} />
                      3. Itemized Quote
                    </div>
                    <p className="mt-1 text-[11px] text-slate-400">Parts & labor pricing</p>
                  </div>
                  <div className="rounded-xl bg-white/70 p-3 border border-slate-100 shadow-xs opacity-75">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                      <CalendarDays size={14} />
                      4. Dispatch
                    </div>
                    <p className="mt-1 text-[11px] text-slate-400">Technician visit</p>
                  </div>
                </div>
              </section>
            )}
          </div>

          {/* SERVICE ORDER DISPATCH STATUS (If Provisioned) */}
          {serviceOrder && (
            <section className="rounded-3xl border border-teal-200 bg-[linear-gradient(135deg,#134E48_0%,#0D9488_100%)] p-6 text-white shadow-lg">
              <div className="flex items-center gap-3.5">
                <div className="flex size-11 items-center justify-center rounded-2xl bg-white/10 text-teal-200 backdrop-blur-sm">
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-teal-200">
                    Service Order Confirmed & Dispatched
                  </p>
                  <h2 className="text-xl font-bold text-white">
                    Order #{String((serviceOrder as unknown as Record<string, unknown>).id)}
                  </h2>
                </div>
              </div>
              <p className="mt-3 text-sm text-teal-50/90 leading-relaxed">
                Your service order has been provisioned and added to the certified technician route. Real-time ETA and status updates will be tracked here.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Button asChild size="pill" className="bg-white text-teal-950 hover:bg-white/90 font-bold">
                  <Link href={`/user/schedule`}>View Live Schedule</Link>
                </Button>
              </div>
            </section>
          )}
        </div>

        {/* Right Sidebar: Timeline, Tech, Support */}
        <div className="space-y-6">
          {/* Assigned Technician Card */}
          {technician && (
            <section className="rounded-3xl border border-teal-100 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-teal-700">
                    Assigned Field Technician
                  </p>
                  <h2 className="mt-1.5 text-xl font-bold text-slate-900">
                    {technician.displayName}
                  </h2>
                </div>
                <div className="flex size-10 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
                  <ShieldCheck size={22} />
                </div>
              </div>

              <div className="mt-5 space-y-3 text-sm text-slate-700">
                <div className="flex items-center gap-2 font-medium">
                  <Phone size={16} className="text-teal-600" />
                  {technician.phone}
                </div>
                <div className="flex items-center gap-2 font-medium">
                  <Star className="fill-current text-amber-500" size={16} />
                  {technician.rating} rating across {technician.completedJobs} verified visits
                </div>
                <div className="rounded-2xl bg-teal-50/60 p-3 text-xs font-semibold text-teal-900">
                  Specialties: {technician.specializations.join(" · ")}
                </div>
              </div>
            </section>
          )}

          {/* Request Timeline */}
          <section className="rounded-3xl border border-teal-100 bg-white p-6 shadow-sm">
            <h2 className="text-base font-bold text-slate-900">Request Lifecycle Timeline</h2>
            <div className="mt-5 space-y-4">
              <div className="flex gap-3">
                <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-teal-100 text-teal-800">
                  <Clock3 size={15} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-slate-900">Intake Request Submitted</h3>
                  <p className="text-xs text-slate-500">
                    {request.submittedAt || reqAny.createdAt
                      ? formatShortDateTime(request.submittedAt || reqAny.createdAt || "")
                      : "Recently submitted"}
                  </p>
                </div>
              </div>

              {quotation && (
                <div className="flex gap-3">
                  <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-800">
                    <FileText size={15} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-slate-900">Quotation Ready</h3>
                    <p className="text-xs text-slate-500">
                      Total: {formatCurrencyUsd(quotation.totalUsd)} ({quotation.status})
                    </p>
                  </div>
                </div>
              )}

              {serviceOrder && (
                <div className="flex gap-3">
                  <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-800">
                    <CheckCircle2 size={15} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-slate-900">Service Order Dispatched</h3>
                    <p className="text-xs text-slate-500">Appointment scheduled with certified tech</p>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Customer Support Card */}
          <section className="rounded-3xl border border-teal-100 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                <HelpCircle size={18} />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Customer Support</h2>
                <p className="text-xs text-slate-500">Need help or changes to this visit?</p>
              </div>
            </div>
            <div className="mt-5 space-y-2.5">
              <Button asChild className="w-full" variant="outline" size="pill">
                <Link href="/contact">Message Support Team</Link>
              </Button>
              <Button asChild className="w-full" variant="outline" size="pill">
                <Link href="/user/schedule">View Complete Schedule</Link>
              </Button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
