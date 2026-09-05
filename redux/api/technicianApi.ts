import { baseApi } from "./baseApi";
import type { PaginatedResponse } from "./types";

export interface TechnicianSummary {
  availability: "AVAILABLE" | "BUSY" | "ON_BREAK" | "OFF_DUTY";
  todayJobsCount: number;
  activeJobsCount: number;
  completedTodayCount: number;
  upcomingJobsCount: number;
  completedTotalCount: number;
}

export interface TechnicianJobItemDto {
  appointmentId: string;
  serviceOrderId: string;
  businessId: string;
  serviceName: string;
  timeWindow: string;
  status: string;
  customerName: string;
  customerPhone?: string;
  propertyAddress: string;
  scheduledDate?: string;
  totalAmountUsd?: string;
  completedAt?: string;
}

export interface TechnicianOverviewDto {
  summary: TechnicianSummary;
  todaySchedule: TechnicianJobItemDto[];
  nextAppointment?: TechnicianJobItemDto;
  upcomingJobs: TechnicianJobItemDto[];
  recentlyCompleted: TechnicianJobItemDto[];
}

export interface GetTechnicianJobsParams {
  tab?: "today" | "upcoming" | "in_progress" | "completed" | "all";
  page?: number;
  limit?: number;
}

export interface TechnicianJobsResponseDto {
  counts: {
    today: number;
    upcoming: number;
    active: number;
    completed: number;
  };
  items: Array<{
    id: string;
    businessId: string;
    status: string;
    scheduledDate: string;
    timeWindow: string;
    customer: {
      id: string;
      displayName: string;
      phone: string;
      email: string;
    };
    propertyAddress: string;
    service: {
      name: string;
      slug: string;
    };
    symptoms?: string[];
    etaMinutes?: number;
    totalAmountUsd: string;
    createdAt: string;
  }>;
  meta: {
    totalItems: number;
    currentPage: number;
    totalPages: number;
  };
}

export interface TechnicianScheduleDto {
  range: {
    from: string;
    to: string;
  };
  days: Array<{
    date: string;
    isToday: boolean;
    appointmentsCount: number;
    appointments: TechnicianJobItemDto[];
  }>;
}

function unwrapData<T>(response: unknown): T {
  if (
    response &&
    typeof response === "object" &&
    "data" in response &&
    (response as { data?: unknown }).data !== undefined
  ) {
    return (response as { data: T }).data;
  }
  return response as T;
}

export interface TechnicianProfileDto {
  id: string;
  userId: string;
  displayName: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  availability: string;
  timezone?: string;
  avatarUrl?: string;
  bio?: string;
  specializations?: string[];
  rating?: string | number;
  completedJobs?: number;
  isVerified?: boolean;
  adminNotes?: string;
  defaultAvailability?: string | null;
  createdAt?: string;
  updatedAt?: string;
  user?: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    role?: string;
    isActive?: boolean;
  };
  _count?: {
    assignedRequests?: number;
    assignedJobs?: number;
    appointments?: number;
    serviceReports?: number;
  };
  stats?: {
    completedJobs: number;
    jobsThisMonth: number;
    upcomingAssignments: number;
    joinedAt: string;
  };
  appointments?: Array<{
    id: string;
    status: string;
    date?: string;
    startTime?: string;
    endTime?: string;
    notes?: string;
    serviceOrderId?: string;
    serviceRequestId?: string;
    serviceRequest?: {
      id: string;
      businessId?: string;
      title?: string;
      serviceAddress?: {
        addressLine1?: string;
        city?: string;
      };
      customer?: {
        id: string;
        displayName: string;
      };
    };
  }>;
  assignedRequests?: Array<{
    id: string;
    businessId: string;
    title: string;
    status: string;
    preferredDate?: string;
    preferredTime?: string;
    customer?: {
      id: string;
      displayName: string;
    };
  }>;
  assignedJobs?: Array<{
    id: string;
    businessId?: string;
    status: string;
    serviceName?: string;
  }>;
  serviceReports?: Array<unknown>;
}

export interface SubmitFieldReportRequest {
  diagnosisFindings: string;
  workPerformed: string;
  technicianNotes?: string;
  recommendations?: string;
  partsUsed?: Array<{ partName: string; quantity: number; costUsd: number }>;
}

export const technicianApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getTechnicianOverview: builder.query<TechnicianOverviewDto, void>({
      query: () => "/technicians/me/overview",
      providesTags: [{ type: "Technician", id: "OVERVIEW" }],
    }),
    getMyAssignedJobs: builder.query<TechnicianJobsResponseDto, GetTechnicianJobsParams | void>({
      query: (params) => ({
        url: "/technicians/me/jobs",
        params: params || undefined,
      }),
      providesTags: [{ type: "Technician", id: "JOBS" }],
    }),
    getMySchedule: builder.query<TechnicianScheduleDto, { from?: string; to?: string } | void>({
      query: (params) => ({
        url: "/technicians/me/schedule",
        params: params || undefined,
      }),
      providesTags: [{ type: "Technician", id: "SCHEDULE" }],
    }),
    requestScheduleChange: builder.mutation<{ success: boolean; message: string }, { serviceOrderId: string; reason: string; proposedDate: string; proposedTimeWindow: string }>({
      query: (body) => ({
        url: "/technicians/me/schedule-change-request",
        method: "POST",
        body,
      }),
    }),
    getTechnicianProfile: builder.query<TechnicianProfileDto, void>({
      query: () => "/technicians/me/profile",
      providesTags: [{ type: "Technician", id: "PROFILE" }],
    }),
    updateTechnicianProfile: builder.mutation<TechnicianProfileDto, Partial<TechnicianProfileDto>>({
      query: (body) => ({
        url: "/technicians/me/profile",
        method: "PATCH",
        body,
      }),
      invalidatesTags: [{ type: "Technician", id: "PROFILE" }],
    }),
    uploadTechnicianPhoto: builder.mutation<{ success: boolean; avatarUrl: string }, FormData>({
      query: (formData) => ({
        url: "/technicians/me/photo",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: [{ type: "Technician", id: "PROFILE" }],
    }),
    removeTechnicianPhoto: builder.mutation<{ success: boolean; message: string }, void>({
      query: () => ({
        url: "/technicians/me/photo",
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Technician", id: "PROFILE" }],
    }),
    updateTechnicianAvailability: builder.mutation<
      TechnicianProfileDto,
      { availability: "AVAILABLE" | "BUSY" | "ON_BREAK" | "OFF_DUTY"; timezone?: string }
    >({
      query: (body) => ({
        url: "/technicians/me/availability",
        method: "PATCH",
        body,
      }),
      invalidatesTags: [
        { type: "Technician", id: "OVERVIEW" },
        { type: "Technician", id: "PROFILE" },
      ],
    }),
    submitFieldReport: builder.mutation<{ success: boolean; message: string }, { serviceOrderId: string; body: SubmitFieldReportRequest }>({
      query: ({ serviceOrderId, body }) => ({
        url: `/service-orders/${serviceOrderId}/reports`,
        method: "POST",
        body,
      }),
      invalidatesTags: [
        { type: "Technician", id: "JOBS" },
        { type: "ServiceOrder" },
      ],
    }),
    getAdminTechniciansList: builder.query<
      PaginatedResponse<TechnicianProfileDto>,
      { search?: string; status?: string; availability?: string; page?: number; limit?: number } | void
    >({
      query: (params) => ({
        url: "/technicians",
        params: params || undefined,
      }),
      transformResponse: (response: unknown): PaginatedResponse<TechnicianProfileDto> => {
        const unwrapped = unwrapData<Record<string, unknown>>(response);
        if (Array.isArray(unwrapped)) {
          return {
            items: unwrapped as TechnicianProfileDto[],
            meta: { total: unwrapped.length, page: 1, limit: unwrapped.length, totalPages: 1 },
          };
        }
        if (unwrapped && Array.isArray((unwrapped as { items?: unknown }).items)) {
          return unwrapped as unknown as PaginatedResponse<TechnicianProfileDto>;
        }
        if (unwrapped && Array.isArray((unwrapped as { technicians?: unknown }).technicians)) {
          const techs = (unwrapped as { technicians: TechnicianProfileDto[] }).technicians;
          return {
            items: techs,
            meta: (unwrapped as { meta?: { total: number; page: number; limit: number; totalPages: number } }).meta || {
              total: techs.length,
              page: 1,
              limit: 10,
              totalPages: 1,
            },
          };
        }
        return { items: [], meta: { total: 0, page: 1, limit: 10, totalPages: 0 } };
      },
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ id }) => ({ type: "Technician" as const, id })),
              { type: "Technician", id: "ADMIN_LIST" },
            ]
          : [{ type: "Technician", id: "ADMIN_LIST" }],
    }),
    getTechnicianById: builder.query<TechnicianProfileDto, string>({
      query: (id) => `/technicians/${id}`,
      transformResponse: (response: unknown) => unwrapData<TechnicianProfileDto>(response),
      providesTags: (_result, _error, id) => [{ type: "Technician", id }],
    }),
    createTechnician: builder.mutation<
      TechnicianProfileDto & { message?: string },
      Record<string, unknown>
    >({
      query: (body) => ({
        url: "/technicians",
        method: "POST",
        body,
      }),
      transformResponse: (response: unknown) => {
        const raw = response as { message?: string };
        const unwrapped = unwrapData<TechnicianProfileDto>(response);
        return {
          ...unwrapped,
          message: raw?.message,
        };
      },
      invalidatesTags: [{ type: "Technician", id: "ADMIN_LIST" }],
    }),
    updateTechnician: builder.mutation<
      TechnicianProfileDto & { message?: string },
      { id: string; body: Record<string, unknown> }
    >({
      query: ({ id, body }) => ({
        url: `/technicians/${id}`,
        method: "PATCH",
        body,
      }),
      transformResponse: (response: unknown) => {
        const raw = response as { message?: string };
        const unwrapped = unwrapData<TechnicianProfileDto>(response);
        return {
          ...unwrapped,
          message: raw?.message,
        };
      },
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Technician", id },
        { type: "Technician", id: "ADMIN_LIST" },
      ],
    }),
    deleteTechnician: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/technicians/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: "Technician", id },
        { type: "Technician", id: "ADMIN_LIST" },
      ],
    }),
  }),
});

export const {
  useGetTechnicianOverviewQuery,
  useGetMyAssignedJobsQuery,
  useGetMyScheduleQuery,
  useRequestScheduleChangeMutation,
  useGetTechnicianProfileQuery,
  useUpdateTechnicianProfileMutation,
  useUploadTechnicianPhotoMutation,
  useRemoveTechnicianPhotoMutation,
  useUpdateTechnicianAvailabilityMutation,
  useSubmitFieldReportMutation,
  useGetAdminTechniciansListQuery,
  useGetTechnicianByIdQuery,
  useCreateTechnicianMutation,
  useUpdateTechnicianMutation,
  useDeleteTechnicianMutation,
} = technicianApi;
