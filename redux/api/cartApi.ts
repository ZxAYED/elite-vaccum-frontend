import { baseApi } from "./baseApi";

export interface CartItemDto {
  id: string;
  productId: string;
  name: string;
  sku: string;
  priceUsd: string;
  quantity: number;
  subtotalUsd: string;
  imageUrl?: string;
  stockAvailable?: number;
  isAvailable?: boolean;
}

export interface CartSummaryDto {
  itemCount: number;
  totalUnits: number;
  subtotalUsd: string;
  estimatedShippingUsd: string;
  freeShippingThreshold: string;
  qualifiesForFreeShipping: boolean;
  amountNeededForFreeShipping: string;
  estimatedTaxUsd: string;
  estimatedTotalUsd: string;
}

export interface ActiveCartDto {
  id: string;
  items: CartItemDto[];
  summary: CartSummaryDto;
}

export interface AddToCartRequest {
  productId: string;
  quantity: number;
}

export interface UpdateCartItemRequest {
  itemId: string;
  quantity: number;
}

export interface CartValidationResponse {
  isValid: boolean;
  invalidItems: Array<{ productId: string; reason: string }>;
}

function unwrapCartResponse(raw: unknown): ActiveCartDto {
  if (!raw || typeof raw !== "object") {
    return {
      id: "cart-default",
      items: [],
      summary: {
        itemCount: 0,
        totalUnits: 0,
        subtotalUsd: "0.00",
        estimatedShippingUsd: "0.00",
        freeShippingThreshold: "150.00",
        qualifiesForFreeShipping: false,
        amountNeededForFreeShipping: "150.00",
        estimatedTaxUsd: "0.00",
        estimatedTotalUsd: "0.00",
      },
    };
  }
  const payload = raw as Record<string, unknown>;
  const data = (payload.data && typeof payload.data === "object" ? payload.data : payload) as ActiveCartDto;
  return data;
}

export const cartApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getActiveCart: builder.query<ActiveCartDto, void>({
      query: () => "/store/cart",
      transformResponse: unwrapCartResponse,
      providesTags: ["Cart"],
    }),
    getCartCount: builder.query<{ success: boolean; count: number }, void>({
      query: () => "/store/cart/count",
      providesTags: ["Cart"],
    }),
    addItemToCart: builder.mutation<ActiveCartDto, AddToCartRequest>({
      query: (body) => ({
        url: "/store/cart/items",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Cart"],
    }),
    updateCartItemQuantity: builder.mutation<ActiveCartDto, UpdateCartItemRequest>({
      query: ({ itemId, quantity }) => ({
        url: `/store/cart/items/${itemId}`,
        method: "PATCH",
        body: { quantity },
      }),
      invalidatesTags: ["Cart"],
    }),
    removeCartItem: builder.mutation<ActiveCartDto, string>({
      query: (itemId) => ({
        url: `/store/cart/items/${itemId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Cart"],
    }),
    clearServerCart: builder.mutation<{ success: boolean }, void>({
      query: () => ({
        url: "/store/cart",
        method: "DELETE",
      }),
      invalidatesTags: ["Cart"],
    }),
    validateCart: builder.mutation<CartValidationResponse, void>({
      query: () => ({
        url: "/store/cart/validate",
        method: "POST",
      }),
    }),
  }),
});

export const {
  useGetActiveCartQuery,
  useGetCartCountQuery,
  useAddItemToCartMutation,
  useUpdateCartItemQuantityMutation,
  useRemoveCartItemMutation,
  useClearServerCartMutation,
  useValidateCartMutation,
} = cartApi;
