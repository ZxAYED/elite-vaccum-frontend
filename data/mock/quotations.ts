import { mockServices } from "@/data/mock/services";
import { mockCustomers } from "@/data/mock/customers";
import { mockServiceRequests } from "@/data/mock/service-requests";
import type {
  AdminQuotation,
  FlexibleQuotationLineItem,
  QuoteStatus,
  ServiceRequest,
} from "@/types/domain";

export type AdminQuotationFilterStatus = "all" | QuoteStatus;

export function calculateQuotationTotals(
  lineItems: FlexibleQuotationLineItem[],
  taxUsd: number,
  discountUsd: number,
) {
  const subtotalUsd = lineItems.reduce(
    (sum, item) => sum + item.quantity * item.unitPriceUsd,
    0,
  );
  const totalUsd = Math.max(0, subtotalUsd + taxUsd - discountUsd);

  return {
    subtotalUsd: Number(subtotalUsd.toFixed(2)),
    taxUsd: Number(taxUsd.toFixed(2)),
    discountUsd: Number(discountUsd.toFixed(2)),
    totalUsd: Number(totalUsd.toFixed(2)),
  };
}

function totals(
  lineItems: FlexibleQuotationLineItem[],
  taxUsd: number,
  discountUsd = 0,
) {
  return calculateQuotationTotals(lineItems, taxUsd, discountUsd);
}

const motorRepairItems: FlexibleQuotationLineItem[] = [
  {
    id: "qline-1001-1",
    description: "On-site diagnostic visit",
    quantity: 1,
    unitPriceUsd: 89,
    note: "Includes motor testing and airflow verification.",
  },
  {
    id: "qline-1001-2",
    description: "Motor repair labor",
    quantity: 1,
    unitPriceUsd: 107,
  },
];

const inletItems: FlexibleQuotationLineItem[] = [
  {
    id: "qline-1004-1",
    description: "Inlet diagnostics",
    quantity: 1,
    unitPriceUsd: 79,
  },
  {
    id: "qline-1004-2",
    description: "Valve seal replacement",
    quantity: 2,
    unitPriceUsd: 25,
  },
];

const installItems: FlexibleQuotationLineItem[] = [
  {
    id: "qline-1009-1",
    description: "Rough-in layout review",
    quantity: 1,
    unitPriceUsd: 180,
  },
  {
    id: "qline-1009-2",
    description: "Installation planning package",
    quantity: 1,
    unitPriceUsd: 240,
  },
];

const maintenanceItems: FlexibleQuotationLineItem[] = [
  {
    id: "qline-1002-1",
    description: "Annual system maintenance",
    quantity: 1,
    unitPriceUsd: 149,
  },
];

export const mockAdminQuotations: AdminQuotation[] = [
  {
    id: "QUO-1001",
    serviceRequestId: "REQ-1001",
    customerId: "cust-1001",
    serviceId: "svc-motor-repair",
    status: "sent",
    version: 1,
    lineItems: motorRepairItems,
    ...totals(motorRepairItems, 20),
    issuedAt: "2026-08-07T08:00:00.000Z",
    expiresAt: "2026-08-11T23:59:00.000Z",
    createdAt: "2026-08-07T07:30:00.000Z",
    updatedAt: "2026-08-07T08:00:00.000Z",
    sentAt: "2026-08-07T08:00:00.000Z",
    notes:
      "If full motor replacement is required after inspection, request approval before proceeding.",
    terms:
      "Customer approval authorizes the listed diagnostic and repair scope only.",
    revisionHistory: [],
  },
  {
    id: "QUO-1004",
    serviceRequestId: "REQ-1004",
    customerId: "cust-1004",
    serviceId: "svc-inlet-diagnostics",
    status: "viewed",
    version: 2,
    lineItems: inletItems,
    ...totals(inletItems, 10, 0),
    issuedAt: "2026-08-04T10:15:00.000Z",
    expiresAt: "2026-08-18T23:59:00.000Z",
    createdAt: "2026-08-04T09:40:00.000Z",
    updatedAt: "2026-08-05T11:20:00.000Z",
    sentAt: "2026-08-04T10:15:00.000Z",
    viewedAt: "2026-08-05T11:20:00.000Z",
    notes: "Quote revised after reviewing the customer inlet photo.",
    revisionHistory: [
      {
        id: "rev-1004-1",
        version: 1,
        status: "sent",
        subtotalUsd: 129,
        discountUsd: 0,
        taxUsd: 9.03,
        totalUsd: 138.03,
        createdAt: "2026-08-04T10:15:00.000Z",
        reason: "Initial inlet diagnostic quote.",
      },
    ],
  },
  {
    id: "QUO-1009",
    serviceRequestId: "REQ-1009",
    customerId: "cust-1001",
    serviceId: "svc-central-installation",
    status: "draft",
    version: 1,
    lineItems: installItems,
    ...totals(installItems, 33.6),
    issuedAt: "2026-08-08T17:10:00.000Z",
    expiresAt: "",
    createdAt: "2026-08-08T17:10:00.000Z",
    updatedAt: "2026-08-08T17:10:00.000Z",
    notes: "Draft prepared from accepted new construction request.",
    terms: "Final install scope may change after builder plan review.",
    revisionHistory: [],
  },
  {
    id: "QUO-1002",
    serviceRequestId: "REQ-1002",
    customerId: "cust-1002",
    serviceId: "svc-maintenance-visit",
    status: "accepted",
    version: 1,
    lineItems: maintenanceItems,
    ...totals(maintenanceItems, 0),
    issuedAt: "2026-08-03T11:00:00.000Z",
    expiresAt: "2026-08-10T23:59:00.000Z",
    createdAt: "2026-08-03T10:35:00.000Z",
    updatedAt: "2026-08-03T12:20:00.000Z",
    sentAt: "2026-08-03T11:00:00.000Z",
    acceptedAt: "2026-08-03T12:20:00.000Z",
    serviceOrderId: "SO-2038",
    revisionHistory: [],
  },
  {
    id: "QUO-1005",
    serviceRequestId: "REQ-1005",
    customerId: "cust-1005",
    serviceId: "svc-accessory-fit",
    status: "rejected",
    version: 1,
    lineItems: [
      {
        id: "qline-1005-1",
        description: "Accessory compatibility review",
        quantity: 1,
        unitPriceUsd: 95,
      },
    ],
    ...totals(
      [
        {
          id: "qline-1005-1",
          description: "Accessory compatibility review",
          quantity: 1,
          unitPriceUsd: 95,
        },
      ],
      0,
    ),
    issuedAt: "2026-08-07T13:05:00.000Z",
    expiresAt: "2026-08-14T23:59:00.000Z",
    createdAt: "2026-08-07T12:45:00.000Z",
    updatedAt: "2026-08-08T09:00:00.000Z",
    sentAt: "2026-08-07T13:05:00.000Z",
    rejectedAt: "2026-08-08T09:00:00.000Z",
    revisionHistory: [],
    rejectionHistory: [
      {
        id: "quote-reject-1005",
        reason: "Price concern",
        comments: "Customer asked for a lower-cost self-service option.",
        rejectedAt: "2026-08-08T09:00:00.000Z",
        actorLabel: "Customer",
      },
    ],
  },
];

export function getQuotationById(quotationId: string) {
  return mockAdminQuotations.find((quotation) => quotation.id === quotationId);
}

export function getQuotationForRequest(requestId: string) {
  return mockAdminQuotations.find((quotation) => quotation.serviceRequestId === requestId);
}

export function getQuotationRequest(quotation: AdminQuotation) {
  return mockServiceRequests.find((request) => request.id === quotation.serviceRequestId);
}

export function getQuotationCustomer(quotation: AdminQuotation) {
  return mockCustomers.find((customer) => customer.id === quotation.customerId);
}

export function getQuotationService(quotation: AdminQuotation) {
  return mockServices.find((service) => service.id === quotation.serviceId);
}

export function buildQuotationFromRequest(request: ServiceRequest): AdminQuotation {
  const service = mockServices.find((item) => item.id === request.serviceId);
  const baseAmount = request.estimatedAmountUsd ?? service?.basePriceUsd ?? 0;
  const lineItems: FlexibleQuotationLineItem[] = [
    {
      id: `qline-${request.id.toLowerCase()}-1`,
      description: service?.name ?? request.title,
      quantity: 1,
      unitPriceUsd: baseAmount,
    },
  ];
  const calculated = calculateQuotationTotals(lineItems, 0, 0);

  return {
    id: `QUO-${request.id.replace("REQ-", "")}`,
    serviceRequestId: request.id,
    customerId: request.customerId,
    serviceId: request.serviceId,
    status: "draft",
    version: 1,
    lineItems,
    ...calculated,
    issuedAt: new Date().toISOString(),
    expiresAt: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    notes: "",
    terms: "",
    revisionHistory: [],
  };
}
