import {
  getAdminTechnicianById,
  updateAdminTechnician,
  getTechnicianCompletedOrders,
  getTechnicianSchedules,
  getTechnicianTodaySchedules,
  getTechnicianUpcomingSchedules,
} from "@/data/mock/technicians";
import {
  getSharedAdminServiceOrderById,
  getTechnicianAssignedOrders,
} from "@/data/mock/admin-schedule-state";
import { getSharedCustomerById } from "@/data/mock/shared-business-store";
import { getMockTodayIso, isToday } from "@/data/mock/mock-clock";
import type {
  AdminScheduleRecord,
  AdminServiceOrder,
  AdminTechnician,
  Notification,
  ServiceOrderStatus,
  TechnicianAvailability,
} from "@/types/domain";

export const mockCurrentTechnicianId = "tech-002";

export type TechnicianJobFilter = "today" | "upcoming" | "in-progress" | "completed";

export interface TechnicianRecentActivityItem {
  id: string;
  title: string;
  detail: string;
  createdAt: string;
  href?: string;
}

export interface TechnicianNotificationPreference {
  key:
    | "new-job-assignment"
    | "schedule-changes"
    | "appointment-reminders"
    | "admin-messages"
    | "service-report-updates";
  label: string;
  description: string;
  inApp: boolean;
  email: boolean;
}

let technicianNotificationsState: Notification[] = [
  {
    id: "tech-note-001",
    userId: "user-tech-002",
    type: "service-update",
    title: "New Job Assignment",
    message: "Annual Maintenance Visit was assigned for Friday at 11:00 AM.",
    createdAt: "2026-08-12T18:15:00.000Z",
    isRead: false,
    ctaLabel: "Open job",
  },
  {
    id: "tech-note-002",
    userId: "user-tech-002",
    type: "service-update",
    title: "Schedule Changed",
    message: "Accessory Fit Service moved to August 16 at 2:00 PM.",
    createdAt: "2026-08-11T12:40:00.000Z",
    isRead: false,
    ctaLabel: "Review schedule",
  },
  {
    id: "tech-note-003",
    userId: "user-tech-002",
    type: "account",
    title: "Admin Message",
    message: "Bring the standard HEPA filter kit for the Avery Stone visit.",
    createdAt: "2026-08-10T08:20:00.000Z",
    isRead: true,
    ctaLabel: "Open job",
  },
  {
    id: "tech-note-004",
    userId: "user-tech-002",
    type: "service-update",
    title: "Service Report Reviewed",
    message: "Filter Replacement report was reviewed and accepted by admin.",
    createdAt: "2026-08-09T09:05:00.000Z",
    isRead: true,
    ctaLabel: "Open job",
  },
];

let technicianNotificationPreferencesState: TechnicianNotificationPreference[] = [
  {
    key: "new-job-assignment",
    label: "New Job Assignment",
    description: "Receive alerts when a new service order is assigned.",
    inApp: true,
    email: true,
  },
  {
    key: "schedule-changes",
    label: "Schedule Changes",
    description: "Stay updated on admin reschedules and time-window adjustments.",
    inApp: true,
    email: true,
  },
  {
    key: "appointment-reminders",
    label: "Upcoming Appointment Reminder",
    description: "Get reminders before today’s first appointment begins.",
    inApp: true,
    email: false,
  },
  {
    key: "admin-messages",
    label: "Admin Messages",
    description: "Receive dispatch notes and technician instructions.",
    inApp: true,
    email: true,
  },
  {
    key: "service-report-updates",
    label: "Service Report Updates",
    description: "Get notified when admin reviews a submitted service report.",
    inApp: true,
    email: false,
  },
];

let technicianSettingsState = {
  timezone: "et",
};

const fallbackTechnician: AdminTechnician = {
  id: mockCurrentTechnicianId,
  userId: "user-tech-002",
  displayName: "Field Technician",
  email: "technician@elitevacuum.com",
  phone: "+1 (203) 555-0100",
  status: "ACTIVE",
  availability: "AVAILABLE",
  rating: 5,
  completedJobs: 0,
  verified: true,
  specializations: ["General Diagnostics", "Repairs"],
  createdAt: "2025-01-01T00:00:00.000Z",
  updatedAt: "2025-01-01T00:00:00.000Z",
};

export function getCurrentTechnicianProfile(): AdminTechnician {
  const technician = getAdminTechnicianById(mockCurrentTechnicianId);
  return technician ?? fallbackTechnician;
}

export function getTechnicianOrderById(serviceOrderId: string) {
  const order = getSharedAdminServiceOrderById(serviceOrderId);
  if (!order || order.technicianId !== mockCurrentTechnicianId) return undefined;
  return order;
}

export function getTechnicianTodayOrders() {
  return getTechnicianAssignedOrders(mockCurrentTechnicianId).filter((order) =>
    isToday(order.currentSchedule.date),
  );
}

export function getTechnicianUpcomingOrders() {
  const today = getMockTodayIso();
  return getTechnicianAssignedOrders(mockCurrentTechnicianId).filter(
    (order) => order.currentSchedule.date > today,
  );
}

export function getTechnicianJobsByFilter(filter: TechnicianJobFilter) {
  const today = getMockTodayIso();
  const orders = getTechnicianAssignedOrders(mockCurrentTechnicianId);

  if (filter === "today") {
    return orders.filter((order) => order.currentSchedule.date === today);
  }

  if (filter === "upcoming") {
    return orders.filter(
      (order) =>
        order.currentSchedule.date > today &&
        order.status !== "completed" &&
        order.status !== "cancelled",
    );
  }

  if (filter === "in-progress") {
    return orders.filter((order) =>
      ["on-the-way", "arrived", "in-progress", "report-submitted"].includes(
        order.status,
      ),
    );
  }

  return orders.filter((order) => order.status === "completed");
}

export function getTechnicianOverviewStats() {
  const technician = getCurrentTechnicianProfile();
  const todaySchedules = getTechnicianTodaySchedules(technician.id);
  const upcomingSchedules = getTechnicianUpcomingSchedules(technician.id);
  const completedToday = getTechnicianCompletedOrders(technician.id).filter((order) =>
    isToday(order.currentSchedule.date),
  );

  return {
    todayJobs: todaySchedules.length,
    nextAppointment:
      todaySchedules[0]?.currentSchedule.label ??
      upcomingSchedules[0]?.currentSchedule.label ??
      "No upcoming schedule",
    completedToday: completedToday.length,
    upcomingJobs: upcomingSchedules.filter(
      (schedule) => schedule.currentSchedule.date > getMockTodayIso(),
    ).length,
    activeJobs: upcomingSchedules.filter((schedule) =>
      ["on-the-way", "arrived", "in-progress"].includes(schedule.status),
    ).length,
    availability: technician.availability,
  };
}

export function getTechnicianJobCounts() {
  return {
    today: getTechnicianJobsByFilter("today").length,
    upcoming: getTechnicianJobsByFilter("upcoming").length,
    active: getTechnicianJobsByFilter("in-progress").length,
    completed: getTechnicianJobsByFilter("completed").length,
  };
}

export function getTechnicianScheduleGroups() {
  const technician = getCurrentTechnicianProfile();
  return {
    today: getTechnicianTodaySchedules(technician.id),
    upcoming: getTechnicianUpcomingSchedules(technician.id).filter(
      (schedule) => schedule.currentSchedule.date > getMockTodayIso(),
    ),
    all: getTechnicianSchedules(technician.id),
  };
}

export function getTechnicianCustomerLabel(order: AdminServiceOrder) {
  return getSharedCustomerById(order.customerId)?.displayName ?? "Assigned customer";
}

export function getTechnicianOrderPhone(order: AdminServiceOrder) {
  return getSharedCustomerById(order.customerId)?.phone ?? "Not available";
}

export function getTechnicianScheduleCardData(schedule: AdminScheduleRecord) {
  const order = getSharedAdminServiceOrderById(schedule.serviceOrderId);
  return {
    schedule,
    order,
    customerName:
      order ? getTechnicianCustomerLabel(order) : schedule.customerName,
  };
}

export function getAllowedTechnicianNextStatuses(status: ServiceOrderStatus) {
  const sequence: ServiceOrderStatus[] = [
    "scheduled",
    "rescheduled",
    "technician-assigned",
    "on-the-way",
    "arrived",
    "in-progress",
    "report-submitted",
  ];
  const currentIndex = sequence.indexOf(status);
  if (currentIndex === -1) return [];

  return sequence.slice(currentIndex + 1).filter((entry) => entry !== "completed");
}

export function getTechnicianImmediateNextStatus(
  status: ServiceOrderStatus,
): ServiceOrderStatus | null {
  return getAllowedTechnicianNextStatuses(status)[0] ?? null;
}

export function getTechnicianPrimaryAction(status: ServiceOrderStatus) {
  const next = getTechnicianImmediateNextStatus(status);
  if (!next) return null;

  const labelMap: Record<ServiceOrderStatus, string> = {
    scheduled: "Assign Technician",
    rescheduled: "Assign Technician",
    "technician-assigned": "Mark On the Way",
    "on-the-way": "Mark Arrived",
    arrived: "Start Service",
    "in-progress": "Move Forward",
    "report-submitted": "Report Submitted",
    completed: "Completed",
    cancelled: "Cancelled",
  };

  return {
    nextStatus: next,
    label:
      next === "on-the-way"
        ? "Mark On the Way"
        : next === "arrived"
          ? "Mark Arrived"
          : next === "in-progress"
            ? "Start Service"
            : next === "report-submitted"
              ? "Ready for Report Submission"
              : labelMap[next],
  };
}

export function getTechnicianRecentActivity(): TechnicianRecentActivityItem[] {
  const orders = getTechnicianAssignedOrders(mockCurrentTechnicianId);

  return orders
    .flatMap((order) => {
      const items: TechnicianRecentActivityItem[] = [];

      const latestTransition = order.technicianReport.statusHistory.at(-1);
      if (latestTransition) {
        items.push({
          id: `${order.id}-transition-${latestTransition.id}`,
          title: `Status updated to ${latestTransition.toStatus.replaceAll("-", " ")}`,
          detail: `${order.serviceName} • ${getTechnicianCustomerLabel(order)}`,
          createdAt: latestTransition.changedAt,
          href: `/technician/jobs/${order.id}`,
        });
      }

      if (order.technicianEta) {
        items.push({
          id: `${order.id}-eta`,
          title: `ETA updated to ${order.technicianEta.minutes} minutes`,
          detail: `${order.serviceName} • ${order.id}`,
          createdAt: order.technicianEta.updatedAt,
          href: `/technician/jobs/${order.id}`,
        });
      }

      if (order.technicianReport.submittedAt) {
        items.push({
          id: `${order.id}-report`,
          title: "Service report submitted",
          detail: `${order.serviceName} • ${getTechnicianCustomerLabel(order)}`,
          createdAt: order.technicianReport.submittedAt,
          href: `/technician/jobs/${order.id}`,
        });
      }

      if (order.status === "completed") {
        items.push({
          id: `${order.id}-completed`,
          title: "Job completed by admin",
          detail: `${order.serviceName} • ${order.id}`,
          createdAt: order.createdAt,
          href: `/technician/jobs/${order.id}`,
        });
      }

      return items;
    })
    .sort(
      (left, right) =>
        new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
    )
    .slice(0, 5);
}

export function getTechnicianNotifications() {
  return technicianNotificationsState.map((item) => ({ ...item }));
}

export function getTechnicianUnreadNotificationCount() {
  return technicianNotificationsState.filter((item) => !item.isRead).length;
}

export function markTechnicianNotificationRead(notificationId: string) {
  technicianNotificationsState = technicianNotificationsState.map((item) =>
    item.id === notificationId ? { ...item, isRead: true } : item,
  );
}

export function markAllTechnicianNotificationsRead() {
  technicianNotificationsState = technicianNotificationsState.map((item) => ({
    ...item,
    isRead: true,
  }));
}

export function getTechnicianNotificationHref(notificationId: string) {
  if (notificationId === "tech-note-002") return "/technician/schedule";
  return "/technician/jobs/SO-1006";
}

export function getTechnicianNotificationPreferences() {
  return technicianNotificationPreferencesState.map((item) => ({ ...item }));
}

export function updateTechnicianNotificationPreference(
  key: TechnicianNotificationPreference["key"],
  channel: "inApp" | "email",
  value: boolean,
) {
  technicianNotificationPreferencesState = technicianNotificationPreferencesState.map(
    (item) => (item.key === key ? { ...item, [channel]: value } : item),
  );
}

export function getTechnicianSettingsState() {
  return { ...technicianSettingsState };
}

export function updateTechnicianSettingsState(input: { timezone?: string }) {
  technicianSettingsState = {
    ...technicianSettingsState,
    ...input,
  };
}

export function updateCurrentTechnicianProfile(input: {
  displayName?: string;
  phone?: string;
  availability?: TechnicianAvailability;
}) {
  return updateAdminTechnician(mockCurrentTechnicianId, {
    ...(input.displayName ? { displayName: input.displayName } : {}),
    ...(input.phone ? { phone: input.phone } : {}),
    ...(input.availability ? { availability: input.availability } : {}),
  });
}

export function getTechnicianRecentCompletedJobs() {
  return getTechnicianCompletedOrders(mockCurrentTechnicianId).slice(0, 5);
}

export function getTechnicianJobsThisMonth() {
  return getTechnicianAssignedOrders(mockCurrentTechnicianId).filter((order) =>
    order.currentSchedule.date.startsWith("2026-08"),
  ).length;
}
