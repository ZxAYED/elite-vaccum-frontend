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

export const notificationsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getNotifications: builder.query<PaginatedResponse<Notification>, GetNotificationsParams | void>({
      query: (params) => ({
        url: "/notifications",
        params: params || undefined,
      }),
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
      providesTags: [{ type: "Notification", id: "UNREAD_COUNT" }],
    }),
    getNotificationPreferences: builder.query<NotificationPreferencesDto, void>({
      query: () => "/notifications/preferences",
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
