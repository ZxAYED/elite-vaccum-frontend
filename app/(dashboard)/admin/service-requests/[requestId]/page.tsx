"use client";

import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Loader2,
  type LucideIcon,
  MapPin,
  MessageSquare,
  PackageSearch,
  Phone,
  Plus,
  UserCheck,
  UserRound,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { use, useMemo, useState } from "react";

import { StatusBadge } from "@/components/customer-portal/StatusBadge";
import { MediaGalleryPreview } from "@/components/shared/MediaGalleryPreview";
import { ServiceRequestQuotations } from "@/components/admin/quotations/ServiceRequestQuotations";
import { QuotationModal } from "@/components/admin/quotations/QuotationModal";
import { AssignTechnicianModal } from "@/components/admin/shared/AssignTechnicianModal";
import { RescheduleServiceRequestModal } from "@/components/admin/service-requests/RescheduleServiceRequestModal";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import {
  acceptSharedServiceRequest,
  assignSharedServiceRequestTechnician,
  getSharedCustomerById,
  getSharedPublicServices,
  getSharedServiceRequestById,
  rejectSharedServiceRequest,
} from "@/data/mock/shared-business-store";
import { useSharedBusinessStoreVersion } from "@/hooks/useSharedBusinessStoreVersion";
import { formatLongDate, formatShortDateTime } from "@/lib/formatters";
import { formatStatusLabel } from "@/lib/status-labels";
import { cn } from "@/lib/utils";
import {
  useGetServiceRequestByIdQuery,
  useUpdateServiceRequestStatusMutation,
  useRejectServiceRequestMutation,
} from "@/redux/api/serviceRequestsApi";
import { useAssignTechnicianToAppointmentMutation } from "@/redux/api/servicesApi";
import { useAssignTechnicianToServiceOrderMutation } from "@/redux/api/serviceOrdersApi";
import type { TechnicianProfileDto } from "@/redux/api/technicianApi";
import { toast } from "sonner";
import type {
  RejectionHistoryEntry,
  ServiceRequest,
} from "@/types/domain";

type DecisionStatus =
  | "submitted"
  | "under-review"
  | "accepted"
  | "rejected"
  | "cancelled";

const rejectionReasons = [
  "Outside service area",
  "Service not available",
  "Insufficient information",
  "Unable to accommodate request",
  "Duplicate request",
  "Other",
];

const acceptedLikeStatuses: string[] = [
  "accepted",
  "quoted",
  "scheduled",
  "in-progress",
  "completed",
];

function getInitialDecisionStatus(rawStatus?: string): DecisionStatus {
  if (!rawStatus) return "submitted";
  const normalized = rawStatus.toLowerCase().replace(/_/g, "-");
  if (acceptedLikeStatuses.includes(normalized)) return "accepted";
  if (normalized === "rejected") return "rejected";
  if (normalized === "cancelled") return "cancelled";
  if (normalized === "under-review") return "under-review";
  return "submitted";
}

function getCustomer(request: ServiceRequest) {
  return getSharedCustomerById(request.customerId);
}

function getServiceName(request: ServiceRequest) {
  return (
    getSharedPublicServices().find(
      (service) => service.serviceId === request.serviceId,
    )?.title ?? request.title
  );
}

function getRequestedSchedule(request: ServiceRequest) {
  const reqAny = request as unknown as Record<string, unknown>;
  const sched = (request.requestedSchedule || reqAny.requestedSchedule || {}) as Record<string, unknown>;

  const date =
    (typeof sched.preferredDate === "string" && sched.preferredDate) ||
    (typeof sched.date === "string" && sched.date) ||
    (typeof request.preferredDate === "string" && request.preferredDate) ||
    (typeof reqAny.preferredDate === "string" && reqAny.preferredDate) ||
    "";

  const time =
    (typeof sched.timeWindow === "string" && sched.timeWindow) ||
    (typeof sched.time === "string" && sched.time) ||
    (typeof request.preferredTime === "string" && request.preferredTime) ||
    (typeof reqAny.timeWindow === "string" && reqAny.timeWindow) ||
    (typeof reqAny.preferredTime === "string" && reqAny.preferredTime) ||
    "";

  return {
    date,
    time: time || "Not provided",
  };
}

function emptyValue(value?: string) {
  return value?.trim() ? value : "Not provided";
}

interface RequestDetailPageProps {
  params: Promise<{
    requestId: string;
  }>;
}

export default function AdminServiceRequestDetailPage({
  params,
}: RequestDetailPageProps) {
  useSharedBusinessStoreVersion();
  const { requestId } = use(params);
  const { data: apiRequest, isLoading } = useGetServiceRequestByIdQuery(requestId, {
    skip: !requestId,
  });
  const mockRequest = getSharedServiceRequestById(requestId);
  const request = apiRequest || mockRequest;

  if (isLoading && !request) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="size-8 animate-spin text-teal-600" />
      </div>
    );
  }

  if (!request) {
    notFound();
  }

  return <RequestReviewExperience request={request} />;
}

function RequestReviewExperience({ request }: { request: ServiceRequest }) {
  useSharedBusinessStoreVersion();
  const customer = getCustomer(request);
  const schedule = getRequestedSchedule(request);
  const [overrideStatus, setOverrideStatus] = useState<DecisionStatus | null>(null);
  const decisionStatus = overrideStatus ?? getInitialDecisionStatus(request.status);

  const [acceptOpen, setAcceptOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [createQuotationOpen, setCreateQuotationOpen] = useState(false);
  const [assignTechOpen, setAssignTechOpen] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [isAssigningTech, setIsAssigningTech] = useState(false);
  const [assignedTechnician, setAssignedTechnician] = useState<{
    id?: string;
    displayName?: string;
    phone?: string;
    rating?: number;
    completedJobs?: number;
    specializations?: string[];
  } | null>(() => {
    if (request.appointments && request.appointments.length > 0 && request.appointments[0].technician) {
      return request.appointments[0].technician;
    }
    if (request.assignedTechnicianId) {
      return { id: request.assignedTechnicianId, displayName: "Field Technician" };
    }
    return null;
  });

  const [assignTechnicianToAppointment] = useAssignTechnicianToAppointmentMutation();
  const [assignTechnicianToServiceOrder] = useAssignTechnicianToServiceOrderMutation();

  const handleAssignTechnician = async (
    techId: string,
    notes?: string,
    tech?: TechnicianProfileDto,
  ) => {
    setIsAssigningTech(true);
    try {
      if (request.appointments && request.appointments.length > 0 && request.appointments[0].id) {
        await assignTechnicianToAppointment({
          appointmentId: request.appointments[0].id,
          technicianId: techId,
          notes: notes || undefined,
        }).unwrap();
      } else if (request.serviceOrder?.id) {
        await assignTechnicianToServiceOrder({
          id: request.serviceOrder.id,
          technicianId: techId,
        }).unwrap();
      }

      assignSharedServiceRequestTechnician(request.id, techId, tech ? {
        displayName: tech.displayName,
        phone: tech.phone,
        rating: typeof tech.rating === "number" ? tech.rating : tech.rating ? parseFloat(String(tech.rating)) : undefined,
        completedJobs: tech.completedJobs,
        specializations: tech.specializations,
      } : undefined);

      setAssignedTechnician({
        id: techId,
        displayName: tech?.displayName || "Field Technician",
        phone: tech?.phone,
        rating: typeof tech?.rating === "number" ? tech.rating : tech?.rating ? parseFloat(String(tech.rating)) : undefined,
        completedJobs: tech?.completedJobs,
        specializations: tech?.specializations,
      });

      toast.success("Technician assigned successfully", {
        description: `${tech?.displayName || "Technician"} was assigned to ${request.title || request.id}`,
      });
      setAssignTechOpen(false);
    } catch {
      assignSharedServiceRequestTechnician(request.id, techId, tech ? {
        displayName: tech.displayName,
        phone: tech.phone,
        rating: typeof tech.rating === "number" ? tech.rating : tech.rating ? parseFloat(String(tech.rating)) : undefined,
        completedJobs: tech.completedJobs,
        specializations: tech.specializations,
      } : undefined);

      setAssignedTechnician({
        id: techId,
        displayName: tech?.displayName || "Field Technician",
        phone: tech?.phone,
        rating: typeof tech?.rating === "number" ? tech.rating : tech?.rating ? parseFloat(String(tech.rating)) : undefined,
        completedJobs: tech?.completedJobs,
        specializations: tech?.specializations,
      });

      toast.success("Technician assigned successfully", {
        description: `${tech?.displayName || "Technician"} was assigned to ${request.title || request.id}`,
      });
      setAssignTechOpen(false);
    } finally {
      setIsAssigningTech(false);
    }
  };

  const [rejectReason, setRejectReason] = useState("");
  const [rejectNote, setRejectNote] = useState("");
  const [rejectError, setRejectError] = useState("");
  const [localRejections, setLocalRejections] = useState<
    RejectionHistoryEntry[]
  >(request.rejectionHistory ?? []);

  const history = useMemo(() => {
    const base = [
      {
        label: "Submitted",
        detail: formatShortDateTime(request.submittedAt),
        tone: "bg-slate-100 text-slate-700",
      },
    ];

    if (decisionStatus === "cancelled") {
      base.push({
        label: "Cancelled",
        detail: "Request was cancelled",
        tone: "bg-rose-100 text-rose-700",
      });
      return base;
    }

    base.push({
      label: "Under Review",
      detail:
        request.status === "submitted"
          ? "Opened in admin review"
          : "Review in progress",
      tone: "bg-blue-100 text-blue-800",
    });

    if (decisionStatus === "accepted") {
      base.push({
        label: "Accepted",
        detail: "Quotation can be prepared next",
        tone: "bg-teal-100 text-teal-800",
      });
    }

    if (decisionStatus === "rejected") {
      base.push({
        label: "Rejected",
        detail: localRejections[0]
          ? formatShortDateTime(localRejections[0].rejectedAt)
          : "Rejected in admin review",
        tone: "bg-rose-100 text-rose-700",
      });
    }

    return base;
  }, [decisionStatus, localRejections, request.status, request.submittedAt]);

  const [updateStatusMutation] = useUpdateServiceRequestStatusMutation();
  const [rejectRequestMutation] = useRejectServiceRequestMutation();

  async function acceptRequest() {
    acceptSharedServiceRequest(request.id);
    setOverrideStatus("accepted");
    setAcceptOpen(false);

    try {
      await updateStatusMutation({
        id: request.id,
        status: "ACCEPTED",
      }).unwrap();
      toast.success("Service request accepted", {
        description: "You can now prepare a quotation for the customer.",
      });
    } catch {
      // Local store fallback handled
    }
  }

  async function rejectRequest() {
    if (!rejectReason) {
      setRejectError("Choose a rejection reason.");
      return;
    }

    const nextRequest = rejectSharedServiceRequest(
      request.id,
      rejectReason,
      rejectNote || undefined,
    );
    setLocalRejections(nextRequest?.rejectionHistory ?? []);
    setOverrideStatus("rejected");
    setRejectError("");
    setRejectOpen(false);

    try {
      await rejectRequestMutation({
        id: request.id,
        body: {
          reason: rejectReason,
          comments: rejectNote || undefined,
        },
      }).unwrap();
      toast.success("Service request rejected");
    } catch {
      // Local store fallback handled
    }
  }

  return (
    <main className="min-h-screen bg-[#f4f7f7] text-slate-950">
      <section className="space-y-4">
        <Link
          className="inline-flex items-center gap-2 text-sm font-semibold text-teal-800 hover:text-teal-950"
          href="/admin/service-requests"
        >
          <ArrowLeft size={16} />
          Back to service requests
        </Link>

        <div className="rounded-xl border border-teal-100 bg-white p-5 shadow-[0_18px_56px_-44px_rgba(28,79,80,0.35)]">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <StatusBadge
                  label={formatStatusLabel(decisionStatus)}
                  status={decisionStatus}
                />
                <span className="text-sm text-slate-500">
                  Submitted {formatShortDateTime(request.submittedAt)}
                </span>
              </div>
              <h1 className="mt-3 text-3xl font-medium tracking-[-0.03em] text-primary">
                {request.id}
              </h1>
              <p className="mt-2 text-base font-medium text-slate-700">
                {getServiceName(request)}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="outline"
                className="gap-2 border-teal-200 text-teal-800 hover:bg-teal-50"
                onClick={() => setRescheduleOpen(true)}
              >
                <CalendarDays size={16} />
                Reschedule
              </Button>
              <Button
                variant="outline"
                className="gap-2 border-teal-200 text-teal-800 hover:bg-teal-50"
                onClick={() => setAssignTechOpen(true)}
              >
                <UserCheck size={16} />
                {assignedTechnician ? "Reassign Tech" : "Assign Tech"}
              </Button>
              <Button
                variant="outline"
                className="gap-2 border-teal-200 text-teal-800 hover:bg-teal-50"
                onClick={() => {
                  toast.info("Customer messaging / chat will be implemented soon.", {
                    description: `Messaging with ${customer?.displayName ?? "customer"} will be supported directly in this portal.`,
                  });
                }}
              >
                <MessageSquare size={16} />
                Message Customer
              </Button>
            </div>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1fr_24rem]">
          <div className="space-y-4">
            <section className="grid gap-4 lg:grid-cols-2">
              <InfoPanel
                icon={UserRound}
                title="Customer"
                rows={[
                  ["Name", customer?.displayName ?? "Pending customer"],
                  ["Email", customer?.email ?? "Not supplied"],
                  ["Phone", customer?.phone ?? "Not supplied"],
                  ["Cellphone", customer?.phone ?? "Not supplied"],
                ]}
                action={
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        toast.info("Customer messaging will be available soon.")
                      }
                      className="inline-flex items-center gap-1 text-xs font-semibold text-teal-800 hover:text-teal-950 cursor-pointer"
                    >
                      <MessageSquare size={13} />
                      Message
                    </button>
                    {customer ? (
                      <Link
                        className="text-xs font-semibold text-teal-800 hover:text-teal-950"
                        href={`/admin/customers/${customer.id}`}
                      >
                        Profile
                      </Link>
                    ) : null}
                  </div>
                }
              />

              <InfoPanel
                icon={MapPin}
                title="Service Location"
                rows={[
                  ["Address", request.serviceAddress.line1],
                  [
                    "City / State / ZIP",
                    [
                      request.serviceAddress?.city,
                      request.serviceAddress?.state,
                      request.serviceAddress?.postalCode ||
                        (request.serviceAddress as unknown as Record<string, unknown>)?.zipCode,
                    ]
                      .filter(Boolean)
                      .join(", ") || "Not provided",
                  ],
                  ["Inside Location", emptyValue(request.problemLocation)],
                  ["Property", request.propertyLabel],
                ]}
              />
            </section>

            <section className="grid gap-4 lg:grid-cols-2">
              <InfoPanel
                icon={CalendarDays}
                title="Requested Schedule"
                rows={[
                  [
                    "Customer-selected date",
                    schedule.date ? formatLongDate(schedule.date) : "Not provided",
                  ],
                  ["Customer-selected time", schedule.time || "Not provided"],
                  ["Current schedule", request.currentSchedule?.label ?? "Matches requested schedule"],
                ]}
                action={
                  <button
                    type="button"
                    onClick={() => setRescheduleOpen(true)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-teal-800 hover:text-teal-950 cursor-pointer"
                  >
                    <CalendarDays size={13} />
                    Reschedule
                  </button>
                }
              />

              <InfoPanel
                icon={PackageSearch}
                title="Equipment Information"
                rows={[
                  ["Manufacturer", emptyValue(request.equipment?.manufacturer)],
                  ["Model", emptyValue(request.equipment?.modelNumber)],
                  ["Serial Number", emptyValue(request.equipment?.serialNumber)],
                  ["Unit Location", emptyValue(request.equipment?.unitLocation)],
                ]}
              />
            </section>

            <section className="rounded-xl border border-teal-100 bg-white p-5 shadow-[0_14px_44px_-36px_rgba(28,79,80,0.34)]">
              <h2 className="text-xl font-semibold text-teal-950">
                Problem Details
              </h2>
              <div className="mt-4 space-y-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                    Issue Description
                  </p>
                  <p className="mt-2 leading-7 text-slate-700">
                    {request.description}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                    Additional Notes
                  </p>
                  <p className="mt-2 leading-7 text-slate-700">
                    {emptyValue(request.additionalNotes)}
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-teal-100 bg-white p-5 shadow-[0_14px_44px_-36px_rgba(28,79,80,0.34)]">
              <MediaGalleryPreview
                attachments={request.attachments}
                title="Customer Photos & Videos"
                emptyMessage="No customer media submitted"
                emptyDescription="No photos or video recordings were submitted with this request."
              />
            </section>

            <ServiceRequestQuotations
              serviceRequest={request}
              isAccepted={decisionStatus === "accepted"}
              isCancelled={decisionStatus === "cancelled"}
            />
          </div>

          <aside className="space-y-6">
            <section className="rounded-xl bg-primary p-5 text-white shadow-[0_18px_56px_-42px_rgba(28,79,80,0.58)]">
              <h2 className="text-xl font-semibold">Admin Decision</h2>
              <p className="mt-3 text-sm leading-6 text-white/75">
                {decisionStatus === "accepted"
                  ? "This service request has been accepted. You can now prepare a quotation for the customer."
                  : decisionStatus === "rejected"
                    ? "This service request was rejected. Rejection details are logged in the history below."
                    : decisionStatus === "cancelled"
                      ? "This service request was cancelled. Decision actions and quotations are closed for this request."
                      : "Accepting a request only prepares it for quotation. It does not create a service order."}
              </p>
              <div className="mt-6 space-y-3">
                {decisionStatus === "accepted" ? (
                  <Button
                    className="w-full bg-white text-primary hover:bg-teal-50 font-medium"
                    onClick={() => setCreateQuotationOpen(true)}
                  >
                    <Plus size={16} />
                    Create Quotation
                  </Button>
                ) : decisionStatus === "rejected" ? (
                  <div className="rounded-lg border border-white/20 bg-white/10 p-3 text-center text-sm font-medium text-white/90">
                    Request Rejected
                  </div>
                ) : decisionStatus === "cancelled" ? (
                  <div className="rounded-lg border border-rose-200/30 bg-rose-500/20 p-3 text-center text-sm font-medium text-rose-100">
                    Request Cancelled
                  </div>
                ) : (
                  <>
                    <Button
                      className="w-full bg-white text-primary hover:bg-teal-50 font-medium"
                      onClick={() => setAcceptOpen(true)}
                    >
                      <CheckCircle2 size={16} />
                      Accept Request
                    </Button>
                    <Button
                      className="w-full border border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white font-medium shadow-none"
                      onClick={() => setRejectOpen(true)}
                    >
                      <XCircle size={16} />
                      Reject Request
                    </Button>
                  </>
                )}
              </div>
            </section>

            {assignedTechnician ? (
              <section className="rounded-xl border border-teal-100 bg-white p-5 shadow-[0_14px_44px_-36px_rgba(28,79,80,0.34)]">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-teal-950 flex items-center gap-2">
                    <UserRound size={18} className="text-teal-700" />
                    Assigned Technician
                  </h2>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                    <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Assigned
                  </span>
                </div>
                <div className="mt-4 rounded-xl bg-slate-50 p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-slate-900">{assignedTechnician.displayName}</p>
                    {assignedTechnician.rating && (
                      <span className="text-xs font-semibold text-amber-600">
                        ⭐ {assignedTechnician.rating}
                      </span>
                    )}
                  </div>
                  {assignedTechnician.phone && (
                    <p className="text-xs text-slate-600 flex items-center gap-1.5">
                      <Phone size={12} className="text-slate-400" />
                      {assignedTechnician.phone}
                    </p>
                  )}
                  {assignedTechnician.completedJobs !== undefined && (
                    <p className="text-xs text-slate-500">
                      {assignedTechnician.completedJobs} completed jobs
                    </p>
                  )}
                  {assignedTechnician.specializations && assignedTechnician.specializations.length > 0 && (
                    <div className="pt-1 flex flex-wrap gap-1">
                      {assignedTechnician.specializations.map((spec) => (
                        <span key={spec} className="rounded bg-teal-50 text-teal-800 border border-teal-100 px-1.5 py-0.5 text-[10px] font-medium">
                          {spec.replace(/_/g, " ")}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <Button
                  onClick={() => setAssignTechOpen(true)}
                  variant="outline"
                  size="sm"
                  className="w-full mt-3 text-xs border-teal-200 text-teal-800 hover:bg-teal-50 font-medium"
                >
                  <UserCheck size={14} className="mr-1.5" />
                  Change / Reassign Technician
                </Button>
              </section>
            ) : (
              <section className="rounded-xl border border-dashed border-teal-200 bg-teal-50/40 p-5 text-center shadow-sm">
                <div className="mx-auto size-10 rounded-full bg-white border border-teal-200 flex items-center justify-center text-teal-700 mb-2 shadow-xs">
                  <UserRound size={18} />
                </div>
                <h3 className="text-sm font-bold text-teal-950">No Technician Assigned</h3>
                <p className="mt-1 text-xs text-slate-600">
                  Assign an available technician to handle on-site diagnostics and service execution.
                </p>
                <Button
                  onClick={() => setAssignTechOpen(true)}
                  size="sm"
                  className="mt-3.5 w-full bg-primary text-white hover:bg-teal-700 font-medium"
                >
                  <UserCheck size={15} className="mr-1.5" />
                  Assign Technician
                </Button>
              </section>
            )}

            <section className="rounded-xl border border-teal-100 bg-white p-5 shadow-[0_14px_44px_-36px_rgba(28,79,80,0.34)]">
              <h2 className="text-xl font-semibold text-teal-950">
                Request Decision History
              </h2>
              <div className="mt-5 space-y-3">
                {history.map((entry) => (
                  <div
                    className="rounded-xl bg-slate-50 p-4"
                    key={`${entry.label}-${entry.detail}`}
                  >
                    <span
                      className={cn(
                        "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
                        entry.tone,
                      )}
                    >
                      {entry.label}
                    </span>
                    <p className="mt-2 text-sm text-slate-600">{entry.detail}</p>
                  </div>
                ))}
              </div>
            </section>

            {localRejections.length > 0 ? (
              <section className="rounded-xl border border-rose-100 bg-white p-5 shadow-[0_14px_44px_-36px_rgba(28,79,80,0.34)]">
                <h2 className="text-xl font-semibold text-rose-950">
                  Rejection History
                </h2>
                <div className="mt-5 space-y-4">
                  {localRejections.map((entry) => (
                    <div className="rounded-xl bg-rose-50 p-4" key={entry.id}>
                      <p className="font-semibold text-rose-950">
                        {entry.reason}
                      </p>
                      <p className="mt-1 text-sm text-rose-700">
                        {formatShortDateTime(entry.rejectedAt)} ·{" "}
                        {entry.actorLabel}
                      </p>
                      {entry.comments ? (
                        <p className="mt-3 text-sm leading-6 text-slate-700">
                          {entry.comments}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </section>
            ) : null}
          </aside>
        </div>
      </section>

      <Dialog open={acceptOpen} onOpenChange={setAcceptOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Accept Service Request?</DialogTitle>
            <DialogDescription>
              The request will be accepted and you can prepare a quotation for
              the customer. No service order is created at this stage.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAcceptOpen(false)}>
              Cancel
            </Button>
            <Button onClick={acceptRequest}>Accept Request</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Request</DialogTitle>
            <DialogDescription>
              Rejection requires a reason and remains visible in request history.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-5 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-900">
                Reason <span className="text-red-600">*</span>
              </label>
              <Select
                value={rejectReason}
                onValueChange={(value) => {
                  setRejectReason(value);
                  setRejectError("");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a rejection reason" />
                </SelectTrigger>
                <SelectContent>
                  {rejectionReasons.map((reason) => (
                    <SelectItem key={reason} value={reason}>
                      {reason}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {rejectError ? (
                <p className="text-sm text-red-700" role="alert">
                  {rejectError}
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-900">
                Additional Admin Note
              </label>
              <Textarea
                onChange={(event) => setRejectNote(event.target.value)}
                placeholder="Add context for history..."
                value={rejectNote}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={rejectRequest}>
              Reject Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Quotation Modal */}
      <QuotationModal
        open={createQuotationOpen}
        onOpenChange={setCreateQuotationOpen}
        serviceRequest={request}
        mode="create"
      />

      {/* Assign Technician Modal */}
      <AssignTechnicianModal
        open={assignTechOpen}
        onOpenChange={setAssignTechOpen}
        title="Assign Field Technician"
        subtitle={`Select an available technician for service request #${request.id}`}
        currentTechnicianId={assignedTechnician?.id}
        contextInfo={{
          serviceName: getServiceName(request),
          customerName: customer?.displayName || "Customer",
          date: schedule.date,
          timeWindow: schedule.time,
          location: `${request.serviceAddress.line1}, ${request.serviceAddress.city}`,
        }}
        isAssigning={isAssigningTech}
        onAssign={handleAssignTechnician}
      />

      <RescheduleServiceRequestModal
        open={rescheduleOpen}
        onOpenChange={setRescheduleOpen}
        serviceRequest={request}
      />
    </main>
  );
}

interface InfoPanelProps {
  action?: ReactNode;
  icon: LucideIcon;
  rows: Array<[string, string]>;
  title: string;
}

function InfoPanel({ action, icon: Icon, rows, title }: InfoPanelProps) {
  return (
    <section className="rounded-xl border border-teal-100 bg-white p-5 shadow-[0_14px_44px_-36px_rgba(28,79,80,0.34)]">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-xl bg-teal-50 text-teal-800">
            <Icon size={19} />
          </span>
          <h2 className="text-xl font-semibold text-teal-950">{title}</h2>
        </div>
        {action}
      </div>
      <dl className="mt-5 space-y-4">
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
              {label}
            </dt>
            <dd className="mt-1 text-sm leading-6 text-slate-700">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
