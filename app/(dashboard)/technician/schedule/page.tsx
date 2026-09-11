"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CalendarDays, Clock3, MapPin, RefreshCw } from "lucide-react";

import { StatusBadge } from "@/components/customer-portal/StatusBadge";
import {
  AdminSurface,
  TechnicianRouteShell,
} from "@/components/technician/TechnicianRouteShell";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { DatePicker } from "@/components/ui/DatePicker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { formatLongDate } from "@/lib/formatters";
import { toast } from "sonner";
import {
  useGetMyScheduleQuery,
  useRequestScheduleChangeMutation,
  type TechnicianJobItemDto,
} from "@/redux/api/technicianApi";

const TIME_WINDOWS = [
  "09:00 AM - 11:00 AM",
  "11:00 AM - 01:00 PM",
  "02:00 PM - 04:00 PM",
  "04:00 PM - 06:00 PM",
];

function toIsoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

/** Monday-anchored start of the week containing `date`, shifted by `weekOffset`. */
function startOfWeek(date: Date, weekOffset = 0) {
  const result = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  const day = result.getUTCDay();
  const mondayDelta = day === 0 ? -6 : 1 - day;
  result.setUTCDate(result.getUTCDate() + mondayDelta + weekOffset * 7);
  return result;
}

function shortDate(iso: string) {
  return new Date(`${iso}T12:00:00.000Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export default function TechnicianSchedulePage() {
  const [weekOffset, setWeekOffset] = useState(0);

  const { from, to } = useMemo(() => {
    const start = startOfWeek(new Date(), weekOffset);
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 6);
    return { from: toIsoDate(start), to: toIsoDate(end) };
  }, [weekOffset]);

  // Phase 17.3 `GET /technicians/me/schedule?from=&to=`
  const {
    data: schedule,
    isLoading,
    isError,
  } = useGetMyScheduleQuery({ from, to });
  const [requestScheduleChange, { isLoading: isRequestingChange }] =
    useRequestScheduleChangeMutation();

  const days = useMemo(() => schedule?.days ?? [], [schedule?.days]);
  const todayEntry = days.find((day) => day.isToday);
  const otherDays = days.filter((day) => !day.isToday);

  // Every appointment in range is a candidate for a change request.
  const allAppointments = useMemo(
    () => days.flatMap((day) => day.appointments ?? []),
    [days],
  );

  const [dialogOpen, setDialogOpen] = useState(false);
  const [requestOrderId, setRequestOrderId] = useState("");
  const [requestDate, setRequestDate] = useState("");
  const [requestTime, setRequestTime] = useState(TIME_WINDOWS[0]);
  const [requestReason, setRequestReason] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const canSubmit =
    Boolean(requestOrderId) &&
    Boolean(requestDate) &&
    Boolean(requestTime) &&
    requestReason.trim().length > 0;

  async function handleSubmitChangeRequest() {
    if (!canSubmit) return;
    try {
      await requestScheduleChange({
        serviceOrderId: requestOrderId,
        reason: requestReason.trim(),
        proposedDate: requestDate,
        proposedTimeWindow: requestTime,
      }).unwrap();
      toast.success("Schedule change request submitted to admin.");
      setSubmitted(true);
    } catch {
      toast.error("Could not submit the request. Please try again.");
    }
  }

  function resetDialog(open: boolean) {
    setDialogOpen(open);
    if (!open) {
      setSubmitted(false);
      setRequestReason("");
    }
  }

  const weekLabel = `${shortDate(from)} - ${shortDate(to)}`;

  return (
    <TechnicianRouteShell
      eyebrow="Assignment Calendar"
      title="Schedule"
      description="Today’s assignments and upcoming appointments grouped by date."
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 rounded-xl border border-teal-100 bg-white px-4 py-2 text-sm font-medium text-slate-700">
          <Button
            size="sm"
            variant="ghost"
            type="button"
            onClick={() => setWeekOffset((prev) => prev - 1)}
          >
            Previous Week
          </Button>
          <span className="text-slate-400">|</span>
          <span>{weekLabel}</span>
          <span className="text-slate-400">|</span>
          <Button
            size="sm"
            variant="ghost"
            type="button"
            onClick={() => setWeekOffset((prev) => prev + 1)}
          >
            Next Week
          </Button>
        </div>
        {weekOffset !== 0 ? (
          <Button
            size="sm"
            variant="outline"
            type="button"
            onClick={() => setWeekOffset(0)}
          >
            Back to this week
          </Button>
        ) : null}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <AdminSurface>
          <h2 className="text-xl font-semibold text-primary">
            {todayEntry ? "Today" : "This week"}
          </h2>
          <div className="mt-5 space-y-3">
            {isLoading ? (
              Array.from({ length: 2 }).map((_, index) => (
                <div
                  key={index}
                  className="h-32 animate-pulse rounded-xl bg-slate-100"
                />
              ))
            ) : isError ? (
              <EmptyState
                icon={CalendarDays}
                title="We couldn't load your schedule"
                description="Your calendar is temporarily unavailable. Please refresh in a moment."
                tone="minimal"
                className="py-6"
              />
            ) : (todayEntry?.appointments ?? []).length === 0 ? (
              <EmptyState
                icon={CalendarDays}
                title={
                  todayEntry
                    ? "No assignments scheduled for today."
                    : "No assignments in this week."
                }
                description="Assigned appointments and visits will appear here once booked."
                tone="minimal"
                className="py-6"
              />
            ) : (
              (todayEntry?.appointments ?? []).map((appointment) => (
                <AppointmentCard
                  key={appointment.appointmentId || appointment.serviceOrderId}
                  appointment={appointment}
                />
              ))
            )}
          </div>
        </AdminSurface>

        <AdminSurface className="bg-primary text-white">
          <div className="flex items-center gap-3">
            <RefreshCw size={20} />
            <div>
              <h2 className="text-xl font-semibold">Need a schedule change?</h2>
              <p className="mt-1 text-sm text-white/75">
                Send a request to the admin team if an assigned appointment needs
                to be adjusted.
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-xl bg-white/10 p-4 text-sm leading-6 text-white/80">
            Use this when travel, access, or timing conflicts affect an assigned
            appointment. Admin will review the request before changing the live
            schedule.
          </div>

          <div className="mt-5">
            <Button
              variant="secondary"
              onClick={() => resetDialog(true)}
              disabled={allAppointments.length === 0}
            >
              Request Schedule Change
            </Button>
          </div>
          {allAppointments.length === 0 && !isLoading ? (
            <p className="mt-3 text-xs text-white/70">
              No appointments in this week to reschedule.
            </p>
          ) : null}
        </AdminSurface>
      </div>

      <div className="space-y-4">
        {otherDays
          .filter((day) => (day.appointments ?? []).length > 0)
          .map((day) => (
            <AdminSurface key={day.date}>
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="text-xl font-semibold text-primary">
                  {formatLongDate(`${day.date}T12:00:00.000Z`)}
                </h2>
                <span className="text-sm text-slate-500">
                  {day.appointmentsCount ?? day.appointments.length}{" "}
                  {(day.appointmentsCount ?? day.appointments.length) === 1
                    ? "appointment"
                    : "appointments"}
                </span>
              </div>
              <div className="mt-5 space-y-3">
                {day.appointments.map((appointment) => (
                  <AppointmentCard
                    key={appointment.appointmentId || appointment.serviceOrderId}
                    appointment={appointment}
                  />
                ))}
              </div>
            </AdminSurface>
          ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={resetDialog}>
        <DialogContent className="w-[min(94vw,42rem)]">
          <DialogHeader>
            <DialogTitle>Request Schedule Change</DialogTitle>
            <DialogDescription>
              Send a revised appointment request to the admin team for review.
            </DialogDescription>
          </DialogHeader>

          {submitted ? (
            <div className="rounded-xl bg-emerald-50 px-4 py-4 text-sm text-emerald-800">
              Schedule change request submitted.
            </div>
          ) : (
            <div className="grid gap-4">
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-900">
                  Service Order
                </span>
                <Select value={requestOrderId} onValueChange={setRequestOrderId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select service order" />
                  </SelectTrigger>
                  <SelectContent>
                    {allAppointments.map((appointment) => (
                      <SelectItem
                        key={appointment.serviceOrderId}
                        value={appointment.serviceOrderId}
                      >
                        {appointment.businessId} • {appointment.serviceName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <span className="text-sm font-medium text-slate-900">
                    Requested Date
                  </span>
                  <DatePicker
                    size="sm"
                    value={requestDate}
                    onChange={(val) => setRequestDate(val)}
                    placeholder="Select requested date..."
                    className="bg-white"
                  />
                </div>

                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-900">
                    Requested Time Window
                  </span>
                  <Select value={requestTime} onValueChange={setRequestTime}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_WINDOWS.map((window) => (
                        <SelectItem key={window} value={window}>
                          {window}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </label>
              </div>

              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-900">Reason</span>
                <Textarea
                  value={requestReason}
                  onChange={(event) => setRequestReason(event.target.value)}
                  placeholder="Explain why this appointment needs to move..."
                  className="min-h-28"
                />
              </label>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => resetDialog(false)}>
              {submitted ? "Close" : "Cancel"}
            </Button>
            {!submitted ? (
              <Button
                disabled={isRequestingChange || !canSubmit}
                onClick={handleSubmitChangeRequest}
              >
                {isRequestingChange ? "Submitting..." : "Submit Request"}
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TechnicianRouteShell>
  );
}

function AppointmentCard({
  appointment,
}: {
  appointment: TechnicianJobItemDto;
}) {
  return (
    <article className="rounded-xl bg-slate-50 p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={appointment.status?.toLowerCase() ?? "scheduled"} />
            <span className="text-sm text-slate-500">{appointment.businessId}</span>
          </div>
          <h3 className="mt-3 text-lg font-semibold text-primary">
            {appointment.serviceName}
          </h3>
          <p className="mt-1 text-sm text-slate-500">{appointment.customerName}</p>
          <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-600">
            <span className="inline-flex items-center gap-2">
              <Clock3 size={16} className="text-teal-700" />
              {appointment.timeWindow}
            </span>
            {appointment.propertyAddress ? (
              <span className="inline-flex items-center gap-2">
                <MapPin size={16} className="text-teal-700" />
                <span className="truncate">{appointment.propertyAddress}</span>
              </span>
            ) : null}
          </div>
        </div>
        <Button asChild size="sm">
          <Link href={`/technician/jobs/${appointment.serviceOrderId}`}>
            Open Job
          </Link>
        </Button>
      </div>
    </article>
  );
}
