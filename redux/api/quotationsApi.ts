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
  expiresAt?: string;
}

export interface AcceptQuotationResponse {
  success: boolean;
  message: string;
  checkoutUrl?: string;
  serviceOrder?: {
    id: string;
    businessId: string;
    status: string;
    scheduledAt?: string;
  };
}

interface ApiResponse<T> {
  success?: boolean;
  message?: string;
  data?: T;
}

function unwrapData<T>(response: ApiResponse<T> | T): T {
  if (response && typeof response === "object") {
    const resObj = response as Record<string, unknown>;
    if ("data" in resObj && resObj.data !== undefined) {
      return resObj.data as T;
    }
    if (
      "quotation" in resObj &&
      resObj.quotation !== undefined &&
      typeof resObj.quotation === "object"
    ) {
      return {
        ...(resObj.quotation as object),
        message: resObj.message,
        success: resObj.success,
      } as T;
    }
  }
  return response as T;
}

function unwrapPaginated<T>(
  response: ApiResponse<PaginatedResponse<T> | T[]> | PaginatedResponse<T> | T[]
): PaginatedResponse<T> {
  const unwrapped = unwrapData(response);
  if (Array.isArray(unwrapped)) {
    return {
      items: unwrapped,
      meta: {
        total: unwrapped.length,
        page: 1,
        limit: unwrapped.length || 10,
        totalPages: 1,
      },
    };
  }
  return unwrapped as PaginatedResponse<T>;
}

export const quotationsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAdminQuotations: builder.query<
      PaginatedResponse<AdminQuotation>,
      GetQuotationsParams | void
    >({
      query: (params) => ({
        url: "/quotations",
        params: params || undefined,
      }),
      transformResponse: (
        response:
          | ApiResponse<PaginatedResponse<AdminQuotation> | AdminQuotation[]>
          | PaginatedResponse<AdminQuotation>
          | AdminQuotation[]
      ) => {
        return unwrapPaginated(response);
      },
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ id }) => ({
                type: "Quotation" as const,
                id,
              })),
              { type: "Quotation", id: "ADMIN_LIST" },
            ]
          : [{ type: "Quotation", id: "ADMIN_LIST" }],
    }),
    getMyQuotations: builder.query<AdminQuotation[], void>({
      query: () => "/quotations/me",
      transformResponse: (
        response: ApiResponse<AdminQuotation[]> | AdminQuotation[]
      ) => {
        const unwrapped = unwrapData(response);
        if (Array.isArray(unwrapped)) {
          return unwrapped;
        }
        if (
          unwrapped &&
          typeof unwrapped === "object" &&
          "items" in unwrapped &&
          Array.isArray((unwrapped as { items: AdminQuotation[] }).items)
        ) {
          return (unwrapped as { items: AdminQuotation[] }).items;
        }
        return [];
      },
      providesTags: (result) =>
        Array.isArray(result)
          ? [
              ...result.map(({ id }) => ({
                type: "Quotation" as const,
                id,
              })),
              { type: "Quotation", id: "MY_LIST" },
            ]
          : [{ type: "Quotation", id: "MY_LIST" }],
    }),
    getQuotationById: builder.query<AdminQuotation, string>({
      query: (id) => `/quotations/${id}`,
      transformResponse: (
        response: ApiResponse<AdminQuotation> | AdminQuotation
      ) => {
        return unwrapData(response);
      },
      providesTags: (_result, _error, id) => [{ type: "Quotation", id }],
    }),
    createQuotation: builder.mutation<AdminQuotation, CreateQuotationRequest>({
      query: (body) => ({
        url: "/quotations",
        method: "POST",
        body,
      }),
      transformResponse: (
        response: ApiResponse<AdminQuotation> | AdminQuotation
      ) => {
        return unwrapData(response);
      },
      invalidatesTags: [
        { type: "Quotation", id: "ADMIN_LIST" },
        { type: "ServiceRequest" },
      ],
    }),
    reviseQuotation: builder.mutation<
      AdminQuotation,
      { id: string; body: Partial<CreateQuotationRequest> }
    >({
      query: ({ id, body }) => ({
        url: `/quotations/${id}`,
        method: "PATCH",
        body,
      }),
      transformResponse: (
        response: ApiResponse<AdminQuotation> | AdminQuotation
      ) => {
        return unwrapData(response);
      },
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
      transformResponse: (response: unknown) => {
        const raw =
          response && typeof response === "object"
            ? (response as Record<string, unknown>)
            : {};
        const data =
          raw.data && typeof raw.data === "object"
            ? (raw.data as Record<string, unknown>)
            : {};
        const quotation =
          raw.quotation && typeof raw.quotation === "object"
            ? (raw.quotation as Record<string, unknown>)
            : {};

        // Resiliently resolve checkoutUrl across any response structure
        const checkoutUrl =
          raw.checkoutUrl ||
          raw.checkout_url ||
          raw.checkoutURL ||
          raw.url ||
          raw.sessionUrl ||
          raw.session_url ||
          raw.stripeUrl ||
          raw.stripe_url ||
          data.checkoutUrl ||
          data.checkout_url ||
          data.checkoutURL ||
          data.url ||
          data.sessionUrl ||
          data.session_url ||
          data.stripeUrl ||
          data.stripe_url ||
          quotation.checkoutUrl ||
          quotation.checkout_url;

        const message =
          raw.message ||
          data.message ||
          "Quotation accepted successfully. Please complete payment to confirm your service order.";

        const success = raw.success ?? data.success ?? true;

        const serviceOrder = raw.serviceOrder || data.serviceOrder;

        return {
          ...data,
          ...raw,
          checkoutUrl: checkoutUrl ? String(checkoutUrl) : undefined,
          message: String(message),
          success: Boolean(success),
          serviceOrder: serviceOrder as AcceptQuotationResponse["serviceOrder"],
        };
      },
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Quotation", id },
        { type: "Quotation", id: "MY_LIST" },
        { type: "Quotation", id: "ADMIN_LIST" },
        { type: "ServiceOrder" },
        { type: "ServiceRequest" },
      ],
    }),
    rejectQuotation: builder.mutation<
      { success: boolean; message?: string },
      { id: string; reason: string }
    >({
      query: ({ id, reason }) => ({
        url: `/quotations/${id}/reject`,
        method: "POST",
        body: { reason },
      }),
      transformResponse: (
        response:
          | ApiResponse<{ success: boolean; message?: string }>
          | { success: boolean; message?: string }
      ) => {
        const data = unwrapData(response);
        return {
          success: (data as { success?: boolean })?.success ?? true,
          message:
            (data as { message?: string })?.message ||
            "Quotation rejected.",
        };
      },
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Quotation", id },
        { type: "Quotation", id: "MY_LIST" },
        { type: "Quotation", id: "ADMIN_LIST" },
        { type: "ServiceRequest" },
      ],
    }),
    deleteQuotation: builder.mutation<
      { success: boolean; message?: string },
      string
    >({
      query: (id) => ({
        url: `/quotations/${id}`,
        method: "DELETE",
      }),
      transformResponse: (
        response:
          | ApiResponse<{ success: boolean; message?: string }>
          | { success: boolean; message?: string }
      ) => {
        const data = unwrapData(response);
        return {
          success: (data as { success?: boolean })?.success ?? true,
          message:
            (data as { message?: string })?.message ||
            "Quotation deleted successfully.",
        };
      },
      invalidatesTags: [
        { type: "Quotation", id: "ADMIN_LIST" },
        { type: "Quotation", id: "MY_LIST" },
        { type: "ServiceRequest" },
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
  useDeleteQuotationMutation,
} = quotationsApi;
