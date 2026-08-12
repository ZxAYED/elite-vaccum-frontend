import type { Address, PaymentStatus } from "@/types/domain";

import { getSharedAdminServiceOrders } from "@/data/mock/admin-schedule-state";
import {
  type BillingInvoiceRecord,
  type BillingPaymentRecord,
  getBillingInvoiceById,
  getBillingInvoices,
  getBillingPayments,
} from "@/data/mock/shared-billing";
import {
  getServiceDetailByRequestId,
  getServiceRequestById,
  getTechnicianById,
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
  | "report-submitted"
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
    sku?: string;
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

function buildProductTimeline(status: UnifiedOrderStatus) {
  const order: UnifiedOrderStatus[] = [
    "pending",
    "paid",
    "processing",
    "shipped",
    "delivered",
  ];
  const activeIndex = order.indexOf(status);

  return [
    { key: "placed", label: "Order Placed", detail: "Order received", complete: true },
    {
      key: "paid",
      label: "Payment Confirmed",
      detail: "Payment captured",
      complete: activeIndex >= 1,
    },
    {
      key: "processing",
      label: "Processing",
      detail: "In progress",
      complete: activeIndex >= 2,
      active: status === "processing",
    },
    {
      key: "shipped",
      label: "Shipped",
      detail: "Carrier pickup",
      complete: activeIndex >= 3,
      active: status === "shipped",
    },
    {
      key: "delivered",
      label: "Delivered",
      detail: "Completed",
      complete: activeIndex >= 4,
      active: status === "delivered",
    },
  ];
}

function toDashboardInvoice(invoice: BillingInvoiceRecord): DashboardInvoice {
  const invoiceStatus: InvoiceStatus =
    invoice.status === "paid" || invoice.status === "refunded"
      ? invoice.status
      : "pending";

  return {
    id: invoice.id,
    type: invoice.type,
    status: invoiceStatus,
    invoiceDate: invoice.createdAt,
    relatedOrderId: invoice.relatedOrderId,
    title: invoice.description,
    customerName: invoice.customerName,
    billingAddress: invoice.billingAddress,
    paymentMethodLabel: "Visa ending in 4242",
    lineItems: invoice.lineItems.map((item) => ({
      id: item.id,
      label: item.label,
      description: item.description,
      quantity: item.quantity,
      unitPriceUsd: item.unitPriceUsd,
      amountUsd: item.amountUsd,
      sku: item.sku,
    })),
    totals: invoice.totals,
    paymentId: invoice.paymentId ?? `PAY-${invoice.relatedOrderId.replace(/^[A-Z]+-/, "")}`,
  };
}

function toDashboardPayment(payment: BillingPaymentRecord): DashboardPayment {
  return {
    id: payment.id,
    type: payment.type,
    status: payment.status,
    processedAt: payment.processedAt,
    amountUsd: payment.amountUsd,
    relatedOrderId: payment.orderId,
    invoiceId: payment.invoiceId,
    title: payment.title,
    methodLabel: payment.methodLabel,
  };
}

const billingInvoices = getBillingInvoices().filter(
  (invoice) => invoice.customerId === mockCurrentCustomer.id,
);

export const dashboardInvoices: DashboardInvoice[] = billingInvoices.map(toDashboardInvoice);

export const dashboardPayments: DashboardPayment[] = getBillingPayments()
  .filter((payment) => payment.customerId === mockCurrentCustomer.id)
  .map(toDashboardPayment);

export const dashboardProductOrders: DashboardProductOrder[] = billingInvoices
  .filter((invoice) => invoice.type === "PRODUCT")
  .map((invoice) => ({
    id: invoice.relatedOrderId,
    type: "PRODUCT",
    status:
      invoice.status === "paid"
        ? "delivered"
        : invoice.paymentStatus === "refunded"
          ? "refunded"
          : "processing",
    placedAt: invoice.createdAt,
    total: invoice.totals,
    paymentStatus: invoice.paymentStatus,
    invoiceId: invoice.id,
    paymentId: invoice.paymentId ?? `PAY-${invoice.relatedOrderId.replace(/^[A-Z]+-/, "")}`,
    items: invoice.lineItems.map((item) => ({
      id: item.id,
      productId: item.id,
      name: item.label,
      summary: item.description ?? "Elite central vacuum product",
      sku: item.sku ?? "ECV-SKU",
      quantity: item.quantity ?? 1,
      unitPriceUsd: item.unitPriceUsd ?? item.amountUsd,
      imageSrc: "/product.png",
    })),
    delivery: {
      address: invoice.billingAddress,
      trackingNumber: invoice.relatedOrderId === "ORD-88410" ? "1Z999AA1012345678" : "ECV-TRK-8052",
      carrier: "UPS",
      estimatedDelivery:
        invoice.relatedOrderId === "ORD-88410"
          ? "2026-08-02T18:00:00.000Z"
          : "2026-08-11T18:00:00.000Z",
      timeline: buildProductTimeline(
        invoice.status === "paid"
          ? "delivered"
          : invoice.paymentStatus === "refunded"
            ? "refunded"
            : "processing",
      ),
    },
  }));

export function getDashboardServiceOrders(): DashboardServiceOrder[] {
  return getSharedAdminServiceOrders()
    .filter((order) => order.customerId === mockCurrentCustomer.id)
    .map((order) => {
      const request = getServiceRequestById(order.serviceRequestId);
      const detail = request ? getServiceDetailByRequestId(request.id) : undefined;
      const technician = getTechnicianById(
        order.technicianId ?? detail?.appointment?.technicianId,
      );

      return {
        id: order.id,
        type: "SERVICE",
        status: order.status,
        createdAt: order.createdAt,
        serviceRequestId: order.serviceRequestId,
        quotationId: order.quotationId,
        invoiceId: order.invoiceId ?? `INV-${order.id.replace("SO-", "")}`,
        paymentId: order.paymentId ?? `PAY-${order.id.replace("SO-", "")}`,
        serviceName: order.serviceName,
        problemSummary: order.problemSummary,
        location: order.serviceLocation,
        problemLocation: order.problemLocation,
        requestedSchedule: order.requestedSchedule.label ?? order.requestedSchedule.time,
        currentSchedule: order.currentSchedule.label ?? order.currentSchedule.time,
        customerNotes:
          order.customerNotes ?? "Unit makes a high-pitched noise when starting up.",
        technicianInstruction:
          order.technicianInstruction
          ?? "Please ensure the main central unit is accessible and cleared of any obstruction.",
        technician: technician
          ? {
              name: technician.displayName,
              phone: technician.phone,
              role: "Elite technician",
              avatarSrc: "/nav_profile.jpg",
            }
          : undefined,
        total: order.total,
        timeline: order.timeline.map((step) => ({
          ...step,
          dateLabel: step.dateLabel ?? "Confirmed",
        })),
      };
    });
}

export function getDashboardOrders(): DashboardOrder[] {
  return [...dashboardProductOrders, ...getDashboardServiceOrders()].sort(
    (left, right) => {
      const leftDate = left.type === "PRODUCT" ? left.placedAt : left.createdAt;
      const rightDate = right.type === "PRODUCT" ? right.placedAt : right.createdAt;
      return new Date(rightDate).getTime() - new Date(leftDate).getTime();
    },
  );
}

export const dashboardOrders: DashboardOrder[] = getDashboardOrders();
export const dashboardServiceOrders: DashboardServiceOrder[] = getDashboardServiceOrders();

export function getDashboardOrderById(orderId: string) {
  return getDashboardOrders().find((order) => order.id === orderId);
}

export function getDashboardInvoiceById(invoiceId: string) {
  const invoice = getBillingInvoiceById(invoiceId);
  return invoice && invoice.customerId === mockCurrentCustomer.id
    ? toDashboardInvoice(invoice)
    : undefined;
}

export function getDashboardServiceOrderByRequestId(requestId: string) {
  return getDashboardServiceOrders().find(
    (order) => order.serviceRequestId === requestId,
  );
}

export function getDashboardScheduleItems(status: "upcoming" | "completed") {
  return getDashboardServiceOrders().filter((order) =>
    status === "completed" ? order.status === "completed" : order.status !== "completed",
  );
}
