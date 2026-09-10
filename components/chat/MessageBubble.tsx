"use client";

import { AlertCircle, Check, CheckCheck, Clock, Paperclip } from "lucide-react";

import { cn } from "@/lib/utils";

import { formatBytes, messageTime } from "./format";
import type { ChatMessage, MessageStatus } from "./types";

const STATUS_ICON: Record<MessageStatus, typeof Check> = {
  sending: Clock,
  sent: Check,
  delivered: CheckCheck,
  read: CheckCheck,
  failed: AlertCircle,
};

const STATUS_LABEL: Record<MessageStatus, string> = {
  sending: "Sending",
  sent: "Sent",
  delivered: "Delivered",
  read: "Read",
  failed: "Not delivered",
};

/**
 * One message.
 *
 * Own messages sit right in the brand colour, incoming ones left on white.
 * Consecutive messages from the same author lose their inner corner so a run
 * reads as one block, which is what `isGroupStart` / `isGroupEnd` control.
 */
export function MessageBubble({
  message,
  isOwn,
  isGroupStart,
  isGroupEnd,
}: {
  message: ChatMessage;
  isOwn: boolean;
  isGroupStart: boolean;
  isGroupEnd: boolean;
}) {
  const status = message.status;
  const StatusIcon = status ? STATUS_ICON[status] : null;
  const hasFailed = status === "failed";

  return (
    <div
      className={cn(
        "flex w-full",
        isOwn ? "justify-end" : "justify-start",
        isGroupStart ? "mt-3" : "mt-1",
      )}
    >
      <div
        className={cn(
          "max-w-[85%] sm:max-w-[70%]",
          isOwn ? "items-end text-right" : "items-start text-left",
        )}
      >
        <div
          className={cn(
            "rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
            // Long tokens (an order number, a pasted URL) reflow instead of
            // forcing the bubble past its max width.
            "wrap-break-word whitespace-pre-wrap text-left",
            isOwn
              ? "bg-primary text-white shadow-[0_10px_24px_-18px_rgba(28,79,80,0.9)]"
              : "border border-slate-200/80 bg-white text-slate-800 shadow-xs",
            isOwn && !isGroupEnd && "rounded-br-md",
            !isOwn && !isGroupEnd && "rounded-bl-md",
            hasFailed && "border border-rose-300 bg-rose-50 text-rose-900",
          )}
        >
          {message.body}

          {message.attachments?.length ? (
            <ul
              className={cn(
                "mt-2 space-y-1.5 border-t pt-2",
                isOwn ? "border-white/20" : "border-slate-100",
              )}
            >
              {message.attachments.map((attachment) => (
                <li
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs",
                    isOwn ? "bg-white/10" : "bg-slate-50",
                  )}
                  key={attachment.id}
                >
                  <Paperclip
                    aria-hidden="true"
                    className="shrink-0 opacity-70"
                    size={13}
                  />
                  <span className="min-w-0 flex-1 truncate font-medium">
                    {attachment.name}
                  </span>
                  <span
                    className={cn(
                      "shrink-0 tabular-nums",
                      isOwn ? "text-white/70" : "text-slate-500",
                    )}
                  >
                    {formatBytes(attachment.size)}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        {/*
          The timestamp and delivery state only print on the last message of a
          run — repeating them under every bubble is noise, and the run shares
          a minute anyway.
        */}
        {isGroupEnd ? (
          <p
            className={cn(
              "mt-1 flex items-center gap-1 px-1 text-[11px] tabular-nums",
              isOwn ? "justify-end" : "justify-start",
              hasFailed ? "text-rose-600" : "text-slate-400",
            )}
          >
            <span>{messageTime(message.sentAt)}</span>
            {isOwn && StatusIcon && status ? (
              <>
                <StatusIcon
                  aria-hidden="true"
                  className={cn(
                    status === "read" && "text-teal-600",
                    hasFailed && "text-rose-600",
                  )}
                  size={13}
                />
                {/* The tick is decorative; the state itself is spoken here. */}
                <span className="sr-only">{STATUS_LABEL[status]}</span>
                {hasFailed ? (
                  <span className="font-medium">{STATUS_LABEL[status]}</span>
                ) : null}
              </>
            ) : null}
          </p>
        ) : null}
      </div>
    </div>
  );
}
