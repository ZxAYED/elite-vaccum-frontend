import { mockServices } from "@/data/mock/services";
import type {
  AdminQuotation,
  Customer,
  FlexibleQuotationLineItem,
  QuoteStatus,
  ServiceRequest,
} from "@/types/domain";

export type AdminQuotationFilterStatus = "all" | QuoteStatus;

export function calculateQuotationTotals(
  lineItems: FlexibleQuotationLineItem[],
  taxUsd: number | string,
  discountUsd: number | string,
) {
  const numTax = Number(taxUsd) || 0;
  const numDiscount = Number(discountUsd) || 0;
  const subtotalUsd = (lineItems || []).reduce(
    (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPriceUsd) || 0),
    0,
  );
  const totalUsd = Math.max(0, subtotalUsd + numTax - numDiscount);

  return {
    subtotalUsd: Number(subtotalUsd.toFixed(2)),
    taxUsd: Number(numTax.toFixed(2)),
    discountUsd: Number(numDiscount.toFixed(2)),
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

export function getQuotationRequest(_quotation?: AdminQuotation): ServiceRequest | undefined {
  void _quotation;
  return undefined;
}

export function getQuotationCustomer(_quotation?: AdminQuotation): Customer | undefined {
  void _quotation;
  return undefined;
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
