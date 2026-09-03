import { baseApi } from "./baseApi";
import type { ServiceOffering, Appointment } from "@/types/domain";

export interface ScheduleSlot {
  timeWindow: string;
  startTime: string;
  endTime: string;
  isBooked: boolean;
  status: "FREE" | "BOOKED";
}

export interface GetSlotsResponse {
  date: string;
  slots: ScheduleSlot[];
}

export interface GetScheduleBoardParams {
  startDate: string;
  endDate: string;
  technicianId?: string;
}

export interface CreateAppointmentRequest {
  serviceRequestId: string;
  technicianId: string;
  date: string;
  startTime: string;
  endTime: string;
  notes?: string;
}

export interface DispatchBoardDto {
  startDate: string;
  endDate: string;
  appointments: Appointment[];
  technicianWorkload: Array<{ technicianId: string; count: number }>;
}

export interface CreateServiceDto {
  title: string;
  group: string;
  summary: string;
  description?: string;
  iconKey: string;
  recommendedSymptoms: string[];
  status: "ACTIVE" | "INACTIVE";
}

export interface UpdateServiceDto {
  title?: string;
  group?: string;
  summary?: string;
  description?: string;
  iconKey?: string;
  recommendedSymptoms?: string[];
  status?: "ACTIVE" | "INACTIVE";
}

export interface DeleteServiceResponse {
  success: boolean;
  message?: string;
  action?: "deleted" | "deactivated" | string;
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

export const servicesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllServicesList: builder.query<ServiceOffering[], void>({
      query: () => "/services/list/all",
      transformResponse: (
        response: ApiResponse<ServiceOffering[]> | ServiceOffering[]
      ) => {
        const unwrapped = unwrapData(response);
        if (Array.isArray(unwrapped)) return unwrapped;
        return [];
      },
      providesTags: (result) =>
        Array.isArray(result)
          ? [
              ...result.map(({ slug }) => ({
                type: "Service" as const,
                id: slug,
              })),
              { type: "Service", id: "LIST" },
            ]
          : [{ type: "Service", id: "LIST" }],
    }),
    createService: builder.mutation<ServiceOffering, CreateServiceDto>({
      query: (body) => ({
        url: "/services",
        method: "POST",
        body,
      }),
      transformResponse: (
        response: ApiResponse<ServiceOffering> | ServiceOffering
      ) => {
        return unwrapData(response);
      },
      invalidatesTags: [{ type: "Service", id: "LIST" }],
    }),
    updateService: builder.mutation<
      ServiceOffering,
      { id: string; body: UpdateServiceDto }
    >({
      query: ({ id, body }) => ({
        url: `/services/${id}`,
        method: "PATCH",
        body,
      }),
      transformResponse: (
        response: ApiResponse<ServiceOffering> | ServiceOffering
      ) => {
        return unwrapData(response);
      },
      invalidatesTags: [{ type: "Service", id: "LIST" }],
    }),
    deleteService: builder.mutation<DeleteServiceResponse, string>({
      query: (id) => ({
        url: `/services/${id}`,
        method: "DELETE",
      }),
      transformResponse: (
        response: ApiResponse<DeleteServiceResponse> | DeleteServiceResponse
      ) => {
        const data = unwrapData(response);
        return (
          data || {
            success: true,
            message: "Service processed successfully.",
          }
        );
      },
      invalidatesTags: [{ type: "Service", id: "LIST" }],
    }),
    getServices: builder.query<ServiceOffering[], void>({
      query: () => "/services",
      transformResponse: (
        response:
          | ApiResponse<ServiceOffering[]>
          | ServiceOffering[]
          | { groups?: Array<{ services?: ServiceOffering[] }>; symptoms?: unknown[] }
      ) => {
        const unwrapped = unwrapData(response as ApiResponse<unknown>);
        if (Array.isArray(unwrapped)) return unwrapped;
        if (
          unwrapped &&
          typeof unwrapped === "object" &&
          "groups" in unwrapped &&
          Array.isArray((unwrapped as { groups: Array<{ services?: ServiceOffering[] }> }).groups)
        ) {
          return (unwrapped as { groups: Array<{ services?: ServiceOffering[] }> }).groups.flatMap(
            (g) => g.services || []
          );
        }
        return [];
      },
      providesTags: (result) =>
        Array.isArray(result)
          ? [
              ...result.map(({ slug }) => ({
                type: "Service" as const,
                id: slug,
              })),
              { type: "Service", id: "LIST" },
            ]
          : [{ type: "Service", id: "LIST" }],
    }),
    getServiceBySlug: builder.query<ServiceOffering, string>({
      query: (slug) => `/services/${slug}`,
      transformResponse: (
        response: ApiResponse<ServiceOffering> | ServiceOffering
      ) => {
        return unwrapData(response);
      },
      providesTags: (_result, _error, slug) => [{ type: "Service", id: slug }],
    }),
    getAvailableSlots: builder.query<GetSlotsResponse, string>({
      query: (date) => `/schedule/slots?date=${date}`,
      transformResponse: (
        response: ApiResponse<GetSlotsResponse> | GetSlotsResponse
      ) => {
        return unwrapData(response);
      },
      providesTags: (_result, _error, date) => [
        { type: "Schedule", id: date },
      ],
    }),
    getDispatchBoard: builder.query<DispatchBoardDto, GetScheduleBoardParams>({
      query: (params) => ({
        url: "/schedule/board",
        params,
      }),
      transformResponse: (
        response: ApiResponse<DispatchBoardDto> | DispatchBoardDto
      ) => {
        return unwrapData(response);
      },
      providesTags: [{ type: "Schedule", id: "BOARD" }],
    }),
    createAppointment: builder.mutation<Appointment, CreateAppointmentRequest>({
      query: (body) => ({
        url: "/schedule",
        method: "POST",
        body,
      }),
      transformResponse: (
        response: ApiResponse<Appointment> | Appointment
      ) => {
        return unwrapData(response);
      },
      invalidatesTags: [
        { type: "Schedule", id: "BOARD" },
        { type: "ServiceRequest" },
      ],
    }),
    updateAppointment: builder.mutation<
      Appointment,
      { appointmentId: string; body: Partial<CreateAppointmentRequest> }
    >({
      query: ({ appointmentId, body }) => ({
        url: `/schedule/${appointmentId}`,
        method: "PATCH",
        body,
      }),
      transformResponse: (
        response: ApiResponse<Appointment> | Appointment
      ) => {
        return unwrapData(response);
      },
      invalidatesTags: [{ type: "Schedule", id: "BOARD" }],
    }),
    assignTechnicianToAppointment: builder.mutation<
      Appointment,
      { appointmentId: string; technicianId: string }
    >({
      query: ({ appointmentId, technicianId }) => ({
        url: `/schedule/${appointmentId}/assign`,
        method: "POST",
        body: { technicianId },
      }),
      transformResponse: (
        response: ApiResponse<Appointment> | Appointment
      ) => {
        return unwrapData(response);
      },
      invalidatesTags: [{ type: "Schedule", id: "BOARD" }],
    }),
    cancelAppointment: builder.mutation<
      { success: boolean; message: string },
      { appointmentId: string; reason?: string }
    >({
      query: ({ appointmentId, reason }) => ({
        url: `/schedule/${appointmentId}/cancel`,
        method: "POST",
        body: { reason },
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
            (response as ApiResponse<unknown>)?.message ||
            "Appointment cancelled successfully.",
        };
      },
      invalidatesTags: [{ type: "Schedule", id: "BOARD" }],
    }),
  }),
});

export const {
  useGetAllServicesListQuery,
  useCreateServiceMutation,
  useUpdateServiceMutation,
  useDeleteServiceMutation,
  useGetServicesQuery,
  useGetServiceBySlugQuery,
  useGetAvailableSlotsQuery,
  useGetDispatchBoardQuery,
  useCreateAppointmentMutation,
  useUpdateAppointmentMutation,
  useAssignTechnicianToAppointmentMutation,
  useCancelAppointmentMutation,
} = servicesApi;
