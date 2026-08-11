import { mockCustomers } from "@/data/mock/customers";
import {
  dashboardInvoices,
  dashboardPayments,
  dashboardProductOrders,
} from "@/data/mock/customer-dashboard";
import {
  getSharedAdminScheduleRecords,
  getSharedAdminServiceOrderById,
  getSharedAdminServiceOrders,
} from "@/data/mock/admin-schedule-state";
import { getAdminTechnicians } from "@/data/mock/technicians";
import type {
  AdminProductOrder,
  AdminUnifiedOrder,
  OrderTimelineStep,
  ProductOrderStatus,
  UnifiedOrderStatus,
} from "@/types/domain";

export type AdminOrdersTypeFilter = "ALL" | "PRODUCT" | "SERVICE";
export type AdminOrdersStatusFilter = "all" | "active" | "completed" | "cancelled";

export interface TechnicianAvailabilityOption {
  technicianId: string;
  displayName: string;
  availabilityLabel: string;
  jobsToday: number;
  status: "available" | "busy" | "offline";
  active: boolean;
}

function productOrderStatus(index: number): ProductOrderStatus {
  if (index === 0) return "processing";
  if (index === 1) return "delivered";
  return "shipped";
}

function shippingTimeline(status: ProductOrderStatus): OrderTimelineStep[] {
  const order: ProductOrderStatus[] = [
    "pending",
    "paid",
    "processing",
    "shipped",
    "delivered",
  ];
  const activeIndex = order.indexOf(status);

  return [
    {
      key: "pending",
      label: "Pending",
      detail: "Order placed",
      complete: activeIndex >= 0,
      active: status === "pending",
    },
    {
      key: "paid",
      label: "Paid",
      detail: "Payment captured",
      complete: activeIndex >= 1,
      active: status === "paid",
    },
    {
      key: "processing",
      label: "Processing",
      detail: "Warehouse handling",
      complete: activeIndex >= 2,
      active: status === "processing",
    },
    {
      key: "shipped",
      label: "Shipped",
      detail: "UPS in transit",
      complete: activeIndex >= 3,
      active: status === "shipped",
    },
    {
      key: "delivered",
      label: "Delivered",
      detail: "Customer received package",
      complete: activeIndex >= 4,
      active: status === "delivered",
    },
  ];
}

export const adminProductOrders: AdminProductOrder[] = dashboardProductOrders.map(
  (order, index) => {
    const status = productOrderStatus(index);
    return {
      id: order.id,
      type: "PRODUCT",
      customerId: mockCustomers[index % mockCustomers.length]?.id ?? "cust-1001",
      status,
      total: order.total,
      createdAt: order.placedAt,
      invoiceId: order.invoiceId,
      paymentId: order.paymentId,
      paymentStatus: order.paymentStatus,
      items: order.items,
      shippingAddress: order.delivery.address,
      tracking: {
        carrier: order.delivery.carrier,
        trackingNumber: order.delivery.trackingNumber,
        shippingStatus: status,
        estimatedDelivery: order.delivery.estimatedDelivery,
      },
      shippingTimeline: shippingTimeline(status),
    };
  },
);

export function getAdminServiceOrders() {
  return getSharedAdminServiceOrders();
}

export function getAdminOrders(): AdminUnifiedOrder[] {
  return [...adminProductOrders, ...getSharedAdminServiceOrders()].sort(
    (left, right) =>
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  );
}

export function getAdminOrderCounts() {
  const adminOrders = getAdminOrders();
  return {
    all: adminOrders.length,
    product: adminOrders.filter((order) => order.type === "PRODUCT").length,
    service: adminOrders.filter((order) => order.type === "SERVICE").length,
    active: adminOrders.filter((order) => isActiveOrderStatus(order.status)).length,
    completed: adminOrders.filter((order) => isCompletedOrderStatus(order.status))
      .length,
  };
}

export function isCompletedOrderStatus(status: UnifiedOrderStatus) {
  return status === "completed" || status === "delivered" || status === "refunded";
}

export function isCancelledOrderStatus(status: UnifiedOrderStatus) {
  return status === "cancelled";
}

export function isActiveOrderStatus(status: UnifiedOrderStatus) {
  return !isCompletedOrderStatus(status) && !isCancelledOrderStatus(status);
}

export function getAdminOrderById(orderId: string) {
  return adminProductOrders.find((order) => order.id === orderId)
    ?? getSharedAdminServiceOrderById(orderId);
}

export function getAdminOrderCustomer(order: AdminUnifiedOrder) {
  return mockCustomers.find((customer) => customer.id === order.customerId);
}

export function getAdminOrderPayment(order: AdminUnifiedOrder) {
  return dashboardPayments.find((payment) => payment.id === order.paymentId);
}

export function getAdminOrderInvoice(order: AdminUnifiedOrder) {
  return dashboardInvoices.find((invoice) => invoice.id === order.invoiceId);
}

export function getTechnicianAvailabilityOptions() {
  const today = "2026-08-10";
  const schedules = getSharedAdminScheduleRecords();

  return getAdminTechnicians().map((technician) => {
    const jobsToday = schedules.filter(
      (schedule) =>
        schedule.technicianId === technician.id &&
        schedule.currentSchedule.date === today &&
        schedule.status !== "cancelled" &&
        schedule.status !== "completed",
    ).length;

    const status =
      technician.status === "INACTIVE"
        ? "offline"
        : jobsToday > 0 || technician.availability === "BUSY"
          ? "busy"
          : technician.availability === "OFF_DUTY"
            ? "offline"
            : "available";

    return {
      technicianId: technician.id,
      displayName: technician.displayName,
      availabilityLabel:
        status === "offline"
          ? "Off duty today"
          : status === "busy"
            ? `Busy with ${jobsToday || 1} active job${jobsToday === 1 ? "" : "s"}`
            : "Available now",
      jobsToday,
      status,
      active: technician.status === "ACTIVE",
    } satisfies TechnicianAvailabilityOption;
  });
}
