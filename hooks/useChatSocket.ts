"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";

import { getCookie } from "@/lib/cookies";
import { getSocketBaseUrl } from "@/lib/socketUrl";
import { chatApi, type ChatMessageDto } from "@/redux/api/chatApi";
import { AUTH_TOKEN_KEY } from "@/redux/constants";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";

interface MessageReceivedPayload {
  conversationId: string;
  message: ChatMessageDto;
}

interface TypingPayload {
  conversationId: string;
  userId: string;
  userName?: string;
  isTyping: boolean;
}

interface ReadReceiptPayload {
  conversationId: string;
  userId: string;
  readAt: string;
}

/**
 * The `/chat` gateway: live messages, typing, and read receipts.
 *
 * The socket is a delivery channel, not a second source of truth. An incoming
 * message is written into the RTK cache for the open thread and the list is
 * invalidated; everything the UI renders still comes from the query cache, so
 * a dropped socket degrades to whatever the last fetch returned rather than to
 * a blank screen.
 *
 * `activeConversationId` is held in a ref as well as the dependency list: the
 * handlers are registered once per connection and read the current thread at
 * event time, so switching threads does not tear down the socket.
 */
export function useChatSocket(activeConversationId?: string) {
  const dispatch = useAppDispatch();
  const tokenFromRedux = useAppSelector((state) => state.auth.token);
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const currentUserId = useAppSelector((state) => state.auth.user?.id);

  const socketRef = useRef<Socket | null>(null);
  const activeIdRef = useRef<string | undefined>(activeConversationId);

  // Who is typing, by conversation. Set from socket callbacks only, never
  // from inside an effect body.
  const [typingByConversation, setTypingByConversation] = useState<
    Record<string, string | undefined>
  >({});
  const typingTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    const token =
      tokenFromRedux ||
      getCookie(AUTH_TOKEN_KEY) ||
      (typeof window !== "undefined"
        ? localStorage.getItem(AUTH_TOKEN_KEY)
        : null);

    if (!token || !isAuthenticated) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      return;
    }

    const socket = io(`${getSocketBaseUrl()}/chat`, {
      // The gateway reads any of the three; sending both covers the auth
      // handshake and the reconnect query alike.
      auth: { token },
      query: { token },
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      const openId = activeIdRef.current;
      if (openId) socket.emit("chat:join_conversation", { conversationId: openId });
    });

    socket.on("chat:message_received", (payload: MessageReceivedPayload) => {
      const { conversationId, message } = payload ?? {};
      if (!conversationId || !message) return;

      // 1. Unconditionally update the open/cached thread so it appears without delay
      dispatch(
        chatApi.util.updateQueryData(
          "getConversationMessages",
          { conversationId },
          (draft) => {
            // Deduplicate by id or replace matching temporary optimistic message
            const existingIndex = draft.items.findIndex(
              (item) =>
                item.id === message.id ||
                (item.id.startsWith("temp-") &&
                  item.content === message.content &&
                  item.senderId === message.senderId),
            );
            if (existingIndex >= 0) {
              draft.items[existingIndex] = message;
            } else {
              draft.items.push(message);
              draft.meta.totalItems += 1;
            }
          },
        ),
      );

      // 2. Invalidate MESSAGES, CONVERSATIONS, and UNREAD_COUNT tags so RTK Query refetches in real-time
      dispatch(
        chatApi.util.invalidateTags([
          { type: "Chat", id: `MESSAGES-${conversationId}` },
          { type: "Chat", id: "CONVERSATIONS" },
          { type: "Chat", id: "UNREAD_COUNT" },
        ]),
      );

      // 3. If this message arrived in the currently open conversation, mark it as read immediately
      if (conversationId === activeIdRef.current) {
        dispatch(chatApi.endpoints.markConversationRead.initiate(conversationId));
        socket.emit("chat:mark_read", { conversationId });
      }
    });

    socket.on("chat:typing_update", (payload: TypingPayload) => {
      const { conversationId, userId, userName, isTyping } = payload ?? {};
      if (!conversationId || userId === currentUserId) return;

      clearTimeout(typingTimers.current[conversationId]);

      if (!isTyping) {
        setTypingByConversation((current) => ({
          ...current,
          [conversationId]: undefined,
        }));
        return;
      }

      setTypingByConversation((current) => ({
        ...current,
        [conversationId]: userName || "Someone",
      }));

      // A "stopped typing" event can be lost; without this the indicator
      // would stay up for the rest of the session.
      typingTimers.current[conversationId] = setTimeout(() => {
        setTypingByConversation((current) => ({
          ...current,
          [conversationId]: undefined,
        }));
      }, 4000);
    });

    socket.on("chat:read_receipt_update", (payload: ReadReceiptPayload) => {
      const { conversationId, userId } = payload ?? {};
      // Our own receipt changes nothing on screen; the other side's marks our
      // outgoing messages read.
      if (!conversationId || userId === currentUserId) return;

      dispatch(
        chatApi.util.updateQueryData(
          "getConversationMessages",
          { conversationId },
          (draft) => {
            for (const message of draft.items) {
              if (message.senderId === currentUserId) {
                message.isRead = true;
                message.readAt = payload.readAt;
              }
            }
          },
        ),
      );
    });

    socket.on("connect_error", () => {
      // Silent: the REST queries already rendered the thread, and reconnection
      // is handled by the client. A toast here would fire on every flaky
      // network blip.
    });

    const timers = typingTimers.current;
    return () => {
      for (const timer of Object.values(timers)) clearTimeout(timer);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [currentUserId, dispatch, isAuthenticated, tokenFromRedux]);

  /**
   * Joining is separate from connecting: the thread can change many times
   * within one connection. This also owns the ref the socket handlers read at
   * event time — writing it during render is what the compiler forbids, and
   * an effect is early enough, since the handlers only fire on real events.
   */
  useEffect(() => {
    activeIdRef.current = activeConversationId;
    if (!activeConversationId) return;
    socketRef.current?.emit("chat:join_conversation", {
      conversationId: activeConversationId,
    });
  }, [activeConversationId]);

  const emitTyping = useCallback(
    (isTyping: boolean) => {
      const conversationId = activeIdRef.current;
      if (!conversationId) return;
      socketRef.current?.emit("chat:typing", { conversationId, isTyping });
    },
    [],
  );

  const emitMarkRead = useCallback((conversationId: string) => {
    socketRef.current?.emit("chat:mark_read", { conversationId });
  }, []);

  return {
    /** Display name of whoever is typing in this thread, if anyone. */
    typingName: activeConversationId
      ? typingByConversation[activeConversationId]
      : undefined,
    emitTyping,
    emitMarkRead,
  };
}
