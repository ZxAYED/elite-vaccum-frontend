import { baseApi } from "./baseApi";
import type { CustomerReview, ReviewStatus } from "@/types/domain";
import type { PaginatedResponse } from "./types";

export interface RatingSummary {
  averageRating: number;
  totalReviews: number;
  distribution: Record<string, number>;
}

export interface PublicReviewsResponse {
  ratingSummary: RatingSummary;
  items: CustomerReview[];
}

export interface SubmitReviewRequest {
  type: "PRODUCT" | "SERVICE";
  rating: number;
  title: string;
  body: string;
  comment?: string;
  productId?: string;
  productOrderId?: string;
  serviceOrderId?: string;
  orderId?: string;
}

export interface GetAdminReviewsParams {
  status?: ReviewStatus;
  type?: "PRODUCT" | "SERVICE";
  rating?: number;
  search?: string;
  page?: number;
  limit?: number;
}

function unwrapPublicReviews(raw: unknown): PublicReviewsResponse {
  if (!raw || typeof raw !== "object") {
    return {
      ratingSummary: { averageRating: 5.0, totalReviews: 0, distribution: { "5": 0, "4": 0, "3": 0, "2": 0, "1": 0 } },
      items: [],
    };
  }
  const obj = raw as Record<string, unknown>;
  const rawItems = Array.isArray(obj.items)
    ? obj.items
    : Array.isArray(raw)
    ? raw
    : [];

  const summary = (obj.ratingSummary || obj.summary) as RatingSummary | undefined;
  const ratingSummary: RatingSummary = summary || {
    averageRating: 4.9,
    totalReviews: rawItems.length,
    distribution: { "5": rawItems.length, "4": 0, "3": 0, "2": 0, "1": 0 },
  };

  return { ratingSummary, items: rawItems as CustomerReview[] };
}

function unwrapAdminReviews(raw: unknown): PaginatedResponse<CustomerReview> {
  if (!raw || typeof raw !== "object") {
    return { items: [], meta: { page: 1, limit: 20, total: 0, totalPages: 0 } };
  }
  const obj = raw as Record<string, unknown>;
  const rawItems = Array.isArray(obj.items)
    ? obj.items
    : Array.isArray(raw)
    ? raw
    : [];

  const meta =
    obj.meta && typeof obj.meta === "object"
      ? (obj.meta as PaginatedResponse<CustomerReview>["meta"])
      : { page: 1, limit: 20, total: rawItems.length, totalPages: 1 };

  return { items: rawItems as CustomerReview[], meta };
}

export interface ReviewedProductItem {
  review: {
    id: string;
    rating: number;
    title: string;
    body: string;
    status: ReviewStatus;
    submittedAt: string;
    publishedAt?: string;
  };
  product: {
    id: string;
    name: string;
    sku?: string;
    model?: string;
    priceUsd?: number;
  };
  order?: {
    id: string;
    status?: string;
    totalUsd?: number;
    placedAt?: string;
  };
}

export interface MyReviewedProductsResponse {
  items: ReviewedProductItem[];
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CheckProductReviewResponse {
  hasReviewed: boolean;
  product?: {
    id: string;
    name: string;
    sku?: string;
    priceUsd?: number;
  };
  review?: {
    id: string;
    rating: number;
    title: string;
    body: string;
    status: ReviewStatus;
  } | null;
}

export const reviewsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPublicReviews: builder.query<PublicReviewsResponse, void>({
      query: () => "/reviews",
      transformResponse: unwrapPublicReviews,
      providesTags: [{ type: "Review", id: "PUBLIC_LIST" }],
    }),
    getMyReviews: builder.query<CustomerReview[], { type?: "PRODUCT" | "SERVICE"; rating?: number } | void>({
      query: (params) => ({
        url: "/reviews/me",
        params: params || undefined,
      }),
      transformResponse: (raw: unknown) => {
        if (Array.isArray(raw)) return raw as CustomerReview[];
        if (raw && typeof raw === "object") {
          const obj = raw as Record<string, unknown>;
          if (Array.isArray(obj.items)) return obj.items as CustomerReview[];
        }
        return [];
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Review" as const, id })),
              { type: "Review", id: "MY_LIST" },
            ]
          : [{ type: "Review", id: "MY_LIST" }],
    }),
    getMyReviewedProducts: builder.query<MyReviewedProductsResponse, { rating?: number; page?: number; limit?: number } | void>({
      query: (params) => ({
        url: "/reviews/me/products",
        params: params || undefined,
      }),
      providesTags: [{ type: "Review", id: "MY_PRODUCTS" }],
    }),
    checkProductReview: builder.query<CheckProductReviewResponse, string>({
      query: (productId) => `/reviews/products/${productId}/me`,
      providesTags: (_result, _error, id) => [{ type: "Review", id: `PRODUCT_${id}` }],
    }),
    submitReview: builder.mutation<CustomerReview, SubmitReviewRequest>({
      query: (body) => ({
        url: "/reviews",
        method: "POST",
        body,
      }),
      invalidatesTags: [
        { type: "Review", id: "PUBLIC_LIST" },
        { type: "Review", id: "MY_LIST" },
        { type: "Review", id: "MY_PRODUCTS" },
        { type: "Review", id: "ADMIN_LIST" },
      ],
    }),
    getAdminReviews: builder.query<PaginatedResponse<CustomerReview>, GetAdminReviewsParams | void>({
      query: (params) => ({
        url: "/reviews/admin/all",
        params: params || undefined,
      }),
      transformResponse: unwrapAdminReviews,
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ id }) => ({ type: "Review" as const, id })),
              { type: "Review", id: "ADMIN_LIST" },
            ]
          : [{ type: "Review", id: "ADMIN_LIST" }],
    }),
    moderateReview: builder.mutation<
      CustomerReview,
      { id: string; status: ReviewStatus; reason?: string }
    >({
      query: ({ id, ...body }) => ({
        url: `/reviews/${id}/moderate`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Review", id },
        { type: "Review", id: "ADMIN_LIST" },
        { type: "Review", id: "PUBLIC_LIST" },
        { type: "Review", id: "MY_LIST" },
      ],
    }),
    deleteReview: builder.mutation<{ success: boolean; id: string }, string>({
      query: (id) => ({
        url: `/reviews/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: "Review", id },
        { type: "Review", id: "ADMIN_LIST" },
        { type: "Review", id: "PUBLIC_LIST" },
        { type: "Review", id: "MY_LIST" },
      ],
    }),
  }),
});

export const {
  useGetPublicReviewsQuery,
  useGetMyReviewsQuery,
  useGetMyReviewedProductsQuery,
  useCheckProductReviewQuery,
  useSubmitReviewMutation,
  useGetAdminReviewsQuery,
  useModerateReviewMutation,
  useDeleteReviewMutation,
} = reviewsApi;
