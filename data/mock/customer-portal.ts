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

const customerPrimaryAddress =
  mockCurrentCustomer.addresses[0] ?? mockCustomerServiceRequests[0]?.serviceAddress;

export const mockCustomerServiceDetailsByRequestId: Record<
  string,
  CustomerServiceDetail
> = {
  "REQ-1001": {
    requestId: "REQ-1001",
    timeline: [
      {
        id: "timeline-1001-1",
        label: "Request Submitted",
        detail: "Photos and issue notes were received for motor diagnostics.",
        occurredAt: "2026-08-06T13:18:00.000Z",
      },
      {
        id: "timeline-1001-2",
        label: "Technical Review",
        detail: "A specialist reviewed the overheating symptoms and recommended an on-site visit.",
        occurredAt: "2026-08-06T16:42:00.000Z",
      },
      {
        id: "timeline-1001-3",
        label: "Quote Issued",
        detail: "Pricing is ready and awaiting your approval before scheduling.",
        occurredAt: "2026-08-07T08:00:00.000Z",
      },
    ],
    quote: {
      id: "QUO-1001",
      serviceRequestId: "REQ-1001",
      status: "sent",
      subtotalUsd: 196,
      totalUsd: 216,
      issuedAt: "2026-08-07T08:00:00.000Z",
      expiresAt: "2026-08-11T23:59:00.000Z",
      notes:
        "If the motor needs a full replacement after inspection, the technician will provide an updated approval request before proceeding.",
      lineItems: [
        {
          id: "quote-line-1001",
          label: "On-site diagnostic visit",
          description: "Arrival, motor testing, and airflow verification.",
          amountUsd: 89,
        },
        {
          id: "quote-line-1002",
          label: "Motor repair labor",
          description: "Repair and reset for the existing central unit.",
          amountUsd: 107,
        },
      ],
      suggestedSlots: [
        {
          date: "2026-08-10",
          windows: ["8:00 AM - 10:00 AM", "1:00 PM - 3:00 PM"],
        },
        {
          date: "2026-08-11",
          windows: ["10:00 AM - 12:00 PM", "3:00 PM - 5:00 PM"],
        },
      ],
    },
  },
  "REQ-1006": {
    requestId: "REQ-1006",
    timeline: [
      {
        id: "timeline-1006-1",
        label: "Request Submitted",
        detail: "Preventive maintenance visit requested for the main residence.",
        occurredAt: "2026-07-31T15:10:00.000Z",
      },
      {
        id: "timeline-1006-2",
        label: "Visit Confirmed",
        detail: "The annual maintenance visit has been scheduled with a technician.",
        occurredAt: "2026-08-03T09:10:00.000Z",
      },
      {
        id: "timeline-1006-3",
        label: "Technician Assigned",
        detail: "Naomi Carter will handle the appointment and bring standard maintenance parts.",
        occurredAt: "2026-08-06T17:22:00.000Z",
      },
    ],
    appointment: {
      id: "APT-1006",
      serviceRequestId: "REQ-1006",
      status: "confirmed",
      startAt: "2026-08-14T11:00:00.000Z",
      endAt: "2026-08-14T13:00:00.000Z",
      address: customerPrimaryAddress,
      technicianId: "tech-002",
      arrivalWindowLabel: "Friday, August 14, 2026 between 11:00 AM and 1:00 PM",
      preparationChecklist: [
        "Confirm parking or gate instructions for the technician.",
        "Have your current hose and attachments available for fit checks.",
        "Make note of any rooms with weaker suction since the last visit.",
      ],
    },
  },
  "REQ-1007": {
    requestId: "REQ-1007",
    timeline: [
      {
        id: "timeline-1007-1",
        label: "Request Submitted",
        detail: "Accessory compatibility review requested after a recent hose replacement.",
        occurredAt: "2026-07-08T10:00:00.000Z",
      },
      {
        id: "timeline-1007-2",
        label: "Visit Completed",
        detail: "The technician matched a new wand and updated the accessory adapter kit.",
        occurredAt: "2026-07-12T11:45:00.000Z",
      },
    ],
    completionSummary: {
      completedAt: "2026-07-12T11:45:00.000Z",
      workPerformed: [
        "Verified compatibility between the hose handle and replacement wand.",
        "Installed an updated adapter ring for a tighter seal.",
        "Tested accessory airflow after the fit adjustment.",
      ],
      followUp:
        "No additional service is required. A product review can be left from your orders area once replacements are delivered.",
    },
  },
  "REQ-1008": {
    requestId: "REQ-1008",
    timeline: [
      {
        id: "timeline-1008-1",
        label: "Request Submitted",
        detail: "Low suction request submitted with address and requested schedule.",
        occurredAt: "2026-08-08T11:10:00.000Z",
      },
      {
        id: "timeline-1008-2",
        label: "Request Rejected",
        detail: "Admin rejected the request and left a reason for the customer.",
        occurredAt: "2026-08-08T15:20:00.000Z",
      },
    ],
  },
  "REQ-1009": {
    requestId: "REQ-1009",
    timeline: [
      {
        id: "timeline-1009-1",
        label: "Request Submitted",
        detail: "Installation request submitted with requested visit window.",
        occurredAt: "2026-08-08T14:05:00.000Z",
      },
      {
        id: "timeline-1009-2",
        label: "Request Accepted",
        detail:
          "Admin accepted the request and updated the current schedule for technician availability.",
        occurredAt: "2026-08-08T16:45:00.000Z",
      },
    ],
  },
};

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

export const mockCustomerProductOrders: StoreOrder[] = [
  {
    id: "SHOP-1001",
    customerId: mockCurrentCustomer.id,
    status: "delivered",
    placedAt: "2026-07-30T14:10:00.000Z",
    totalUsd: 96,
    paymentStatus: "paid",
    trackingNumber: "ECV-TRK-7301",
    etaLabel: "Delivered on August 2, 2026",
    deliveryAddress: customerPrimaryAddress,
    items: [
      {
        id: "shop-item-1001",
        productId: "prd-hand-tool",
        quantity: 1,
        unitPriceUsd: 48,
      },
      {
        id: "shop-item-1002",
        productId: "prd-bag",
        quantity: 2,
        unitPriceUsd: 24,
      },
    ],
  },
  {
    id: "SHOP-1002",
    customerId: mockCurrentCustomer.id,
    status: "processing",
    placedAt: "2026-08-05T10:30:00.000Z",
    totalUsd: 167,
    paymentStatus: "pending",
    trackingNumber: "ECV-TRK-8052",
    etaLabel: "Estimated delivery by August 11, 2026",
    deliveryAddress: customerPrimaryAddress,
    items: [
      {
        id: "shop-item-1003",
        productId: "prd-brush-head",
        quantity: 1,
        unitPriceUsd: 64,
      },
      {
        id: "shop-item-1004",
        productId: "prd-adapter",
        quantity: 1,
        unitPriceUsd: 18,
      },
      {
        id: "shop-item-1005",
        productId: "prd-roller",
        quantity: 1,
        unitPriceUsd: 85,
      },
    ],
  },
];

export const mockCartItems: CartItem[] = [
  { productId: "prd-hand-tool", quantity: 1 },
  { productId: "prd-bag", quantity: 2 },
];

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
