import { baseApi } from "./baseApi";
import type { Payment } from "@/types/domain";
import type { PaginatedResponse } from "./types";

export interface InvoiceLineItemDto {
  description: string;
  quantity: number;
  unitPriceUsd: number;
  totalUsd: number;
}

export interface InvoiceDto {
  id: string;
  businessId: string;
  orderId?: string;
  serviceOrderId?: string;
  customerId: string;
  status: "DRAFT" | "SENT" | "PAID" | "OVERDUE" | "CANCELLED" | "REFUNDED";
  subtotalUsd: string | number;
  taxUsd: string | number;
  discountUsd?: string | number;
  totalUsd: string | number;
  lineItems: InvoiceLineItemDto[];
  dueDate?: string;
  paidAt?: string;
  createdAt: string;
}

export interface GetInvoicesParams {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface RecordOfflinePaymentRequest {
  amountUsd: number;
  method: "CASH" | "CHECK" | "BANK_TRANSFER" | "OTHER";
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
      providesTags: (_result, _error, id) => [{ type: "Invoice", id }],
    }),
    getInvoiceHtml: builder.query<string, string>({
      query: (id) => ({
        url: `/billing/invoices/${id}/html`,
        responseHandler: (response) => response.text(),
      }),
    }),
    createInvoice: builder.mutation<InvoiceDto, Partial<InvoiceDto>>({
      query: (body) => ({
        url: "/billing/invoices",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Invoice", id: "ADMIN_LIST" }],
    }),
    updateInvoice: builder.mutation<InvoiceDto, { id: string; body: Partial<InvoiceDto> }>({
      query: ({ id, body }) => ({
        url: `/billing/invoices/${id}`,
        method: "PATCH",
        body,
      }),
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
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Invoice", id },
        { type: "Payment", id: "LIST" },
      ],
    }),
    recordInvoiceRefund: builder.mutation<Payment, { id: string; body: RecordRefundRequest }>({
      query: ({ id, body }) => ({
        url: `/billing/invoices/${id}/refunds`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Invoice", id },
        { type: "Payment", id: "LIST" },
      ],
    }),
    createStripePaymentIntent: builder.mutation<{ clientSecret: string }, string>({
      query: (invoiceId) => ({
        url: `/billing/invoices/${invoiceId}/stripe/payment-intent`,
        method: "POST",
      }),
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
      invalidatesTags: (_result, _error, { invoiceId }) => [
        { type: "Invoice", id: invoiceId },
        { type: "Invoice", id: "MY_LIST" },
        { type: "Invoice", id: "ADMIN_LIST" },
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
