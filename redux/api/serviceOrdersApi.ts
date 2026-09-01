import { baseApi } from "./baseApi";
import type { AdminServiceOrder } from "@/types/domain";
import type { PaginatedResponse } from "./types";

export interface GetServiceOrdersParams {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

interface ApiResponse<T> {
  success?: boolean;
  message?: string;
  data?: T;
}

function unwrapData<T>(response: ApiResponse<T> | T): T {
  if (
    response &&
    typeof response === "object" &&
    "data" in response &&
    response.data !== undefined
  ) {
    return response.data as T;
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

export const serviceOrdersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAdminServiceOrders: builder.query<PaginatedResponse<AdminServiceOrder>, GetServiceOrdersParams | void>({
      query: (params) => ({
        url: "/service-orders",
        params: params || undefined,
      }),
      transformResponse: (
        response:
          | ApiResponse<PaginatedResponse<AdminServiceOrder> | AdminServiceOrder[]>
          | PaginatedResponse<AdminServiceOrder>
          | AdminServiceOrder[]
      ) => {
        return unwrapPaginated(response);
      },
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ id }) => ({ type: "ServiceOrder" as const, id })),
              { type: "ServiceOrder", id: "ADMIN_LIST" },
            ]
          : [{ type: "ServiceOrder", id: "ADMIN_LIST" }],
    }),
    getMyServiceOrders: builder.query<PaginatedResponse<AdminServiceOrder>, GetServiceOrdersParams | void>({
      query: (params) => ({
        url: "/service-orders/me",
        params: params || undefined,
      }),
      transformResponse: (
        response:
          | ApiResponse<PaginatedResponse<AdminServiceOrder> | AdminServiceOrder[]>
          | PaginatedResponse<AdminServiceOrder>
          | AdminServiceOrder[]
      ) => {
        return unwrapPaginated(response);
      },
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ id }) => ({ type: "ServiceOrder" as const, id })),
              { type: "ServiceOrder", id: "MY_LIST" },
            ]
          : [{ type: "ServiceOrder", id: "MY_LIST" }],
    }),
    getServiceOrderById: builder.query<AdminServiceOrder, string>({
      query: (id) => `/service-orders/${id}`,
      transformResponse: (response: ApiResponse<AdminServiceOrder> | AdminServiceOrder) => {
        return unwrapData(response);
      },
      providesTags: (_result, _error, id) => [{ type: "ServiceOrder", id }],
    }),
    createServiceOrder: builder.mutation<AdminServiceOrder, Partial<AdminServiceOrder>>({
      query: (body) => ({
        url: "/service-orders",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "ServiceOrder", id: "ADMIN_LIST" }],
    }),
    updateServiceOrder: builder.mutation<AdminServiceOrder, { id: string; body: Partial<AdminServiceOrder> }>({
      query: ({ id, body }) => ({
        url: `/service-orders/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "ServiceOrder", id },
        { type: "ServiceOrder", id: "ADMIN_LIST" },
        { type: "ServiceOrder", id: "MY_LIST" },
      ],
    }),
    updateServiceOrderStatus: builder.mutation<
      AdminServiceOrder,
      { id: string; status: string; note?: string }
    >({
      query: ({ id, ...body }) => ({
        url: `/service-orders/${id}/status`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "ServiceOrder", id },
        { type: "ServiceOrder", id: "ADMIN_LIST" },
        { type: "ServiceOrder", id: "MY_LIST" },
      ],
    }),
    assignTechnicianToServiceOrder: builder.mutation<AdminServiceOrder, { id: string; technicianId: string }>({
      query: ({ id, technicianId }) => ({
        url: `/service-orders/${id}/assign`,
        method: "POST",
        body: { technicianId },
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "ServiceOrder", id },
        { type: "ServiceOrder", id: "ADMIN_LIST" },
      ],
    }),
    updateServiceOrderEta: builder.mutation<{ success: boolean; etaMinutes: number }, { id: string; minutes: number; note?: string }>({
      query: ({ id, ...body }) => ({
        url: `/service-orders/${id}/eta`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: "ServiceOrder", id }],
    }),
  }),
});

export const {
  useGetAdminServiceOrdersQuery,
  useGetMyServiceOrdersQuery,
  useGetServiceOrderByIdQuery,
  useCreateServiceOrderMutation,
  useUpdateServiceOrderMutation,
  useUpdateServiceOrderStatusMutation,
  useAssignTechnicianToServiceOrderMutation,
  useUpdateServiceOrderEtaMutation,
} = serviceOrdersApi;
