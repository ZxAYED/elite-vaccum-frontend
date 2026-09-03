import type {
  Address,
  Appointment,
  PaymentStatus,
  Product,
  Quote,
  RejectionHistoryEntry,
} from "@/types/domain";

import { mockNotifications } from "@/data/mock/notifications";
import { mockOrders } from "@/data/mock/orders";
import { mockPayments } from "@/data/mock/payments";
import { mockServices } from "@/data/mock/services";
import { mockTechnicians } from "@/data/mock/technicians";
import {
  getCustomerVisibleQuotations,
  getSharedProducts,
  getSharedQuotationForRequest,
  getSharedServiceRequestById,
  getSharedServiceRequests,
} from "@/data/mock/shared-business-store";
import { mockCurrentCustomer, mockCurrentUser } from "@/data/mock/user";

export interface QuoteLineItem {
  id: string;
  label: string;
  description: string;
  amountUsd: number;
}

export interface SuggestedSlot {
  date: string;
  windows: string[];
}

export interface CustomerQuote extends Quote {
  lineItems: QuoteLineItem[];
  suggestedSlots: SuggestedSlot[];
  rejectionHistory?: RejectionHistoryEntry[];
}

export interface CustomerAppointment extends Appointment {
  arrivalWindowLabel: string;
  preparationChecklist: string[];
}

export interface ServiceTimelineEvent {
  id: string;
  label: string;
  detail: string;
  occurredAt: string;
}

export interface CompletionSummary {
  completedAt: string;
  workPerformed: string[];
  followUp: string;
}

export interface CustomerServiceDetail {
  requestId: string;
  timeline: ServiceTimelineEvent[];
  quote?: CustomerQuote;
  appointment?: CustomerAppointment;
  completionSummary?: CompletionSummary;
}

export type StoreOrderStatus = "processing" | "shipped" | "delivered";
export interface StoreOrderItem {
  id: string;
  productId: string;
  quantity: number;
  unitPriceUsd: number;
}

export interface StoreOrder {
  id: string;
  customerId: string;
  status: StoreOrderStatus;
  placedAt: string;
  totalUsd: number;
  paymentStatus: PaymentStatus;
  trackingNumber: string;
  etaLabel: string;
  deliveryAddress: Address;
  items: StoreOrderItem[];
}

export interface CartItem {
  productId: string;
  quantity: number;
}

export interface CartProduct extends CartItem {
  product: Product;
}

export interface PaymentLedgerEntry {
  id: string;
  title: string;
  category: "service" | "product";
  amountUsd: number;
  status: PaymentStatus;
  processedAt: string;
  detail: string;
  href: string;
}

export const mockCustomerServiceRequests = getSharedServiceRequests().filter(
  (request) => request.customerId === mockCurrentUser.customerId,
);

export function getCustomerServiceRequests() {
  return getSharedServiceRequests().filter(
    (request) => request.customerId === mockCurrentUser.customerId,
  );
}


export const mockCustomerServiceDetailsByRequestId: Record<
  string,
  CustomerServiceDetail
> = {};

function buildFallbackTimeline(requestId: string): ServiceTimelineEvent[] {
  const request = getSharedServiceRequestById(requestId);
  if (!request) return [];

  const timeline: ServiceTimelineEvent[] = [
    {
      id: `${request.id}-submitted`,
      label: "Request Submitted",
      detail: "Your service request was captured and routed into the shared mock workflow.",
      occurredAt: request.submittedAt,
    },
  ];

  if (request.status === "under-review") {
    timeline.push({
      id: `${request.id}-review`,
      label: "Under Review",
      detail: "Admin is reviewing the issue details, schedule, and uploaded evidence.",
      occurredAt: request.submittedAt,
    });
  }

  if (request.status === "accepted" || request.status === "quoted" || request.status === "scheduled") {
    timeline.push({
      id: `${request.id}-accepted`,
      label: "Request Accepted",
      detail: "The request was accepted and moved into quotation or scheduling.",
      occurredAt: request.submittedAt,
    });
  }

  const quote = getSharedQuotationForRequest(request.id);
  if (quote) {
    timeline.push({
      id: `${request.id}-quote`,
      label: "Quote Ready",
      detail: "The quotation is available in your customer dashboard.",
      occurredAt: quote.sentAt ?? quote.updatedAt,
    });
  }

  if (request.rejectionHistory?.length) {
    timeline.push(
      ...request.rejectionHistory.map((entry) => ({
        id: entry.id,
        label: "Request Rejected",
        detail: entry.comments
          ? `${entry.reason} - ${entry.comments}`
          : entry.reason,
        occurredAt: entry.rejectedAt,
      })),
    );
  }

  return timeline.sort(
    (left, right) =>
      new Date(left.occurredAt).getTime() - new Date(right.occurredAt).getTime(),
  );
}

function buildFallbackDetail(requestId: string): CustomerServiceDetail | undefined {
  const request = getSharedServiceRequestById(requestId);
  if (!request || request.customerId !== mockCurrentUser.customerId) return undefined;

  const sharedQuote = getSharedQuotationForRequest(request.id);
  const quote: CustomerQuote | undefined = sharedQuote
    ? {
        id: sharedQuote.id,
        serviceRequestId: sharedQuote.serviceRequestId,
        status: sharedQuote.status,
        subtotalUsd: sharedQuote.subtotalUsd,
        totalUsd: sharedQuote.totalUsd,
        issuedAt: sharedQuote.issuedAt,
        expiresAt: sharedQuote.expiresAt,
        notes: sharedQuote.notes,
        lineItems: sharedQuote.lineItems.map((item) => ({
          id: item.id,
          label: item.description,
          description: item.note ?? `Qty ${item.quantity}`,
          amountUsd: item.quantity * item.unitPriceUsd,
        })),
        suggestedSlots: request.currentSchedule
          ? [
              {
                date: request.currentSchedule.date,
                windows: [request.currentSchedule.time],
              },
            ]
          : [],
        rejectionHistory: sharedQuote.rejectionHistory,
      }
    : undefined;

  return {
    requestId: request.id,
    timeline: buildFallbackTimeline(request.id),
    quote,
  };
}

export const mockCustomerProductOrders: StoreOrder[] = [];

export const mockCartItems: CartItem[] = [];

export const mockCustomerPaymentMethods = [
  {
    id: "pm-1001",
    brand: "Visa",
    last4: "4242",
    expiryLabel: "12/26",
    default: true,
  },
];

export const mockPaymentLedger: PaymentLedgerEntry[] = [
  ...mockPayments
    .filter((payment) => payment.customerId === mockCurrentCustomer.id)
    .map((payment) => {
      const relatedOrder = mockOrders.find((order) => order.id === payment.orderId);
      return {
        id: payment.id,
        title: relatedOrder?.summary ?? "Service invoice",
        category: "service" as const,
        amountUsd: payment.amountUsd,
        status: payment.status,
        processedAt: payment.processedAt,
        detail: payment.methodLabel,
        href: relatedOrder?.serviceRequestId
          ? `/user/services/${relatedOrder.serviceRequestId}`
          : "/user/services",
      };
    }),
  ...mockCustomerProductOrders.map((order) => ({
    id: `pay-${order.id.toLowerCase()}`,
    title: `Store order ${order.id}`,
    category: "product" as const,
    amountUsd: order.totalUsd,
    status: order.paymentStatus,
    processedAt: order.placedAt,
    detail: `${order.items.length} item${order.items.length > 1 ? "s" : ""}`,
    href: `/user/orders/${order.id}`,
  })),
].sort(
  (left, right) =>
    new Date(right.processedAt).getTime() - new Date(left.processedAt).getTime(),
);

export const mockNotificationHrefById: Record<string, string> = {
  "notif-1001": "/user/services/REQ-1001#quote",
  "notif-1002": "/user/services/REQ-1006#appointment",
  "notif-1003": "/user/billing",
  "notif-1004": "/user/services",
};

export const mockCustomerNotifications = mockNotifications.filter(
  (notification) => notification.userId === mockCurrentUser.id,
);

export function getServiceRequestById(requestId: string) {
  const request = getSharedServiceRequestById(requestId);
  return request?.customerId === mockCurrentUser.customerId ? request : undefined;
}

export function getServiceDetailByRequestId(requestId: string) {
  return (
    mockCustomerServiceDetailsByRequestId[requestId] ??
    buildFallbackDetail(requestId)
  );
}

export function getCustomerQuotations() {
  const visibleQuotationIds = new Set(
    getCustomerVisibleQuotations().map((quotation) => quotation.id),
  );

  return getSharedServiceRequests()
    .filter((request) => request.customerId === mockCurrentUser.customerId)
    .map((request) => {
      const detail = mockCustomerServiceDetailsByRequestId[request.id];
      const sharedQuote = getSharedQuotationForRequest(request.id);
      if (!sharedQuote || !visibleQuotationIds.has(sharedQuote.id)) {
        return null;
      }
      return sharedQuote
        ? {
            request,
            detail,
            quote: {
              id: sharedQuote.id,
              serviceRequestId: sharedQuote.serviceRequestId,
              status: sharedQuote.status,
              subtotalUsd: sharedQuote.subtotalUsd,
              totalUsd: sharedQuote.totalUsd,
              issuedAt: sharedQuote.issuedAt,
              expiresAt: sharedQuote.expiresAt,
              notes: sharedQuote.notes,
              rejectionHistory: sharedQuote.rejectionHistory,
              lineItems: sharedQuote.lineItems.map((lineItem) => ({
                id: lineItem.id,
                label: lineItem.description,
                description: lineItem.note ?? `Qty ${lineItem.quantity}`,
                amountUsd: lineItem.quantity * lineItem.unitPriceUsd,
              })),
              suggestedSlots: detail?.quote?.suggestedSlots ?? [],
            },
          }
        : null;
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
}

export function getCustomerQuotationByRequestId(requestId: string) {
  return getCustomerQuotations().find((item) => item.request.id === requestId);
}

export function getProductBySlug(slug: string) {
  return getSharedProducts().find((product) => product.slug === slug);
}

export function getProductById(productId: string) {
  return getSharedProducts().find((product) => product.id === productId);
}

export function getStoreOrderById(orderId: string) {
  return mockCustomerProductOrders.find((order) => order.id === orderId);
}

export function getTechnicianById(technicianId?: string) {
  if (!technicianId) return undefined;
  return mockTechnicians.find((technician) => technician.id === technicianId);
}

export function getServiceById(serviceId: string) {
  return mockServices.find((service) => service.id === serviceId);
}

export function getCartProducts(): CartProduct[] {
  return mockCartItems.map((item) => ({
    ...item,
    product: getProductById(item.productId) as Product,
  }));
}
