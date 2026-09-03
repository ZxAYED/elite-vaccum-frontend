import type {
  AdminTechnician,
  AdminScheduleRecord,
  AdminServiceOrder,
  Technician,
} from "@/types/domain";

import { getSharedAdminScheduleRecords, getSharedAdminServiceOrders } from "@/data/mock/admin-schedule-state";
import { getMockTodayIso } from "@/data/mock/mock-clock";

const seededTechnicians: AdminTechnician[] = [];

let adminTechniciansState = seededTechnicians.map((item) => ({ ...item }));

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function getAdminTechnicians(): AdminTechnician[] {
  return adminTechniciansState.map((technician) => ({
    ...technician,
  }));
}

export function getAdminTechnicianById(technicianId: string) {
  return getAdminTechnicians().find((technician) => technician.id === technicianId);
}

export function createAdminTechnician(
  technician: Omit<AdminTechnician, "id" | "createdAt" | "updatedAt">,
) {
  const now = new Date().toISOString();
  const created = {
    ...technician,
    id: `tech-${Math.random().toString().slice(2, 6)}`,
    createdAt: now,
    updatedAt: now,
  } satisfies AdminTechnician;
  adminTechniciansState = [...adminTechniciansState, created];
  return created;
}

export function updateAdminTechnician(
  technicianId: string,
  updates: Partial<AdminTechnician>,
) {
  adminTechniciansState = adminTechniciansState.map((technician) =>
    technician.id === technicianId
      ? {
          ...technician,
          ...updates,
          updatedAt: new Date().toISOString(),
        }
      : technician,
  );
  return getAdminTechnicianById(technicianId);
}

export function deleteAdminTechnician(technicianId: string) {
  adminTechniciansState = adminTechniciansState.filter(
    (technician) => technician.id !== technicianId,
  );
}

export function getTechnicianById(technicianId?: string): Technician | undefined {
  if (!technicianId) return undefined;
  const technician = getAdminTechnicianById(technicianId);
  if (!technician) return undefined;

  return {
    id: technician.id,
    userId: technician.userId,
    displayName: technician.displayName,
    email: technician.email,
    phone: technician.phone,
    status:
      technician.status === "INACTIVE"
        ? "offline"
        : technician.availability === "BUSY"
          ? "on-job"
          : "available",
    rating: technician.rating,
    completedJobs: technician.completedJobs,
    verified: technician.verified,
    specializations: technician.specializations,
  };
}

export const mockTechnicians: Technician[] = getAdminTechnicians().map((technician) => ({
  id: technician.id,
  userId: technician.userId,
  displayName: technician.displayName,
  email: technician.email,
  phone: technician.phone,
  status:
    technician.status === "INACTIVE"
      ? "offline"
      : technician.availability === "BUSY"
        ? "on-job"
        : "available",
  rating: technician.rating,
  completedJobs: technician.completedJobs,
  verified: technician.verified,
  specializations: clone(technician.specializations),
}));

function isActiveScheduleStatus(status: string) {
  return status !== "cancelled" && status !== "completed";
}

function getTechnicianSchedulesInternal(technicianId: string) {
  return getSharedAdminScheduleRecords()
    .filter((schedule) => schedule.technicianId === technicianId)
    .sort(
      (left, right) =>
        new Date(left.startAt).getTime() - new Date(right.startAt).getTime(),
    );
}

export function getTechnicianActiveAvailability(technician: AdminTechnician) {
  if (technician.status === "INACTIVE") return "OFF_DUTY" as const;
  if (technician.availability === "OFF_DUTY") return "OFF_DUTY" as const;
  const today = getMockTodayIso();
  const hasActiveScheduleToday = getTechnicianSchedulesInternal(technician.id).some(
    (schedule) =>
      schedule.currentSchedule.date === today && isActiveScheduleStatus(schedule.status),
  );
  return hasActiveScheduleToday ? ("BUSY" as const) : ("AVAILABLE" as const);
}

export function getTechnicianSchedules(technicianId: string): AdminScheduleRecord[] {
  return getTechnicianSchedulesInternal(technicianId);
}

export function getTechnicianTodaySchedules(technicianId: string) {
  const today = getMockTodayIso();
  return getTechnicianSchedulesInternal(technicianId).filter(
    (schedule) =>
      schedule.currentSchedule.date === today &&
      isActiveScheduleStatus(schedule.status),
  );
}

export function getTechnicianUpcomingSchedules(technicianId: string) {
  const today = getMockTodayIso();
  return getTechnicianSchedulesInternal(technicianId).filter(
    (schedule) =>
      schedule.currentSchedule.date >= today &&
      isActiveScheduleStatus(schedule.status),
  );
}

export function getTechnicianCompletedOrders(technicianId: string): AdminServiceOrder[] {
  return getSharedAdminServiceOrders()
    .filter(
      (order) => order.technicianId === technicianId && order.status === "completed",
    )
    .sort(
      (left, right) =>
        new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
    );
}

export function canDeleteTechnician(technicianId: string) {
  const hasSchedules = getTechnicianSchedulesInternal(technicianId).length > 0;
  const hasOrders = getSharedAdminServiceOrders().some(
    (order) => order.technicianId === technicianId,
  );
  return !hasSchedules && !hasOrders;
}

export function hasFutureAssignments(technicianId: string) {
  const today = getMockTodayIso();
  return getTechnicianUpcomingSchedules(technicianId).filter(
    (schedule) => schedule.currentSchedule.date > today,
  ).length;
}
