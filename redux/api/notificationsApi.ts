import { baseApi } from "./baseApi";
import type { Notification } from "@/types/domain";
import type { PaginatedResponse } from "./types";

export interface GetNotificationsParams {
  isRead?: boolean;
  type?: string;
  page?: number;
  limit?: number;
}

export interface NotificationPreferencesDto {
  email: boolean;
  sms: boolean;
  push: boolean;
}

export interface AdminEnqueueNotificationRequest {
  userId?: string;
  role?: string;
  type: string;
  title: string;
  message: string;
  ctaLabel?: string;
}

function unwrapNotificationsResponse(raw: unknown): PaginatedResponse<Notification> {
  if (!raw || typeof raw !== "object") {
    return { items: [], meta: { page: 1, limit: 20, total: 0, totalPages: 0 } };
  }
  const obj = raw as Record<string, unknown>;
  const rawItems = Array.isArray(obj.items)
    ? obj.items
    : Array.isArray(raw)
    ? raw
    : Array.isArray(obj.data)
    ? obj.data
    : [];

  const meta =
    obj.meta && typeof obj.meta === "object"
      ? (obj.meta as PaginatedResponse<Notification>["meta"])
      : { page: 1, limit: 20, total: rawItems.length, totalPages: 1 };

  return { items: rawItems as Notification[], meta };
}

function unwrapUnreadCountResponse(raw: unknown): { unreadCount: number } {
  if (typeof raw === "number") return { unreadCount: raw };
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    if (typeof obj.unreadCount === "number") return { unreadCount: obj.unreadCount };
    if (typeof obj.count === "number") return { unreadCount: obj.count };
    if (obj.data && typeof obj.data === "object") {
      const dataObj = obj.data as Record<string, unknown>;
      if (typeof dataObj.unreadCount === "number") return { unreadCount: dataObj.unreadCount };
    }
  }
  return { unreadCount: 0 };
}

function unwrapPreferencesResponse(raw: unknown): NotificationPreferencesDto {
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    const target = (obj.preferences || obj.data || obj) as Record<string, unknown>;
    return {
      email: typeof target.email === "boolean" ? target.email : true,
      sms: typeof target.sms === "boolean" ? target.sms : false,
      push: typeof target.push === "boolean" ? target.push : true,
    };
  }
  return { email: true, sms: false, push: true };
}

export const notificationsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getNotifications: builder.query<PaginatedResponse<Notification>, GetNotificationsParams | void>({
      query: (params) => ({
        url: "/notifications",
        params: params || undefined,
      }),
      transformResponse: unwrapNotificationsResponse,
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ id }) => ({ type: "Notification" as const, id })),
              { type: "Notification", id: "LIST" },
            ]
          : [{ type: "Notification", id: "LIST" }],
    }),
    getUnreadNotificationsCount: builder.query<{ unreadCount: number }, void>({
      query: () => "/notifications/unread-count",
      transformResponse: unwrapUnreadCountResponse,
      providesTags: [{ type: "Notification", id: "UNREAD_COUNT" }],
    }),
    getNotificationPreferences: builder.query<NotificationPreferencesDto, void>({
      query: () => "/notifications/preferences",
      transformResponse: unwrapPreferencesResponse,
      providesTags: [{ type: "Notification", id: "PREFERENCES" }],
    }),
    updateNotificationPreferences: builder.mutation<
      NotificationPreferencesDto,
      Partial<NotificationPreferencesDto>
    >({
      query: (body) => ({
        url: "/notifications/preferences",
        method: "PATCH",
        body,
      }),
      invalidatesTags: [{ type: "Notification", id: "PREFERENCES" }],
    }),
    adminEnqueueNotification: builder.mutation<{ success: boolean; jobId: string }, AdminEnqueueNotificationRequest>({
      query: (body) => ({
        url: "/notifications",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Notification", id: "LIST" }],
    }),
    markNotificationAsRead: builder.mutation<{ success: boolean; id: string }, string>({
      query: (id) => ({
        url: `/notifications/${id}/read`,
        method: "PATCH",
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: "Notification", id },
        { type: "Notification", id: "LIST" },
        { type: "Notification", id: "UNREAD_COUNT" },
      ],
    }),
    markAllNotificationsAsRead: builder.mutation<{ success: boolean }, void>({
      query: () => ({
        url: "/notifications/read-all",
        method: "PATCH",
      }),
      invalidatesTags: [
        { type: "Notification", id: "LIST" },
        { type: "Notification", id: "UNREAD_COUNT" },
      ],
    }),
    deleteNotification: builder.mutation<{ success: boolean; id: string }, string>({
      query: (id) => ({
        url: `/notifications/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: "Notification", id },
        { type: "Notification", id: "LIST" },
        { type: "Notification", id: "UNREAD_COUNT" },
      ],
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useGetUnreadNotificationsCountQuery,
  useGetNotificationPreferencesQuery,
  useUpdateNotificationPreferencesMutation,
  useAdminEnqueueNotificationMutation,
  useMarkNotificationAsReadMutation,
  useMarkAllNotificationsAsReadMutation,
  useDeleteNotificationMutation,
} = notificationsApi;
