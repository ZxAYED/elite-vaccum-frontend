import { formatLongDate, formatShortDateTime } from "@/lib/formatters";
import type {
  AdminScheduleRecord,
  AdminServiceOrder,
  ServiceOrderStatus,
  TechnicianAvailability,
} from "@/types/domain";

export function formatAvailabilityLabel(value: TechnicianAvailability) {
  if (value === "AVAILABLE") return "Available";
  if (value === "BUSY") return "Busy";
  return "Off duty";
}

export function formatStatusLabelForTechnician(status: ServiceOrderStatus) {
  return status
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function buildTechnicianOrderTimeLabel(order: AdminServiceOrder) {
  return order.currentSchedule.label ?? `${order.currentSchedule.date} at ${order.currentSchedule.time}`;
}

export function buildTechnicianScheduleTimeLabel(schedule: AdminScheduleRecord) {
  return schedule.timeWindowLabel || `${schedule.currentSchedule.date} at ${schedule.currentSchedule.time}`;
}

export function buildTechnicianAddressLabel(order: AdminServiceOrder) {
  return `${order.serviceLocation.line1}, ${order.serviceLocation.city}, ${order.serviceLocation.state}`;
}

export function buildTechnicianCustomerContact(order: AdminServiceOrder, phone: string) {
  return `${phone} • ${formatLongDate(order.createdAt)}`;
}

export function buildTechnicianReportTimestamp(order: AdminServiceOrder) {
  return order.technicianReport.submittedAt
    ? formatShortDateTime(order.technicianReport.submittedAt)
    : "Not submitted";
}
