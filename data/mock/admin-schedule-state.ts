import { mockCustomers } from "@/data/mock/customers";
import { mockAdminQuotations } from "@/data/mock/quotations";
import { mockServiceRequests } from "@/data/mock/service-requests";
import { mockServices } from "@/data/mock/services";
import type {
  AdminScheduleRecord,
  AdminServiceOrder,
  FlexibleQuotationLineItem,
  OrderTimelineStep,
  ScheduleCancellationEntry,
  ScheduleRescheduleEntry,
  ServiceOrderStatus,
  ServiceRequest,
  ServiceScheduleWindow,
} from "@/types/domain";

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function findCustomer(customerId: string) {
  return mockCustomers.find((customer) => customer.id === customerId);
}

function scheduleWindowToLabel(window: ServiceScheduleWindow) {
  return window.label ?? `${window.date} at ${window.time}`;
}

function toScheduleWindow(date: string, time: string): ServiceScheduleWindow {
  const parsedDate = new Date(`${date}T12:00:00`);
  const label = Number.isNaN(parsedDate.getTime())
    ? `${date} at ${time}`
    : `${parsedDate.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })} at ${time}`;

  return {
    date,
    time,
    label,
  };
}

function timeTo24Hour(time: string) {
  const normalized = time.trim().toUpperCase();
  const [, hoursText = "0", minutesText = "00", suffix = "AM"] =
    normalized.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/) ?? [];
  let hours = Number(hoursText);
  const minutes = Number(minutesText);

  if (suffix === "PM" && hours < 12) hours += 12;
  if (suffix === "AM" && hours === 12) hours = 0;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function combineDateTime(date: string, time: string) {
  return `${date}T${timeTo24Hour(time)}:00`;
}

function addHours(date: string, time: string, hoursToAdd: number) {
  const source = new Date(combineDateTime(date, time));
  source.setHours(source.getHours() + hoursToAdd);
  return source.toISOString();
}

function formatTimeWindowLabel(startAt: string, endAt: string) {
  const start = new Date(startAt);
  const end = new Date(endAt);
  const formatter = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  return `${formatter.format(start)} - ${formatter.format(end)}`;
}

function buildServiceTimeline(
  status: ServiceOrderStatus,
  currentSchedule: ServiceScheduleWindow,
  technicianId?: string,
): OrderTimelineStep[] {
  const order: ServiceOrderStatus[] = [
    "scheduled",
    "technician-assigned",
    "on-the-way",
    "arrived",
    "in-progress",
    "report-submitted",
    "completed",
  ];
  const activeIndex = order.indexOf(status);

  return [
    {
      key: "scheduled",
      label: status === "rescheduled" ? "Rescheduled" : "Scheduled",
      detail: scheduleWindowToLabel(currentSchedule),
      complete: activeIndex >= 0 || status === "rescheduled",
      active: status === "scheduled" || status === "rescheduled",
      dateLabel: scheduleWindowToLabel(currentSchedule),
    },
    {
      key: "technician-assigned",
      label: "Technician Assigned",
      detail: technicianId
        ? "Technician assigned to the order."
        : "Awaiting technician assignment.",
      complete: activeIndex >= 1,
      active: status === "technician-assigned",
    },
    {
      key: "on-the-way",
      label: "On the Way",
      detail: "Technician is traveling to the property.",
      complete: activeIndex >= 2,
      active: status === "on-the-way",
    },
    {
      key: "arrived",
      label: "Arrived",
      detail: "Technician has checked in on site.",
      complete: activeIndex >= 3,
      active: status === "arrived",
    },
    {
      key: "in-progress",
      label: "In Progress",
      detail: "Repair or service work is underway.",
      complete: activeIndex >= 4,
      active: status === "in-progress",
    },
    {
      key: "report-submitted",
      label: "Report Submitted",
      detail: "Technician uploaded completion notes.",
      complete: activeIndex >= 5,
      active: status === "report-submitted",
    },
    {
      key: "completed",
      label: "Completed",
      detail: "Order is closed and ready for billing history.",
      complete: activeIndex >= 6,
      active: status === "completed",
    },
  ];
}

function createAcceptedQuoteSnapshot(lineItems: FlexibleQuotationLineItem[], acceptedAt?: string) {
  return {
    quotationTotalUsd: lineItems.reduce(
      (sum, item) => sum + item.quantity * item.unitPriceUsd,
      0,
    ),
    lineItems,
    acceptedAt,
  };
}

function createServiceOrderFromRequest(request: ServiceRequest): AdminServiceOrder {
  const service = mockServices.find((item) => item.id === request.serviceId);
  const quote = mockAdminQuotations.find((item) => item.serviceRequestId === request.id);
  const requestedSchedule =
    request.requestedSchedule ??
    toScheduleWindow(request.preferredDate, request.preferredTime);
  const currentSchedule =
    request.currentSchedule ?? request.requestedSchedule ?? requestedSchedule;

  const lineItems =
    quote?.lineItems ?? [
      {
        id: `${request.id}-line-1`,
        description: service?.name ?? request.title,
        quantity: 1,
        unitPriceUsd: request.estimatedAmountUsd ?? service?.basePriceUsd ?? 149,
      },
    ];
  const subtotalUsd = quote?.subtotalUsd ?? lineItems.reduce(
    (sum, item) => sum + item.quantity * item.unitPriceUsd,
    0,
  );
  const taxUsd = quote?.taxUsd ?? Math.round(subtotalUsd * 0.08 * 100) / 100;
  const discountUsd = quote?.discountUsd ?? 0;
  const totalUsd = quote?.totalUsd ?? subtotalUsd + taxUsd - discountUsd;

  const status: ServiceOrderStatus =
    request.status === "completed"
      ? "completed"
      : request.status === "scheduled"
        ? "technician-assigned"
        : request.currentSchedule &&
            request.requestedSchedule &&
            request.currentSchedule.label !== request.requestedSchedule.label
          ? "rescheduled"
          : "scheduled";

  const orderId = quote?.serviceOrderId ?? `SO-${request.id.replace("REQ-", "")}`;

  return {
    id: orderId,
    type: "SERVICE",
    customerId: request.customerId,
    status,
    total: {
      subtotalUsd,
      taxUsd,
      discountUsd,
      totalUsd,
    },
    createdAt: quote?.acceptedAt ?? request.submittedAt,
    invoiceId: `INV-${orderId.replace("SO-", "")}`,
    paymentId: `PAY-${orderId.replace("SO-", "")}`,
    paymentStatus: request.status === "completed" ? "paid" : "pending",
    serviceRequestId: request.id,
    quotationId: quote?.id ?? `QUO-${request.id.replace("REQ-", "")}`,
    serviceId: request.serviceId,
    serviceName: service?.name ?? request.title,
    problemSummary: request.description,
    requestedSchedule,
    currentSchedule,
    technicianId: request.assignedTechnicianId,
    serviceLocation: request.serviceAddress,
    problemLocation: request.problemLocation,
    equipment: request.equipment,
    attachments: request.attachments,
    customerNotes: request.additionalNotes,
    technicianInstruction:
      "Please confirm access to the main unit and all affected inlet locations before arrival.",
    scheduleAdminNote:
      request.status === "accepted"
        ? "Pending admin appointment confirmation."
        : undefined,
    rescheduleHistory:
      request.requestedSchedule &&
      request.currentSchedule &&
      request.requestedSchedule.label !== request.currentSchedule.label
        ? [
            {
              id: `${request.id}-reschedule-1`,
              previousSchedule: request.requestedSchedule,
              nextSchedule: request.currentSchedule,
              reason: "Initial admin scheduling adjustment",
              changedAt: request.submittedAt,
              actorLabel: "Admin",
            },
          ]
        : [],
    acceptedQuoteSnapshot: createAcceptedQuoteSnapshot(lineItems, quote?.acceptedAt),
    timeline: buildServiceTimeline(status, currentSchedule, request.assignedTechnicianId),
  };
}

const seededServiceOrders: AdminServiceOrder[] = [
  createServiceOrderFromRequest(
    mockServiceRequests.find((request) => request.id === "REQ-1006") ?? mockServiceRequests[0],
  ),
  createServiceOrderFromRequest(
    mockServiceRequests.find((request) => request.id === "REQ-1007") ?? mockServiceRequests[1],
  ),
  createServiceOrderFromRequest(
    mockServiceRequests.find((request) => request.id === "REQ-1009") ?? mockServiceRequests[2],
  ),
];

function createScheduleFromOrder(
  order: AdminServiceOrder,
  overrides?: Partial<AdminScheduleRecord>,
): AdminScheduleRecord {
  const customer = findCustomer(order.customerId);
  const startAt = combineDateTime(order.currentSchedule.date, order.currentSchedule.time);
  const endAt = addHours(order.currentSchedule.date, order.currentSchedule.time, 2);

  return {
    id: `SCH-${order.id.replace("SO-", "")}`,
    serviceOrderId: order.id,
    serviceRequestId: order.serviceRequestId,
    customerId: order.customerId,
    serviceId: order.serviceId,
    serviceName: order.serviceName,
    customerName: customer?.displayName ?? "Unknown customer",
    address: order.serviceLocation,
    requestedSchedule: clone(order.requestedSchedule),
    currentSchedule: clone(order.currentSchedule),
    startAt,
    endAt,
    timeWindowLabel: formatTimeWindowLabel(startAt, endAt),
    technicianId: order.technicianId,
    status: order.status,
    adminNote: order.scheduleAdminNote,
    createdAt: order.createdAt,
    updatedAt: order.createdAt,
    deletionEligible: order.status === "scheduled" && !order.technicianId,
    rescheduleHistory: clone(order.rescheduleHistory ?? []),
    cancellation: order.scheduleCancellation,
    ...overrides,
  };
}

const seededSchedules: AdminScheduleRecord[] = [
  createScheduleFromOrder(seededServiceOrders[0]),
  createScheduleFromOrder(seededServiceOrders[1], {
    status: "completed",
    updatedAt: "2026-07-12T12:30:00.000Z",
    deletionEligible: false,
  }),
];

let serviceOrdersState = clone(seededServiceOrders);
let schedulesState = clone(seededSchedules);

function syncOrderFromSchedule(schedule: AdminScheduleRecord) {
  serviceOrdersState = serviceOrdersState.map((order) =>
    order.id === schedule.serviceOrderId
      ? {
          ...order,
          scheduleId: schedule.id,
          currentSchedule: clone(schedule.currentSchedule),
          technicianId: schedule.technicianId,
          status: schedule.status,
          scheduleAdminNote: schedule.adminNote,
          rescheduleHistory: clone(schedule.rescheduleHistory),
          scheduleCancellation: schedule.cancellation,
          timeline: buildServiceTimeline(
            schedule.status,
            schedule.currentSchedule,
            schedule.technicianId,
          ),
        }
      : order,
  );
}

function syncSchedulesFromOrder(order: AdminServiceOrder) {
  schedulesState = schedulesState.map((schedule) =>
    schedule.serviceOrderId === order.id
      ? {
          ...schedule,
          requestedSchedule: clone(order.requestedSchedule),
          currentSchedule: clone(order.currentSchedule),
          technicianId: order.technicianId,
          status: order.status,
          adminNote: order.scheduleAdminNote,
          rescheduleHistory: clone(order.rescheduleHistory ?? []),
          cancellation: order.scheduleCancellation,
          updatedAt: new Date().toISOString(),
        }
      : schedule,
  );
}

function toWindow(date: string, time: string) {
  return toScheduleWindow(date, time);
}

export function getSharedAdminServiceOrders() {
  return serviceOrdersState;
}

export function getSharedAdminServiceOrderById(orderId: string) {
  return serviceOrdersState.find((order) => order.id === orderId);
}

export function getSharedAdminScheduleRecords() {
  return schedulesState;
}

export function getSharedAdminScheduleById(scheduleId: string) {
  return schedulesState.find((schedule) => schedule.id === scheduleId);
}

export function getSharedAdminScheduleByOrderId(orderId: string) {
  return schedulesState.find((schedule) => schedule.serviceOrderId === orderId);
}

export function replaceSharedAdminSchedule(schedule: AdminScheduleRecord) {
  const index = schedulesState.findIndex((item) => item.id === schedule.id);
  if (index >= 0) {
    schedulesState = schedulesState.map((item) =>
      item.id === schedule.id ? schedule : item,
    );
  } else {
    schedulesState = [...schedulesState, schedule];
  }
  syncOrderFromSchedule(schedule);
}

export function createSharedAdminSchedule(input: {
  serviceOrderId: string;
  date: string;
  startTime: string;
  endTime: string;
  technicianId?: string;
  adminNote?: string;
  status: ServiceOrderStatus;
}) {
  const order = getSharedAdminServiceOrderById(input.serviceOrderId);
  if (!order) return null;

  const currentSchedule = toWindow(input.date, input.startTime);
  const startAt = combineDateTime(input.date, input.startTime);
  const endAt = combineDateTime(input.date, input.endTime);
  const now = new Date().toISOString();

  const schedule: AdminScheduleRecord = {
    id: `SCH-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
    serviceOrderId: order.id,
    serviceRequestId: order.serviceRequestId,
    customerId: order.customerId,
    serviceId: order.serviceId,
    serviceName: order.serviceName,
    customerName: findCustomer(order.customerId)?.displayName ?? "Unknown customer",
    address: order.serviceLocation,
    requestedSchedule: clone(order.requestedSchedule),
    currentSchedule,
    startAt,
    endAt,
    timeWindowLabel: formatTimeWindowLabel(startAt, endAt),
    technicianId: input.technicianId,
    status: input.status,
    adminNote: input.adminNote,
    createdAt: now,
    updatedAt: now,
    deletionEligible: !input.technicianId && input.status === "scheduled",
    rescheduleHistory: clone(order.rescheduleHistory ?? []),
  };

  replaceSharedAdminSchedule(schedule);
  return schedule;
}

export function updateSharedAdminSchedule(
  scheduleId: string,
  updates: Partial<AdminScheduleRecord>,
) {
  const existing = getSharedAdminScheduleById(scheduleId);
  if (!existing) return null;
  const next = {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString(),
  } satisfies AdminScheduleRecord;

  replaceSharedAdminSchedule(next);
  return next;
}

export function rescheduleSharedAdminSchedule(input: {
  scheduleId: string;
  date: string;
  startTime: string;
  endTime: string;
  reason: string;
  note?: string;
  actorLabel?: string;
}) {
  const existing = getSharedAdminScheduleById(input.scheduleId);
  if (!existing) return null;

  const nextSchedule = toWindow(input.date, input.startTime);
  const historyEntry: ScheduleRescheduleEntry = {
    id: `${existing.id}-reschedule-${existing.rescheduleHistory.length + 1}`,
    previousSchedule: clone(existing.currentSchedule),
    nextSchedule,
    reason: input.reason,
    note: input.note,
    changedAt: new Date().toISOString(),
    actorLabel: input.actorLabel ?? "Admin",
  };

  return updateSharedAdminSchedule(input.scheduleId, {
    currentSchedule: nextSchedule,
    startAt: combineDateTime(input.date, input.startTime),
    endAt: combineDateTime(input.date, input.endTime),
    timeWindowLabel: formatTimeWindowLabel(
      combineDateTime(input.date, input.startTime),
      combineDateTime(input.date, input.endTime),
    ),
    status: "rescheduled",
    rescheduleHistory: [...existing.rescheduleHistory, historyEntry],
    deletionEligible: false,
  });
}

export function cancelSharedAdminSchedule(input: {
  scheduleId: string;
  reason: string;
  note?: string;
  actorLabel?: string;
}) {
  const existing = getSharedAdminScheduleById(input.scheduleId);
  if (!existing) return null;

  const cancellation: ScheduleCancellationEntry = {
    id: `${existing.id}-cancelled`,
    reason: input.reason,
    note: input.note,
    cancelledAt: new Date().toISOString(),
    actorLabel: input.actorLabel ?? "Admin",
  };

  return updateSharedAdminSchedule(input.scheduleId, {
    status: "cancelled",
    cancellation,
    deletionEligible: false,
  });
}

export function deleteSharedAdminSchedule(scheduleId: string) {
  const schedule = getSharedAdminScheduleById(scheduleId);
  if (!schedule || !schedule.deletionEligible) return false;

  schedulesState = schedulesState.filter((item) => item.id !== scheduleId);
  serviceOrdersState = serviceOrdersState.map((order) =>
    order.id === schedule.serviceOrderId
      ? {
          ...order,
          scheduleId: undefined,
          technicianId: undefined,
          scheduleAdminNote: undefined,
          currentSchedule: clone(order.requestedSchedule),
          status: "scheduled",
          timeline: buildServiceTimeline("scheduled", order.requestedSchedule),
        }
      : order,
  );
  return true;
}

export function assignTechnicianToSharedSchedule(
  scheduleId: string,
  technicianId?: string,
) {
  const schedule = getSharedAdminScheduleById(scheduleId);
  if (!schedule) return null;

  return updateSharedAdminSchedule(scheduleId, {
    technicianId,
    status: technicianId
      ? schedule.status === "scheduled"
        ? "technician-assigned"
        : schedule.status
      : "scheduled",
    deletionEligible: !technicianId && schedule.status === "scheduled",
  });
}

export function updateSharedServiceOrder(
  orderId: string,
  updates: Partial<AdminServiceOrder>,
) {
  serviceOrdersState = serviceOrdersState.map((order) =>
    order.id === orderId
      ? {
          ...order,
          ...updates,
          timeline: buildServiceTimeline(
            (updates.status ?? order.status) as ServiceOrderStatus,
            (updates.currentSchedule ?? order.currentSchedule) as ServiceScheduleWindow,
            updates.technicianId ?? order.technicianId,
          ),
        }
      : order,
  );

  const next = getSharedAdminServiceOrderById(orderId);
  if (next) syncSchedulesFromOrder(next);
  return next;
}
