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
  if (typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    if (Array.isArray(obj.items)) return obj.items.map(normalizeAddress);
    if (Array.isArray(obj.addresses)) return obj.addresses.map(normalizeAddress);
    if (Array.isArray(obj.data)) return obj.data.map(normalizeAddress);
    if (obj.data && typeof obj.data === "object") {
      const inner = obj.data as Record<string, unknown>;
      if (Array.isArray(inner.items)) return inner.items.map(normalizeAddress);
      if (Array.isArray(inner.addresses)) return inner.addresses.map(normalizeAddress);
    }
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
        const payload: Record<string, unknown> = {
          label: body.label || body.fullName || "Delivery Address",
          line1: body.line1 || body.street || "",
          city: body.city,
          state: body.state,
          postalCode: body.postalCode || body.zipCode || "",
          country: body.country || "USA",
          isDefault: Boolean(body.isDefault),
        };
        const line2 = body.line2 || body.apartment;
        if (line2 && line2.trim()) {
          payload.line2 = line2.trim();
        }
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
      { id: string; data: Partial<CreateAddressDto> }
    >({
      query: ({ id, data }) => {
        const payload: Record<string, unknown> = {};
        if (data.label !== undefined) payload.label = data.label;
        if (data.line1 !== undefined || data.street !== undefined) {
          payload.line1 = data.line1 || data.street;
        }
        const line2 = data.line2 || data.apartment;
        if (line2 !== undefined) {
          if (line2.trim()) payload.line2 = line2.trim();
        }
        if (data.city !== undefined) payload.city = data.city;
        if (data.state !== undefined) payload.state = data.state;
        if (data.postalCode !== undefined || data.zipCode !== undefined) {
          payload.postalCode = data.postalCode || data.zipCode;
        }
        if (data.country !== undefined) payload.country = data.country;
        if (data.isDefault !== undefined) payload.isDefault = Boolean(data.isDefault);

        return {
          url: `/store/addresses/${id}`,
          method: "PATCH",
          body: payload,
        };
      },
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
