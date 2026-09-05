import { baseApi } from "./baseApi";
import type { Payment } from "@/types/domain";
import type { PaginatedResponse } from "./types";

interface ApiResponse<T> {
  success?: boolean;
  message?: string;
  data?: T;
}

function unwrapData<T>(response: ApiResponse<T> | T): T {
  if (response && typeof response === "object") {
    const resObj = response as unknown as Record<string, unknown>;
    if ("data" in resObj && resObj.data !== undefined && resObj.data !== null) {
      return resObj.data as T;
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
  if (unwrapped && typeof unwrapped === "object") {
    const obj = unwrapped as unknown as Record<string, unknown>;
    const metaObj =
      obj.meta && typeof obj.meta === "object"
        ? (obj.meta as Record<string, unknown>)
        : {};

    if (Array.isArray(obj.items)) {
      return {
        items: obj.items as T[],
        meta: {
          total: (metaObj.total as number) ?? (obj.total as number) ?? (obj.items as T[]).length,
          page: (metaObj.page as number) ?? (obj.page as number) ?? 1,
          limit: (metaObj.limit as number) ?? (obj.limit as number) ?? (obj.items as T[]).length,
          totalPages: (metaObj.totalPages as number) ?? (obj.totalPages as number) ?? 1,
          hasNextPage: metaObj.hasNextPage as boolean | undefined,
          hasPreviousPage: metaObj.hasPreviousPage as boolean | undefined,
        },
      };
    }
    if (Array.isArray(obj.data)) {
      return {
        items: obj.data as T[],
        meta: {
          total: (metaObj.total as number) ?? (obj.total as number) ?? (obj.data as T[]).length,
          page: (metaObj.page as number) ?? (obj.page as number) ?? 1,
          limit: (metaObj.limit as number) ?? (obj.limit as number) ?? (obj.data as T[]).length,
          totalPages: (metaObj.totalPages as number) ?? (obj.totalPages as number) ?? 1,
        },
      };
    }
  }
  return {
    items: [],
    meta: {
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0,
    },
  };
}

export interface InvoiceLineItemDto {
  description: string;
  quantity: number;
  unitPriceUsd: number;
  totalUsd?: number;
}

export interface InvoiceDto {
  id: string;
  businessId: string;
  orderId?: string;
  serviceOrderId?: string;
  customerId: string;
  type?: "SERVICE" | "PRODUCT" | string;
  status: "DRAFT" | "SENT" | "PAID" | "OVERDUE" | "CANCELLED" | "REFUNDED" | string;
  subtotalUsd: string | number;
  taxUsd: string | number;
  discountUsd?: string | number;
  totalUsd: string | number;
  lineItems: InvoiceLineItemDto[];
  dueDate?: string;
  paidAt?: string;
  notes?: string;
  customer?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  payments?: Payment[];
  refunds?: {
    id: string;
    paymentId: string;
    amountUsd: number;
    reason?: string;
    createdAt?: string;
  }[];
  createdAt: string;
  updatedAt?: string;
}

export interface GetInvoicesParams {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CreateInvoiceRequest {
  customerId: string;
  serviceOrderId?: string;
  orderId?: string;
  lineItems: {
    description: string;
    quantity: number;
    unitPriceUsd: number;
  }[];
  discountUsd?: number;
  taxUsd?: number;
  notes?: string;
  dueDays?: number;
}

export interface RecordOfflinePaymentRequest {
  amountUsd: number;
  methodLabel?: string;
  method?: "CASH" | "CHECK" | "BANK_TRANSFER" | "OTHER" | string;
  transactionReference?: string;
  reference?: string;
}

export interface RecordRefundRequest {
  paymentId: string;
  amountUsd: number;
  reason?: string;
}

export const billingApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAdminInvoices: builder.query<PaginatedResponse<InvoiceDto>, GetInvoicesParams | void>({
      query: (params) => ({
        url: "/billing/invoices",
        params: params || undefined,
      }),
      transformResponse: (
        response: ApiResponse<PaginatedResponse<InvoiceDto> | InvoiceDto[]> | PaginatedResponse<InvoiceDto> | InvoiceDto[]
      ) => unwrapPaginated(response),
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ id }) => ({ type: "Invoice" as const, id })),
              { type: "Invoice", id: "ADMIN_LIST" },
            ]
          : [{ type: "Invoice", id: "ADMIN_LIST" }],
    }),
    getMyInvoices: builder.query<PaginatedResponse<InvoiceDto>, GetInvoicesParams | void>({
      query: (params) => ({
        url: "/billing/invoices/me",
        params: params || undefined,
      }),
      transformResponse: (
        response: ApiResponse<PaginatedResponse<InvoiceDto> | InvoiceDto[]> | PaginatedResponse<InvoiceDto> | InvoiceDto[]
      ) => unwrapPaginated(response),
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ id }) => ({ type: "Invoice" as const, id })),
              { type: "Invoice", id: "MY_LIST" },
            ]
          : [{ type: "Invoice", id: "MY_LIST" }],
    }),
    getInvoiceById: builder.query<InvoiceDto, string>({
      query: (id) => `/billing/invoices/${id}`,
      transformResponse: (response: ApiResponse<InvoiceDto> | InvoiceDto) => unwrapData(response),
      providesTags: (_result, _error, id) => [{ type: "Invoice", id }],
    }),
    getInvoiceHtml: builder.query<string, string>({
      query: (id) => ({
        url: `/billing/invoices/${id}/html`,
        responseHandler: (response) => response.text(),
      }),
    }),
    createInvoice: builder.mutation<InvoiceDto, CreateInvoiceRequest | Partial<InvoiceDto>>({
      query: (body) => ({
        url: "/billing/invoices",
        method: "POST",
        body,
      }),
      transformResponse: (response: ApiResponse<InvoiceDto> | InvoiceDto) => unwrapData(response),
      invalidatesTags: [
        { type: "Invoice", id: "ADMIN_LIST" },
        { type: "Invoice", id: "MY_LIST" },
      ],
    }),
    updateInvoice: builder.mutation<InvoiceDto, { id: string; body: Partial<InvoiceDto> }>({
      query: ({ id, body }) => ({
        url: `/billing/invoices/${id}`,
        method: "PATCH",
        body,
      }),
      transformResponse: (response: ApiResponse<InvoiceDto> | InvoiceDto) => unwrapData(response),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Invoice", id },
        { type: "Invoice", id: "ADMIN_LIST" },
        { type: "Invoice", id: "MY_LIST" },
      ],
    }),
    recordOfflinePayment: builder.mutation<Payment, { id: string; body: RecordOfflinePaymentRequest }>({
      query: ({ id, body }) => ({
        url: `/billing/invoices/${id}/payments`,
        method: "POST",
        body: {
          amountUsd: body.amountUsd,
          methodLabel: body.methodLabel || body.method || "Cash",
          method: body.method || body.methodLabel || "CASH",
          transactionReference: body.transactionReference || body.reference || "Offline payment",
          reference: body.reference || body.transactionReference || "Offline payment",
        },
      }),
      transformResponse: (response: ApiResponse<Payment> | Payment) => unwrapData(response),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Invoice", id },
        { type: "Invoice", id: "ADMIN_LIST" },
        { type: "Invoice", id: "MY_LIST" },
        { type: "Payment", id: "LIST" },
      ],
    }),
    recordInvoiceRefund: builder.mutation<Payment, { id: string; body: RecordRefundRequest }>({
      query: ({ id, body }) => ({
        url: `/billing/invoices/${id}/refunds`,
        method: "POST",
        body,
      }),
      transformResponse: (response: ApiResponse<Payment> | Payment) => unwrapData(response),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Invoice", id },
        { type: "Invoice", id: "ADMIN_LIST" },
        { type: "Invoice", id: "MY_LIST" },
        { type: "Payment", id: "LIST" },
      ],
    }),
    createStripePaymentIntent: builder.mutation<{ clientSecret: string }, string>({
      query: (invoiceId) => ({
        url: `/billing/invoices/${invoiceId}/stripe/payment-intent`,
        method: "POST",
      }),
      transformResponse: (
        response: ApiResponse<{ clientSecret: string }> | { clientSecret: string }
      ) => {
        const unwrapped = unwrapData(response);
        return {
          clientSecret:
            (unwrapped as { clientSecret?: string })?.clientSecret ||
            (response as { clientSecret?: string })?.clientSecret ||
            "",
        };
      },
    }),
    confirmStripePayment: builder.mutation<
      { success: boolean; message: string },
      { invoiceId: string; paymentIntentId: string }
    >({
      query: ({ invoiceId, paymentIntentId }) => ({
        url: `/billing/invoices/${invoiceId}/stripe/confirm`,
        method: "POST",
        body: { paymentIntentId },
      }),
      transformResponse: (
        response: ApiResponse<{ success: boolean; message: string }> | { success: boolean; message: string }
      ) => {
        const unwrapped = unwrapData(response);
        return {
          success: (unwrapped as { success?: boolean })?.success ?? true,
          message:
            (unwrapped as { message?: string })?.message ||
            (response as { message?: string })?.message ||
            "Payment confirmed.",
        };
      },
      invalidatesTags: (_result, _error, { invoiceId }) => [
        { type: "Invoice", id: invoiceId },
        { type: "Invoice", id: "MY_LIST" },
        { type: "Invoice", id: "ADMIN_LIST" },
        { type: "Payment", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetAdminInvoicesQuery,
  useGetMyInvoicesQuery,
  useGetInvoiceByIdQuery,
  useGetInvoiceHtmlQuery,
  useCreateInvoiceMutation,
  useUpdateInvoiceMutation,
  useRecordOfflinePaymentMutation,
  useRecordInvoiceRefundMutation,
  useCreateStripePaymentIntentMutation,
  useConfirmStripePaymentMutation,
} = billingApi;
