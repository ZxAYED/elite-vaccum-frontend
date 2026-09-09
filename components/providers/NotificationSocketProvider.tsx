"use client";

import React from "react";
import { useNotificationSocket } from "@/hooks/useNotificationSocket";

export function NotificationSocketProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useNotificationSocket();
  return <>{children}</>;
}
