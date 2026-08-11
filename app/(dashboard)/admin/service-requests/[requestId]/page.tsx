"use client";

import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  FileImage,
  FileVideo,
  type LucideIcon,
  MapPin,
  PackageSearch,
  UserRound,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { use, useMemo, useState } from "react";

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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { mockCustomers } from "@/data/mock/customers";
import { publicServiceOfferings } from "@/data/mock/public-services";
import { getQuotationForRequest } from "@/data/mock/quotations";
import { mockServiceRequests } from "@/data/mock/service-requests";
import { formatLongDate, formatShortDateTime } from "@/lib/formatters";
import { formatStatusLabel } from "@/lib/status-labels";
import { cn } from "@/lib/utils";
import type {
  RejectionHistoryEntry,
  ServiceRequest,
  ServiceRequestAttachment,
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
  return mockCustomers.find((customer) => customer.id === request.customerId);
}

function getServiceName(request: ServiceRequest) {
  return (
    publicServiceOfferings.find(
      (service) => service.serviceId === request.serviceId,
    )?.title ?? request.title
  );
}

function getRequestedSchedule(request: ServiceRequest) {
  return request.requestedSchedule ?? {
    date: request.preferredDate,
    time: request.preferredTime,
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
  const { requestId } = use(params);
  const request = mockServiceRequests.find((item) => item.id === requestId);

  if (!request) {
    notFound();
  }

  return <RequestReviewExperience request={request} />;
}

function RequestReviewExperience({ request }: { request: ServiceRequest }) {
  const customer = getCustomer(request);
  const schedule = getRequestedSchedule(request);
  const quotation = getQuotationForRequest(request.id);
  const [decisionStatus, setDecisionStatus] = useState<DecisionStatus>(
    getInitialDecisionStatus(request.status),
  );
  const [acceptOpen, setAcceptOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [previewAttachment, setPreviewAttachment] =
    useState<ServiceRequestAttachment | null>(null);
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

  function acceptRequest() {
    setDecisionStatus("accepted");
    setAcceptOpen(false);
  }

  function rejectRequest() {
    if (!rejectReason) {
      setRejectError("Choose a rejection reason.");
      return;
    }

    setLocalRejections((current) => [
      {
        id: `req-reject-${Date.now().toString(36)}`,
        reason: rejectReason,
        comments: rejectNote || undefined,
        rejectedAt: new Date().toISOString(),
        actorLabel: "Admin",
      },
      ...current,
    ]);
    setDecisionStatus("rejected");
    setRejectError("");
    setRejectOpen(false);
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
              <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em] text-teal-950">
                {request.id}
              </h1>
              <p className="mt-2 text-lg text-slate-600">
                {getServiceName(request)}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {decisionStatus !== "rejected" ? (
                <Button variant="outline" onClick={() => setRejectOpen(true)}>
                  <XCircle size={17} />
                  Reject Request
                </Button>
              ) : null}
              {decisionStatus !== "accepted" ? (
                <Button onClick={() => setAcceptOpen(true)}>
                  <CheckCircle2 size={17} />
                  Accept Request
                </Button>
              ) : quotation ? (
                <Button asChild>
                  <Link href={`/admin/quotations/${quotation.id}`}>
                    View Quotation
                  </Link>
                </Button>
              ) : (
                <Button asChild>
                  <Link href={`/admin/quotations/new?requestId=${request.id}`}>
                    Create Quotation
                  </Link>
                </Button>
              )}
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
                  customer ? (
                    <Link
                      className="text-sm font-semibold text-teal-800 hover:text-teal-950"
                      href={`/admin/customers?customerId=${customer.id}`}
                    >
                      Open customer profile
                    </Link>
                  ) : null
                }
              />

              <InfoPanel
                icon={MapPin}
                title="Service Location"
                rows={[
                  ["Address", request.serviceAddress.line1],
                  [
                    "City / State / ZIP",
                    `${request.serviceAddress.city}, ${request.serviceAddress.state} ${request.serviceAddress.postalCode}`,
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
                  ["Customer-selected date", formatLongDate(schedule.date)],
                  ["Customer-selected time", schedule.time],
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
              <h2 className="text-xl font-semibold text-teal-950">
                Customer Photos & Videos
              </h2>
              {request.attachments.length === 0 ? (
                <div className="mt-5 rounded-[1.25rem] border border-dashed border-teal-200 bg-teal-50/40 p-8 text-center text-sm text-slate-600">
                  No customer media was submitted with this request.
                </div>
              ) : (
                <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {request.attachments.map((attachment) => (
                    <button
                      className="rounded-[1.25rem] border border-teal-100 bg-slate-50 p-4 text-left transition hover:bg-teal-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--focus-ring)]"
                      key={attachment.id}
                      onClick={() => setPreviewAttachment(attachment)}
                      type="button"
                    >
                    <div className="flex h-32 items-center justify-center rounded-xl bg-white text-teal-800">
                        {attachment.kind === "video" ? (
                          <FileVideo size={34} />
                        ) : (
                          <FileImage size={34} />
                        )}
                      </div>
                      <p className="mt-4 truncate font-semibold text-teal-950">
                        {attachment.fileName}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {attachment.kind} · {attachment.fileType}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </section>
          </div>

          <aside className="space-y-6">
            <section className="rounded-xl bg-primary p-5 text-white shadow-[0_18px_56px_-42px_rgba(28,79,80,0.58)]">
              <h2 className="text-xl font-semibold">Admin Decision</h2>
              <p className="mt-3 text-sm leading-6 text-white/75">
                Accepting a request only prepares it for quotation. It does not
                create a service order.
              </p>
              <div className="mt-6 space-y-3">
                <Button
                  className="w-full bg-white text-primary hover:bg-teal-50"
                  disabled={decisionStatus === "accepted"}
                  onClick={() => setAcceptOpen(true)}
                >
                  Accept Request
                </Button>
                <Button
                  className="w-full border-white/30 text-white hover:bg-white/10"
                  disabled={decisionStatus === "rejected"}
                  onClick={() => setRejectOpen(true)}
                  variant="outline"
                >
                  Reject Request
                </Button>
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

      <Dialog
        open={Boolean(previewAttachment)}
        onOpenChange={() => setPreviewAttachment(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{previewAttachment?.fileName}</DialogTitle>
            <DialogDescription>
              Customer-submitted evidence preview metadata.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-6 rounded-xl bg-slate-50 p-8 text-center">
            {previewAttachment?.kind === "video" ? (
              <FileVideo className="mx-auto text-teal-800" size={52} />
            ) : (
              <FileImage className="mx-auto text-teal-800" size={52} />
            )}
            <p className="mt-4 font-semibold text-teal-950">
              {previewAttachment?.fileType}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {previewAttachment
                ? `${Math.round(previewAttachment.sizeBytes / 1024)} KB`
                : ""}
            </p>
          </div>
        </DialogContent>
      </Dialog>
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
