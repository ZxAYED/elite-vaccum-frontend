import { baseApi } from "./baseApi";

export interface DeliveryAddressDto {
  id: string;
  label?: string;
  fullName?: string;
  line1: string;
  line2?: string;
  street?: string;
  apartment?: string;
  city: string;
  state: string;
  postalCode?: string;
  zipCode?: string;
  country?: string;
  phone?: string;
  isDefault?: boolean;
}

export type CreateAddressDto = Partial<DeliveryAddressDto> & {
  line1?: string;
  street?: string;
  city: string;
  state: string;
};

function normalizeAddress(raw: unknown): DeliveryAddressDto {
  const a = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const line1 = String(a.line1 || a.street || "");
  const line2 = a.line2 ? String(a.line2) : a.apartment ? String(a.apartment) : undefined;
  const postalCode = String(a.postalCode || a.zipCode || "");

  return {
    id: String(a.id || ""),
    label: a.label ? String(a.label) : a.fullName ? String(a.fullName) : "Delivery Address",
    fullName: a.fullName ? String(a.fullName) : a.label ? String(a.label) : undefined,
    line1,
    line2,
    street: line1,
    apartment: line2,
    city: String(a.city || ""),
    state: String(a.state || ""),
    postalCode,
    zipCode: postalCode,
    country: a.country ? String(a.country) : "USA",
    phone: a.phone ? String(a.phone) : undefined,
    isDefault: Boolean(a.isDefault),
  };
}

function normalizeAddressList(raw: unknown): DeliveryAddressDto[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map(normalizeAddress);
  if (typeof raw === "object" && "items" in raw && Array.isArray((raw as { items: unknown[] }).items)) {
    return (raw as { items: unknown[] }).items.map(normalizeAddress);
  }
  if (typeof raw === "object" && "data" in raw && Array.isArray((raw as { data: unknown[] }).data)) {
    return (raw as { data: unknown[] }).data.map(normalizeAddress);
  }
  return [];
}

export const addressesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSavedAddresses: builder.query<DeliveryAddressDto[], void>({
      query: () => "/store/addresses",
      transformResponse: normalizeAddressList,
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Address" as const, id })),
              { type: "Address", id: "LIST" },
            ]
          : [{ type: "Address", id: "LIST" }],
    }),
    createAddress: builder.mutation<DeliveryAddressDto, CreateAddressDto>({
      query: (body) => {
        const payload = {
          label: body.label || body.fullName || "Delivery Address",
          line1: body.line1 || body.street,
          line2: body.line2 || body.apartment || undefined,
          city: body.city,
          state: body.state,
          postalCode: body.postalCode || body.zipCode,
          country: body.country || "USA",
          isDefault: body.isDefault ?? false,
          phone: body.phone,
          fullName: body.fullName,
        };
        return {
          url: "/store/addresses",
          method: "POST",
          body: payload,
        };
      },
      transformResponse: normalizeAddress,
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
