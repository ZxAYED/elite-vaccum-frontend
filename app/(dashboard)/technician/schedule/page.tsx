"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CalendarDays, Clock3, RefreshCw } from "lucide-react";

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
import { Input } from "@/components/ui/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import {
  getTechnicianScheduleGroups,
  getTechnicianScheduleCardData,
  getTechnicianTodayOrders,
} from "@/data/mock/technician-dashboard";
import { formatLongDate } from "@/lib/formatters";

const weekLabel = "Aug 10 - Aug 16";

export default function TechnicianSchedulePage() {
  const groups = getTechnicianScheduleGroups();
  const todayOrders = getTechnicianTodayOrders();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [requestOrderId, setRequestOrderId] = useState(todayOrders[0]?.id ?? "");
  const [requestDate, setRequestDate] = useState("2026-08-16");
  const [requestTime, setRequestTime] = useState("02:00 PM");
  const [requestReason, setRequestReason] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const groupedUpcoming = useMemo(() => {
    const buckets = new Map<
      string,
      Array<ReturnType<typeof getTechnicianScheduleCardData>>
    >();

    groups.upcoming.forEach((schedule) => {
      const key = schedule.currentSchedule.date;
      const current = buckets.get(key) ?? [];
      current.push(getTechnicianScheduleCardData(schedule));
      buckets.set(key, current);
    });

    return Array.from(buckets.entries()).map(([date, entries]) => ({
      date,
      label: formatLongDate(`${date}T12:00:00.000Z`),
      entries,
    }));
  }, [groups.upcoming]);

  function handleSubmitChangeRequest() {
    if (!requestOrderId || !requestDate || !requestTime || !requestReason.trim()) {
      return;
    }
    setSubmitted(true);
  }

  return (
    <TechnicianRouteShell
      eyebrow="Assignment Calendar"
      title="Schedule"
      description="Today’s assignments and upcoming appointments grouped by date."
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 rounded-xl border border-teal-100 bg-white px-4 py-2 text-sm font-medium text-slate-700">
          <Button size="sm" variant="ghost" type="button">
            Previous Week
          </Button>
          <span className="text-slate-400">|</span>
          <span>{weekLabel}</span>
          <span className="text-slate-400">|</span>
          <Button size="sm" variant="ghost" type="button">
            Next Week
          </Button>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <ScheduleSection
          emptyText="No assignments scheduled for today."
          entries={groups.today.map(getTechnicianScheduleCardData)}
          title="Today"
        />

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
            <Button variant="secondary" onClick={() => setDialogOpen(true)}>
              Request Schedule Change
            </Button>
          </div>
        </AdminSurface>
      </div>

      <div className="space-y-4">
        {groupedUpcoming.map((group) => (
          <AdminSurface key={group.date}>
            <h2 className="text-xl font-semibold text-slate-950">{group.label}</h2>
            <div className="mt-5 space-y-3">
              {group.entries.length === 0 ? (
                <div className="rounded-xl bg-slate-50 px-4 py-6 text-sm text-slate-600">
                  No assignments.
                </div>
              ) : (
                group.entries.map((entry) => (
                  <article key={entry.schedule.id} className="rounded-xl bg-slate-50 p-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <StatusBadge status={entry.schedule.status} />
                          <span className="text-sm text-slate-500">
                            {entry.schedule.serviceOrderId}
                          </span>
                        </div>
                        <h3 className="mt-3 text-lg font-semibold text-primary">
                          {entry.order?.serviceName ?? entry.schedule.serviceName}
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">{entry.customerName}</p>
                        <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-600">
                          <span className="inline-flex items-center gap-2">
                            <CalendarDays size={16} className="text-teal-700" />
                            {entry.schedule.currentSchedule.label}
                          </span>
                          <span className="inline-flex items-center gap-2">
                            <Clock3 size={16} className="text-teal-700" />
                            {entry.schedule.timeWindowLabel}
                          </span>
                        </div>
                      </div>
                      <Button asChild size="sm">
                        <Link href={`/technician/jobs/${entry.schedule.serviceOrderId}`}>
                          Open Job
                        </Link>
                      </Button>
                    </div>
                  </article>
                ))
              )}
            </div>
          </AdminSurface>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
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
                <span className="text-sm font-medium text-slate-900">Service Order</span>
                <Select value={requestOrderId} onValueChange={setRequestOrderId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select service order" />
                  </SelectTrigger>
                  <SelectContent>
                    {[...groups.today, ...groups.upcoming].map((schedule) => (
                      <SelectItem key={schedule.serviceOrderId} value={schedule.serviceOrderId}>
                        {schedule.serviceOrderId} • {schedule.serviceName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-900">Requested Date</span>
                  <Input
                    type="date"
                    value={requestDate}
                    onChange={(event) => setRequestDate(event.target.value)}
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-900">Requested Time</span>
                  <Select value={requestTime} onValueChange={setRequestTime}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="09:00 AM">09:00 AM</SelectItem>
                      <SelectItem value="11:00 AM">11:00 AM</SelectItem>
                      <SelectItem value="02:00 PM">02:00 PM</SelectItem>
                      <SelectItem value="04:30 PM">04:30 PM</SelectItem>
                    </SelectContent>
                  </Select>
                </label>
              </div>

              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-900">Reason</span>
                <Textarea
                  value={requestReason}
                  onChange={(event) => setRequestReason(event.target.value)}
                  className="min-h-28"
                />
              </label>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {submitted ? "Close" : "Cancel"}
            </Button>
            {!submitted ? (
              <Button onClick={handleSubmitChangeRequest}>Submit Request</Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TechnicianRouteShell>
  );
}

function ScheduleSection({
  entries,
  emptyText,
  title,
}: {
  entries: Array<ReturnType<typeof getTechnicianScheduleCardData>>;
  emptyText: string;
  title: string;
}) {
  return (
    <AdminSurface>
      <h2 className="text-xl font-semibold text-slate-950">{title}</h2>
      <div className="mt-5 space-y-3">
        {entries.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title={emptyText}
            description="Assigned appointments and visits will appear here once booked."
            tone="minimal"
            className="py-6"
          />
        ) : (
          entries.map((entry) => (
            <article key={entry.schedule.id} className="rounded-xl bg-slate-50 p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={entry.schedule.status} />
                    <span className="text-sm text-slate-500">
                      {entry.schedule.serviceOrderId}
                    </span>
                  </div>
                  <h3 className="mt-3 text-lg font-semibold text-primary">
                    {entry.order?.serviceName ?? entry.schedule.serviceName}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">{entry.customerName}</p>
                  <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-600">
                    <span className="inline-flex items-center gap-2">
                      <CalendarDays size={16} className="text-teal-700" />
                      {entry.schedule.currentSchedule.label}
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <Clock3 size={16} className="text-teal-700" />
                      {entry.schedule.timeWindowLabel}
                    </span>
                  </div>
                </div>
                <Button asChild size="sm">
                  <Link href={`/technician/jobs/${entry.schedule.serviceOrderId}`}>
                    Open Job
                  </Link>
                </Button>
              </div>
            </article>
          ))
        )}
      </div>
    </AdminSurface>
  );
}
