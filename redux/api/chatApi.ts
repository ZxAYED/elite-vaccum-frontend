import { baseApi } from "./baseApi";
import type { PaginatedResponse } from "./types";

export interface ConversationParticipant {
  userId: string;
  roleInChat: string;
}

export interface ConversationDto {
  id: string;
  type: string;
  title: string;
  unreadCount: number;
  isOtherOnline?: boolean;
  lastMessage?: {
    content: string;
    createdAt: string;
  };
  participants?: ConversationParticipant[];
  createdAt?: string;
}

export interface ChatMessageDto {
  id: string;
  conversationId: string;
  content: string;
  type: "TEXT" | "IMAGE" | "FILE";
  isRead: boolean;
  sender: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  attachments: Array<{ id: string; url: string; fileName: string }>;
  createdAt: string;
}

export interface StartConversationRequest {
  type?: "SUPPORT" | "DIRECT";
  title?: string;
  initialMessage?: string;
  participantId?: string;
}

export interface GetMessagesParams {
  id: string;
  page?: number;
  limit?: number;
  before?: string;
}

export const chatApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getConversations: builder.query<PaginatedResponse<ConversationDto>, void>({
      query: () => "/chat/conversations",
      providesTags: [{ type: "Chat", id: "CONVERSATIONS" }],
    }),
    getChatUnreadCount: builder.query<{ success: boolean; unreadCount: number }, void>({
      query: () => "/chat/unread-count",
      providesTags: [{ type: "Chat", id: "UNREAD_COUNT" }],
    }),
    startConversation: builder.mutation<ConversationDto, StartConversationRequest>({
      query: (body) => ({
        url: "/chat/conversations",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Chat", id: "CONVERSATIONS" }],
    }),
    getConversationMessages: builder.query<PaginatedResponse<ChatMessageDto>, GetMessagesParams>({
      query: ({ id, ...params }) => ({
        url: `/chat/conversations/${id}/messages`,
        params: params || undefined,
      }),
      providesTags: (_result, _error, { id }) => [{ type: "Chat", id }],
    }),
    sendConversationMessage: builder.mutation<
      ChatMessageDto,
      { conversationId: string; body: FormData | { content: string; type?: string } }
    >({
      query: ({ conversationId, body }) => ({
        url: `/chat/conversations/${conversationId}/messages`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { conversationId }) => [
        { type: "Chat", id: conversationId },
        { type: "Chat", id: "CONVERSATIONS" },
      ],
    }),
    markConversationRead: builder.mutation<{ success: boolean; readAt: string }, string>({
      query: (conversationId) => ({
        url: `/chat/conversations/${conversationId}/read`,
        method: "PATCH",
      }),
      invalidatesTags: (_result, _error, conversationId) => [
        { type: "Chat", id: conversationId },
        { type: "Chat", id: "CONVERSATIONS" },
        { type: "Chat", id: "UNREAD_COUNT" },
      ],
    }),
  }),
});

export const {
  useGetConversationsQuery,
  useGetChatUnreadCountQuery,
  useStartConversationMutation,
  useGetConversationMessagesQuery,
  useSendConversationMessageMutation,
  useMarkConversationReadMutation,
} = chatApi;
