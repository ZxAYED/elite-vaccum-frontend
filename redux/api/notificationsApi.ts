import { baseApi } from "./baseApi";
import type { Notification } from "@/types/domain";
import type { PaginatedResponse } from "./types";

/**
 * The server enum (`enums.prisma:195`). `POST /notifications` rejects anything
 * else with `type must be one of the following values: ...`, so never invent a
 * slug like "system" or "service-update" here.
 */
export const NOTIFICATION_TYPES = [
  "SERVICE_REQUEST_UPDATE",
  "QUOTATION_UPDATE",
  "SCHEDULE_DISPATCH",
  "ORDER_STATUS_UPDATE",
  "BILLING_INVOICE",
  "REVIEW_MODERATION",
  "SYSTEM_ALERT",
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  SERVICE_REQUEST_UPDATE: "Service Request Update",
  QUOTATION_UPDATE: "Quotation Update",
  SCHEDULE_DISPATCH: "Schedule & Dispatch",
  ORDER_STATUS_UPDATE: "Order Status Update",
  BILLING_INVOICE: "Billing & Invoice",
  REVIEW_MODERATION: "Review Moderation",
  SYSTEM_ALERT: "System Alert",
};

/** Server caps: `title` 200 chars, `ctaUrl` 255. */
export const NOTIFICATION_TITLE_MAX = 200;

export interface GetNotificationsParams {
  isRead?: boolean;
  type?: string;
  page?: number;
  limit?: number;
}

export interface NotificationPreferencesDto {
  id?: string;
  userId?: string;
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  preferences?: {
    orderUpdates?: boolean;
    serviceUpdates?: boolean;
    billingUpdates?: boolean;
    marketing?: boolean;
    [key: string]: unknown;
  } | null;
  updatedAt?: string;
  /** Backward-compatible aliases used by older portal widgets. */
  email: boolean;
  sms: boolean;
  push: boolean;
}

/**
 * `POST /notifications` targets exactly one recipient and requires
 * `userId`, `type`, `title` and `message`. There is no role-broadcast and no
 * bulk endpoint yet, so multi-recipient sends fan out client-side — one POST
 * per id. `userId` is the **User** UUID, not a customer profile id.
 */
export interface AdminEnqueueNotificationRequest {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  ctaLabel?: string;
  ctaUrl?: string;
  metadata?: Record<string, unknown>;
  sendEmail?: boolean;
  /** 1 = highest, 10 = normal. Server default 5. */
  priority?: number;
}

export interface AdminEnqueueNotificationResponse {
  success: boolean;
  message?: string;
  jobId?: string;
  recipientUserId?: string;
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
    const nested =
      target.preferences && typeof target.preferences === "object"
        ? (target.preferences as NotificationPreferencesDto["preferences"])
        : null;
    const email =
      typeof target.emailNotifications === "boolean"
        ? target.emailNotifications
        : typeof target.email === "boolean"
          ? target.email
          : true;
    const sms =
      typeof target.smsNotifications === "boolean"
        ? target.smsNotifications
        : typeof target.sms === "boolean"
          ? target.sms
          : false;
    const push =
      typeof target.pushNotifications === "boolean"
        ? target.pushNotifications
        : typeof target.push === "boolean"
          ? target.push
          : true;
    return {
      id: typeof target.id === "string" ? target.id : undefined,
      userId: typeof target.userId === "string" ? target.userId : undefined,
      emailNotifications: email,
      smsNotifications: sms,
      pushNotifications: push,
      preferences: nested,
      updatedAt: typeof target.updatedAt === "string" ? target.updatedAt : undefined,
      email,
      sms,
      push,
    };
  }
  return {
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    preferences: null,
    email: true,
    sms: false,
    push: true,
  };
}

function serializePreferencesRequest(
  body: Partial<NotificationPreferencesDto>,
) {
  return {
    emailNotifications: body.emailNotifications ?? body.email,
    smsNotifications: body.smsNotifications ?? body.sms,
    pushNotifications: body.pushNotifications ?? body.push,
    preferences: body.preferences,
  };
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
        body: serializePreferencesRequest(body),
      }),
      transformResponse: unwrapPreferencesResponse,
      invalidatesTags: [{ type: "Notification", id: "PREFERENCES" }],
    }),
    adminEnqueueNotification: builder.mutation<
      AdminEnqueueNotificationResponse,
      AdminEnqueueNotificationRequest
    >({
      query: (body) => ({
        url: "/notifications",
        method: "POST",
        body,
      }),
      invalidatesTags: [
        { type: "Notification", id: "LIST" },
        { type: "Notification", id: "UNREAD_COUNT" },
      ],
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
