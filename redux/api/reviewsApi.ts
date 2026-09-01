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
  serviceOrderId?: string;
  orderId?: string;
  rating: number;
  title: string;
  comment: string;
}

export interface GetAdminReviewsParams {
  status?: ReviewStatus;
  search?: string;
  page?: number;
  limit?: number;
}

export const reviewsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPublicReviews: builder.query<PublicReviewsResponse, void>({
      query: () => "/reviews",
      providesTags: [{ type: "Review", id: "PUBLIC_LIST" }],
    }),
    getMyReviews: builder.query<CustomerReview[], void>({
      query: () => "/reviews/me",
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Review" as const, id })),
              { type: "Review", id: "MY_LIST" },
            ]
          : [{ type: "Review", id: "MY_LIST" }],
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
        { type: "Review", id: "ADMIN_LIST" },
      ],
    }),
    getAdminReviews: builder.query<PaginatedResponse<CustomerReview>, GetAdminReviewsParams | void>({
      query: (params) => ({
        url: "/reviews/admin/all",
        params: params || undefined,
      }),
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
      ],
    }),
  }),
});

export const {
  useGetPublicReviewsQuery,
  useGetMyReviewsQuery,
  useSubmitReviewMutation,
  useGetAdminReviewsQuery,
  useModerateReviewMutation,
  useDeleteReviewMutation,
} = reviewsApi;
