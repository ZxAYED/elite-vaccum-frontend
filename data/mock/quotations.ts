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

export const mockAdminQuotations: AdminQuotation[] = [];

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
