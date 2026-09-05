import type { AdminTechnician, AdminServiceOrder } from "@/types/domain";

import { getSharedAdminServiceOrders } from "@/data/mock/admin-schedule-state";
import {
  getTechnicianActiveAvailability,
  getTechnicianCompletedOrders,
  getTechnicianTodaySchedules,
  getTechnicianUpcomingSchedules,
} from "@/data/mock/technicians";

export type TechnicianAvailabilityFilter =
  | "all"
  | "available"
  | "busy"
  | "inactive"
  | "assigned-today"
  | "no-jobs-today";

export type TechnicianSortValue =
  | "name-asc"
  | "name-desc"
  | "most-jobs"
  | "fewest-jobs"
  | "recently-added";

export function getTechnicianAvailabilityMeta(technician: AdminTechnician) {
  const availability = getTechnicianActiveAvailability(technician);

  if (technician.status === "INACTIVE") {
    return {
      badgeStatus: "cancelled",
      label: "Inactive",
      helper: "Removed from new assignment rotation.",
    } as const;
  }

  if (availability === "BUSY") {
    return {
      badgeStatus: "in-progress",
      label: "Busy",
      helper: "Has active service workload.",
    } as const;
  }

  if (availability === "ON_BREAK") {
    return {
      badgeStatus: "rescheduled",
      label: "On Break",
      helper: "Temporarily paused on break.",
    } as const;
  }

  if (availability === "OFF_DUTY") {
    return {
      badgeStatus: "draft",
      label: "Off Duty",
      helper: "Manually unavailable for scheduling.",
    } as const;
  }

  return {
    badgeStatus: "accepted",
    label: "Available",
    helper: "Can receive new assignments.",
  } as const;
}

export function getTechnicianUpcomingServiceOrders(technicianId: string) {
  const orderIds = new Set(getTechnicianUpcomingSchedules(technicianId).map((item) => item.serviceOrderId));
  return getSharedAdminServiceOrders().filter((order) => orderIds.has(order.id));
}

export function getTechnicianTodaySummary(technicianId: string) {
  const todaySchedules = getTechnicianTodaySchedules(technicianId);
  const currentAssignment = todaySchedules[0];
  const nextAssignment = todaySchedules[1];

  return {
    jobsToday: todaySchedules.length,
    currentAssignment,
    nextAssignment,
  };
}

export function getTechnicianRecentCompletedOrders(technicianId: string): AdminServiceOrder[] {
  return getTechnicianCompletedOrders(technicianId).slice(0, 6);
}
