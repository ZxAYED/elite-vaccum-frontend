import type {
  AdminTechnician,
  AdminScheduleRecord,
  AdminServiceOrder,
  Technician,
} from "@/types/domain";

import { getSharedAdminScheduleRecords, getSharedAdminServiceOrders } from "@/data/mock/admin-schedule-state";

const seededTechnicians: AdminTechnician[] = [
  {
    id: "tech-001",
    userId: "user-tech-001",
    displayName: "Elliot Grant",
    email: "elliot.grant@example.com",
    phone: "+1 (203) 555-0174",
    status: "ACTIVE",
    availability: "BUSY",
    rating: 4.9,
    completedJobs: 127,
    verified: true,
    specializations: [
      "Motor Repair",
      "Central Vacuum Installation",
      "Inlet Diagnostics",
    ],
    notes: "Senior field technician for diagnostics and high-complexity repairs.",
    createdAt: "2026-01-18T10:00:00.000Z",
    updatedAt: "2026-08-08T09:00:00.000Z",
  },
  {
    id: "tech-002",
    userId: "user-tech-002",
    displayName: "Naomi Carter",
    email: "naomi.carter@example.com",
    phone: "+1 (914) 555-0141",
    status: "ACTIVE",
    availability: "AVAILABLE",
    rating: 4.8,
    completedJobs: 104,
    verified: true,
    specializations: ["Maintenance Visits", "Accessory Fit Service"],
    notes: "Handles routine maintenance and customer education visits.",
    createdAt: "2026-02-02T11:30:00.000Z",
    updatedAt: "2026-08-06T12:15:00.000Z",
  },
  {
    id: "tech-003",
    userId: "user-tech-003",
    displayName: "Owen Blake",
    email: "owen.blake@example.com",
    phone: "+1 (646) 555-0106",
    status: "ACTIVE",
    availability: "AVAILABLE",
    rating: 4.7,
    completedJobs: 91,
    verified: true,
    specializations: ["Central Vacuum Installation", "Inlet Diagnostics"],
    notes: "Focused on installations, retrofits, and layout adjustments.",
    createdAt: "2026-02-19T08:45:00.000Z",
    updatedAt: "2026-08-07T10:40:00.000Z",
  },
  {
    id: "tech-004",
    userId: "user-tech-004",
    displayName: "Riley Foster",
    email: "riley.foster@example.com",
    phone: "+1 (475) 555-0129",
    status: "INACTIVE",
    availability: "OFF_DUTY",
    rating: 4.9,
    completedJobs: 138,
    verified: true,
    specializations: ["Motor Repair", "Accessory Fit Service"],
    notes: "Inactive for new assignments pending route planning update.",
    createdAt: "2026-01-07T09:10:00.000Z",
    updatedAt: "2026-08-01T14:10:00.000Z",
  },
  {
    id: "tech-005",
    userId: "user-tech-005",
    displayName: "Taylor Bennett",
    email: "taylor.bennett@example.com",
    phone: "+1 (212) 555-0133",
    status: "ACTIVE",
    availability: "OFF_DUTY",
    rating: 4.8,
    completedJobs: 112,
    verified: true,
    specializations: ["Maintenance Visits", "Central Vacuum Installation"],
    notes: "Off duty today but kept active for future assignment planning.",
    createdAt: "2026-03-03T13:20:00.000Z",
    updatedAt: "2026-08-09T17:00:00.000Z",
  },
];

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
  const today = "2026-08-10";
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
  return getTechnicianSchedulesInternal(technicianId).filter(
    (schedule) =>
      schedule.currentSchedule.date === "2026-08-10" &&
      isActiveScheduleStatus(schedule.status),
  );
}

export function getTechnicianUpcomingSchedules(technicianId: string) {
  return getTechnicianSchedulesInternal(technicianId).filter(
    (schedule) =>
      schedule.currentSchedule.date >= "2026-08-10" &&
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
  return getTechnicianUpcomingSchedules(technicianId).filter(
    (schedule) => schedule.currentSchedule.date > "2026-08-10",
  ).length;
}
