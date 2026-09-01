"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  FileText,
  Loader2,
  MapPin,
  Paperclip,
  Phone,
  Plus,
  ShieldCheck,
  Star,
  Wrench,
} from "lucide-react";

import { PageHeader } from "@/components/customer-portal/PageHeader";
import { QuotationDecisionPanel } from "@/components/customer-portal/QuotationDecisionPanel";
import { StatusBadge } from "@/components/customer-portal/StatusBadge";
import { Button } from "@/components/ui/Button";
import {
  useGetServiceRequestByIdQuery,
  useAppendServiceRequestAttachmentsMutation,
} from "@/redux/api/serviceRequestsApi";
import { useGetMyQuotationsQuery } from "@/redux/api/quotationsApi";
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

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  // 1. Live RTK Queries
  const { data: apiRequest, isLoading: isLoadingRequest } =
    useGetServiceRequestByIdQuery(requestId, {
      skip: !requestId,
    });

  const { data: myQuotations } = useGetMyQuotationsQuery();

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

  // Matching Quotation
  const quotation = useMemo(() => {
    if (myQuotations && myQuotations.length > 0) {
      const match = myQuotations.find(
        (q) => q.serviceRequestId === requestId || q.id === requestId,
      );
      if (match) return match;
    }
    return mockDetail?.quote;
  }, [myQuotations, requestId, mockDetail]);

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

  // Handle File Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append("attachments", files[i]);
    }

    try {
      setIsUploading(true);
      await appendAttachmentsMutation({ id: requestId, formData }).unwrap();
      toast.success("Attachments uploaded successfully.");
    } catch (err: unknown) {
      const errorMessage =
        err && typeof err === "object" && "data" in err && err.data && typeof (err.data as Record<string, unknown>).message === "string"
          ? String((err.data as Record<string, unknown>).message)
          : "Failed to upload attachments. Please try again.";
      toast.error(errorMessage);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const isLoading = isLoadingRequest && !mockRequest;

  // 3. Loading Skeleton State
  if (isLoading) {
    return (
      <div className="min-h-screen">
        <PageHeader
          eyebrow="Service Request"
          title="Loading details..."
          description="Fetching live intake request and quotation data from the server."
          actions={
            <Button asChild variant="outline">
              <Link href="/user/services">
                <ArrowLeft size={16} />
                Back to requests
              </Link>
            </Button>
          }
        />
        <div className="flex flex-col items-center justify-center py-24 text-teal-700">
          <Loader2 size={40} className="animate-spin" />
          <p className="mt-4 text-sm font-medium text-slate-600">
            Loading request #{requestId}...
          </p>
        </div>
      </div>
    );
  }

  // 4. Not Found Fallback State (Friendly UI instead of crash)
  if (!request) {
    return (
      <div className="min-h-screen">
        <PageHeader
          eyebrow="Service Request"
          title="Request Not Found"
          description="We could not locate the requested service intake ticket."
          actions={
            <Button asChild variant="outline">
              <Link href="/user/services">
                <ArrowLeft size={16} />
                Back to requests
              </Link>
            </Button>
          }
        />
        <div className="rounded-3xl border border-dashed border-teal-200 bg-teal-50/30 p-12 text-center">
          <Wrench size={40} className="mx-auto text-teal-700 opacity-60" />
          <h2 className="mt-4 text-xl font-bold text-slate-900">
            No Service Request Found
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
            Request #{requestId} might have been removed or does not belong to your account.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button asChild size="pill">
              <Link href="/user/services">View All Requests</Link>
            </Button>
            <Button asChild variant="outline" size="pill">
              <Link href="/services">Submit New Request</Link>
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

  const addressLine =
    request.serviceAddress?.line1 || reqAny.address || "Address on file";
  const cityStateZip =
    request.serviceAddress
      ? `${request.serviceAddress.city}, ${request.serviceAddress.state} ${request.serviceAddress.postalCode}`
      : reqAny.city
        ? `${reqAny.city}, ${reqAny.state || ""} ${reqAny.zipCode || ""}`.trim()
        : "";

  return (
    <div className="min-h-screen">
      <PageHeader
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="pill">
              <Link href="/user/services">
                <ArrowLeft size={16} />
                Back to requests
              </Link>
            </Button>
            {quotation && (
              <Button asChild size="pill" className="bg-amber-600 text-white hover:bg-amber-700">
                <a href="#quotation-section">
                  <FileText size={16} />
                  View Quotation
                </a>
              </Button>
            )}
            <Button asChild size="pill">
              <Link href="/user/billing">Related Billing</Link>
            </Button>
          </div>
        }
        description={request.description || reqAny.problemDescription || "Central vacuum diagnostic and intake ticket."}
        eyebrow={`Request ID: ${request.id}`}
        title={request.title || service?.name || "Central Vacuum Service Request"}
      />

      <div className="grid gap-6 xl:grid-cols-[1.45fr_1fr]">
        <div className="space-y-6">
          {/* Primary Request Overview */}
          <section className="rounded-3xl border border-teal-100/80 bg-white p-6 shadow-[0_12px_36px_-24px_rgba(28,79,80,0.15)]">
            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge status={request.status} />
              {request.urgency && (
                <StatusBadge label={request.urgency} status={request.urgency} />
              )}
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl bg-teal-50/50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Requested Schedule
                </p>
                <p className="mt-2 font-semibold text-slate-900">{requestedSchedule}</p>
              </div>
              <div className="rounded-2xl bg-teal-50/50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Current Schedule
                </p>
                <p className="mt-2 font-semibold text-slate-900">{currentSchedule}</p>
              </div>
              <div className="rounded-2xl bg-teal-50/50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Service Type
                </p>
                <p className="mt-2 font-semibold text-slate-900">
                  {service?.name ?? request.title ?? "Central Vacuum"}
                </p>
              </div>
              <div className="rounded-2xl bg-teal-50/50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Estimated Total
                </p>
                <p className="mt-2 font-semibold text-teal-800">
                  {quotation
                    ? formatCurrencyUsd(quotation.totalUsd)
                    : request.estimatedAmountUsd
                      ? formatCurrencyUsd(request.estimatedAmountUsd)
                      : "Pending Review"}
                </p>
              </div>
            </div>

            {/* Symptoms Tags */}
            {reqAny.symptoms && reqAny.symptoms.length > 0 && (
              <div className="mt-5 rounded-2xl border border-teal-100 bg-teal-50/30 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-teal-800">
                  Reported Symptoms
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {reqAny.symptoms.map((symptom: string, idx: number) => (
                    <span
                      key={idx}
                      className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-teal-900 shadow-sm border border-teal-100"
                    >
                      {symptom.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Address & Media */}
            <div className="mt-6 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
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
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-semibold text-teal-800">
                    <Paperclip size={16} />
                    Attachments ({(request.attachments || []).length})
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 gap-1.5 rounded-full text-xs"
                    disabled={isUploading}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {isUploading ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Plus size={12} />
                    )}
                    Add Files
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </div>

                <div className="mt-3 space-y-2">
                  {request.attachments && request.attachments.length > 0 ? (
                    request.attachments.map((attachment) => (
                      <div
                        className="flex items-center justify-between rounded-xl bg-slate-50 px-3.5 py-2.5 text-xs text-slate-700"
                        key={attachment.id}
                      >
                        <span className="truncate font-medium">{attachment.fileName}</span>
                        <span className="shrink-0 text-slate-400">
                          {attachment.fileType?.split("/")[1]?.toUpperCase() || "FILE"}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-500">
                      No files attached yet. You can upload photos or documents above.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Equipment details if provided */}
            {request.equipment && (
              <div className="mt-6 rounded-2xl border border-teal-100 p-5">
                <p className="text-sm font-semibold text-teal-800">
                  Equipment Information
                </p>
                <div className="mt-4 grid gap-3 md:grid-cols-4">
                  {[
                    ["Manufacturer", request.equipment.manufacturer],
                    ["Model", request.equipment.modelNumber],
                    ["Serial", request.equipment.serialNumber],
                    ["Unit Location", request.equipment.unitLocation],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-xl bg-slate-50 p-3">
                      <p className="text-xs text-slate-500">{label}</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        {value || "Not provided"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Rejection History if any */}
            {request.rejectionHistory && request.rejectionHistory.length > 0 && (
              <div className="mt-6 rounded-2xl border border-rose-100 bg-rose-50 p-5">
                <p className="text-sm font-semibold text-rose-800">
                  Request Rejection History
                </p>
                <div className="mt-3 space-y-2">
                  {request.rejectionHistory.map((entry) => (
                    <div key={entry.id} className="text-sm text-rose-800">
                      <span className="font-semibold">{entry.reason}</span>
                      {entry.comments ? ` - ${entry.comments}` : null}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* ITEMIZE QUOTATION SECTION (If Quoted/Available) */}
          {quotation ? (
            <section
              className="rounded-3xl border-2 border-amber-200 bg-amber-50/20 p-6 shadow-sm"
              id="quotation-section"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-800">
                    Official Quotation
                  </span>
                  <h2 className="mt-2 text-3xl font-bold text-slate-900">
                    {formatCurrencyUsd(quotation.totalUsd)}
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Quote ID: <span className="font-mono font-semibold">{quotation.id}</span>
                    {quotation.expiresAt && ` · Valid until ${formatLongDate(quotation.expiresAt)}`}
                  </p>
                </div>
                <StatusBadge status={quotation.status} />
              </div>

              {/* Line items table */}
              <div className="mt-6 space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Itemized Services & Parts
                </p>
                {quotation.lineItems && quotation.lineItems.length > 0 ? (
                  quotation.lineItems.map((item, idx) => {
                    const lineAny = item as unknown as Record<string, unknown>;
                    const label = String(lineAny.label || lineAny.description || `Item #${idx + 1}`);
                    const desc = typeof lineAny.description === "string" && lineAny.label ? lineAny.description : null;
                    const amount = Number(lineAny.amountUsd || (Number(lineAny.unitPriceUsd || 0) * Number(lineAny.quantity || 1)));

                    return (
                      <div
                        className="flex items-start justify-between gap-4 rounded-2xl border border-amber-100/80 bg-white px-4 py-3.5 shadow-sm"
                        key={String(lineAny.id || idx)}
                      >
                        <div>
                          <p className="font-semibold text-slate-900">{label}</p>
                          {desc && (
                            <p className="mt-0.5 text-xs text-slate-500">{desc}</p>
                          )}
                          {lineAny.quantity ? (
                            <p className="mt-1 text-xs font-medium text-amber-700">
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
                const orderAny = serviceOrder ? (serviceOrder as unknown as Record<string, unknown>) : undefined;

                return (
                  <>
                    <div className="mt-6 rounded-2xl bg-white p-4 shadow-sm border border-amber-100 space-y-2 text-sm">
                      {quotation.subtotalUsd ? (
                        <div className="flex justify-between text-slate-600">
                          <span>Subtotal</span>
                          <span>{formatCurrencyUsd(quotation.subtotalUsd)}</span>
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
                      <div className="border-t border-slate-100 pt-2 flex justify-between text-base font-bold text-slate-900">
                        <span>Total Amount</span>
                        <span className="text-teal-800">{formatCurrencyUsd(quotation.totalUsd)}</span>
                      </div>
                    </div>

                    {quotation.notes && (
                      <div className="mt-4 rounded-2xl border border-dashed border-amber-300 bg-amber-50/50 p-4 text-xs leading-relaxed text-amber-900">
                        <span className="font-bold">Estimator Note:</span> {quotation.notes}
                      </div>
                    )}

                    {/* Action Decision Panel */}
                    <div className="mt-6">
                      <QuotationDecisionPanel
                        quotationId={quotation.id}
                        requestId={request.id}
                        initialStatus={quotation.status as QuoteStatus}
                        currentScheduleLabel={currentSchedule}
                        serviceOrderHref={
                          orderAny ? `/user/orders/${String(orderAny.id)}` : undefined
                        }
                      />
                    </div>
                  </>
                );
              })()}
            </section>
          ) : request.status === "submitted" || request.status === "under-review" ? (
            <section className="rounded-3xl border border-teal-100 bg-teal-50/50 p-6 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-teal-800">
                Diagnostic Status
              </p>
              <h2 className="mt-2 text-xl font-bold text-slate-900">
                Quotation Under Review
              </h2>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Our service technicians are currently reviewing your intake specifications. An itemized quote with pricing and time slot confirmation will appear right here.
              </p>
            </section>
          ) : null}

          {/* SERVICE ORDER STATUS (If Provisioned) */}
          {serviceOrder && (
            <section className="rounded-3xl border border-teal-200 bg-[linear-gradient(135deg,#134E48_0%,#0D9488_100%)] p-6 text-white shadow-lg">
              <div className="flex items-center gap-3">
                <CheckCircle2 size={24} className="text-teal-200" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-teal-200">
                    Service Order Confirmed
                  </p>
                  <h2 className="text-xl font-bold text-white">
                    Order #{String((serviceOrder as unknown as Record<string, unknown>).id)}
                  </h2>
                </div>
              </div>
              <p className="mt-3 text-sm text-teal-50/80 leading-relaxed">
                This request has been approved and moved into dispatch scheduling. Certified technicians have been provisioned for the service visit.
              </p>
              <div className="mt-5">
                <Button asChild size="pill" className="bg-white text-teal-950 hover:bg-white/90">
                  <Link href={`/user/schedule`}>View Dispatch Schedule</Link>
                </Button>
              </div>
            </section>
          )}
        </div>

        {/* Right Sidebar: Timeline, Tech, Support */}
        <div className="space-y-6">
          {/* Assigned Technician if any */}
          {technician && (
            <section className="rounded-3xl border border-teal-100 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-teal-700">
                    Assigned Technician
                  </p>
                  <h2 className="mt-2 text-xl font-bold text-slate-900">
                    {technician.displayName}
                  </h2>
                </div>
                <ShieldCheck className="text-teal-700" size={24} />
              </div>

              <div className="mt-5 space-y-3 text-sm text-slate-700">
                <div className="flex items-center gap-2">
                  <Phone size={16} className="text-teal-600" />
                  {technician.phone}
                </div>
                <div className="flex items-center gap-2">
                  <Star className="fill-current text-amber-500" size={16} />
                  {technician.rating} rating across {technician.completedJobs} jobs
                </div>
                <div className="rounded-2xl bg-teal-50/50 p-4 text-xs font-medium text-teal-900">
                  {technician.specializations.join(" · ")}
                </div>
              </div>
            </section>
          )}

          {/* Timeline of events */}
          <section className="rounded-3xl border border-teal-100 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">Request Timeline</h2>
            <div className="mt-5 space-y-4">
              <div className="flex gap-3">
                <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-teal-50 text-teal-700">
                  <Clock3 size={16} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-slate-900">Request Submitted</h3>
                  <p className="text-xs text-slate-500">
                    {request.submittedAt || reqAny.createdAt
                      ? formatShortDateTime(request.submittedAt || reqAny.createdAt || "")
                      : "Recently submitted"}
                  </p>
                </div>
              </div>

              {quotation && (
                <div className="flex gap-3">
                  <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-700">
                    <FileText size={16} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-slate-900">Quotation Prepared</h3>
                    <p className="text-xs text-slate-500">
                      Total: {formatCurrencyUsd(quotation.totalUsd)}
                    </p>
                  </div>
                </div>
              )}

              {serviceOrder && (
                <div className="flex gap-3">
                  <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                    <CheckCircle2 size={16} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-slate-900">Service Order Dispatched</h3>
                    <p className="text-xs text-slate-500">Order confirmed for visit</p>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Support Actions */}
          <section className="rounded-3xl border border-teal-100 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <FileText className="text-teal-700" size={20} />
              <h2 className="text-lg font-bold text-slate-900">Customer Support</h2>
            </div>
            <p className="mt-2 text-xs text-slate-600">
              Need to reschedule or update instructions for this specific visit?
            </p>
            <div className="mt-5 space-y-3">
              <Button asChild className="w-full" variant="outline" size="pill">
                <Link href="/contact">Message Support</Link>
              </Button>
              <Button asChild className="w-full" variant="outline" size="pill">
                <Link href="/user/schedule">View Full Schedule</Link>
              </Button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
