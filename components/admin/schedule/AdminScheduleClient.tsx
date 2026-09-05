"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Ban,
  Calendar,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock3,
  ExternalLink,
  MapPin,
  Pencil,
  Plus,
  Star,
  UserCheck,
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
import { AdminSearchInput } from "@/components/admin/AdminSearchInput";
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
import { DatePicker } from "@/components/ui/DatePicker";
import { AssignTechnicianModal } from "@/components/admin/shared/AssignTechnicianModal";
import type { TechnicianProfileDto } from "@/redux/api/technicianApi";
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
import { getSharedCustomerById } from "@/data/mock/shared-business-store";
import { useSharedBusinessStoreVersion } from "@/hooks/useSharedBusinessStoreVersion";
import { formatLongDate, formatTime } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import {
  useGetDispatchBoardQuery,
  useGetAvailableSlotsQuery,
  useCreateAppointmentMutation,
  useUpdateAppointmentMutation,
  useAssignTechnicianToAppointmentMutation,
  useCancelAppointmentMutation,
} from "@/redux/api/servicesApi";
import { useRescheduleServiceRequestMutation } from "@/redux/api/serviceRequestsApi";
import { toast } from "sonner";
import type { AdminScheduleRecord, ServiceOrderStatus } from "@/types/domain";

export const FIXED_DAILY_SHIFTS = [
  {
    slot: "09:00 AM - 11:00 AM",
    label: "09:00 AM - 11:00 AM (Morning Shift 1)",
    startTime: "09:00 AM",
    endTime: "11:00 AM",
  },
  {
    slot: "11:00 AM - 01:00 PM",
    label: "11:00 AM - 01:00 PM (Morning Shift 2)",
    startTime: "11:00 AM",
    endTime: "01:00 PM",
  },
  {
    slot: "01:00 PM - 03:00 PM",
    label: "01:00 PM - 03:00 PM (Afternoon Shift 1)",
    startTime: "01:00 PM",
    endTime: "03:00 PM",
  },
  {
    slot: "03:00 PM - 04:30 PM",
    label: "03:00 PM - 04:30 PM (Afternoon Shift 2)",
    startTime: "03:00 PM",
    endTime: "04:30 PM",
  },
  {
    slot: "04:30 PM - 06:30 PM",
    label: "04:30 PM - 06:30 PM (Evening Shift)",
    startTime: "04:30 PM",
    endTime: "06:30 PM",
  },
] as const;

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
    getSharedCustomerById(customerId)?.displayName ?? "Unknown customer"
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
  useSharedBusinessStoreVersion();
  const [viewMode, setViewMode] = useState<ScheduleViewMode>("calendar");
  const [rangeMode, setRangeMode] = useState<CalendarRangeMode>("month");
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [technicianFilter, setTechnicianFilter] = useState("all");
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

  // Assign Technician Modal State
  const [assigningSchedule, setAssigningSchedule] = useState<AdminScheduleRecord | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);

  // Compute dateFrom / dateTo for active calendar month
  const calendarRange = useMemo(() => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const dateFrom = firstDay.toISOString().slice(0, 10);
    const dateTo = lastDay.toISOString().slice(0, 10);
    return { dateFrom, dateTo };
  }, [calendarDate]);

  // RTK Query: Dispatch board (returns only booked days)
  const { data: apiBoard, refetch: refetchBoard } =
    useGetDispatchBoardQuery({
      dateFrom: calendarRange.dateFrom,
      dateTo: calendarRange.dateTo,
      technicianId: technicianFilter !== "all" ? technicianFilter : undefined,
      status: statusFilter !== "all" ? statusFilter.toUpperCase() : undefined,
    });

  // RTK Query: 5 fixed shifts availability for selected date
  const { data: apiSlots, refetch: refetchSlots } =
    useGetAvailableSlotsQuery({
      date: selectedDate,
      technicianId: technicianFilter !== "all" ? technicianFilter : undefined,
    });

  const [createAppointmentMutation] = useCreateAppointmentMutation();
  const [updateAppointmentMutation] = useUpdateAppointmentMutation();
  const [assignTechnicianMutation] = useAssignTechnicianToAppointmentMutation();
  const [cancelAppointmentMutation] = useCancelAppointmentMutation();
  const [rescheduleServiceRequestMutation] = useRescheduleServiceRequestMutation();

  const schedules = clone(getSharedAdminScheduleRecords());
  const serviceOrders = clone(getSharedAdminServiceOrders());

  // Merge technicians from API with mock fallback
  const technicianOptions = useMemo(() => {
    if (apiBoard?.technicians && apiBoard.technicians.length > 0) {
      return apiBoard.technicians.map((tech) => ({
        technicianId: tech.id,
        displayName: tech.displayName,
        phone: tech.phone ?? "+1 (555) 234-5678",
        rating: typeof tech.rating === "number" ? tech.rating : 4.9,
        active: tech.status !== "INACTIVE",
        availabilityLabel: tech.status || "Active",
      }));
    }
    return getTechnicianAvailabilityOptions().map((opt) => ({
      technicianId: opt.technicianId,
      displayName: opt.displayName,
      phone: "+1 (555) 234-5678",
      rating: 4.9,
      active: opt.active,
      availabilityLabel: opt.availabilityLabel,
    }));
  }, [apiBoard?.technicians]);

  // Map API appointments to unified AdminScheduleRecord shape
  const mappedApiAppointments = useMemo(() => {
    if (!apiBoard?.appointments || !Array.isArray(apiBoard.appointments)) {
      return [];
    }
    return apiBoard.appointments.map((appt) => {
      const startDate =
        appt.date ||
        (appt.startAt ? new Date(appt.startAt).toISOString().slice(0, 10) : selectedDate);
      const startTimeStr =
        appt.startTime || (appt.startAt ? formatTime(appt.startAt) : "09:00 AM");
      const endTimeStr =
        appt.endTime || (appt.endAt ? formatTime(appt.endAt) : "11:00 AM");
      const label = `${startDate} at ${startTimeStr}`;

      const rawStatus = (appt.status || "CONFIRMED").toLowerCase();
      const normalizedStatus: ServiceOrderStatus =
        rawStatus === "confirmed"
          ? "scheduled"
          : rawStatus === "rescheduled"
          ? "rescheduled"
          : rawStatus === "completed"
          ? "completed"
          : rawStatus === "cancelled"
          ? "cancelled"
          : (rawStatus.replace(/_/g, "-") as ServiceOrderStatus);

      return {
        id: appt.id,
        serviceOrderId:
          appt.serviceOrderId ||
          appt.serviceRequest?.businessId ||
          appt.serviceRequestId,
        serviceRequestId: appt.serviceRequestId,
        customerId: appt.serviceRequest?.customer?.id || "",
        serviceId: appt.serviceRequestId,
        serviceName:
          appt.serviceRequest?.title || "Central Vacuum Repair & Maintenance",
        customerName:
          appt.serviceRequest?.customer?.displayName || "Valued Customer",
        address: {
          id: `addr-${appt.id}`,
          label: "Service Location",
          line1: appt.serviceRequest?.serviceAddress?.addressLine1 || "",
          city: appt.serviceRequest?.serviceAddress?.city || "",
          state: appt.serviceRequest?.serviceAddress?.state || "",
          postalCode: appt.serviceRequest?.serviceAddress?.postalCode || "",
          country: "US",
        },
        requestedSchedule: {
          date: startDate,
          time: startTimeStr,
          label,
        },
        currentSchedule: {
          date: startDate,
          time: startTimeStr,
          label,
        },
        startAt: appt.startAt || `${startDate}T09:00:00.000Z`,
        endAt: appt.endAt || `${startDate}T11:00:00.000Z`,
        timeWindowLabel: `${startTimeStr} - ${endTimeStr}`,
        technicianId: appt.technicianId || appt.technician?.id,
        status: normalizedStatus,
        adminNote: appt.notes,
        createdAt: appt.startAt || new Date().toISOString(),
        updatedAt: appt.endAt || new Date().toISOString(),
        deletionEligible: false,
        rescheduleHistory: [],
      } as AdminScheduleRecord;
    });
  }, [apiBoard?.appointments, selectedDate]);

  // Combine live backend appointments with mock fallback
  const allSchedules = useMemo(() => {
    if (mappedApiAppointments.length === 0) return schedules;
    const apiIds = new Set(mappedApiAppointments.map((a) => a.id));
    const nonConflictingMocks = schedules.filter((s) => !apiIds.has(s.id));
    return [...mappedApiAppointments, ...nonConflictingMocks];
  }, [mappedApiAppointments, schedules]);

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

    return allSchedules.filter((schedule) => {
      if (dateFilter && schedule.currentSchedule.date !== dateFilter) return false;
      if (technicianFilter !== "all" && schedule.technicianId !== technicianFilter) {
        return false;
      }
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
  }, [allSchedules, dateFilter, search, statusFilter, technicianFilter, technicianOptions]);

  const selectedDateSchedules = useMemo(
    () =>
      allSchedules.filter((schedule) => schedule.currentSchedule.date === selectedDate),
    [allSchedules, selectedDate],
  );

  const stats = useMemo(() => {
    const apiStats = apiBoard?.meta?.stats;
    const totalCount = apiBoard?.meta?.total ?? allSchedules.length;
    const confirmedCount =
      apiStats?.confirmed ??
      allSchedules.filter((s) => s.status === "scheduled" || s.status === "technician-assigned").length;
    const openSlotsCount =
      apiSlots?.availableSlotsCount ??
      Math.max(5 - selectedDateSchedules.length, 0);
    const rescheduledCount =
      apiStats?.rescheduled ??
      allSchedules.filter((s) => s.status === "rescheduled").length;
    const cancelledCount =
      apiStats?.cancelled ??
      allSchedules.filter((s) => s.status === "cancelled").length;
    const unassignedCount =
      apiStats?.unassigned ??
      allSchedules.filter((s) => !s.technicianId && s.status !== "cancelled").length;

    return [
      { label: "Total Bookings", value: totalCount },
      { label: "Confirmed", value: confirmedCount, tone: "soft" as const },
      {
        label: "Open Shifts Today",
        value: openSlotsCount,
        tone: "success" as const,
      },
      {
        label: "Rescheduled",
        value: rescheduledCount,
        tone: "warning" as const,
      },
      {
        label: "Unassigned",
        value: unassignedCount,
      },
      {
        label: "Cancelled",
        value: cancelledCount,
      },
    ];
  }, [apiBoard?.meta, apiSlots?.availableSlotsCount, allSchedules, selectedDateSchedules]);

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
        const existing = allSchedules.find(
          (schedule) =>
            schedule.serviceOrderId === order.id && isBlockingStatus(schedule.status),
        );
        return !existing || existing.id === editingScheduleId;
      }),
    [editingScheduleId, allSchedules, serviceOrders],
  );

  const selectedSchedule = detailScheduleId
    ? allSchedules.find((schedule) => schedule.id === detailScheduleId) ?? null
    : null;

  function openCreateSchedule(
    defaultDate?: string,
    defaultStartTime?: string,
    defaultEndTime?: string
  ) {
    scheduleForm.reset({
      serviceOrderId: "",
      date: defaultDate || selectedDate,
      startTime: defaultStartTime || "09:00 AM",
      endTime: defaultEndTime || "11:00 AM",
      technicianId: "",
      adminNote: "",
      status: "scheduled",
    });
    setEditingScheduleId(null);
    setFormError("");
    setCreateOpen(true);
  }

  function openEditSchedule(scheduleId: string) {
    const schedule = allSchedules.find((s) => s.id === scheduleId);
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

  async function handleAssignTechnician(
    techId: string,
    notes?: string,
    tech?: TechnicianProfileDto,
  ) {
    if (!assigningSchedule || !techId) return;
    setIsAssigning(true);
    try {
      await assignTechnicianMutation({
        appointmentId: assigningSchedule.id,
        technicianId: techId,
        notes: notes || undefined,
      }).unwrap();

      const updatedSchedule: AdminScheduleRecord = {
        ...assigningSchedule,
        technicianId: techId,
        status: "technician-assigned",
        updatedAt: new Date().toISOString(),
      };
      replaceSharedAdminSchedule(updatedSchedule);

      toast.success("Technician assigned successfully", {
        description: `Assigned ${tech?.displayName || "technician"} to appointment #${assigningSchedule.serviceRequestId || assigningSchedule.serviceOrderId}`,
      });
      refetchBoard();
      refetchSlots();
      setAssigningSchedule(null);
    } catch {
      // Fallback for mock/offline environment
      const updatedSchedule: AdminScheduleRecord = {
        ...assigningSchedule,
        technicianId: techId,
        status: "technician-assigned",
        updatedAt: new Date().toISOString(),
      };
      replaceSharedAdminSchedule(updatedSchedule);
      toast.success("Technician assigned successfully", {
        description: `Assigned ${tech?.displayName || "technician"} to appointment #${assigningSchedule.serviceRequestId || assigningSchedule.serviceOrderId}`,
      });
      refetchBoard();
      refetchSlots();
      setAssigningSchedule(null);
    } finally {
      setIsAssigning(false);
    }
  }

  async function saveSchedule(values: ScheduleFormValues) {
    const technicianConflict = technicianConflictMessage(
      allSchedules,
      values,
      editingScheduleId ?? undefined,
    );
    if (technicianConflict) {
      setFormError(technicianConflict);
      return;
    }

    if (!editingScheduleId) {
      const orderConflict = serviceOrderConflictMessage(allSchedules, values);
      if (orderConflict) {
        setFormError(orderConflict);
        return;
      }

      createSharedAdminSchedule(values);

      try {
        await createAppointmentMutation({
          serviceRequestId: values.serviceOrderId,
          technicianId: values.technicianId || undefined,
          date: values.date,
          startTime: values.startTime,
          endTime: values.endTime,
          adminNote: values.adminNote,
          notes: values.adminNote,
        }).unwrap();
        toast.success("Appointment created successfully", {
          description: `Scheduled for ${values.date} from ${values.startTime} to ${values.endTime}`,
        });
        refetchBoard();
        refetchSlots();
      } catch (err: unknown) {
        const anyErr = err as {
          data?: { message?: string | string[] };
        };
        const msg =
          (Array.isArray(anyErr.data?.message)
            ? anyErr.data.message.join(", ")
            : anyErr.data?.message) || "Saved locally in admin store.";
        toast.info("Appointment saved", { description: msg });
      }
    } else {
      const existing = allSchedules.find((s) => s.id === editingScheduleId);
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

      try {
        if (
          values.technicianId &&
          existing.technicianId !== values.technicianId
        ) {
          await assignTechnicianMutation({
            appointmentId: editingScheduleId,
            technicianId: values.technicianId,
          }).unwrap();
        }
        await updateAppointmentMutation({
          appointmentId: editingScheduleId,
          body: {
            date: values.date,
            startTime: values.startTime,
            endTime: values.endTime,
            status: values.status,
            notes: values.adminNote,
          },
        }).unwrap();
        toast.success("Appointment updated successfully");
        refetchBoard();
        refetchSlots();
      } catch {
        // Fallback to local store
      }
    }
    setCreateOpen(false);
  }

  async function saveReschedule(values: RescheduleValues) {
    if (!rescheduleId) return;
    const schedule = allSchedules.find((s) => s.id === rescheduleId);
    if (!schedule) return;

    const technicianConflict = technicianConflictMessage(
      allSchedules,
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

    const targetServiceRequestId =
      schedule.serviceRequestId ||
      (schedule.serviceOrderId?.startsWith("SR-") ? schedule.serviceOrderId : undefined) ||
      (schedule.id?.startsWith("SR-") ? schedule.id : undefined);

    let rescheduleSuccess = false;

    if (targetServiceRequestId) {
      try {
        await rescheduleServiceRequestMutation({
          id: targetServiceRequestId,
          body: {
            date: values.date,
            startTime: values.startTime,
            endTime: values.endTime,
            technicianId: schedule.technicianId || undefined,
            adminNote: values.reason + (values.note ? ` - ${values.note}` : ""),
          },
        }).unwrap();
        rescheduleSuccess = true;
      } catch (err) {
        console.error("Failed to reschedule service request via dedicated endpoint", err);
      }
    }

    try {
      await updateAppointmentMutation({
        appointmentId: rescheduleId,
        body: {
          date: values.date,
          startTime: values.startTime,
          endTime: values.endTime,
          status: "RESCHEDULED",
          notes: values.reason + (values.note ? ` - ${values.note}` : ""),
        },
      }).unwrap();
      rescheduleSuccess = true;
    } catch {
      // Fallback to local store
    }

    if (rescheduleSuccess) {
      toast.success("Appointment rescheduled successfully", {
        description: `New schedule: ${values.date} from ${values.startTime} to ${values.endTime}`,
      });
      refetchBoard();
      refetchSlots();
    } else {
      toast.success("Appointment rescheduled locally", {
        description: `New schedule: ${values.date} from ${values.startTime} to ${values.endTime}`,
      });
    }
    setRescheduleId(null);
  }

  async function saveCancellation(values: CancellationValues) {
    if (!cancelId) return;
    cancelSharedAdminSchedule({
      scheduleId: cancelId,
      reason: values.reason,
      note: values.note,
    });

    try {
      await cancelAppointmentMutation({
        appointmentId: cancelId,
        cancellationReason: values.reason + (values.note ? ` - ${values.note}` : ""),
      }).unwrap();
      toast.success("Appointment cancelled successfully");
      refetchBoard();
      refetchSlots();
    } catch {
      // Fallback to local store
    }
    setCancelId(null);
  }

  function renderAvailabilityShift(shift: (typeof FIXED_DAILY_SHIFTS)[number]) {
    const apiSlot = apiSlots?.slots?.find(
      (s) =>
        s.slot === shift.slot ||
        s.startTime === shift.startTime ||
        (s.timeWindow && s.timeWindow.includes(shift.startTime)),
    );

    const bookedAppt = selectedDateSchedules.find(
      (schedule) =>
        (schedule.currentSchedule.time === shift.startTime ||
          schedule.timeWindowLabel.includes(shift.startTime)) &&
        isBlockingStatus(schedule.status),
    );

    const isBooked = apiSlot
      ? apiSlot.isBooked || apiSlot.status === "BOOKED"
      : Boolean(bookedAppt);

    const bookedCount = apiSlot?.bookedCount ?? (isBooked ? 1 : 0);
    const capacity = apiSlot?.availableCapacity ?? (isBooked ? 0 : 1);

    return (
      <div
        className={cn(
          "rounded-xl border px-4 py-3 transition",
          isBooked
            ? "border-rose-200 bg-rose-50/70"
            : "border-emerald-200 bg-emerald-50/70",
        )}
        key={shift.slot}
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Clock3 size={14} className={isBooked ? "text-rose-600" : "text-emerald-700"} />
              <p className="text-sm font-semibold text-slate-900">{shift.slot}</p>
            </div>
            <p className="mt-1 text-xs text-slate-600">
              {isBooked
                ? bookedAppt
                  ? `${bookedAppt.customerName} • ${bookedAppt.serviceName}`
                  : `${bookedCount} appointment booked`
                : `${capacity} technician capacity available`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em]",
                isBooked
                  ? "bg-rose-100 text-rose-700 border border-rose-200"
                  : "bg-emerald-100 text-emerald-800 border border-emerald-200",
              )}
            >
              {isBooked ? "BOOKED" : "OPEN"}
            </span>
            {!isBooked && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => openCreateSchedule(selectedDate, shift.startTime, shift.endTime)}
                className="h-7 px-2.5 text-xs text-emerald-800 border-emerald-300 hover:bg-emerald-100"
              >
                <Plus size={12} className="mr-1" />
                Book
              </Button>
            )}
          </div>
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
          <Button onClick={() => openCreateSchedule()}>
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
          <div className="inline-flex rounded-lg border border-teal-100 bg-teal-50/50 p-1">
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
            <AdminSearchInput
              className="min-w-[18rem]"
              value={search}
              onChange={setSearch}
              placeholder="Search customer, order, address, or technician..."
              ariaLabel="Search schedules"
            />
            <DatePicker
              className="min-w-[12rem] bg-white"
              value={dateFilter}
              onChange={(val) => setDateFilter(val)}
              placeholder="Filter by date..."
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

              {rangeMode === "month" && (
                <div className="grid grid-cols-7 gap-2 mt-4 text-center">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((dayName) => (
                    <div
                      key={dayName}
                      className="text-xs font-bold uppercase tracking-wider text-slate-400 py-1"
                    >
                      {dayName}
                    </div>
                  ))}
                </div>
              )}

              <div
                className={cn(
                  rangeMode === "month" ? "mt-2" : "mt-4",
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
                        "rounded-xl border p-3 text-left transition relative flex flex-col justify-between",
                        rangeMode === "month" ? "h-20 min-h-[5rem]" : "min-h-[5.5rem]",
                        selectedDate === dayKey
                          ? "border-teal-400 bg-teal-50/80 shadow-sm ring-1 ring-teal-400"
                          : "border-teal-100 bg-white hover:border-teal-200 hover:bg-slate-50/50",
                        rangeMode === "month"
                          ? day.getMonth() === calendarDate.getMonth()
                            ? ""
                            : "opacity-35"
                          : "",
                      )}
                      key={dayKey}
                      onClick={() => setSelectedDate(dayKey)}
                      type="button"
                    >
                      <div className="flex items-center justify-between w-full">
                        <span
                          className={cn(
                            "text-sm font-semibold",
                            selectedDate === dayKey
                              ? "text-teal-950 font-bold"
                              : "text-slate-800",
                          )}
                        >
                          {day.getDate()}
                        </span>
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[11px] font-semibold transition-colors",
                            daySchedules.length > 0
                              ? "bg-teal-100 text-teal-800 font-bold"
                              : "bg-slate-100 text-slate-500",
                          )}
                        >
                          {daySchedules.length}
                        </span>
                      </div>
                      {rangeMode !== "month" && daySchedules.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {daySchedules.slice(0, 3).map((schedule) => (
                            <div
                              className="rounded bg-slate-50 px-2 py-1 text-[11px] truncate text-slate-600"
                              key={schedule.id}
                            >
                              <span className="font-semibold text-primary mr-1">
                                {schedule.currentSchedule.time}
                              </span>
                              {schedule.customerName}
                            </div>
                          ))}
                        </div>
                      )}
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
                  {FIXED_DAILY_SHIFTS.map((shift) => renderAvailabilityShift(shift))}
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
                      <Button
                        onClick={() => setAssigningSchedule(schedule)}
                        variant="outline"
                        className="text-teal-700 border-teal-200 hover:bg-teal-50"
                      >
                        <UserCheck size={15} />
                        Assign Tech
                      </Button>
                      <Button onClick={() => openEditSchedule(schedule.id)} variant="outline">
                        <Pencil size={15} />
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
                      {schedule.status !== "cancelled" && (
                        <Button
                          onClick={() => {
                            cancellationForm.reset({ reason: "", note: "" });
                            setCancelId(schedule.id);
                          }}
                          variant="outline"
                          className="text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700"
                        >
                          <Ban size={15} />
                          Cancel
                        </Button>
                      )}
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

            <div className="space-y-1.5 rounded-xl border border-teal-100 bg-teal-50/40 p-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-teal-900">
                  Quick Shift Preset (5 Standard Shifts)
                </span>
                <span className="text-[11px] text-teal-700">Click to set start & end time</span>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {FIXED_DAILY_SHIFTS.map((shift) => (
                  <Button
                    key={shift.slot}
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs border-teal-200 text-teal-800 hover:bg-teal-100 bg-white"
                    onClick={() => {
                      scheduleForm.setValue("startTime", shift.startTime, { shouldValidate: true });
                      scheduleForm.setValue("endTime", shift.endTime, { shouldValidate: true });
                    }}
                  >
                    {shift.slot}
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-900">
                  Date <span className="text-rose-600">*</span>
                </label>
                <Controller
                  control={scheduleForm.control}
                  name="date"
                  render={({ field }) => (
                    <DatePicker
                      size="sm"
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Select appointment date..."
                      className="bg-white"
                    />
                  )}
                />
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
        <DialogContent className="w-[min(94vw,48rem)] sm:max-w-3xl max-h-[88vh] overflow-y-auto p-6 sm:p-7">
          {selectedSchedule ? (
            (() => {
              const selectedTechnician = technicianOptions.find(
                (item) => item.technicianId === selectedSchedule.technicianId,
              );
              const hasRealServiceOrder =
                Boolean(selectedSchedule.serviceOrderId) &&
                !selectedSchedule.serviceOrderId.startsWith("REQ-") &&
                selectedSchedule.serviceOrderId !== selectedSchedule.serviceRequestId;

              return (
                <div className="space-y-6">
                  {/* Header */}
                  <DialogHeader className="space-y-2.5 pb-4 border-b border-slate-100 pr-8">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center rounded-md bg-teal-50 px-2.5 py-0.5 text-xs font-bold text-teal-800 border border-teal-200/80">
                        {selectedSchedule.serviceOrderId || selectedSchedule.serviceRequestId || `Appt #${selectedSchedule.id}`}
                      </span>
                      <StatusBadge status={selectedSchedule.status} />
                    </div>
                    <div>
                      <DialogTitle className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                        {selectedSchedule.serviceName}
                      </DialogTitle>
                      <DialogDescription className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-600">
                        <span className="font-semibold text-slate-800">{selectedSchedule.customerName}</span>
                        <span className="text-slate-300">•</span>
                        <span>{selectedSchedule.address.city}, {selectedSchedule.address.state}</span>
                      </DialogDescription>
                    </div>
                  </DialogHeader>

                  {/* Highlight Cards: Schedule Time & Assigned Technician */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border border-teal-100 bg-gradient-to-br from-teal-50/60 to-white p-4.5 shadow-sm">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-teal-800">
                        <CalendarClock className="size-4 text-teal-700" />
                        <span>Appointment Time</span>
                      </div>
                      <div className="mt-3 space-y-1">
                        <p className="text-base sm:text-lg font-bold text-slate-900">
                          {selectedSchedule.currentSchedule.label}
                        </p>
                        <p className="text-xs text-slate-500 flex items-center gap-1.5">
                          <Clock3 className="size-3.5 text-teal-600" />
                          <span>Window: {selectedSchedule.timeWindowLabel}</span>
                        </p>
                      </div>
                      {selectedSchedule.requestedSchedule.label !== selectedSchedule.currentSchedule.label && (
                        <div className="mt-3 pt-2.5 border-t border-teal-100 text-xs text-slate-500">
                          <span className="font-medium text-slate-700">Requested:</span>{" "}
                          {selectedSchedule.requestedSchedule.label}
                        </div>
                      )}
                    </div>

                    <div className="rounded-2xl border border-teal-100 bg-gradient-to-br from-teal-50/60 to-white p-4.5 shadow-sm flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-teal-800">
                            <UserRound className="size-4 text-teal-700" />
                            <span>Assigned Technician</span>
                          </div>
                          {selectedTechnician?.rating ? (
                            <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-800 border border-amber-200">
                              <Star className="size-3 fill-amber-400 text-amber-500" />
                              {Number(selectedTechnician.rating).toFixed(1)}
                            </span>
                          ) : null}
                        </div>
                        <div className="mt-3">
                          {selectedTechnician ? (
                            <div>
                              <p className="text-base sm:text-lg font-bold text-slate-900">
                                {selectedTechnician.displayName}
                              </p>
                              <p className="text-xs text-slate-500 mt-0.5">
                                {selectedTechnician.phone || "Field Technician"}
                              </p>
                            </div>
                          ) : (
                            <div>
                              <p className="text-base font-semibold text-amber-800">
                                Unassigned
                              </p>
                              <p className="text-xs text-slate-500 mt-0.5">
                                No technician assigned to this appointment
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="pt-3 mt-2 border-t border-teal-100/80">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="w-full h-8 text-xs font-semibold text-teal-800 border-teal-200 hover:bg-teal-100/60"
                          onClick={() => {
                            setAssigningSchedule(selectedSchedule);
                            setDetailScheduleId(null);
                          }}
                        >
                          <UserCheck className="size-3.5 mr-1" />
                          {selectedTechnician ? "Change Technician" : "Assign Technician"}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Location & Admin Notes */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border border-teal-100/80 bg-white p-4 shadow-sm">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                        <MapPin className="size-4 text-teal-700" />
                        <span>Service Location</span>
                      </div>
                      <p className="mt-2 text-sm font-semibold text-slate-800 leading-snug">
                        {selectedSchedule.address.line1}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {selectedSchedule.address.city}, {selectedSchedule.address.state} {selectedSchedule.address.postalCode}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-teal-100/80 bg-white p-4 shadow-sm">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                        <ClipboardList className="size-4 text-teal-700" />
                        <span>Admin & Booking Notes</span>
                      </div>
                      <p className="mt-2 text-sm text-slate-700 leading-relaxed">
                        {selectedSchedule.adminNote || "No special booking notes recorded."}
                      </p>
                    </div>
                  </div>

                  {/* Reschedule History (if any) */}
                  {selectedSchedule.rescheduleHistory.length > 0 && (
                    <div className="rounded-2xl border border-teal-100/80 bg-white p-4 shadow-sm space-y-2">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Reschedule History
                      </p>
                      <div className="space-y-2 pt-1">
                        {selectedSchedule.rescheduleHistory.map((entry) => (
                          <div className="rounded-xl bg-slate-50 p-3 text-xs border border-slate-100" key={entry.id}>
                            <div className="flex items-center justify-between font-semibold text-slate-900">
                              <span>{entry.previousSchedule.label} → {entry.nextSchedule.label}</span>
                            </div>
                            {entry.reason && <p className="mt-1 text-slate-600">{entry.reason}</p>}
                            {entry.note && <p className="mt-0.5 text-slate-500 italic">{entry.note}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Quick Related Links */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="text-xs font-medium text-slate-400 mr-1">Quick Links:</span>
                    <Button asChild size="sm" variant="outline" className="h-8 text-xs font-medium border-slate-200 text-slate-700 hover:text-primary hover:border-teal-200">
                      <Link href={`/admin/service-requests/${selectedSchedule.serviceRequestId}`}>
                        <ExternalLink className="size-3 mr-1" />
                        Service Request
                      </Link>
                    </Button>
                    <Button asChild size="sm" variant="outline" className="h-8 text-xs font-medium border-slate-200 text-slate-700 hover:text-primary hover:border-teal-200">
                      <Link href={`/admin/customers/${selectedSchedule.customerId}`}>
                        <ExternalLink className="size-3 mr-1" />
                        Customer Profile
                      </Link>
                    </Button>
                    {hasRealServiceOrder && (
                      <Button asChild size="sm" variant="outline" className="h-8 text-xs font-medium border-slate-200 text-slate-700 hover:text-primary hover:border-teal-200">
                        <Link href={`/admin/orders/${selectedSchedule.serviceOrderId}`}>
                          <ExternalLink className="size-3 mr-1" />
                          Service Order
                        </Link>
                      </Button>
                    )}
                  </div>

                  {/* Footer Action Bar */}
                  <DialogFooter className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 border-t border-slate-100">
                    <div>
                      {selectedSchedule.status !== "cancelled" && (
                        <Button
                          onClick={() => {
                            cancellationForm.reset({ reason: "", note: "" });
                            setCancelId(selectedSchedule.id);
                            setDetailScheduleId(null);
                          }}
                          type="button"
                          variant="outline"
                          className="border-rose-200 text-rose-700 hover:bg-rose-50 hover:text-rose-800 hover:border-rose-300 w-full sm:w-auto"
                        >
                          <Ban size={15} className="mr-1.5" />
                          Cancel Appointment
                        </Button>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                      <Button
                        onClick={() => {
                          openEditSchedule(selectedSchedule.id);
                          setDetailScheduleId(null);
                        }}
                        type="button"
                        variant="outline"
                      >
                        <Pencil size={15} className="mr-1.5" />
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
                        className="bg-primary hover:bg-brand-hover text-white font-medium"
                      >
                        <CalendarClock size={15} className="mr-1.5" />
                        Reschedule
                      </Button>
                    </div>
                  </DialogFooter>
                </div>
              );
            })()
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

              <div className="space-y-1.5 rounded-xl border border-teal-100 bg-teal-50/40 p-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-teal-900">
                    Quick Shift Preset (5 Standard Shifts)
                  </span>
                  <span className="text-[11px] text-teal-700">Click to set start & end time</span>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {FIXED_DAILY_SHIFTS.map((shift) => (
                    <Button
                      key={shift.slot}
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs border-teal-200 text-teal-800 hover:bg-teal-100 bg-white"
                      onClick={() => {
                        rescheduleForm.setValue("startTime", shift.startTime, { shouldValidate: true });
                        rescheduleForm.setValue("endTime", shift.endTime, { shouldValidate: true });
                      }}
                    >
                      {shift.slot}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <Controller
                  control={rescheduleForm.control}
                  name="date"
                  render={({ field }) => (
                    <DatePicker
                      size="sm"
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Select new date..."
                      className="bg-white"
                    />
                  )}
                />
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
      <AssignTechnicianModal
        open={Boolean(assigningSchedule)}
        onOpenChange={(open) => {
          if (!open) setAssigningSchedule(null);
        }}
        title="Assign Field Technician"
        subtitle={
          assigningSchedule
            ? `Select an available technician for appointment #${assigningSchedule.serviceRequestId || assigningSchedule.serviceOrderId}`
            : undefined
        }
        currentTechnicianId={assigningSchedule?.technicianId}
        contextInfo={
          assigningSchedule
            ? {
                serviceName: assigningSchedule.serviceName,
                customerName: assigningSchedule.customerName,
                date: assigningSchedule.currentSchedule.date,
                timeWindow: assigningSchedule.timeWindowLabel,
                location: `${assigningSchedule.address.line1}, ${assigningSchedule.address.city}`,
              }
            : undefined
        }
        isAssigning={isAssigning}
        onAssign={handleAssignTechnician}
      />
    </AdminPageShell>
  );
}
