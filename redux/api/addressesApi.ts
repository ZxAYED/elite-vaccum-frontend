import { baseApi } from "./baseApi";

export interface DeliveryAddressDto {
  id: string;
  fullName: string;
  street: string;
  apartment?: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  isDefault?: boolean;
}

export const addressesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSavedAddresses: builder.query<DeliveryAddressDto[], void>({
      query: () => "/store/addresses",
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Address" as const, id })),
              { type: "Address", id: "LIST" },
            ]
          : [{ type: "Address", id: "LIST" }],
    }),
    createAddress: builder.mutation<DeliveryAddressDto, Omit<DeliveryAddressDto, "id">>({
      query: (body) => ({
        url: "/store/addresses",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Address", id: "LIST" }],
    }),
    updateAddress: builder.mutation<
      DeliveryAddressDto,
      { id: string; data: Partial<DeliveryAddressDto> }
    >({
      query: ({ id, data }) => ({
        url: `/store/addresses/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Address", id },
        { type: "Address", id: "LIST" },
      ],
    }),
    setDefaultAddress: builder.mutation<DeliveryAddressDto, string>({
      query: (id) => ({
        url: `/store/addresses/${id}/set-default`,
        method: "PATCH",
      }),
      invalidatesTags: [{ type: "Address", id: "LIST" }],
    }),
    deleteAddress: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/store/addresses/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: "Address", id },
        { type: "Address", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetSavedAddressesQuery,
  useCreateAddressMutation,
  useUpdateAddressMutation,
  useSetDefaultAddressMutation,
  useDeleteAddressMutation,
} = addressesApi;
