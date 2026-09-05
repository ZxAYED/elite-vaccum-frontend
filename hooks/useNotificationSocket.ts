"use client";

import { useEffect, useRef } from "react";
import { io, type Socket } from "socket.io-client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { notificationsApi } from "@/redux/api/notificationsApi";
import { playNotificationSound } from "@/lib/notificationSound";
import { getCookie } from "@/lib/cookies";
import { AUTH_TOKEN_KEY, API_BASE_URL } from "@/redux/constants";

interface NotificationPayload {
  id?: string;
  title: string;
  message: string;
  type?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  metadata?: {
    serviceRequestId?: string;
    quotationId?: string;
    requestId?: string;
    orderId?: string;
    [key: string]: unknown;
  };
  createdAt?: string;
}

interface UnreadCountPayload {
  unreadCount: number;
}

function getSocketBaseUrl(): string {
  if (typeof window === "undefined") return "http://localhost:3000";
  const explicit = process.env.NEXT_PUBLIC_SOCKET_URL;
  if (explicit) return explicit;
  try {
    const parsed = new URL(API_BASE_URL);
    return parsed.origin;
  } catch {
    return "http://localhost:3000";
  }
}

export function useNotificationSocket() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const tokenFromRedux = useAppSelector((state) => state.auth.token);
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const token =
      tokenFromRedux ||
      getCookie(AUTH_TOKEN_KEY) ||
      (typeof window !== "undefined"
        ? localStorage.getItem(AUTH_TOKEN_KEY) || localStorage.getItem("token")
        : null);

    if (!token || !isAuthenticated) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    const baseUrl = getSocketBaseUrl();
    const socket = io(`${baseUrl}/notifications`, {
      query: { token },
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      // Connected to notifications gateway
    });

    socket.on("notification:new", (notification: NotificationPayload) => {
      playNotificationSound();

      // Invalidate RTK cache to re-fetch unread count and inbox list
      dispatch(
        notificationsApi.util.invalidateTags([
          { type: "Notification", id: "LIST" },
          { type: "Notification", id: "UNREAD_COUNT" },
        ]),
      );

      const title = notification.title || "New Notification";
      const message = notification.message || "";
      const meta = notification.metadata || {};
      const serviceReqId =
        (meta.serviceRequestId as string) ||
        (meta.requestId as string) ||
        (meta.businessId as string);

      const titleLower = title.toLowerCase();
      const messageLower = message.toLowerCase();
      const isQuote =
        Boolean(meta.quotationId) ||
        titleLower.includes("quotation") ||
        titleLower.includes("quote") ||
        messageLower.includes("quotation") ||
        messageLower.includes("quote");

      let resolvedCtaUrl = notification.ctaUrl;
      let resolvedCtaLabel = notification.ctaLabel;

      if (!resolvedCtaUrl && serviceReqId) {
        if (isQuote) {
          resolvedCtaUrl = `/user/services/${serviceReqId}#quotation`;
          resolvedCtaLabel = resolvedCtaLabel || "Review Quotation";
        } else {
          resolvedCtaUrl = `/user/services/${serviceReqId}`;
          resolvedCtaLabel = resolvedCtaLabel || "View Request";
        }
      } else if (!resolvedCtaUrl && meta.orderId) {
        resolvedCtaUrl = `/user/orders/${meta.orderId}`;
        resolvedCtaLabel = resolvedCtaLabel || "View Order";
      }

      toast(title, {
        description: message,
        action: resolvedCtaUrl
          ? {
              label: resolvedCtaLabel || "View",
              onClick: () => router.push(resolvedCtaUrl!),
            }
          : undefined,
        duration: 5000,
      });
    });

    socket.on("notification:unread_count", (payload: UnreadCountPayload) => {
      if (typeof payload?.unreadCount === "number") {
        dispatch(
          notificationsApi.util.updateQueryData(
            "getUnreadNotificationsCount",
            undefined,
            () => ({ unreadCount: payload.unreadCount }),
          ),
        );
      }
    });

    socket.on("disconnect", () => {
      // Disconnected
    });

    socket.on("connect_error", () => {
      // Silent error fallback - REST polling/query continues seamlessly
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [dispatch, isAuthenticated, router, tokenFromRedux]);

  return {
    getSocket: () => socketRef.current,
  };
}
