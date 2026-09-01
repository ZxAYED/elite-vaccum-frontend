import { baseApi } from "./baseApi";
import type { PaginatedResponse } from "./types";
import type { DeliveryAddressDto } from "./addressesApi";

export interface StoreOrderItemDto {
  id: string;
  productId: string;
  name: string;
  sku: string;
  priceUsd: string;
  quantity: number;
  subtotalUsd: string;
  imageUrl?: string;
}

export interface StoreOrderDto {
  id: string;
  businessId: string;
  customerId: string;
  status: string;
  totalUsd: string;
  subtotalUsd: string;
  shippingFeeUsd: string;
  taxUsd: string;
  discountUsd?: string;
  deliveryAddress?: DeliveryAddressDto;
  shippingProvider?: string;
  trackingNumber?: string;
  customerNotes?: string;
  items: StoreOrderItemDto[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderRequest {
  deliveryAddressId: string;
  paymentMethod: "CARD" | "COD" | "CHECK" | "BANK_TRANSFER";
  customerNotes?: string;
}

export interface CreateOrderResponse {
  success: boolean;
  message: string;
  order: {
    id: string;
    businessId: string;
    status: string;
    totalUsd: string;
    subtotalUsd: string;
    shippingFeeUsd: string;
    taxUsd: string;
  };
  checkoutUrl?: string;
  stripeSessionId?: string;
}

export interface GetStoreOrdersParams {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
  from?: string;
  to?: string;
}

export interface ReturnOrderRequest {
  reason: string;
  customerNotes?: string;
}

export interface ReturnRecordDto {
  id: string;
  orderId: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "REFUNDED";
  reason: string;
  customerNotes?: string;
  adminNote?: string;
  createdAt: string;
}

export const ordersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createStoreOrder: builder.mutation<CreateOrderResponse, CreateOrderRequest>({
      query: (body) => ({
        url: "/store/orders",
        method: "POST",
        body,
      }),
      invalidatesTags: [
        { type: "Order", id: "LIST" },
        { type: "Cart" },
      ],
    }),
    getStripeCheckoutSession: builder.query<
      { checkoutUrl: string; sessionId: string },
      string
    >({
      query: (orderId) => `/store/orders/checkout/session/${orderId}`,
    }),
    getCustomerOrders: builder.query<PaginatedResponse<StoreOrderDto>, GetStoreOrdersParams | void>({
      query: (params) => ({
        url: "/store/orders",
        params: params || undefined,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ id }) => ({ type: "Order" as const, id })),
              { type: "Order", id: "CUSTOMER_LIST" },
            ]
          : [{ type: "Order", id: "CUSTOMER_LIST" }],
    }),
    getAdminOrdersList: builder.query<PaginatedResponse<StoreOrderDto>, GetStoreOrdersParams | void>({
      query: (params) => ({
        url: "/store/orders/admin/list",
        params: params || undefined,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ id }) => ({ type: "Order" as const, id })),
              { type: "Order", id: "ADMIN_LIST" },
            ]
          : [{ type: "Order", id: "ADMIN_LIST" }],
    }),
    getOrderById: builder.query<StoreOrderDto, string>({
      query: (id) => `/store/orders/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Order", id }],
    }),
    cancelOrder: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/store/orders/${id}/cancel`,
        method: "PATCH",
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: "Order", id },
        { type: "Order", id: "CUSTOMER_LIST" },
        { type: "Order", id: "ADMIN_LIST" },
      ],
    }),
    updateOrderStatus: builder.mutation<
      StoreOrderDto,
      {
        id: string;
        status: string;
        shippingProvider?: string;
        trackingNumber?: string;
        note?: string;
      }
    >({
      query: ({ id, ...body }) => ({
        url: `/store/orders/${id}/status`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Order", id },
        { type: "Order", id: "ADMIN_LIST" },
        { type: "Order", id: "CUSTOMER_LIST" },
      ],
    }),
    submitOrderReturn: builder.mutation<ReturnRecordDto, { orderId: string; body: ReturnOrderRequest }>({
      query: ({ orderId, body }) => ({
        url: `/store/returns/orders/${orderId}`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { orderId }) => [
        { type: "Order", id: orderId },
        { type: "Return", id: orderId },
      ],
    }),
    getReturnStatus: builder.query<ReturnRecordDto, string>({
      query: (orderId) => `/store/returns/orders/${orderId}`,
      providesTags: (_result, _error, orderId) => [{ type: "Return", id: orderId }],
    }),
    approveReturnRefund: builder.mutation<ReturnRecordDto, { orderId: string; adminNote?: string }>({
      query: ({ orderId, adminNote }) => ({
        url: `/store/returns/orders/${orderId}/refund`,
        method: "PATCH",
        body: { adminNote },
      }),
      invalidatesTags: (_result, _error, { orderId }) => [
        { type: "Order", id: orderId },
        { type: "Return", id: orderId },
      ],
    }),
    getOrderInvoice: builder.query<Record<string, unknown>, string>({
      query: (orderId) => `/store/invoices/orders/${orderId}`,
      providesTags: (_result, _error, orderId) => [{ type: "Invoice", id: orderId }],
    }),
  }),
});

export const {
  useCreateStoreOrderMutation,
  useGetStripeCheckoutSessionQuery,
  useGetCustomerOrdersQuery,
  useGetAdminOrdersListQuery,
  useGetOrderByIdQuery,
  useCancelOrderMutation,
  useUpdateOrderStatusMutation,
  useSubmitOrderReturnMutation,
  useGetReturnStatusQuery,
  useApproveReturnRefundMutation,
  useGetOrderInvoiceQuery,
} = ordersApi;
