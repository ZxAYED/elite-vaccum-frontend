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
  Plus,
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
import { toast } from "sonner";
import type {
  RejectionHistoryEntry,
  ServiceRequest,
  ServiceRequestStatus,
} from "@/types/domain";

type DecisionStatus = "under-review" | "accepted" | "rejected";

const rejectionReasons = [
  "Outside service area",
  "Service not available",
  "Insufficient information",
  "Unable to accommodate request",
  "Duplicate request",
  "Other",
];

const acceptedLikeStatuses: ServiceRequestStatus[] = [
  "accepted",
  "quoted",
  "scheduled",
  "in-progress",
  "completed",
];

function getInitialDecisionStatus(status: ServiceRequestStatus): DecisionStatus {
  if (acceptedLikeStatuses.includes(status)) return "accepted";
  if (status === "rejected") return "rejected";
  return "under-review";
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
  const [decisionStatus, setDecisionStatus] = useState<DecisionStatus>(
    getInitialDecisionStatus(request.status),
  );
  const [acceptOpen, setAcceptOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [createQuotationOpen, setCreateQuotationOpen] = useState(false);
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
      {
        label: "Under Review",
        detail:
          request.status === "submitted"
            ? "Opened in admin review"
            : "Review in progress",
        tone: "bg-blue-100 text-blue-800",
      },
    ];

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
    setDecisionStatus("accepted");
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
    setDecisionStatus("rejected");
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
