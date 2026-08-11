"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Calendar,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock3,
  MapPin,
  Pencil,
  Plus,
  Search,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import {
  AdminPageHeader,
  AdminPageShell,
  AdminStatCard,
  AdminSurface,
} from "@/components/admin/AdminPageShell";
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
  cancelSharedAdminSchedule,
  createSharedAdminSchedule,
  deleteSharedAdminSchedule,
  getSharedAdminScheduleById,
  getSharedAdminScheduleRecords,
  getSharedAdminServiceOrders,
  replaceSharedAdminSchedule,
  rescheduleSharedAdminSchedule,
} from "@/data/mock/admin-schedule-state";
import { getTechnicianAvailabilityOptions } from "@/data/mock/admin-orders";
import { mockCustomers } from "@/data/mock/customers";
import { formatLongDate, formatTime } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import type { AdminScheduleRecord, ServiceOrderStatus } from "@/types/domain";

type ScheduleViewMode = "calendar" | "agenda";
type CalendarRangeMode = "month" | "week" | "day";
type ScheduleStatusFilter = "all" | ServiceOrderStatus;

const scheduleFormSchema = z.object({
  serviceOrderId: z.string().min(1, "Select a service order."),
  date: z.string().min(1, "Select a date."),
  startTime: z.string().min(1, "Select a start time."),
  endTime: z.string().min(1, "Select an end time."),
  technicianId: z.string().optional(),
  adminNote: z.string().max(400).optional(),
  status: z.enum([
    "scheduled",
    "rescheduled",
    "technician-assigned",
    "on-the-way",
    "arrived",
    "in-progress",
    "report-submitted",
    "completed",
    "cancelled",
  ]),
});

const rescheduleSchema = z.object({
  date: z.string().min(1, "Select a date."),
  startTime: z.string().min(1, "Select a time."),
  endTime: z.string().min(1, "Select an end time."),
  reason: z.string().min(3, "Provide a reschedule reason."),
  note: z.string().max(400).optional(),
});

const cancellationSchema = z.object({
  reason: z.string().min(3, "Provide a cancellation reason."),
  note: z.string().max(400).optional(),
});

type ScheduleFormValues = z.infer<typeof scheduleFormSchema>;
type RescheduleValues = z.infer<typeof rescheduleSchema>;
type CancellationValues = z.infer<typeof cancellationSchema>;

const statusOptions: ServiceOrderStatus[] = [
  "scheduled",
  "rescheduled",
  "technician-assigned",
  "on-the-way",
  "arrived",
  "in-progress",
  "report-submitted",
  "completed",
  "cancelled",
];

const timeOptions = [
  "09:00 AM",
  "10:00 AM",
  "11:00 AM",
  "01:00 PM",
  "02:00 PM",
  "03:00 PM",
  "04:30 PM",
];

const availabilitySlots = [
  "09:00 AM",
  "11:00 AM",
  "01:00 PM",
  "03:00 PM",
  "04:30 PM",
];

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function formatScheduleLabel(date: string, time: string) {
  const parsed = new Date(`${date}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return `${date} at ${time}`;
  return `${parsed.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })} at ${time}`;
}

function toDateTime(date: string, time: string) {
  const normalized = time.toUpperCase();
  const [, hourText = "0", minuteText = "00", suffix = "AM"] =
    normalized.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/) ?? [];
  let hour = Number(hourText);
  if (suffix === "PM" && hour < 12) hour += 12;
  if (suffix === "AM" && hour === 12) hour = 0;
  return new Date(
    `${date}T${String(hour).padStart(2, "0")}:${String(minuteText).padStart(2, "0")}:00`,
  );
}

function overlaps(
  left: { date: string; startTime: string; endTime: string },
  right: { date: string; startTime: string; endTime: string },
) {
  if (left.date !== right.date) return false;
  const leftStart = toDateTime(left.date, left.startTime).getTime();
  const leftEnd = toDateTime(left.date, left.endTime).getTime();
  const rightStart = toDateTime(right.date, right.startTime).getTime();
  const rightEnd = toDateTime(right.date, right.endTime).getTime();

  return leftStart < rightEnd && rightStart < leftEnd;
}

function isBlockingStatus(status: ServiceOrderStatus) {
  return status !== "cancelled" && status !== "completed";
}

function technicianConflictMessage(
  schedules: AdminScheduleRecord[],
  values: Pick<ScheduleFormValues, "date" | "startTime" | "endTime" | "technicianId" | "serviceOrderId">,
  excludedScheduleId?: string,
) {
  if (!values.technicianId) return null;

  const conflict = schedules.find((schedule) => {
    if (schedule.id === excludedScheduleId) return false;
    if (!isBlockingStatus(schedule.status)) return false;
    if (schedule.technicianId !== values.technicianId) return false;
    return overlaps(values, {
      date: schedule.currentSchedule.date,
      startTime: schedule.currentSchedule.time,
      endTime: formatTime(schedule.endAt),
    });
  });

  if (!conflict) return null;
  return `${conflict.customerName} already has ${conflict.serviceName} assigned to this technician during that time.`;
}

function serviceOrderConflictMessage(
  schedules: AdminScheduleRecord[],
  values: Pick<ScheduleFormValues, "serviceOrderId">,
  excludedScheduleId?: string,
) {
  const conflict = schedules.find((schedule) => {
    if (schedule.id === excludedScheduleId) return false;
    if (!isBlockingStatus(schedule.status)) return false;
    return schedule.serviceOrderId === values.serviceOrderId;
  });

  if (!conflict) return null;
  return `${values.serviceOrderId} already has an active appointment. Reschedule or cancel the existing schedule instead of creating a second active one.`;
}

function toStatusFilterLabel(status: ScheduleStatusFilter) {
  return status === "all"
    ? "All statuses"
    : status.replaceAll("-", " ");
}

function getCustomerName(customerId: string) {
  return (
    mockCustomers.find((customer) => customer.id === customerId)?.displayName ??
    "Unknown customer"
  );
}

function buildDayGrid(anchorDate: Date) {
  const start = new Date(anchorDate.getFullYear(), anchorDate.getMonth(), 1);
  const startDay = start.getDay();
  start.setDate(start.getDate() - startDay);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });
}

function formatDayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function AdminScheduleClient() {
  const [schedules, setSchedules] = useState(() => clone(getSharedAdminScheduleRecords()));
  const [serviceOrders, setServiceOrders] = useState(() =>
    clone(getSharedAdminServiceOrders()),
  );
  const [viewMode, setViewMode] = useState<ScheduleViewMode>("calendar");
  const [rangeMode, setRangeMode] = useState<CalendarRangeMode>("month");
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [technicianFilter, setTechnicianFilter] = useState("all");
  const [serviceFilter, setServiceFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<ScheduleStatusFilter>("all");
  const [calendarDate, setCalendarDate] = useState(() => new Date("2026-08-01T12:00:00"));
  const [selectedDate, setSelectedDate] = useState("2026-08-14");
  const [createOpen, setCreateOpen] = useState(false);
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);
  const [detailScheduleId, setDetailScheduleId] = useState<string | null>(null);
  const [rescheduleId, setRescheduleId] = useState<string | null>(null);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formError, setFormError] = useState("");

  const technicianOptions = getTechnicianAvailabilityOptions();

  function syncFromStore() {
    setSchedules(clone(getSharedAdminScheduleRecords()));
    setServiceOrders(clone(getSharedAdminServiceOrders()));
  }

  const scheduleForm = useForm<ScheduleFormValues>({
    resolver: zodResolver(scheduleFormSchema),
    defaultValues: {
      serviceOrderId: "",
      date: "",
      startTime: "",
      endTime: "",
      technicianId: "",
      adminNote: "",
      status: "scheduled",
    },
  });

  const rescheduleForm = useForm<RescheduleValues>({
    resolver: zodResolver(rescheduleSchema),
    defaultValues: {
      date: "",
      startTime: "",
      endTime: "",
      reason: "",
      note: "",
    },
  });

  const cancellationForm = useForm<CancellationValues>({
    resolver: zodResolver(cancellationSchema),
    defaultValues: {
      reason: "",
      note: "",
    },
  });

  const filteredSchedules = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return schedules.filter((schedule) => {
      if (dateFilter && schedule.currentSchedule.date !== dateFilter) return false;
      if (technicianFilter !== "all" && schedule.technicianId !== technicianFilter) {
        return false;
      }
      if (serviceFilter !== "all" && schedule.serviceId !== serviceFilter) return false;
      if (statusFilter !== "all" && schedule.status !== statusFilter) return false;
      if (!normalizedSearch) return true;

      const technician = technicianOptions.find(
        (item) => item.technicianId === schedule.technicianId,
      );
      const haystack = [
        schedule.serviceOrderId,
        schedule.customerName,
        schedule.address.line1,
        schedule.address.city,
        schedule.serviceName,
        technician?.displayName ?? "",
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedSearch);
    });
  }, [dateFilter, schedules, search, serviceFilter, statusFilter, technicianFilter, technicianOptions]);

  const stats = useMemo(() => {
    const activeSchedules = schedules.filter((schedule) =>
      isBlockingStatus(schedule.status),
    );
    return [
      { label: "Total Schedules", value: schedules.length },
      { label: "Booked", value: activeSchedules.length, tone: "soft" as const },
      {
        label: "Open Slots",
        value: Math.max(availabilitySlots.length * 7 - activeSchedules.length, 0),
      },
      {
        label: "Rescheduled",
        value: schedules.filter((schedule) => schedule.status === "rescheduled").length,
        tone: "warning" as const,
      },
      {
        label: "Assigned Technicians",
        value: schedules.filter((schedule) => schedule.technicianId).length,
      },
      {
        label: "Cancelled",
        value: schedules.filter((schedule) => schedule.status === "cancelled").length,
      },
    ];
  }, [schedules]);

  const selectedDateSchedules = useMemo(
    () =>
      schedules.filter((schedule) => schedule.currentSchedule.date === selectedDate),
    [schedules, selectedDate],
  );

  const visibleCalendarDays = useMemo(() => {
    if (rangeMode === "day") {
      return [new Date(`${selectedDate}T12:00:00`)];
    }

    if (rangeMode === "week") {
      const anchor = new Date(`${selectedDate}T12:00:00`);
      const day = anchor.getDay();
      anchor.setDate(anchor.getDate() - day);
      return Array.from({ length: 7 }, (_, index) => {
        const next = new Date(anchor);
        next.setDate(anchor.getDate() + index);
        return next;
      });
    }

    return buildDayGrid(calendarDate);
  }, [calendarDate, rangeMode, selectedDate]);

  const availableOrderOptions = useMemo(
    () =>
      serviceOrders.filter((order) => {
        const existing = schedules.find(
          (schedule) =>
            schedule.serviceOrderId === order.id && isBlockingStatus(schedule.status),
        );
        return !existing || existing.id === editingScheduleId;
      }),
    [editingScheduleId, schedules, serviceOrders],
  );

  const selectedSchedule = detailScheduleId
    ? schedules.find((schedule) => schedule.id === detailScheduleId) ?? null
    : null;

  function openCreateSchedule() {
    scheduleForm.reset({
      serviceOrderId: "",
      date: selectedDate,
      startTime: "",
      endTime: "",
      technicianId: "",
      adminNote: "",
      status: "scheduled",
    });
    setEditingScheduleId(null);
    setFormError("");
    setCreateOpen(true);
  }

  function openEditSchedule(scheduleId: string) {
    const schedule = getSharedAdminScheduleById(scheduleId);
    if (!schedule) return;

    scheduleForm.reset({
      serviceOrderId: schedule.serviceOrderId,
      date: schedule.currentSchedule.date,
      startTime: schedule.currentSchedule.time,
      endTime: formatTime(schedule.endAt),
      technicianId: schedule.technicianId ?? "",
      adminNote: schedule.adminNote ?? "",
      status: schedule.status,
    });
    setEditingScheduleId(scheduleId);
    setFormError("");
    setCreateOpen(true);
  }

  function saveSchedule(values: ScheduleFormValues) {
    const technicianConflict = technicianConflictMessage(
      schedules,
      values,
      editingScheduleId ?? undefined,
    );
    if (technicianConflict) {
      setFormError(technicianConflict);
      return;
    }

    if (!editingScheduleId) {
      const orderConflict = serviceOrderConflictMessage(schedules, values);
      if (orderConflict) {
        setFormError(orderConflict);
        return;
      }

      createSharedAdminSchedule(values);
    } else {
      const existing = getSharedAdminScheduleById(editingScheduleId);
      if (!existing) return;
      replaceSharedAdminSchedule({
        ...existing,
        currentSchedule: {
          date: values.date,
          time: values.startTime,
          label: formatScheduleLabel(values.date, values.startTime),
        },
        startAt: toDateTime(values.date, values.startTime).toISOString(),
        endAt: toDateTime(values.date, values.endTime).toISOString(),
        timeWindowLabel: `${values.startTime} - ${values.endTime}`,
        technicianId: values.technicianId || undefined,
        status: values.status,
        adminNote: values.adminNote || undefined,
        deletionEligible: !values.technicianId && values.status === "scheduled",
      });
    }

    syncFromStore();
    setCreateOpen(false);
  }

  function saveReschedule(values: RescheduleValues) {
    if (!rescheduleId) return;
    const schedule = getSharedAdminScheduleById(rescheduleId);
    if (!schedule) return;

    const technicianConflict = technicianConflictMessage(
      schedules,
      {
        date: values.date,
        startTime: values.startTime,
        endTime: values.endTime,
        serviceOrderId: schedule.serviceOrderId,
        technicianId: schedule.technicianId,
      },
      schedule.id,
    );
    if (technicianConflict) {
      rescheduleForm.setError("reason", { message: technicianConflict });
      return;
    }

    rescheduleSharedAdminSchedule({
      scheduleId: rescheduleId,
      date: values.date,
      startTime: values.startTime,
      endTime: values.endTime,
      reason: values.reason,
      note: values.note,
    });
    syncFromStore();
    setRescheduleId(null);
  }

  function saveCancellation(values: CancellationValues) {
    if (!cancelId) return;
    cancelSharedAdminSchedule({
      scheduleId: cancelId,
      reason: values.reason,
      note: values.note,
    });
    syncFromStore();
    setCancelId(null);
  }

  function renderAvailability(slot: string) {
    const booked = selectedDateSchedules.find(
      (schedule) =>
        schedule.currentSchedule.time === slot && isBlockingStatus(schedule.status),
    );

    return (
      <div
        className={cn(
          "rounded-xl border px-4 py-3",
          booked
            ? "border-rose-100 bg-rose-50/70"
            : "border-emerald-100 bg-emerald-50/70",
        )}
        key={slot}
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-900">{slot}</p>
            <p className="mt-1 text-xs text-slate-500">
              {booked ? booked.serviceName : "Open for booking"}
            </p>
          </div>
          <span
            className={cn(
              "rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em]",
              booked
                ? "bg-rose-100 text-rose-700"
                : "bg-emerald-100 text-emerald-700",
            )}
          >
            {booked ? "BOOKED" : "OPEN"}
          </span>
        </div>
      </div>
    );
  }

  return (
    <AdminPageShell>
      <AdminPageHeader
        eyebrow="Service Operations"
        title="Schedule"
        description="Manage service appointments and technician assignments."
        action={
          <Button onClick={openCreateSchedule}>
            <Plus size={16} />
            Create Schedule
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        {stats.map((stat) => (
          <AdminStatCard
            key={stat.label}
            label={stat.label}
            tone={stat.tone}
            value={stat.value}
          />
        ))}
      </div>

      <AdminSurface className="space-y-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="inline-flex rounded-xl border border-teal-100 bg-teal-50/50 p-1">
            {(["calendar", "agenda"] as const).map((mode) => (
              <button
                className={cn(
                  "rounded-lg px-4 py-2 text-sm font-semibold transition",
                  viewMode === mode
                    ? "bg-primary text-white"
                    : "text-slate-600 hover:text-primary",
                )}
                key={mode}
                onClick={() => setViewMode(mode)}
                type="button"
              >
                {mode === "calendar" ? "Calendar" : "Agenda / List"}
              </button>
            ))}
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:flex">
            <div className="relative min-w-[18rem]">
              <Search
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                size={18}
              />
              <Input
                className="pl-11"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search customer, order, address, or technician..."
                value={search}
              />
            </div>
            <Input
              onChange={(event) => setDateFilter(event.target.value)}
              type="date"
              value={dateFilter}
            />
            <Select onValueChange={setTechnicianFilter} value={technicianFilter}>
              <SelectTrigger className="min-w-[14rem]">
                <SelectValue placeholder="All technicians" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All technicians</SelectItem>
                {technicianOptions.map((option) => (
                  <SelectItem key={option.technicianId} value={option.technicianId}>
                    {option.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select onValueChange={setServiceFilter} value={serviceFilter}>
              <SelectTrigger className="min-w-[14rem]">
                <SelectValue placeholder="All services" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All services</SelectItem>
                {serviceOrders.map((order) => (
                  <SelectItem key={order.serviceId} value={order.serviceId}>
                    {order.serviceName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              onValueChange={(value) => setStatusFilter(value as ScheduleStatusFilter)}
              value={statusFilter}
            >
              <SelectTrigger className="min-w-[14rem]">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {statusOptions.map((status) => (
                  <SelectItem key={status} value={status}>
                    {toStatusFilterLabel(status)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {viewMode === "calendar" ? (
          <div className="grid gap-4 xl:grid-cols-[1.3fr_0.8fr]">
            <div className="rounded-xl border border-teal-100 bg-white p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="inline-flex rounded-xl border border-teal-100 bg-teal-50/50 p-1">
                  {(["month", "week", "day"] as const).map((mode) => (
                    <button
                      className={cn(
                        "rounded-lg px-3 py-2 text-sm font-semibold transition",
                        rangeMode === mode
                          ? "bg-primary text-white"
                          : "text-slate-600 hover:text-primary",
                      )}
                      key={mode}
                      onClick={() => setRangeMode(mode)}
                      type="button"
                    >
                      {mode}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => {
                      const next = new Date(calendarDate);
                      next.setMonth(calendarDate.getMonth() - 1);
                      setCalendarDate(next);
                    }}
                    size="icon"
                    variant="outline"
                  >
                    <ChevronLeft size={16} />
                  </Button>
                  <p className="min-w-[11rem] text-center text-sm font-semibold text-slate-900">
                    {calendarDate.toLocaleDateString("en-US", {
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                  <Button
                    onClick={() => {
                      const next = new Date(calendarDate);
                      next.setMonth(calendarDate.getMonth() + 1);
                      setCalendarDate(next);
                    }}
                    size="icon"
                    variant="outline"
                  >
                    <ChevronRight size={16} />
                  </Button>
                </div>
              </div>

              <div
                className={cn(
                  "mt-4",
                  rangeMode === "month"
                    ? "grid grid-cols-7 gap-2"
                    : "grid grid-cols-1 gap-2 md:grid-cols-7",
                )}
              >
                {visibleCalendarDays.map((day) => {
                  const dayKey = formatDayKey(day);
                  const daySchedules = filteredSchedules.filter(
                    (schedule) => schedule.currentSchedule.date === dayKey,
                  );

                  return (
                    <button
                      className={cn(
                        "rounded-xl border p-3 text-left transition",
                        selectedDate === dayKey
                          ? "border-teal-300 bg-teal-50"
                          : "border-teal-100 bg-white hover:border-teal-200",
                        rangeMode === "month"
                          ? day.getMonth() === calendarDate.getMonth()
                            ? ""
                            : "opacity-45"
                          : "",
                      )}
                      key={dayKey}
                      onClick={() => setSelectedDate(dayKey)}
                      type="button"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-sm font-semibold text-slate-900">
                          {day.getDate()}
                        </span>
                        <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600">
                          {daySchedules.length}
                        </span>
                      </div>
                      <div className="mt-3 space-y-2">
                        {daySchedules.slice(0, rangeMode === "month" ? 2 : 4).map((schedule) => (
                          <div
                            className="rounded-lg bg-slate-50 px-2.5 py-2"
                            key={schedule.id}
                          >
                            <p className="text-xs font-semibold text-primary">
                              {schedule.currentSchedule.time}
                            </p>
                            <p className="mt-1 line-clamp-1 text-xs text-slate-600">
                              {schedule.customerName}
                            </p>
                            <p className="line-clamp-1 text-xs text-slate-500">
                              {schedule.serviceName}
                            </p>
                          </div>
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-4">
              <AdminSurface>
                <div className="flex items-center gap-3">
                  <CalendarClock className="text-teal-700" size={18} />
                  <div>
                    <h2 className="text-lg font-semibold text-slate-950">
                      {formatLongDate(`${selectedDate}T12:00:00`)}
                    </h2>
                    <p className="text-sm text-slate-500">
                      OPEN / BOOKED slot availability.
                    </p>
                  </div>
                </div>
                <div className="mt-4 space-y-3">
                  {availabilitySlots.map((slot) => renderAvailability(slot))}
                </div>
              </AdminSurface>

              <AdminSurface>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-950">
                      Selected day agenda
                    </h2>
                    <p className="text-sm text-slate-500">
                      {selectedDateSchedules.length} appointment
                      {selectedDateSchedules.length === 1 ? "" : "s"}
                    </p>
                  </div>
                </div>
                <div className="mt-4 space-y-3">
                  {selectedDateSchedules.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-teal-200 bg-teal-50/40 px-4 py-8 text-center text-sm text-slate-600">
                      No schedules on this day.
                    </div>
                  ) : (
                    selectedDateSchedules.map((schedule) => (
                      <button
                        className="w-full rounded-xl border border-teal-100 px-4 py-3 text-left transition hover:border-teal-200 hover:bg-teal-50/50"
                        key={schedule.id}
                        onClick={() => setDetailScheduleId(schedule.id)}
                        type="button"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-semibold text-slate-900">
                              {schedule.serviceName}
                            </p>
                            <p className="mt-1 text-sm text-slate-500">
                              {schedule.customerName} • {schedule.currentSchedule.time}
                            </p>
                          </div>
                          <StatusBadge status={schedule.status} />
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </AdminSurface>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredSchedules.length === 0 ? (
              <div className="rounded-xl border border-dashed border-teal-200 bg-teal-50/40 px-6 py-10 text-center text-sm text-slate-600">
                No schedules matched the current filters.
              </div>
            ) : null}
            {filteredSchedules.map((schedule) => {
              const technician = technicianOptions.find(
                (item) => item.technicianId === schedule.technicianId,
              );

              return (
                <AdminSurface key={schedule.id}>
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                          {schedule.serviceOrderId}
                        </span>
                        <StatusBadge status={schedule.status} />
                        {schedule.technicianId ? (
                          <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">
                            {technician?.displayName ?? schedule.technicianId}
                          </span>
                        ) : null}
                      </div>
                      <h2 className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-primary">
                        {schedule.serviceName}
                      </h2>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {schedule.customerName} • {schedule.address.line1},{" "}
                        {schedule.address.city}
                      </p>
                      <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-slate-600">
                        <span className="inline-flex items-center gap-2">
                          <Calendar size={16} className="text-teal-700" />
                          {formatLongDate(schedule.startAt)}
                        </span>
                        <span className="inline-flex items-center gap-2">
                          <Clock3 size={16} className="text-teal-700" />
                          {schedule.timeWindowLabel}
                        </span>
                        <span className="inline-flex items-center gap-2">
                          <MapPin size={16} className="text-teal-700" />
                          {schedule.address.city}, {schedule.address.state}
                        </span>
                        <span className="inline-flex items-center gap-2">
                          <UserRound size={16} className="text-teal-700" />
                          {technician?.displayName ?? "Unassigned"}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button onClick={() => setDetailScheduleId(schedule.id)} variant="outline">
                        View Details
                      </Button>
                      <Button onClick={() => openEditSchedule(schedule.id)} variant="outline">
                        <Pencil size={16} />
                        Edit
                      </Button>
                      <Button onClick={() => {
                        rescheduleForm.reset({
                          date: schedule.currentSchedule.date,
                          startTime: schedule.currentSchedule.time,
                          endTime: formatTime(schedule.endAt),
                          reason: "",
                          note: "",
                        });
                        setRescheduleId(schedule.id);
                      }}>
                        Reschedule
                      </Button>
                    </div>
                  </div>
                </AdminSurface>
              );
            })}
          </div>
        )}
      </AdminSurface>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {editingScheduleId ? "Edit Schedule" : "Create Schedule"}
            </DialogTitle>
            <DialogDescription>
              Service schedules stay linked to service orders. Requested schedule is
              preserved separately from the current working schedule.
            </DialogDescription>
          </DialogHeader>

          <form
            className="space-y-4"
            onSubmit={scheduleForm.handleSubmit(saveSchedule)}
          >
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-900">
                Service Order <span className="text-rose-600">*</span>
              </label>
              <Controller
                control={scheduleForm.control}
                name="serviceOrderId"
                render={({ field }) => (
                  <Select
                    disabled={Boolean(editingScheduleId)}
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select service order" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableOrderOptions.map((order) => (
                        <SelectItem key={order.id} value={order.id}>
                          {order.id} • {order.serviceName} • {getCustomerName(order.customerId)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {scheduleForm.formState.errors.serviceOrderId ? (
                <p className="text-sm text-rose-700">
                  {scheduleForm.formState.errors.serviceOrderId.message}
                </p>
              ) : null}
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-900">
                  Date <span className="text-rose-600">*</span>
                </label>
                <Input type="date" {...scheduleForm.register("date")} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-900">
                  Start Time <span className="text-rose-600">*</span>
                </label>
                <Controller
                  control={scheduleForm.control}
                  name="startTime"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select start time" />
                      </SelectTrigger>
                      <SelectContent>
                        {timeOptions.map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-900">
                  End Time <span className="text-rose-600">*</span>
                </label>
                <Controller
                  control={scheduleForm.control}
                  name="endTime"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select end time" />
                      </SelectTrigger>
                      <SelectContent>
                        {timeOptions.map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-900">
                  Technician
                </label>
                <Controller
                  control={scheduleForm.control}
                  name="technicianId"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Unassigned" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Unassigned</SelectItem>
                        {technicianOptions.map((option) => (
                          <SelectItem
                            disabled={!option.active}
                            key={option.technicianId}
                            value={option.technicianId}
                          >
                            {option.displayName} • {option.availabilityLabel}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-900">
                  Status <span className="text-rose-600">*</span>
                </label>
                <Controller
                  control={scheduleForm.control}
                  name="status"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status.replaceAll("-", " ")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-900">Admin Note</label>
              <Textarea
                placeholder="Optional schedule note"
                {...scheduleForm.register("adminNote")}
              />
            </div>

            {formError ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {formError}
              </div>
            ) : null}

            <DialogFooter>
              <Button onClick={() => setCreateOpen(false)} type="button" variant="outline">
                Close
              </Button>
              <Button type="submit">
                {editingScheduleId ? "Save Schedule" : "Create Schedule"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(detailScheduleId)}
        onOpenChange={(open) => {
          if (!open) setDetailScheduleId(null);
        }}
      >
        <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-3xl">
          {selectedSchedule ? (
            <>
              <DialogHeader>
                <DialogTitle>{selectedSchedule.serviceName}</DialogTitle>
                <DialogDescription>
                  {selectedSchedule.serviceOrderId} • {selectedSchedule.customerName}
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                    Requested Schedule
                  </p>
                  <p className="mt-2 font-semibold text-slate-900">
                    {selectedSchedule.requestedSchedule.label}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                    Current Schedule
                  </p>
                  <p className="mt-2 font-semibold text-slate-900">
                    {selectedSchedule.currentSchedule.label}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                    Technician
                  </p>
                  <p className="mt-2 font-semibold text-slate-900">
                    {technicianOptions.find(
                      (item) => item.technicianId === selectedSchedule.technicianId,
                    )?.displayName ?? "Unassigned"}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                    Status
                  </p>
                  <div className="mt-2">
                    <StatusBadge status={selectedSchedule.status} />
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <AdminSurface className="p-4">
                  <div className="flex items-center gap-2">
                    <MapPin size={16} className="text-teal-700" />
                    <p className="font-semibold text-slate-900">Address</p>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {selectedSchedule.address.line1}
                    <br />
                    {selectedSchedule.address.city}, {selectedSchedule.address.state}{" "}
                    {selectedSchedule.address.postalCode}
                  </p>
                </AdminSurface>
                <AdminSurface className="p-4">
                  <div className="flex items-center gap-2">
                    <ClipboardList size={16} className="text-teal-700" />
                    <p className="font-semibold text-slate-900">Admin Notes</p>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {selectedSchedule.adminNote ?? "No admin note recorded."}
                  </p>
                </AdminSurface>
              </div>

              <div className="rounded-xl border border-teal-100 p-4">
                <p className="font-semibold text-slate-900">Reschedule History</p>
                <div className="mt-3 space-y-3">
                  {selectedSchedule.rescheduleHistory.length === 0 ? (
                    <p className="text-sm text-slate-500">No reschedules recorded.</p>
                  ) : (
                    selectedSchedule.rescheduleHistory.map((entry) => (
                      <div className="rounded-xl bg-slate-50 p-4" key={entry.id}>
                        <p className="text-sm font-semibold text-slate-900">
                          {entry.previousSchedule.label} → {entry.nextSchedule.label}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">{entry.reason}</p>
                        {entry.note ? (
                          <p className="mt-1 text-sm text-slate-500">{entry.note}</p>
                        ) : null}
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <Button asChild variant="outline">
                  <Link href={`/admin/orders/${selectedSchedule.serviceOrderId}`}>
                    View Service Order
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link
                    href={`/admin/service-requests/${selectedSchedule.serviceRequestId}`}
                  >
                    View Service Request
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href={`/admin/customers?customerId=${selectedSchedule.customerId}`}>
                    View Customer
                  </Link>
                </Button>
              </div>

              <DialogFooter>
                <Button
                  onClick={() => {
                    openEditSchedule(selectedSchedule.id);
                    setDetailScheduleId(null);
                  }}
                  type="button"
                  variant="outline"
                >
                  <Pencil size={16} />
                  Edit
                </Button>
                <Button
                  onClick={() => {
                    rescheduleForm.reset({
                      date: selectedSchedule.currentSchedule.date,
                      startTime: selectedSchedule.currentSchedule.time,
                      endTime: formatTime(selectedSchedule.endAt),
                      reason: "",
                      note: "",
                    });
                    setRescheduleId(selectedSchedule.id);
                    setDetailScheduleId(null);
                  }}
                  type="button"
                >
                  Reschedule
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(rescheduleId)}
        onOpenChange={(open) => {
          if (!open) setRescheduleId(null);
        }}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Reschedule Service</DialogTitle>
            <DialogDescription>
              Requested schedule is preserved. Only the current working schedule is updated.
            </DialogDescription>
          </DialogHeader>
          {rescheduleId ? (
            <form
              className="space-y-4"
              onSubmit={rescheduleForm.handleSubmit(saveReschedule)}
            >
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                    Originally Requested
                  </p>
                  <p className="mt-2 font-semibold text-slate-900">
                    {getSharedAdminScheduleById(rescheduleId)?.requestedSchedule.label}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                    Current Schedule
                  </p>
                  <p className="mt-2 font-semibold text-slate-900">
                    {getSharedAdminScheduleById(rescheduleId)?.currentSchedule.label}
                  </p>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <Input type="date" {...rescheduleForm.register("date")} />
                <Controller
                  control={rescheduleForm.control}
                  name="startTime"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Start time" />
                      </SelectTrigger>
                      <SelectContent>
                        {timeOptions.map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <Controller
                  control={rescheduleForm.control}
                  name="endTime"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="End time" />
                      </SelectTrigger>
                      <SelectContent>
                        {timeOptions.map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <Input placeholder="Reason" {...rescheduleForm.register("reason")} />
              <Textarea
                placeholder="Optional note"
                {...rescheduleForm.register("note")}
              />
              {rescheduleForm.formState.errors.reason ? (
                <p className="text-sm text-rose-700">
                  {rescheduleForm.formState.errors.reason.message}
                </p>
              ) : null}
              <DialogFooter>
                <Button onClick={() => setRescheduleId(null)} type="button" variant="outline">
                  Cancel
                </Button>
                <Button type="submit">Save New Schedule</Button>
              </DialogFooter>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(cancelId)}
        onOpenChange={(open) => {
          if (!open) setCancelId(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Schedule</DialogTitle>
            <DialogDescription>
              Cancellation retains schedule history and does not delete the service order.
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={cancellationForm.handleSubmit(saveCancellation)}
          >
            <Input
              placeholder="Cancellation reason"
              {...cancellationForm.register("reason")}
            />
            <Textarea
              placeholder="Optional note"
              {...cancellationForm.register("note")}
            />
            <DialogFooter>
              <Button onClick={() => setCancelId(null)} type="button" variant="outline">
                Keep Appointment
              </Button>
              <Button type="submit" variant="destructive">
                Cancel Schedule
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(deleteId)}
        onOpenChange={(open) => {
          if (!open) setDeleteId(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Schedule</DialogTitle>
            <DialogDescription>
              Only unused draft-like schedules can be deleted. Active history should be cancelled instead.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setDeleteId(null)} variant="outline">
              Keep Schedule
            </Button>
            <Button
              onClick={() => {
                if (deleteId) {
                  deleteSharedAdminSchedule(deleteId);
                  syncFromStore();
                }
                setDeleteId(null);
              }}
              variant="destructive"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminPageShell>
  );
}
