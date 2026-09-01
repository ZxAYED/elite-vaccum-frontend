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

export const servicesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getServices: builder.query<ServiceOffering[], void>({
      query: () => "/services",
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ slug }) => ({ type: "Service" as const, id: slug })),
              { type: "Service", id: "LIST" },
            ]
          : [{ type: "Service", id: "LIST" }],
    }),
    getServiceBySlug: builder.query<ServiceOffering, string>({
      query: (slug) => `/services/${slug}`,
      providesTags: (_result, _error, slug) => [{ type: "Service", id: slug }],
    }),
    getAvailableSlots: builder.query<GetSlotsResponse, string>({
      query: (date) => `/schedule/slots?date=${date}`,
      providesTags: (_result, _error, date) => [{ type: "Schedule", id: date }],
    }),
    getDispatchBoard: builder.query<DispatchBoardDto, GetScheduleBoardParams>({
      query: (params) => ({
        url: "/schedule/board",
        params,
      }),
      providesTags: [{ type: "Schedule", id: "BOARD" }],
    }),
    createAppointment: builder.mutation<Appointment, CreateAppointmentRequest>({
      query: (body) => ({
        url: "/schedule",
        method: "POST",
        body,
      }),
      invalidatesTags: [
        { type: "Schedule", id: "BOARD" },
        { type: "ServiceRequest" },
      ],
    }),
    updateAppointment: builder.mutation<Appointment, { appointmentId: string; body: Partial<CreateAppointmentRequest> }>({
      query: ({ appointmentId, body }) => ({
        url: `/schedule/${appointmentId}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: [{ type: "Schedule", id: "BOARD" }],
    }),
    assignTechnicianToAppointment: builder.mutation<Appointment, { appointmentId: string; technicianId: string }>({
      query: ({ appointmentId, technicianId }) => ({
        url: `/schedule/${appointmentId}/assign`,
        method: "POST",
        body: { technicianId },
      }),
      invalidatesTags: [{ type: "Schedule", id: "BOARD" }],
    }),
    cancelAppointment: builder.mutation<{ success: boolean; message: string }, { appointmentId: string; reason?: string }>({
      query: ({ appointmentId, reason }) => ({
        url: `/schedule/${appointmentId}/cancel`,
        method: "POST",
        body: { reason },
      }),
      invalidatesTags: [{ type: "Schedule", id: "BOARD" }],
    }),
  }),
});

export const {
  useGetServicesQuery,
  useGetServiceBySlugQuery,
  useGetAvailableSlotsQuery,
  useGetDispatchBoardQuery,
  useCreateAppointmentMutation,
  useUpdateAppointmentMutation,
  useAssignTechnicianToAppointmentMutation,
  useCancelAppointmentMutation,
} = servicesApi;
