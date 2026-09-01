import { baseApi } from "./baseApi";
import type { ServiceRequest, ServiceRequestStatus } from "@/types/domain";
import type { PaginatedResponse } from "./types";

export interface GetServiceRequestsParams {
  search?: string;
  status?: string;
  urgency?: string;
  page?: number;
  limit?: number;
}

export interface RejectServiceRequestDto {
  reason: string;
  comments?: string;
}

export const serviceRequestsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    submitServiceRequest: builder.mutation<ServiceRequest, FormData | Record<string, unknown>>({
      query: (body) => ({
        url: "/service-requests",
        method: "POST",
        body,
      }),
      invalidatesTags: [
        { type: "ServiceRequest", id: "LIST" },
        { type: "ServiceRequest", id: "ME" },
      ],
    }),
    getMyServiceRequests: builder.query<PaginatedResponse<ServiceRequest>, GetServiceRequestsParams | void>({
      query: (params) => ({
        url: "/service-requests/me",
        params: params || undefined,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ id }) => ({ type: "ServiceRequest" as const, id })),
              { type: "ServiceRequest", id: "ME" },
            ]
          : [{ type: "ServiceRequest", id: "ME" }],
    }),
    getAdminServiceRequests: builder.query<PaginatedResponse<ServiceRequest>, GetServiceRequestsParams | void>({
      query: (params) => ({
        url: "/service-requests",
        params: params || undefined,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ id }) => ({ type: "ServiceRequest" as const, id })),
              { type: "ServiceRequest", id: "LIST" },
            ]
          : [{ type: "ServiceRequest", id: "LIST" }],
    }),
    getServiceRequestById: builder.query<ServiceRequest, string>({
      query: (id) => `/service-requests/${id}`,
      providesTags: (_result, _error, id) => [{ type: "ServiceRequest", id }],
    }),
    updateServiceRequestStatus: builder.mutation<
      ServiceRequest,
      { id: string; status: ServiceRequestStatus; adminNote?: string }
    >({
      query: ({ id, ...body }) => ({
        url: `/service-requests/${id}/status`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "ServiceRequest", id },
        { type: "ServiceRequest", id: "LIST" },
        { type: "ServiceRequest", id: "ME" },
      ],
    }),
    rejectServiceRequest: builder.mutation<{ success: boolean; message: string }, { id: string; body: RejectServiceRequestDto }>({
      query: ({ id, body }) => ({
        url: `/service-requests/${id}/reject`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "ServiceRequest", id },
        { type: "ServiceRequest", id: "LIST" },
      ],
    }),
    appendServiceRequestAttachments: builder.mutation<ServiceRequest, { id: string; formData: FormData }>({
      query: ({ id, formData }) => ({
        url: `/service-requests/${id}/attachments`,
        method: "POST",
        body: formData,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: "ServiceRequest", id }],
    }),
  }),
});

export const {
  useSubmitServiceRequestMutation,
  useGetMyServiceRequestsQuery,
  useGetAdminServiceRequestsQuery,
  useGetServiceRequestByIdQuery,
  useUpdateServiceRequestStatusMutation,
  useRejectServiceRequestMutation,
  useAppendServiceRequestAttachmentsMutation,
} = serviceRequestsApi;
