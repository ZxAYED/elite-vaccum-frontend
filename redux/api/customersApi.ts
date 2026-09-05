import { baseApi } from "./baseApi";
import type { Customer } from "@/types/domain";
import type { PaginatedResponse } from "./types";

export interface GetCustomersParams {
  search?: string;
  email?: string;
  phone?: string;
  cellphone?: string;
  fullName?: string;
  status?: string;
  page?: number;
  limit?: number;
}

function unwrapCustomersResponse(raw: unknown): PaginatedResponse<Customer> {
  if (!raw || typeof raw !== "object") {
    return { items: [], meta: { page: 1, limit: 20, total: 0, totalPages: 0 } };
  }

  const payload = raw as Record<string, unknown>;
  const data = (payload.data && typeof payload.data === "object" ? payload.data : payload) as Record<string, unknown>;

  let items: Customer[] = [];
  if (Array.isArray(data)) {
    items = data as Customer[];
  } else if (Array.isArray(data.items)) {
    items = data.items as Customer[];
  } else if (Array.isArray(payload.items)) {
    items = payload.items as Customer[];
  }

  const rawMeta = (data.meta || payload.meta) as Record<string, unknown> | undefined;
  const meta = {
    page: Number(rawMeta?.currentPage ?? rawMeta?.page ?? 1),
    limit: Number(rawMeta?.perPage ?? rawMeta?.limit ?? 20),
    total: Number(rawMeta?.totalItems ?? rawMeta?.total ?? items.length),
    totalPages: Number(rawMeta?.totalPages ?? 1),
  };

  return { items, meta };
}

function unwrapSingleCustomer(raw: unknown): Customer {
  if (raw && typeof raw === "object" && "data" in raw && raw.data) {
    return raw.data as Customer;
  }
  return raw as Customer;
}

export const customersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCustomers: builder.query<PaginatedResponse<Customer>, GetCustomersParams | void>({
      query: (params) => ({
        url: "/customers",
        params: params || undefined,
      }),
      transformResponse: unwrapCustomersResponse,
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ id }) => ({ type: "Customer" as const, id })),
              { type: "Customer", id: "LIST" },
            ]
          : [{ type: "Customer", id: "LIST" }],
    }),
    getCustomerById: builder.query<Customer, string>({
      query: (id) => `/customers/${id}`,
      transformResponse: unwrapSingleCustomer,
      providesTags: (_result, _error, id) => [{ type: "Customer", id }],
    }),
    updateCustomerProfile: builder.mutation<
      Customer,
      { id: string; data: Partial<Customer> }
    >({
      query: ({ id, data }) => ({
        url: `/customers/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Customer", id },
        { type: "Customer", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetCustomersQuery,
  useGetCustomerByIdQuery,
  useUpdateCustomerProfileMutation,
} = customersApi;
