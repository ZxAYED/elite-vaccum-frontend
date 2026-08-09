import type { Address, PaymentStatus, ServiceRequest } from "@/types/domain";

import {
  getProductById,
  getServiceById,
  getServiceDetailByRequestId,
  getServiceRequestById,
  getTechnicianById,
  mockCustomerProductOrders,
  mockCustomerServiceRequests,
} from "@/data/mock/customer-portal";
import { mockCurrentCustomer } from "@/data/mock/user";

export type CustomerRecordType = "PRODUCT" | "SERVICE";

export type UnifiedOrderStatus =
  | "pending"
  | "paid"
  | "processing"
  | "shipped"
  | "delivered"
  | "scheduled"
  | "rescheduled"
  | "technician-assigned"
  | "on-the-way"
  | "arrived"
  | "in-progress"
  | "completed"
  | "cancelled"
  | "refunded";

export interface OrderTotal {
  subtotalUsd: number;
  shippingUsd?: number;
  taxUsd: number;
  discountUsd?: number;
  totalUsd: number;
}

export interface DashboardProductOrderItem {
  id: string;
  productId: string;
  name: string;
  summary: string;
  sku: string;
  quantity: number;
  unitPriceUsd: number;
  imageSrc: string;
}

export interface DashboardProductOrder {
  id: string;
  type: "PRODUCT";
  status: UnifiedOrderStatus;
  placedAt: string;
  total: OrderTotal;
  paymentStatus: PaymentStatus;
  items: DashboardProductOrderItem[];
  delivery: {
    address: Address;
    trackingNumber: string;
    carrier: string;
    estimatedDelivery: string;
    timeline: Array<{
      key: string;
      label: string;
      detail: string;
      complete: boolean;
      active?: boolean;
    }>;
  };
  invoiceId: string;
  paymentId: string;
}

export interface DashboardServiceOrder {
  id: string;
  type: "SERVICE";
  status: UnifiedOrderStatus;
  createdAt: string;
  total: OrderTotal;
  serviceRequestId: string;
  quotationId: string;
  invoiceId: string;
  paymentId: string;
  serviceName: string;
  problemSummary: string;
  location: Address;
  problemLocation?: string;
  requestedSchedule: string;
  currentSchedule: string;
  technician?: {
    name: string;
    phone: string;
    role: string;
    avatarSrc: string;
  };
  customerNotes: string;
  technicianInstruction: string;
  timeline: Array<{
    key: string;
    label: string;
    detail: string;
    dateLabel: string;
    complete: boolean;
    active?: boolean;
  }>;
}

export type DashboardOrder = DashboardProductOrder | DashboardServiceOrder;

export type InvoiceStatus = "pending" | "paid" | "refunded";

export interface DashboardInvoice {
  id: string;
  type: CustomerRecordType;
  status: InvoiceStatus;
  invoiceDate: string;
  relatedOrderId: string;
  title: string;
  customerName: string;
  billingAddress: Address;
  paymentMethodLabel: string;
  lineItems: Array<{
    id: string;
    label: string;
    description?: string;
    quantity?: number;
    unitPriceUsd?: number;
    amountUsd: number;
  }>;
  totals: OrderTotal;
  paymentId: string;
}

export interface DashboardPayment {
  id: string;
  type: CustomerRecordType;
  status: PaymentStatus | "authorized";
  processedAt: string;
  amountUsd: number;
  relatedOrderId: string;
  invoiceId: string;
  title: string;
  methodLabel: string;
}

function scheduleLabel(request: ServiceRequest, key: "requestedSchedule" | "currentSchedule") {
  return (
    request[key]?.label ??
    `${request.preferredDate.slice(0, 10)} at ${request.preferredTime}`
  );
}

function productOrderStatus(index: number): UnifiedOrderStatus {
  return index === 0 ? "delivered" : "processing";
}

export const dashboardProductOrders: DashboardProductOrder[] =
  mockCustomerProductOrders.map((order, index) => {
    const subtotalUsd = order.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPriceUsd,
      0,
    );
    const shippingUsd = index === 0 ? 0 : 18;
    const taxUsd = Math.round(subtotalUsd * 0.08 * 100) / 100;
    const id = index === 0 ? "ORD-88410" : "ORD-90422";

    return {
      id,
      type: "PRODUCT",
      status: productOrderStatus(index),
      placedAt: order.placedAt,
      paymentStatus: order.paymentStatus,
      invoiceId: index === 0 ? "INV-1048" : "INV-1049",
      paymentId: index === 0 ? "PAY-1044" : "PAY-1045",
      total: {
        subtotalUsd,
        shippingUsd,
        taxUsd,
        totalUsd: subtotalUsd + shippingUsd + taxUsd,
      },
      items: order.items.map((item) => {
        const product = getProductById(item.productId);
        return {
          id: item.id,
          productId: item.productId,
          name: product?.name ?? "Central vacuum product",
          summary: product?.summary ?? "Elite central vacuum accessory",
          sku: product?.id.toUpperCase() ?? "ECV-SKU",
          quantity: item.quantity,
          unitPriceUsd: item.unitPriceUsd,
          imageSrc: "/product.png",
        };
      }),
      delivery: {
        address: order.deliveryAddress,
        trackingNumber: index === 0 ? "1Z999AA1012345678" : order.trackingNumber,
        carrier: "UPS",
        estimatedDelivery: index === 0 ? "2026-08-02T18:00:00.000Z" : "2026-08-11T18:00:00.000Z",
        timeline: [
          { key: "placed", label: "Order Placed", detail: "Order received", complete: true },
          { key: "paid", label: "Payment Confirmed", detail: "Payment captured", complete: order.paymentStatus === "paid" || index === 1 },
          { key: "processing", label: "Processing", detail: "In progress", complete: true, active: index === 1 },
          { key: "shipped", label: "Shipped", detail: "Carrier pickup", complete: index === 0 },
          { key: "delivered", label: "Delivered", detail: "Completed", complete: index === 0, active: index === 0 },
        ],
      },
    };
  });

const repairRequest = getServiceRequestById("REQ-1006") ?? mockCustomerServiceRequests[0];
const completedRequest = getServiceRequestById("REQ-1007") ?? mockCustomerServiceRequests[1];

function createServiceOrder(
  request: ServiceRequest,
  overrides: {
    id: string;
    status: UnifiedOrderStatus;
    invoiceId: string;
    paymentId: string;
    quotationId: string;
    totalUsd: number;
    activeStep: string;
  },
): DashboardServiceOrder {
  const service = getServiceById(request.serviceId);
  const detail = getServiceDetailByRequestId(request.id);
  const technician = getTechnicianById(
    request.assignedTechnicianId ?? detail?.appointment?.technicianId,
  );
  const subtotalUsd = Math.max(overrides.totalUsd - 14.08, 0);

  return {
    id: overrides.id,
    type: "SERVICE",
    status: overrides.status,
    createdAt: request.submittedAt,
    serviceRequestId: request.id,
    quotationId: overrides.quotationId,
    invoiceId: overrides.invoiceId,
    paymentId: overrides.paymentId,
    serviceName: service?.name ?? request.title,
    problemSummary: request.description,
    location: request.serviceAddress,
    problemLocation: request.problemLocation,
    requestedSchedule: scheduleLabel(request, "requestedSchedule"),
    currentSchedule: scheduleLabel(request, "currentSchedule"),
    customerNotes: request.additionalNotes ?? "Unit makes a high-pitched noise when starting up.",
    technicianInstruction:
      "Please ensure the main central unit is accessible and cleared of any obstruction.",
    technician: technician
      ? {
          name: technician.displayName,
          phone: technician.phone,
          role: "Elite technician",
          avatarSrc: "/nav_profile.jpg",
        }
      : undefined,
    total: {
      subtotalUsd,
      taxUsd: overrides.totalUsd - subtotalUsd,
      totalUsd: overrides.totalUsd,
    },
    timeline: [
      {
        key: "accepted",
        label: "Request Accepted",
        detail: "Your service request was confirmed by our team.",
        dateLabel: "Apr 19, 2026",
        complete: true,
      },
      {
        key: "scheduled",
        label: "Service Scheduled",
        detail: technician
          ? `${technician.displayName} has been assigned to your appointment.`
          : "A technician will be assigned soon.",
        dateLabel: overrides.activeStep === "scheduled" ? "Current status" : "Confirmed",
        complete: true,
        active: overrides.activeStep === "scheduled",
      },
      {
        key: "in-progress",
        label: "In Progress",
        detail: "Technician performing vacuum service.",
        dateLabel: overrides.activeStep === "in-progress" ? "Current status" : "Pending",
        complete: ["in-progress", "completed"].includes(overrides.activeStep),
        active: overrides.activeStep === "in-progress",
      },
      {
        key: "completed",
        label: "Completed",
        detail: "Service report and final payment capture.",
        dateLabel: overrides.activeStep === "completed" ? "Current status" : "Pending",
        complete: overrides.activeStep === "completed",
        active: overrides.activeStep === "completed",
      },
    ],
  };
}

export const dashboardServiceOrders: DashboardServiceOrder[] = [
  createServiceOrder(repairRequest, {
    id: "SO-2038",
    status: "scheduled",
    invoiceId: "INV-2048",
    paymentId: "PAY-2048",
    quotationId: "QUO-1006",
    totalUsd: 176.55,
    activeStep: "scheduled",
  }),
  createServiceOrder(completedRequest, {
    id: "SO-2037",
    status: "completed",
    invoiceId: "INV-2047",
    paymentId: "PAY-2047",
    quotationId: "QUO-1007",
    totalUsd: 95,
    activeStep: "completed",
  }),
];

export const dashboardOrders: DashboardOrder[] = [
  ...dashboardProductOrders,
  ...dashboardServiceOrders,
].sort((left, right) => {
  const leftDate = left.type === "PRODUCT" ? left.placedAt : left.createdAt;
  const rightDate = right.type === "PRODUCT" ? right.placedAt : right.createdAt;
  return new Date(rightDate).getTime() - new Date(leftDate).getTime();
});

export const dashboardInvoices: DashboardInvoice[] = dashboardOrders.map((order) => {
  const title =
    order.type === "PRODUCT"
      ? order.items[0]?.name ?? "Product order"
      : order.serviceName;
  const lineItems =
    order.type === "PRODUCT"
      ? order.items.map((item) => ({
          id: `inv-${item.id}`,
          label: item.name,
          description: item.summary,
          quantity: item.quantity,
          unitPriceUsd: item.unitPriceUsd,
          amountUsd: item.quantity * item.unitPriceUsd,
        }))
      : [
          {
            id: `${order.invoiceId}-labor`,
            label: order.serviceName,
            description: order.problemSummary,
            amountUsd: order.total.subtotalUsd,
          },
        ];

  return {
    id: order.invoiceId,
    type: order.type,
    status: order.status === "cancelled" ? "pending" : "paid",
    invoiceDate: order.type === "PRODUCT" ? order.placedAt : order.createdAt,
    relatedOrderId: order.id,
    title,
    customerName: mockCurrentCustomer.displayName,
    billingAddress:
      order.type === "PRODUCT" ? order.delivery.address : order.location,
    paymentMethodLabel: "Visa ending in 4242",
    lineItems,
    totals: order.total,
    paymentId: order.paymentId,
  };
});

export const dashboardPayments: DashboardPayment[] = dashboardInvoices.map((invoice) => ({
  id: invoice.paymentId,
  type: invoice.type,
  status: invoice.status === "paid" ? "paid" : "pending",
  processedAt: invoice.invoiceDate,
  amountUsd: invoice.totals.totalUsd,
  relatedOrderId: invoice.relatedOrderId,
  invoiceId: invoice.id,
  title: invoice.title,
  methodLabel: invoice.paymentMethodLabel,
}));

export function getDashboardOrderById(orderId: string) {
  return dashboardOrders.find((order) => order.id === orderId);
}

export function getDashboardInvoiceById(invoiceId: string) {
  return dashboardInvoices.find((invoice) => invoice.id === invoiceId);
}

export function getDashboardServiceOrderByRequestId(requestId: string) {
  return dashboardServiceOrders.find((order) => order.serviceRequestId === requestId);
}

export function getDashboardScheduleItems(status: "upcoming" | "completed") {
  return dashboardServiceOrders.filter((order) =>
    status === "completed" ? order.status === "completed" : order.status !== "completed",
  );
}
