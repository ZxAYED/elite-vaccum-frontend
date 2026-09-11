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
  const isSending = status === "sending";
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
            "rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed transition-all duration-300",
            // Long tokens (an order number, a pasted URL) reflow instead of
            // forcing the bubble past its max width.
            "wrap-break-word whitespace-pre-wrap text-left",
            isOwn
              ? isSending
                ? "border border-slate-300/80 bg-slate-200/90 text-slate-700 shadow-xs"
                : "bg-primary text-white shadow-[0_10px_24px_-18px_rgba(28,79,80,0.9)]"
              : "border border-slate-200/80 bg-white text-slate-800 shadow-xs",
            isOwn && !isGroupEnd && "rounded-br-md",
            !isOwn && !isGroupEnd && "rounded-bl-md",
            hasFailed && "border border-rose-300 bg-rose-50 text-rose-900",
          )}
        >
          {message.body}

          {message.attachments?.length ? (
            <div className="mt-2 space-y-2">
              {message.attachments.map((attachment) => {
                const isImage = attachment.kind === "image" && attachment.url;
                const isVideo = attachment.kind === "video" && attachment.url;

                return (
                  <div className="space-y-1" key={attachment.id}>
                    {isImage ? (
                      <a
                        className="block overflow-hidden rounded-lg border border-black/10 transition hover:opacity-95"
                        href={attachment.url}
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          alt={attachment.name}
                          className="max-h-64 w-auto max-w-full rounded-lg object-cover"
                          loading="lazy"
                          src={attachment.url}
                        />
                      </a>
                    ) : null}

                    {isVideo ? (
                      <div className="overflow-hidden rounded-lg border border-black/10 bg-black/5">
                        <video
                          className="max-h-64 w-full rounded-lg"
                          controls
                          playsInline
                          preload="metadata"
                          src={attachment.url}
                        />
                      </div>
                    ) : null}

                    <a
                      className={cn(
                        "flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs transition",
                        isOwn
                          ? isSending
                            ? "bg-slate-300/60 text-slate-700 hover:bg-slate-300"
                            : "bg-white/10 text-white hover:bg-white/20"
                          : "bg-slate-50 text-slate-800 hover:bg-slate-100",
                        !attachment.url && "pointer-events-none",
                      )}
                      href={attachment.url || "#"}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      <Paperclip
                        aria-hidden="true"
                        className="shrink-0 opacity-70"
                        size={13}
                      />
                      <span className="min-w-0 flex-1 truncate font-medium underline-offset-2 hover:underline">
                        {attachment.name}
                      </span>
                      <span
                        className={cn(
                          "shrink-0 tabular-nums text-[11px]",
                          isOwn
                            ? isSending
                              ? "text-slate-500"
                              : "text-white/70"
                            : "text-slate-500",
                        )}
                      >
                        {formatBytes(attachment.size)}
                      </span>
                    </a>
                  </div>
                );
              })}
            </div>
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
                    isSending && "text-slate-400",
                    status === "read" && "text-teal-600",
                    status === "sent" && "text-slate-400",
                    hasFailed && "text-rose-600",
                  )}
                  size={13}
                />
                {isSending ? (
                  <span className="text-[11px] font-medium text-slate-400">Sending...</span>
                ) : hasFailed ? (
                  <span className="font-medium text-rose-600">{STATUS_LABEL[status]}</span>
                ) : (
                  <span className="sr-only">{STATUS_LABEL[status]}</span>
                )}
              </>
            ) : null}
          </p>
        ) : null}
      </div>
    </div>
  );
}
