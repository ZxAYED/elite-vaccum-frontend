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

export interface RescheduleServiceRequestDto {
  date: string;
  startTime: string;
  endTime?: string;
  technicianId?: string;
  adminNote?: string;
}

export interface CreateServiceRequestDto {
  serviceSlug: string;
  fullName: string;
  phone?: string;
  email?: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  problemLocation?: string;
  otherProblemLocation?: string;
  urgency?: "LOW" | "MEDIUM" | "HIGH" | "EMERGENCY";
  preferredDate?: string;
  timeWindow?: string;
  problemDescription?: string;
  symptoms?: string[];
  manufacturer?: string;
  modelNumber?: string;
  serialNumber?: string;
  unitLocation?: string;
  additionalNotes?: string;
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

export const serviceRequestsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    submitServiceRequest: builder.mutation<
      ServiceRequest,
      FormData | Record<string, unknown>
    >({
      query: (body) => ({
        url: "/service-requests",
        method: "POST",
        body,
      }),
      transformResponse: (
        response: ApiResponse<ServiceRequest> | ServiceRequest
      ) => {
        return unwrapData(response);
      },
      invalidatesTags: [
        { type: "ServiceRequest", id: "LIST" },
        { type: "ServiceRequest", id: "ME" },
      ],
    }),
    getMyServiceRequests: builder.query<
      PaginatedResponse<ServiceRequest>,
      GetServiceRequestsParams | void
    >({
      query: (params) => ({
        url: "/service-requests/me",
        params: params || undefined,
      }),
      transformResponse: (
        response:
          | ApiResponse<PaginatedResponse<ServiceRequest> | ServiceRequest[]>
          | PaginatedResponse<ServiceRequest>
          | ServiceRequest[]
      ) => {
        return unwrapPaginated(response);
      },
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ id }) => ({
                type: "ServiceRequest" as const,
                id,
              })),
              { type: "ServiceRequest", id: "ME" },
            ]
          : [{ type: "ServiceRequest", id: "ME" }],
    }),
    getAdminServiceRequests: builder.query<
      PaginatedResponse<ServiceRequest>,
      GetServiceRequestsParams | void
    >({
      query: (params) => ({
        url: "/service-requests",
        params: params || undefined,
      }),
      transformResponse: (
        response:
          | ApiResponse<PaginatedResponse<ServiceRequest> | ServiceRequest[]>
          | PaginatedResponse<ServiceRequest>
          | ServiceRequest[]
      ) => {
        return unwrapPaginated(response);
      },
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ id }) => ({
                type: "ServiceRequest" as const,
                id,
              })),
              { type: "ServiceRequest", id: "LIST" },
            ]
          : [{ type: "ServiceRequest", id: "LIST" }],
    }),
    getServiceRequestById: builder.query<ServiceRequest, string>({
      query: (id) => `/service-requests/${id}`,
      transformResponse: (
        response: ApiResponse<ServiceRequest> | ServiceRequest
      ) => {
        return unwrapData(response);
      },
      providesTags: (_result, _error, id) => [{ type: "ServiceRequest", id }],
    }),
    updateServiceRequestStatus: builder.mutation<
      ServiceRequest,
      { id: string; status: ServiceRequestStatus | string; adminNote?: string }
    >({
      query: ({ id, ...body }) => ({
        url: `/service-requests/${id}/status`,
        method: "PATCH",
        body: {
          ...body,
          status: body.status
            ? body.status.toUpperCase().replace(/-/g, "_")
            : body.status,
        },
      }),
      transformResponse: (
        response: ApiResponse<ServiceRequest> | ServiceRequest
      ) => {
        return unwrapData(response);
      },
      invalidatesTags: (_result, _error, { id }) => [
        { type: "ServiceRequest", id },
        { type: "ServiceRequest", id: "LIST" },
        { type: "ServiceRequest", id: "ME" },
      ],
    }),
    rejectServiceRequest: builder.mutation<
      { success: boolean; message: string },
      { id: string; body: RejectServiceRequestDto }
    >({
      query: ({ id, body }) => ({
        url: `/service-requests/${id}/reject`,
        method: "POST",
        body,
      }),
      transformResponse: (
        response:
          | ApiResponse<{ success: boolean; message: string }>
          | { success: boolean; message: string }
      ) => {
        const data = unwrapData(response);
        return {
          success: (data as { success?: boolean })?.success ?? true,
          message:
            (data as { message?: string })?.message ||
            "Service request rejected successfully.",
        };
      },
      invalidatesTags: (_result, _error, { id }) => [
        { type: "ServiceRequest", id },
        { type: "ServiceRequest", id: "LIST" },
        { type: "ServiceRequest", id: "ME" },
      ],
    }),
    appendServiceRequestAttachments: builder.mutation<
      ServiceRequest,
      { id: string; formData: FormData }
    >({
      query: ({ id, formData }) => ({
        url: `/service-requests/${id}/attachments`,
        method: "POST",
        body: formData,
      }),
      transformResponse: (
        response: ApiResponse<ServiceRequest> | ServiceRequest
      ) => {
        return unwrapData(response);
      },
      invalidatesTags: (_result, _error, { id }) => [
        { type: "ServiceRequest", id },
        { type: "ServiceRequest", id: "LIST" },
        { type: "ServiceRequest", id: "ME" },
      ],
    }),
    deleteServiceRequestAttachment: builder.mutation<
      ServiceRequest,
      { id: string; attachmentId: string }
    >({
      query: ({ id, attachmentId }) => ({
        url: `/service-requests/${id}/attachments/${attachmentId}`,
        method: "DELETE",
      }),
      transformResponse: (
        response: ApiResponse<ServiceRequest> | ServiceRequest
      ) => {
        return unwrapData(response);
      },
      invalidatesTags: (_result, _error, { id }) => [
        { type: "ServiceRequest", id },
        { type: "ServiceRequest", id: "LIST" },
        { type: "ServiceRequest", id: "ME" },
      ],
    }),
    cancelServiceRequest: builder.mutation<
      { success: boolean; message: string },
      { id: string; reason?: string }
    >({
      query: ({ id, reason }) => ({
        url: `/service-requests/${id}/cancel`,
        method: "POST",
        body: reason ? { reason } : undefined,
      }),
      transformResponse: (
        response:
          | ApiResponse<{ success: boolean; message: string }>
          | { success: boolean; message: string }
      ) => {
        const data = unwrapData(response);
        return {
          success: (data as { success?: boolean })?.success ?? true,
          message:
            (data as { message?: string })?.message ||
            "Service request cancelled successfully.",
        };
      },
      invalidatesTags: (_result, _error, { id }) => [
        { type: "ServiceRequest", id },
        { type: "ServiceRequest", id: "LIST" },
        { type: "ServiceRequest", id: "ME" },
        { type: "Schedule" },
      ],
    }),
    rescheduleServiceRequest: builder.mutation<
      ServiceRequest,
      { id: string; body: RescheduleServiceRequestDto }
    >({
      query: ({ id, body }) => ({
        url: `/service-requests/${id}/schedule`,
        method: "PATCH",
        body,
      }),
      transformResponse: (
        response: ApiResponse<ServiceRequest> | ServiceRequest
      ) => {
        return unwrapData(response);
      },
      invalidatesTags: (_result, _error, { id }) => [
        { type: "ServiceRequest", id },
        { type: "ServiceRequest", id: "LIST" },
        { type: "ServiceRequest", id: "ME" },
        { type: "Schedule" },
      ],
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
  useCancelServiceRequestMutation,
  useRescheduleServiceRequestMutation,
  useAppendServiceRequestAttachmentsMutation,
  useDeleteServiceRequestAttachmentMutation,
} = serviceRequestsApi;
