"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  CalendarDays,
  Check,
  CreditCard,
  Loader2,
  MapPin,
  UserRound,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/customer-portal/PageHeader";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageStateShell } from "@/components/ui/PageStateShell";
import { cn } from "@/lib/utils";
import {
  useCancelServiceRequestMutation,
} from "@/redux/api/serviceRequestsApi";
import { useGetMyServiceOrdersQuery } from "@/redux/api/serviceOrdersApi";

interface UserScheduleDetailClientProps {
  requestId: string;
}

/**
 * Phase 10.6 status workflow, rendered as customer-facing progress. The API
 * exposes only the current status, so completion is derived from its position
 * in this sequence.
 */
const PROGRESS_STEPS = [
  { key: "scheduled", label: "Scheduled", detail: "Appointment confirmed" },
  {
    key: "technician-assigned",
    label: "Technician Assigned",
    detail: "Field tech allocated",
  },
  { key: "on-the-way", label: "On the Way", detail: "Technician en route" },
  { key: "in-progress", label: "In Progress", detail: "Work underway" },
  { key: "completed", label: "Completed", detail: "Service finished" },
] as const;

// `ARRIVED` and `REPORT_SUBMITTED` collapse into the neighbouring visible step.
const STATUS_TO_STEP: Record<string, string> = {
  scheduled: "scheduled",
  rescheduled: "scheduled",
  "technician-assigned": "technician-assigned",
  "on-the-way": "on-the-way",
  arrived: "on-the-way",
  "in-progress": "in-progress",
  "report-submitted": "in-progress",
  completed: "completed",
};

function normalize(value?: string) {
  return String(value ?? "").toLowerCase().replace(/_/g, "-");
}

function addressLabel(location?: {
  line1?: string;
  city?: string;
  state?: string;
  postalCode?: string;
}) {
  if (!location) return "Address not provided";
  return (
    [location.line1, location.city, location.state, location.postalCode]
      .filter(Boolean)
      .join(", ") || "Address not provided"
  );
}

export function UserScheduleDetailClient({
  requestId,
}: UserScheduleDetailClientProps) {
  // No "by service request" endpoint exists, so resolve from the customer's
  // own service orders (Phase 10.1).
  const { data, isLoading, isError } = useGetMyServiceOrdersQuery({
    page: 1,
    limit: 100,
  });
  const [cancelRequest, { isLoading: isCancelling }] =
    useCancelServiceRequestMutation();

  const order = useMemo(
    () =>
      (data?.items ?? []).find(
        (item) =>
          item.serviceRequestId === requestId ||
          item.id === requestId ||
          item.businessId === requestId,
      ),
    [data?.items, requestId],
  );

  const status = normalize(order?.status);
  const activeStepKey = STATUS_TO_STEP[status] ?? "scheduled";
  const activeIndex = PROGRESS_STEPS.findIndex(
    (step) => step.key === activeStepKey,
  );
  const isCancelled = status === "cancelled";
  const canCancel = !isCancelled && !["completed", "in-progress"].includes(status);

  async function handleCancel() {
    if (!order?.serviceRequestId) return;
    try {
      // Phase 8.4 PATCH /service-requests/:id/cancel
      await cancelRequest({ id: order.serviceRequestId }).unwrap();
      toast.success("Service request cancelled.");
    } catch {
      toast.error("Could not cancel the request. Please contact support.");
    }
  }

  if (isLoading) {
    return (
      <PageStateShell>
        <div className="flex items-center justify-center rounded-lg border border-slate-200 bg-white py-14 text-slate-500">
          <Loader2 className="mr-2 size-5 animate-spin text-teal-700" />
          Loading schedule details...
        </div>
      </PageStateShell>
    );
  }

  if (isError || !order) {
    return (
      <PageStateShell
        header={
          <PageHeader
            eyebrow="Service Schedule"
            title="Schedule not found"
            description="This service order isn't on your account, or hasn't been scheduled yet."
          />
        }
      >
        <EmptyState
          icon={CalendarDays}
          title="No schedule for this request"
          description="A schedule appears here once your quotation is accepted and a technician is dispatched."
          action={{ label: "Back to schedule", href: "/user/schedule" }}
          tone="card"
        />
      </PageStateShell>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm" className="rounded-md">
              <Link href="/user/schedule">Back to schedule</Link>
            </Button>
            <Button
              asChild
              size="sm"
              className="rounded-md bg-teal-600 hover:bg-teal-500 font-medium"
            >
              <Link href={`/user/orders/${order.id}`}>View Service Order</Link>
            </Button>
          </div>
        }
        description={`Request ID: ${order.serviceRequestId || order.businessId || order.id}`}
        eyebrow="Service Schedule"
        title="Service Schedule Details"
      />

      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-xs">
        <h2 className="mb-5 text-sm font-bold text-slate-900">
          Appointment Progress
        </h2>
        {isCancelled ? (
          <p className="rounded-md border border-rose-200 bg-rose-50/70 px-4 py-3 text-sm text-rose-800">
            This service order was cancelled.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
            {PROGRESS_STEPS.map((step, index) => {
              const complete = activeIndex >= index;
              return (
                <div className="text-center" key={step.key}>
                  <div
                    className={cn(
                      "mx-auto flex size-10 items-center justify-center rounded-full border-2",
                      complete
                        ? "border-teal-500 bg-teal-600 text-white"
                        : "border-slate-200 bg-slate-50 text-slate-400",
                    )}
                  >
                    <Check size={16} />
                  </div>
                  <p className="mt-2 text-xs font-bold text-slate-900">
                    {step.label}
                  </p>
                  <p className="mt-0.5 text-[11px] font-normal text-slate-500">
                    {step.detail}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-5 shadow-xs sm:p-6 lg:col-span-7">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <CalendarDays className="text-teal-700" size={18} />
            <h2 className="text-base font-bold text-slate-900">
              Appointment Details
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-xs">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Requested Schedule
              </p>
              <p className="mt-1 font-semibold text-slate-900">
                {order.requestedSchedule?.label ?? "Not recorded"}
              </p>
            </div>
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-xs">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Confirmed Schedule
              </p>
              <p className="mt-1 font-semibold text-teal-950">
                {order.currentSchedule?.label ?? "Awaiting confirmation"}
              </p>
            </div>
          </div>
          {order.technicianEta ? (
            <div className="rounded-md border border-teal-200 bg-teal-50/60 p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-teal-800">
                Live ETA
              </p>
              <p className="mt-1 text-base font-bold text-slate-900">
                {order.technicianEta.minutes} minutes away
              </p>
            </div>
          ) : null}
        </section>

        <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-5 shadow-xs sm:p-6 lg:col-span-5">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <UserRound className="text-teal-700" size={18} />
            <h2 className="text-base font-bold text-slate-900">
              Service Overview
            </h2>
          </div>
          <div className="space-y-3 text-xs">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Service Type
              </p>
              <p className="mt-0.5 font-semibold text-slate-900">
                {order.serviceName}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Service Address
              </p>
              <p className="mt-0.5 flex items-center gap-1.5 font-medium text-slate-800">
                <MapPin className="shrink-0 text-teal-700" size={14} />
                {addressLabel(order.serviceLocation)}
              </p>
            </div>
            <div className="rounded-md border border-teal-800 bg-teal-900 p-4 text-white">
              <div className="flex items-center gap-2 text-xs font-bold">
                <CreditCard size={15} />
                Billing
              </div>
              <p className="mt-1 text-xs font-normal text-teal-100/80">
                Invoices for this service order are available in billing.
              </p>
              <Button
                asChild
                size="sm"
                variant="outline"
                className="mt-3 w-full rounded-md border-teal-500/40 text-teal-100 hover:bg-teal-800"
              >
                <Link href="/user/billing">Open Billing</Link>
              </Button>
            </div>
            {order.customerNotes ? (
              <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
                <span className="font-semibold text-slate-900">Notes:</span>{" "}
                {order.customerNotes}
              </div>
            ) : null}
            {canCancel ? (
              <div className="pt-2 text-center">
                <button
                  type="button"
                  disabled={isCancelling}
                  onClick={handleCancel}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 disabled:opacity-50"
                >
                  <XCircle size={14} />
                  {isCancelling ? "Cancelling..." : "Cancel Service Request"}
                </button>
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}
