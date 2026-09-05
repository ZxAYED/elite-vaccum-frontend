import { baseApi } from "./baseApi";
import type { ServiceOffering, Appointment } from "@/types/domain";

export interface ScheduleSlot {
  slot?: string;
  timeWindow?: string;
  startTime: string;
  endTime: string;
  isBooked: boolean;
  status: "FREE" | "BOOKED" | string;
  bookedCount?: number;
  availableCapacity?: number;
}

export interface GetSlotsResponse {
  success?: boolean;
  date: string;
  totalSlots?: number;
  availableSlotsCount?: number;
  bookedSlotsCount?: number;
  slots: ScheduleSlot[];
}

export interface GetScheduleBoardParams {
  dateFrom?: string;
  dateTo?: string;
  startDate?: string;
  endDate?: string;
  technicianId?: string;
  techId?: string;
  status?: string;
}

export interface DispatchAppointmentDto {
  id: string;
  serviceRequestId: string;
  serviceOrderId?: string;
  technicianId?: string;
  status: string;
  startAt?: string;
  endAt?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  notes?: string;
  technician?: {
    id: string;
    displayName: string;
    phone?: string;
    rating?: number;
    status?: string;
  };
  serviceRequest?: {
    id: string;
    businessId?: string;
    title?: string;
    status?: string;
    serviceAddress?: {
      addressLine1?: string;
      city?: string;
      state?: string;
      postalCode?: string;
    };
    customer?: {
      id?: string;
      displayName?: string;
      email?: string;
      phone?: string;
    };
  };
}

export interface DispatchTechnicianDto {
  id: string;
  displayName: string;
  phone?: string;
  status?: string;
  rating?: number;
}

export interface DispatchBoardStats {
  confirmed: number;
  rescheduled: number;
  completed: number;
  cancelled: number;
  unassigned: number;
}

export interface DispatchBoardMeta {
  dateFrom?: string;
  dateTo?: string;
  total?: number;
  technicianId?: string;
  stats?: DispatchBoardStats;
}

export interface DispatchBoardDto {
  appointments: DispatchAppointmentDto[];
  technicians?: DispatchTechnicianDto[];
  meta?: DispatchBoardMeta;
  startDate?: string;
  endDate?: string;
  technicianWorkload?: Array<{ technicianId: string; count: number }>;
}

export interface CreateAppointmentRequest {
  serviceRequestId: string;
  date: string;
  startTime: string;
  endTime: string;
  technicianId?: string;
  adminNote?: string;
  notes?: string;
}

export interface UpdateAppointmentRequest {
  date?: string;
  startTime?: string;
  endTime?: string;
  status?: string;
  notes?: string;
}

export interface AssignTechnicianRequest {
  appointmentId: string;
  technicianId: string;
  notes?: string;
}

export interface CancelAppointmentRequest {
  appointmentId: string;
  cancellationReason?: string;
  reason?: string;
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

export interface GetServicesParams {
  search?: string;
  status?: string;
  group?: string;
  sort?: string;
}

export const servicesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllServicesList: builder.query<
      ServiceOffering[],
      GetServicesParams | void
    >({
      query: (params) => {
        const queryParams: Record<string, string> = {};
        if (params?.search && params.search.trim()) {
          queryParams.search = params.search.trim();
        }
        if (params?.status && params.status !== "all") {
          queryParams.status = params.status;
        }
        if (params?.group && params.group !== "all") {
          queryParams.group = params.group;
        }
        if (params?.sort) {
          queryParams.sort = params.sort;
        }

        return {
          url: "/services/list/all",
          params: Object.keys(queryParams).length > 0 ? queryParams : undefined,
        };
      },
      transformResponse: (
        response:
          | ApiResponse<ServiceOffering[]>
          | ServiceOffering[]
          | { items?: ServiceOffering[]; data?: ServiceOffering[] }
      ) => {
        const unwrapped = unwrapData(response as ApiResponse<unknown>);
        if (Array.isArray(unwrapped)) return unwrapped;
        if (
          unwrapped &&
          typeof unwrapped === "object" &&
          "items" in unwrapped &&
          Array.isArray((unwrapped as { items: ServiceOffering[] }).items)
        ) {
          return (unwrapped as { items: ServiceOffering[] }).items;
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
      transformResponse: (response: unknown) => {
        const unwrapped = unwrapData(response as ApiResponse<unknown>);
        if (Array.isArray(unwrapped)) return unwrapped as ServiceOffering[];
        if (unwrapped && typeof unwrapped === "object") {
          const u = unwrapped as Record<string, unknown>;
          const items: ServiceOffering[] = [];
          if (Array.isArray(u.serviceAndMaintenance)) {
            items.push(...(u.serviceAndMaintenance as ServiceOffering[]));
          }
          if (Array.isArray(u.installation)) {
            items.push(...(u.installation as ServiceOffering[]));
          }
          if (Array.isArray(u.items)) {
            items.push(...(u.items as ServiceOffering[]));
          }
          if (Array.isArray(u.groups)) {
            items.push(
              ...(u.groups as Array<{ services?: ServiceOffering[] }>).flatMap(
                (g) => g.services || [],
              ),
            );
          }
          if (items.length > 0) {
            return items.map((service) => ({
              ...service,
              group:
                service.group === "INSTALLATION" || service.group === "Installation"
                  ? "Installation"
                  : "Service & Maintenance",
            }));
          }
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
    getAvailableSlots: builder.query<
      GetSlotsResponse,
      string | { date: string; technicianId?: string }
    >({
      query: (arg) => {
        const date = typeof arg === "string" ? arg : arg.date;
        const technicianId =
          typeof arg === "object" && arg.technicianId && arg.technicianId !== "all"
            ? arg.technicianId
            : undefined;
        const params: Record<string, string> = { date };
        if (technicianId) params.technicianId = technicianId;
        return {
          url: "/schedule/slots",
          params,
        };
      },
      transformResponse: (
        response: ApiResponse<GetSlotsResponse> | GetSlotsResponse
      ) => {
        return unwrapData(response);
      },
      providesTags: (_result, _error, arg) => [
        { type: "Schedule", id: typeof arg === "string" ? arg : arg.date },
      ],
    }),
    getDispatchBoard: builder.query<DispatchBoardDto, GetScheduleBoardParams>({
      query: (params) => {
        const queryParams: Record<string, string> = {};
        const from = params.dateFrom || params.startDate;
        const to = params.dateTo || params.endDate;
        if (from) queryParams.dateFrom = from;
        if (to) queryParams.dateTo = to;
        const tech = params.technicianId || params.techId;
        if (tech && tech !== "all") {
          queryParams.technicianId = tech;
        }
        if (params.status && params.status !== "all") {
          queryParams.status = params.status;
        }
        return {
          url: "/schedule/board",
          params: queryParams,
        };
      },
      transformResponse: (
        response:
          | {
              success?: boolean;
              data?: {
                appointments?: DispatchAppointmentDto[];
                technicians?: DispatchTechnicianDto[];
              };
              meta?: DispatchBoardMeta;
            }
          | DispatchBoardDto
      ) => {
        if (
          response &&
          typeof response === "object" &&
          "data" in response &&
          response.data
        ) {
          return {
            appointments: response.data.appointments || [],
            technicians: response.data.technicians || [],
            meta: response.meta,
          };
        }
        const unwrapped = unwrapData(response as ApiResponse<DispatchBoardDto>);
        if (unwrapped && typeof unwrapped === "object") {
          const appts =
            "appointments" in unwrapped && Array.isArray(unwrapped.appointments)
              ? (unwrapped.appointments as DispatchAppointmentDto[])
              : [];
          const techs =
            "technicians" in unwrapped && Array.isArray(unwrapped.technicians)
              ? (unwrapped.technicians as DispatchTechnicianDto[])
              : [];
          return {
            appointments: appts,
            technicians: techs,
            meta: (unwrapped as DispatchBoardDto).meta,
          };
        }
        return {
          appointments: [],
          technicians: [],
        };
      },
      providesTags: [{ type: "Schedule", id: "BOARD" }],
    }),
    createAppointment: builder.mutation<
      { success: boolean; message: string; data?: Appointment },
      CreateAppointmentRequest
    >({
      query: (body) => ({
        url: "/schedule",
        method: "POST",
        body,
      }),
      transformResponse: (
        response: ApiResponse<Appointment> | Appointment
      ) => {
        const data = unwrapData(response);
        return {
          success: true,
          message:
            (response as ApiResponse<unknown>)?.message ||
            "Appointment scheduled successfully",
          data: data as Appointment,
        };
      },
      invalidatesTags: [
        { type: "Schedule", id: "BOARD" },
        { type: "ServiceRequest" },
      ],
    }),
    updateAppointment: builder.mutation<
      Appointment,
      { appointmentId: string; body: UpdateAppointmentRequest }
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
      AssignTechnicianRequest
    >({
      query: ({ appointmentId, technicianId, notes }) => ({
        url: `/schedule/${appointmentId}/assign`,
        method: "POST",
        body: { technicianId, notes },
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
      CancelAppointmentRequest
    >({
      query: ({ appointmentId, cancellationReason, reason }) => ({
        url: `/schedule/${appointmentId}/cancel`,
        method: "POST",
        body: { cancellationReason: cancellationReason || reason },
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
