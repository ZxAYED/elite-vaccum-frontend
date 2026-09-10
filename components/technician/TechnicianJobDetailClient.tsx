"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  ClipboardList,
  Clock3,
  Loader2,
  MapPin,
  Phone,
  Plus,
  Trash2,
  Truck,
  User,
} from "lucide-react";
import { toast } from "sonner";

import { StatusBadge } from "@/components/customer-portal/StatusBadge";
import {
  AdminSurface,
  TechnicianRouteShell,
} from "@/components/technician/TechnicianRouteShell";
import { Button } from "@/components/ui/Button";
import { PageStateShell } from "@/components/ui/PageStateShell";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { formatCurrencyUsd } from "@/lib/formatters";
import {
  useGetServiceOrderByIdQuery,
  useUpdateServiceOrderStatusMutation,
  useUpdateServiceOrderEtaMutation,
} from "@/redux/api/serviceOrdersApi";
import { useSubmitFieldReportMutation } from "@/redux/api/technicianApi";

interface TechnicianJobDetailClientProps {
  serviceOrderId: string;
}

/**
 * Phase 17.6 field flow. Each entry is the transition offered while the job
 * sits in `from`; `SCHEDULED`/`TECHNICIAN_ASSIGNED` both lead to `ON_THE_WAY`.
 */
const FIELD_FLOW: Array<{ from: string[]; to: string; label: string }> = [
  {
    from: ["SCHEDULED", "TECHNICIAN_ASSIGNED", "RESCHEDULED"],
    to: "ON_THE_WAY",
    label: "Mark On the Way",
  },
  { from: ["ON_THE_WAY"], to: "ARRIVED", label: "Mark Arrived" },
  { from: ["ARRIVED"], to: "IN_PROGRESS", label: "Start Service" },
  { from: ["IN_PROGRESS"], to: "COMPLETED", label: "Mark Completed" },
];

const ETA_CAPABLE_STATUSES = ["TECHNICIAN_ASSIGNED", "SCHEDULED", "ON_THE_WAY"];

interface PartDraft {
  id: string;
  partName: string;
  quantity: string;
  costUsd: string;
}

function normalizeStatus(value?: string) {
  return String(value ?? "").toUpperCase().replace(/-/g, "_");
}

/** `ON_THE_WAY` -> `on-the-way`, which is what StatusBadge keys on. */
function toBadgeStatus(value?: string) {
  return normalizeStatus(value).toLowerCase().replace(/_/g, "-");
}

function formatDateTime(value?: string) {
  if (!value) return "Not scheduled";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

/**
 * `GET /service-orders/:id` is shared by customer, admin and technician, and
 * the nesting varies by role. Read every documented location for each field so
 * the screen degrades to "—" instead of crashing.
 */
function readJobView(raw: unknown) {
  const order = (raw ?? {}) as Record<string, never> & {
    id?: string;
    businessId?: string;
    status?: string;
    scheduledAt?: string;
    scheduledDate?: string;
    timeWindow?: string;
    summary?: string;
    serviceName?: string;
    customerNotes?: string;
    problemSummary?: string;
    totalUsd?: string | number;
    etas?: Array<{ etaMinutes?: number; note?: string; updatedAt?: string }>;
    service?: { name?: string };
    customer?: { displayName?: string; phone?: string; email?: string };
    serviceRequest?: {
      title?: string;
      problemDescription?: string;
      symptoms?: string[];
      customer?: { displayName?: string; phone?: string; email?: string };
    };
    deliveryAddress?: Record<string, string>;
    serviceAddress?: Record<string, string>;
    propertyAddress?: string | Record<string, string>;
  };

  const addressSource =
    (typeof order.propertyAddress === "object" ? order.propertyAddress : undefined) ??
    order.serviceAddress ??
    order.deliveryAddress;

  const addressLabel =
    typeof order.propertyAddress === "string" && order.propertyAddress
      ? order.propertyAddress
      : addressSource
        ? [
            addressSource.line1 || addressSource.addressLine1 || addressSource.street,
            addressSource.line2 || addressSource.apartment,
            addressSource.city,
            addressSource.state,
            addressSource.postalCode || addressSource.zipCode,
          ]
            .filter(Boolean)
            .join(", ")
        : "";

  const customer = order.customer ?? order.serviceRequest?.customer;
  const latestEta = order.etas?.[0];

  return {
    id: order.id ?? "",
    reference: order.businessId || order.id || "",
    status: normalizeStatus(order.status),
    serviceName:
      order.service?.name ||
      order.serviceName ||
      order.serviceRequest?.title ||
      order.summary ||
      "Central Vacuum Service",
    scheduleLabel:
      order.timeWindow ||
      formatDateTime(order.scheduledAt || order.scheduledDate),
    customerName: customer?.displayName || "Customer",
    customerPhone: customer?.phone || "",
    customerEmail: customer?.email || "",
    addressLabel: addressLabel || "Address not provided",
    problemSummary:
      order.problemSummary || order.serviceRequest?.problemDescription || "",
    symptoms: order.serviceRequest?.symptoms ?? [],
    customerNotes: order.customerNotes || "",
    totalUsd: Number(order.totalUsd) || 0,
    etaMinutes: latestEta?.etaMinutes,
    etaNote: latestEta?.note,
    etaUpdatedAt: latestEta?.updatedAt,
  };
}

export function TechnicianJobDetailClient({
  serviceOrderId,
}: TechnicianJobDetailClientProps) {
  // Phase 10.3 `GET /service-orders/:id`
  const {
    data: raw,
    isLoading,
    isError,
  } = useGetServiceOrderByIdQuery(serviceOrderId, { skip: !serviceOrderId });

  const [updateStatusApi, { isLoading: isUpdatingStatus }] =
    useUpdateServiceOrderStatusMutation();
  const [updateEtaApi, { isLoading: isUpdatingEta }] =
    useUpdateServiceOrderEtaMutation();
  const [submitReportApi, { isLoading: isSubmittingReport }] =
    useSubmitFieldReportMutation();

  const job = useMemo(() => readJobView(raw), [raw]);

  const nextTransition = FIELD_FLOW.find((step) =>
    step.from.includes(job.status),
  );
  const canSetEta = ETA_CAPABLE_STATUSES.includes(job.status);
  const canSubmitReport = job.status === "IN_PROGRESS";
  const isClosed = job.status === "COMPLETED" || job.status === "CANCELLED";

  const [etaDialogOpen, setEtaDialogOpen] = useState(false);
  const [etaMinutes, setEtaMinutes] = useState("20");
  const [etaNote, setEtaNote] = useState("");

  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [diagnosisFindings, setDiagnosisFindings] = useState("");
  const [workPerformed, setWorkPerformed] = useState("");
  const [technicianNotes, setTechnicianNotes] = useState("");
  const [recommendations, setRecommendations] = useState("");
  const [parts, setParts] = useState<PartDraft[]>([]);
  const [reportError, setReportError] = useState("");

  const partsTotal = parts.reduce(
    (sum, part) =>
      sum + (Number(part.quantity) || 0) * (Number(part.costUsd) || 0),
    0,
  );

  async function handleAdvanceStatus() {
    if (!nextTransition) return;
    try {
      // Phase 17.6.1 `PATCH /service-orders/:id/status`
      await updateStatusApi({
        id: job.id || serviceOrderId,
        status: nextTransition.to,
      }).unwrap();
      toast.success(`Status updated to ${nextTransition.to.replace(/_/g, " ")}.`);
    } catch {
      toast.error("Could not update the job status. Please try again.");
    }
  }

  async function handleSubmitEta() {
    const minutes = Number(etaMinutes);
    if (!Number.isFinite(minutes) || minutes <= 0) {
      toast.error("Enter an ETA in minutes.");
      return;
    }
    try {
      // Phase 17.6.2 `POST /service-orders/:id/eta`
      await updateEtaApi({
        id: job.id || serviceOrderId,
        minutes,
        ...(etaNote.trim() ? { note: etaNote.trim() } : {}),
      }).unwrap();
      toast.success("ETA sent to the customer.");
      setEtaDialogOpen(false);
      setEtaNote("");
    } catch {
      toast.error("Could not send the ETA. Please try again.");
    }
  }

  function addPart() {
    setParts((current) => [
      ...current,
      {
        id: `part-${Date.now()}-${current.length}`,
        partName: "",
        quantity: "1",
        costUsd: "0",
      },
    ]);
  }

  function updatePart(id: string, patch: Partial<PartDraft>) {
    setParts((current) =>
      current.map((part) => (part.id === id ? { ...part, ...patch } : part)),
    );
  }

  async function handleSubmitReport() {
    if (!diagnosisFindings.trim() || !workPerformed.trim()) {
      setReportError("Diagnosis findings and work performed are both required.");
      return;
    }
    setReportError("");

    const partsUsed = parts
      .filter((part) => part.partName.trim())
      .map((part) => ({
        partName: part.partName.trim(),
        quantity: Number(part.quantity) || 1,
        costUsd: Number(part.costUsd) || 0,
      }));

    try {
      // Phase 17.6.3 `POST /service-orders/:id/reports`
      await submitReportApi({
        serviceOrderId: job.id || serviceOrderId,
        body: {
          diagnosisFindings: diagnosisFindings.trim(),
          workPerformed: workPerformed.trim(),
          ...(technicianNotes.trim()
            ? { technicianNotes: technicianNotes.trim() }
            : {}),
          ...(recommendations.trim()
            ? { recommendations: recommendations.trim() }
            : {}),
          ...(partsUsed.length > 0 ? { partsUsed } : {}),
        },
      }).unwrap();
      toast.success("Field report submitted.");
      setReportDialogOpen(false);
    } catch {
      toast.error("Could not submit the report. Please try again.");
    }
  }

  if (isLoading) {
    return (
      <PageStateShell>
        <AdminSurface>
          <div className="flex items-center justify-center gap-3 py-4 text-slate-500">
            <Loader2 className="size-5 animate-spin text-teal-700" />
            <span className="text-sm font-medium">Loading job details...</span>
          </div>
        </AdminSurface>
      </PageStateShell>
    );
  }

  if (isError || !job.id) {
    return (
      <PageStateShell>
        <AdminSurface className="p-8 text-center lg:p-10">
          <div className="mx-auto flex size-12 items-center justify-center rounded-lg bg-teal-50 text-teal-700 ring-1 ring-teal-100">
            <ClipboardList size={22} />
          </div>
          <h1 className="mt-4 text-lg font-bold text-slate-900">
            Job not found
          </h1>
          <p className="mx-auto mt-1.5 max-w-md text-sm leading-6 text-slate-600">
            This service order is not assigned to you, or no longer exists.
            Check the service order reference, or return to your assigned jobs.
          </p>
          <div className="mt-6">
            <Button asChild size="sm">
              <Link href="/technician/jobs">Back to My Jobs</Link>
            </Button>
          </div>
        </AdminSurface>
      </PageStateShell>
    );
  }

  return (
    <TechnicianRouteShell
      eyebrow="Field Service Job"
      title={job.serviceName}
      description={`Service Order ${job.reference} for ${job.customerName}`}
      action={
        <Button asChild variant="outline">
          <Link href="/technician/jobs">
            <ArrowLeft size={16} />
            Back to My Jobs
          </Link>
        </Button>
      }
    >
      <div className="grid gap-4 xl:grid-cols-[1.35fr_0.9fr]">
        <div className="space-y-4">
          <AdminSurface>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={toBadgeStatus(job.status)} />
              <span className="text-sm text-slate-500">{job.reference}</span>
              {job.etaMinutes ? (
                <span className="rounded-full bg-teal-100 px-2.5 py-0.5 text-xs font-semibold text-teal-800">
                  ETA {job.etaMinutes} min
                </span>
              ) : null}
            </div>

            <dl className="mt-5 grid gap-4 sm:grid-cols-2">
              <DetailRow
                icon={CalendarDays}
                label="Scheduled"
                value={job.scheduleLabel}
              />
              <DetailRow
                icon={MapPin}
                label="Property"
                value={job.addressLabel}
              />
              <DetailRow icon={User} label="Customer" value={job.customerName} />
              <DetailRow
                icon={Phone}
                label="Phone"
                value={
                  job.customerPhone ? (
                    <a
                      href={`tel:${job.customerPhone}`}
                      className="hover:text-teal-700"
                    >
                      {job.customerPhone}
                    </a>
                  ) : (
                    "Not provided"
                  )
                }
              />
            </dl>

            {job.totalUsd > 0 ? (
              <p className="mt-5 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
                Accepted quote total:{" "}
                <strong className="text-slate-950">
                  {formatCurrencyUsd(job.totalUsd)}
                </strong>
              </p>
            ) : null}
          </AdminSurface>

          {job.problemSummary || job.symptoms.length > 0 || job.customerNotes ? (
            <AdminSurface>
              <h2 className="text-xl font-semibold text-slate-950">
                Reported Problem
              </h2>
              {job.problemSummary ? (
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  {job.problemSummary}
                </p>
              ) : null}

              {job.symptoms.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {job.symptoms.map((symptom) => (
                    <span
                      key={symptom}
                      className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700"
                    >
                      {symptom.replace(/_/g, " ").toLowerCase()}
                    </span>
                  ))}
                </div>
              ) : null}

              {job.customerNotes ? (
                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/70 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-amber-900">
                    Customer notes
                  </p>
                  <p className="mt-1.5 text-sm leading-6 text-amber-950">
                    {job.customerNotes}
                  </p>
                </div>
              ) : null}
            </AdminSurface>
          ) : null}
        </div>

        <div className="space-y-4">
          <AdminSurface>
            <div className="flex items-center gap-3">
              <Truck size={20} className="text-teal-700" />
              <h2 className="text-xl font-semibold text-slate-950">
                Field Actions
              </h2>
            </div>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              {isClosed
                ? "This job is closed. No further field updates are required."
                : "Move the job through the field workflow as you progress on site."}
            </p>

            <div className="mt-5 space-y-3">
              {nextTransition ? (
                <Button
                  className="w-full"
                  disabled={isUpdatingStatus}
                  onClick={handleAdvanceStatus}
                >
                  {isUpdatingStatus ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    nextTransition.label
                  )}
                </Button>
              ) : null}

              {canSetEta ? (
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => setEtaDialogOpen(true)}
                >
                  <Clock3 size={16} />
                  {job.etaMinutes ? "Update ETA" : "Send ETA"}
                </Button>
              ) : null}

              {canSubmitReport ? (
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => setReportDialogOpen(true)}
                >
                  <ClipboardList size={16} />
                  Submit Field Report
                </Button>
              ) : null}
            </div>

            {job.etaUpdatedAt ? (
              <p className="mt-5 rounded-xl bg-slate-50 px-4 py-3 text-xs leading-6 text-slate-600">
                Last ETA sent {formatDateTime(job.etaUpdatedAt)}
                {job.etaNote ? ` — “${job.etaNote}”` : ""}
              </p>
            ) : null}
          </AdminSurface>

          <AdminSurface>
            <h2 className="text-lg font-semibold text-slate-950">
              Field workflow
            </h2>
            <ol className="mt-4 space-y-3">
              {FIELD_FLOW.map((step) => {
                const isCurrent = step.from.includes(job.status);
                const stepIndex = FIELD_FLOW.indexOf(step);
                const currentIndex = nextTransition
                  ? FIELD_FLOW.indexOf(nextTransition)
                  : FIELD_FLOW.length;
                const isDone = stepIndex < currentIndex;

                return (
                  <li
                    key={step.to}
                    className="flex items-center gap-3 text-sm text-slate-600"
                  >
                    <span
                      className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                        isDone
                          ? "bg-teal-600 text-white"
                          : isCurrent
                            ? "bg-teal-100 text-teal-800"
                            : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      {stepIndex + 1}
                    </span>
                    <span className={isCurrent ? "font-semibold text-slate-900" : ""}>
                      {step.to.replace(/_/g, " ").toLowerCase()}
                    </span>
                  </li>
                );
              })}
            </ol>
          </AdminSurface>
        </div>
      </div>

      {/* ETA dialog — Phase 17.6.2 */}
      <Dialog open={etaDialogOpen} onOpenChange={setEtaDialogOpen}>
        <DialogContent className="w-[min(94vw,32rem)]">
          <DialogHeader>
            <DialogTitle>{job.etaMinutes ? "Update ETA" : "Send ETA"}</DialogTitle>
            <DialogDescription>
              The customer sees this arrival estimate on their order tracker.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-900">
                Minutes away
              </span>
              <Input
                type="number"
                min={1}
                value={etaMinutes}
                onChange={(event) => setEtaMinutes(event.target.value)}
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-900">
                Note (optional)
              </span>
              <Input
                value={etaNote}
                onChange={(event) => setEtaNote(event.target.value)}
                placeholder="e.g. Light traffic on the expressway"
              />
            </label>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEtaDialogOpen(false)}>
              Cancel
            </Button>
            <Button disabled={isUpdatingEta} onClick={handleSubmitEta}>
              {isUpdatingEta ? "Sending..." : "Send ETA"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Field report dialog — Phase 17.6.3 */}
      <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <DialogContent className="w-[min(94vw,48rem)]">
          <DialogHeader>
            <DialogTitle>Submit Field Report</DialogTitle>
            <DialogDescription>
              Record your diagnosis, the work performed, and any parts used.
            </DialogDescription>
          </DialogHeader>

          <div className="grid max-h-[60vh] gap-4 overflow-y-auto pr-1">
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-900">
                Diagnosis findings <span className="text-rose-600">*</span>
              </span>
              <Textarea
                value={diagnosisFindings}
                onChange={(event) => setDiagnosisFindings(event.target.value)}
                placeholder="What you found on site..."
                className="min-h-24"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-900">
                Work performed <span className="text-rose-600">*</span>
              </span>
              <Textarea
                value={workPerformed}
                onChange={(event) => setWorkPerformed(event.target.value)}
                placeholder="What you did to resolve it..."
                className="min-h-24"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-900">
                Technician notes
              </span>
              <Textarea
                value={technicianNotes}
                onChange={(event) => setTechnicianNotes(event.target.value)}
                className="min-h-20"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-900">
                Recommendations
              </span>
              <Textarea
                value={recommendations}
                onChange={(event) => setRecommendations(event.target.value)}
                placeholder="Follow-up advice for the customer..."
                className="min-h-20"
              />
            </label>

            <div className="space-y-3 rounded-xl border border-slate-200 p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-slate-900">
                  Parts used
                </span>
                <Button type="button" size="sm" variant="outline" onClick={addPart}>
                  <Plus size={14} />
                  Add part
                </Button>
              </div>

              {parts.length === 0 ? (
                <p className="text-xs text-slate-500">
                  No parts recorded for this visit.
                </p>
              ) : (
                <div className="space-y-3">
                  {parts.map((part) => (
                    <div
                      key={part.id}
                      className="grid gap-2 sm:grid-cols-[1fr_5rem_6rem_auto]"
                    >
                      <Input
                        value={part.partName}
                        onChange={(event) =>
                          updatePart(part.id, { partName: event.target.value })
                        }
                        placeholder="Part name"
                      />
                      <Input
                        type="number"
                        min={1}
                        value={part.quantity}
                        onChange={(event) =>
                          updatePart(part.id, { quantity: event.target.value })
                        }
                        aria-label="Quantity"
                      />
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={part.costUsd}
                        onChange={(event) =>
                          updatePart(part.id, { costUsd: event.target.value })
                        }
                        aria-label="Unit cost in USD"
                      />
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="ghost"
                        aria-label={`Remove ${part.partName || "part"}`}
                        onClick={() =>
                          setParts((current) =>
                            current.filter((item) => item.id !== part.id),
                          )
                        }
                      >
                        <Trash2 size={15} className="text-rose-600" />
                      </Button>
                    </div>
                  ))}
                  <p className="text-right text-sm font-semibold text-slate-900">
                    Parts total: {formatCurrencyUsd(partsTotal)}
                  </p>
                </div>
              )}
            </div>

            {reportError ? (
              <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800">
                {reportError}
              </p>
            ) : null}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setReportDialogOpen(false)}>
              Cancel
            </Button>
            <Button disabled={isSubmittingReport} onClick={handleSubmitReport}>
              {isSubmittingReport ? "Submitting..." : "Submit Report"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TechnicianRouteShell>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof MapPin;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon size={16} className="mt-0.5 shrink-0 text-teal-700" />
      <div className="min-w-0">
        <dt className="text-xs font-medium uppercase tracking-wider text-slate-400">
          {label}
        </dt>
        <dd className="mt-0.5 text-sm text-slate-800">{value}</dd>
      </div>
    </div>
  );
}
