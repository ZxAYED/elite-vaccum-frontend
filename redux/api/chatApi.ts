import { baseApi } from "./baseApi";

/**
 * Chat endpoints, matching `src/chat` on the backend.
 *
 * Two things here differ from the rest of this folder and are deliberate:
 *
 * - the paginated envelope uses `totalItems`, not the `total` that
 *   `PaginatedResponse` in ./types declares, so chat carries its own meta type
 *   rather than pretending to fit the shared one;
 * - `getConversationMessages` marks the conversation read as a side effect on
 *   the server, so it must never be prefetched for a thread the customer has
 *   not opened — doing so silently clears their unread badge.
 */

/** One transcript page. Shared by the thread query and its consumers. */
export const MESSAGE_PAGE_SIZE = 30;

export interface ChatPaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

export interface ChatPaginated<T> {
  items: T[];
  meta: ChatPaginationMeta;
}

export type ConversationType =
  | "DIRECT"
  | "SUPPORT"
  | "SERVICE_JOB"
  | "ORDER_INQUIRY";

export type ChatMessageType = "TEXT" | "IMAGE" | "FILE" | "SYSTEM";

export interface ChatUser {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  role?: string | null;
}

export interface ConversationParticipant {
  id: string;
  conversationId: string;
  userId: string;
  roleInChat: string;
  lastReadAt: string | null;
  isMuted: boolean;
  joinedAt: string;
  user: ChatUser;
}

export interface ChatAttachmentDto {
  id: string;
  messageId: string;
  fileUrl: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  createdAt: string;
}

export interface ChatMessageDto {
  id: string;
  conversationId: string;
  senderId: string;
  type: ChatMessageType;
  content: string;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
  sender: ChatUser;
  attachments?: ChatAttachmentDto[];
  status?: "sending" | "sent" | "delivered" | "read" | "failed";
}

export interface ConversationDto {
  id: string;
  type: ConversationType;
  title: string;
  orderId?: string | null;
  serviceOrderId?: string | null;
  lastMessageAt?: string | null;
  lastMessageText?: string | null;
  createdAt?: string;
  updatedAt?: string;
  participants: ConversationParticipant[];
  /** List response only; absent on the single-conversation endpoint. */
  unreadCount?: number;
  /** List response only. A boolean is all the API exposes about presence. */
  isOtherOnline?: boolean;
  lastMessage?: ChatMessageDto;
}

export interface CreateConversationRequest {
  type?: ConversationType;
  title?: string;
  /** The other participant. Named `targetUserId` by the API, not `participantId`. */
  targetUserId?: string;
  orderId?: string;
  serviceOrderId?: string;
  initialMessage?: string;
}

export interface GetConversationsParams {
  page?: number;
  limit?: number;
  /**
   * Accepted by the DTO but not yet applied server-side, so results come back
   * unfiltered. Sent anyway, so this starts working the day it is implemented.
   */
  search?: string;
}

export interface GetMessagesParams {
  conversationId: string;
  page?: number;
  limit?: number;
  /** ISO cursor: return messages older than this. */
  before?: string;
}

function unwrapChatData<T>(response: unknown): T {
  if (
    response &&
    typeof response === "object" &&
    "data" in response &&
    (response as { data: unknown }).data !== undefined
  ) {
    return (response as { data: T }).data;
  }
  return response as T;
}

export interface SendMessageRequest {
  conversationId: string;
  content?: string;
  type?: ChatMessageType;
  /** Picked files. Present files switch the request to multipart. */
  files?: File[];
}

export const chatApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getConversations: builder.query<
      ChatPaginated<ConversationDto>,
      GetConversationsParams | void
    >({
      query: (params) => ({
        url: "/chat/conversations",
        params: params ?? undefined,
      }),
      transformResponse: (response: unknown): ChatPaginated<ConversationDto> => {
        const unwrapped = unwrapChatData<ChatPaginated<ConversationDto> | ConversationDto[]>(response);
        if (Array.isArray(unwrapped)) {
          return {
            items: unwrapped,
            meta: { page: 1, limit: unwrapped.length, totalItems: unwrapped.length, totalPages: 1 },
          };
        }
        return {
          items: Array.isArray(unwrapped?.items) ? unwrapped.items : [],
          meta: unwrapped?.meta ?? { page: 1, limit: 30, totalItems: 0, totalPages: 1 },
        };
      },
      providesTags: [{ type: "Chat", id: "CONVERSATIONS" }],
    }),

    getConversation: builder.query<ConversationDto, string>({
      query: (conversationId) => `/chat/conversations/${conversationId}`,
      transformResponse: (response: unknown): ConversationDto => {
        return unwrapChatData<ConversationDto>(response);
      },
      providesTags: (_result, _error, conversationId) => [
        { type: "Chat", id: conversationId },
      ],
    }),

    getChatUnreadCount: builder.query<
      { success: boolean; unreadCount: number },
      void
    >({
      query: () => "/chat/unread-count",
      transformResponse: (
        response: unknown,
      ): { success: boolean; unreadCount: number } => {
        const unwrapped = unwrapChatData<{ success?: boolean; unreadCount: number } | number>(response);
        if (typeof unwrapped === "number") {
          return { success: true, unreadCount: unwrapped };
        }
        return {
          success: unwrapped?.success ?? true,
          unreadCount: unwrapped?.unreadCount ?? 0,
        };
      },
      providesTags: [{ type: "Chat", id: "UNREAD_COUNT" }],
    }),

    startConversation: builder.mutation<
      ConversationDto,
      CreateConversationRequest | void
    >({
      query: (body) => ({
        url: "/chat/conversations",
        method: "POST",
        // A customer posting `type: SUPPORT` is handed back their existing
        // support room rather than a second one, so this is safe to call on
        // an empty inbox without creating duplicates.
        body: body ?? { type: "SUPPORT" },
      }),
      transformResponse: (response: unknown): ConversationDto => {
        return unwrapChatData<ConversationDto>(response);
      },
      invalidatesTags: [{ type: "Chat", id: "CONVERSATIONS" }],
    }),

    getConversationMessages: builder.query<
      ChatPaginated<ChatMessageDto>,
      GetMessagesParams
    >({
      query: ({ conversationId, ...params }) => ({
        url: `/chat/conversations/${conversationId}/messages`,
        params,
      }),
      transformResponse: (response: unknown): ChatPaginated<ChatMessageDto> => {
        const unwrapped = unwrapChatData<ChatPaginated<ChatMessageDto> | ChatMessageDto[]>(response);
        if (Array.isArray(unwrapped)) {
          return {
            items: unwrapped,
            meta: { page: 1, limit: unwrapped.length, totalItems: unwrapped.length, totalPages: 1 },
          };
        }
        return {
          items: Array.isArray(unwrapped?.items) ? unwrapped.items : [],
          meta: unwrapped?.meta ?? { page: 1, limit: 30, totalItems: 0, totalPages: 1 },
        };
      },
      serializeQueryArgs: ({ queryArgs }) => queryArgs.conversationId,
      merge: (currentCache, newItems, { arg }) => {
        if (!arg.before) {
          if (!newItems.items.length) {
            currentCache.items = newItems.items;
            currentCache.meta = newItems.meta;
            return;
          }
          const newIds = new Set(newItems.items.map((m) => m.id));
          const oldestNewCreatedAt = new Date(newItems.items[0].createdAt).getTime();
          // Retain older prepended items that precede the newest page
          const existingOlder = currentCache.items.filter(
            (m) =>
              !newIds.has(m.id) &&
              !m.id.startsWith("temp-") &&
              new Date(m.createdAt).getTime() < oldestNewCreatedAt,
          );
          currentCache.items = [...existingOlder, ...newItems.items];
          currentCache.meta = newItems.meta;
        } else {
          // Older messages prepend: deduplicate by id
          const existingIds = new Set(currentCache.items.map((m) => m.id));
          const uniqueOlder = newItems.items.filter((m) => !existingIds.has(m.id));
          currentCache.items.unshift(...uniqueOlder);
          currentCache.meta = newItems.meta;
        }
      },
      forceRefetch: ({ currentArg, previousArg }) => {
        return currentArg?.before !== previousArg?.before;
      },
      providesTags: (_result, _error, { conversationId }) => [
        { type: "Chat", id: `MESSAGES-${conversationId}` },
      ],
      // Reading the thread clears its unread state server-side, so the badge
      // and the list are stale the moment this resolves.
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          if (!arg.before) {
            dispatch(
              chatApi.util.invalidateTags([
                { type: "Chat", id: "UNREAD_COUNT" },
                { type: "Chat", id: "CONVERSATIONS" },
              ]),
            );
          }
        } catch {
          // A failed read leaves the counts as they were; nothing to undo.
        }
      },
    }),

    sendConversationMessage: builder.mutation<ChatMessageDto, SendMessageRequest>({
      query: ({ conversationId, content, type, files }) => {
        // Option A: Multipart FormData with Binary Files (With or Without Text)
        if (files && files.length > 0) {
          const form = new FormData();
          // Provide 'data' JSON string caption & metadata as per API specification
          form.append("data", JSON.stringify({ content: content ?? "" }));
          // Also pass 'content' directly in FormData for maximum compatibility
          form.append("content", content ?? "");
          // attachments: File (Binary) upload (up to 10 files)
          for (const file of files) {
            form.append("attachments", file);
          }
          return {
            url: `/chat/conversations/${conversationId}/messages`,
            method: "POST",
            body: form,
          };
        }

        // Option B: JSON Payload (Text or Pre-uploaded URLs)
        return {
          url: `/chat/conversations/${conversationId}/messages`,
          method: "POST",
          body: {
            content: content ?? "",
            type: type ?? "TEXT",
          },
        };
      },
      transformResponse: (response: unknown): ChatMessageDto => {
        return unwrapChatData<ChatMessageDto>(response);
      },
      invalidatesTags: (_result, _error, { conversationId }) => [
        { type: "Chat", id: `MESSAGES-${conversationId}` },
        { type: "Chat", id: "CONVERSATIONS" },
      ],
      async onQueryStarted(
        { conversationId, content, type, files },
        { dispatch, queryFulfilled, getState },
      ) {
        const state = getState() as { auth?: { user?: ChatUser & { id: string } } };
        const currentUserId = state?.auth?.user?.id ?? "current-user";
        const currentUser = state?.auth?.user ?? { id: currentUserId };
        const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

        const optimisticAttachments = (files ?? []).map((file, idx) => ({
          id: `temp-att-${idx}-${Date.now()}`,
          messageId: tempId,
          fileUrl: URL.createObjectURL(file),
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          createdAt: new Date().toISOString(),
        }));

        const isImage = files?.some((f) => f.type.startsWith("image/"));
        const messageType: ChatMessageType = files?.length
          ? isImage
            ? "IMAGE"
            : "FILE"
          : (type ?? "TEXT");

        dispatch(
          chatApi.util.updateQueryData(
            "getConversationMessages",
            { conversationId },
            (draft) => {
              draft.items.push({
                id: tempId,
                conversationId,
                senderId: currentUserId,
                type: messageType,
                content: content ?? "",
                isRead: false,
                readAt: null,
                createdAt: new Date().toISOString(),
                sender: {
                  id: currentUserId,
                  firstName: currentUser.firstName,
                  lastName: currentUser.lastName,
                  email: currentUser.email,
                  role: currentUser.role,
                },
                attachments: optimisticAttachments,
                status: "sending",
              });
              draft.meta.totalItems += 1;
            },
          ),
        );

        try {
          const { data: realMessage } = await queryFulfilled;
          dispatch(
            chatApi.util.updateQueryData(
              "getConversationMessages",
              { conversationId },
              (draft) => {
                const index = draft.items.findIndex((item) => item.id === tempId);
                if (index !== -1) {
                  draft.items[index] = {
                    ...realMessage,
                    status: "sent",
                  };
                }
              },
            ),
          );
        } catch {
          dispatch(
            chatApi.util.updateQueryData(
              "getConversationMessages",
              { conversationId },
              (draft) => {
                const index = draft.items.findIndex((item) => item.id === tempId);
                if (index !== -1) {
                  draft.items[index].status = "failed";
                }
              },
            ),
          );
        }
      },
    }),

    markConversationRead: builder.mutation<
      { success: boolean; readAt: string },
      string
    >({
      query: (conversationId) => ({
        url: `/chat/conversations/${conversationId}/read`,
        method: "PATCH",
      }),
      invalidatesTags: [
        { type: "Chat", id: "CONVERSATIONS" },
        { type: "Chat", id: "UNREAD_COUNT" },
      ],
    }),
  }),
});

export const {
  useGetConversationsQuery,
  useGetConversationQuery,
  useGetChatUnreadCountQuery,
  useStartConversationMutation,
  useGetConversationMessagesQuery,
  useSendConversationMessageMutation,
  useMarkConversationReadMutation,
} = chatApi;
