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

export const customersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCustomers: builder.query<PaginatedResponse<Customer>, GetCustomersParams | void>({
      query: (params) => ({
        url: "/customers",
        params: params || undefined,
      }),
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
