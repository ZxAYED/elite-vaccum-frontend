import { baseApi } from "./baseApi";
import type { AdminQuotation } from "@/types/domain";
import type { PaginatedResponse } from "./types";

export interface GetQuotationsParams {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CreateQuotationRequest {
  serviceRequestId: string;
  lineItems: Array<{
    description: string;
    quantity: number;
    unitPriceUsd: number;
  }>;
  discountUsd?: number;
  taxUsd?: number;
  notes?: string;
}

export interface AcceptQuotationResponse {
  success: boolean;
  message: string;
  serviceOrder?: {
    id: string;
    businessId: string;
    status: string;
    scheduledAt?: string;
  };
}

export const quotationsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAdminQuotations: builder.query<PaginatedResponse<AdminQuotation>, GetQuotationsParams | void>({
      query: (params) => ({
        url: "/quotations",
        params: params || undefined,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ id }) => ({ type: "Quotation" as const, id })),
              { type: "Quotation", id: "ADMIN_LIST" },
            ]
          : [{ type: "Quotation", id: "ADMIN_LIST" }],
    }),
    getMyQuotations: builder.query<AdminQuotation[], void>({
      query: () => "/quotations/me",
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Quotation" as const, id })),
              { type: "Quotation", id: "MY_LIST" },
            ]
          : [{ type: "Quotation", id: "MY_LIST" }],
    }),
    getQuotationById: builder.query<AdminQuotation, string>({
      query: (id) => `/quotations/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Quotation", id }],
    }),
    createQuotation: builder.mutation<AdminQuotation, CreateQuotationRequest>({
      query: (body) => ({
        url: "/quotations",
        method: "POST",
        body,
      }),
      invalidatesTags: [
        { type: "Quotation", id: "ADMIN_LIST" },
        { type: "ServiceRequest" },
      ],
    }),
    reviseQuotation: builder.mutation<AdminQuotation, { id: string; body: Partial<CreateQuotationRequest> }>({
      query: ({ id, body }) => ({
        url: `/quotations/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Quotation", id },
        { type: "Quotation", id: "ADMIN_LIST" },
        { type: "Quotation", id: "MY_LIST" },
      ],
    }),
    acceptQuotation: builder.mutation<
      AcceptQuotationResponse,
      { id: string; selectedSlot?: { date: string; window: string } }
    >({
      query: ({ id, ...body }) => ({
        url: `/quotations/${id}/accept`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Quotation", id },
        { type: "Quotation", id: "MY_LIST" },
        { type: "Quotation", id: "ADMIN_LIST" },
        { type: "ServiceOrder" },
      ],
    }),
    rejectQuotation: builder.mutation<{ success: boolean }, { id: string; reason: string }>({
      query: ({ id, reason }) => ({
        url: `/quotations/${id}/reject`,
        method: "POST",
        body: { reason },
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Quotation", id },
        { type: "Quotation", id: "MY_LIST" },
        { type: "Quotation", id: "ADMIN_LIST" },
      ],
    }),
  }),
});

export const {
  useGetAdminQuotationsQuery,
  useGetMyQuotationsQuery,
  useGetQuotationByIdQuery,
  useCreateQuotationMutation,
  useReviseQuotationMutation,
  useAcceptQuotationMutation,
  useRejectQuotationMutation,
} = quotationsApi;
