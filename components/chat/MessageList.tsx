"use client";

import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

import { ChatAvatar } from "./ChatAvatar";
import { groupByDay } from "./format";
import { MessageBubble } from "./MessageBubble";
import type { ChatMessage, ChatParticipant } from "./types";

/**
 * The transcript.
 *
 * Messages are bucketed by day, then by consecutive author, so a run from one
 * person reads as a block with a single timestamp under it. The viewport
 * follows the newest message, which is the one behaviour a chat log cannot do
 * without.
 */
export function MessageList({
  messages,
  currentUserId,
  participant,
  isTyping = false,
  className,
}: {
  messages: ChatMessage[];
  currentUserId: string;
  participant: ChatParticipant;
  isTyping?: boolean;
  className?: string;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // `auto` rather than `smooth`: on first paint a smooth scroll animates the
    // whole history past the reader before settling.
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length, isTyping]);

  const days = groupByDay(messages);

  return (
    <div
      className={cn(
        "min-h-0 flex-1 overflow-y-auto bg-[linear-gradient(180deg,#f8fbfa_0%,#f4f7f6_100%)] px-4 py-4 sm:px-6",
        className,
      )}
    >
      {days.length === 0 ? (
        <p className="py-12 text-center text-sm text-slate-500">
          No messages yet. Say hello to start the conversation.
        </p>
      ) : null}

      {days.map((day) => (
        <section key={day.key}>
          <h3 className="sticky top-0 z-10 my-3 flex justify-center">
            <span className="rounded-full border border-teal-100 bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-teal-800 shadow-xs backdrop-blur">
              {day.label}
            </span>
          </h3>

          {day.messages.map((message, index) => {
            const isOwn = message.authorId === currentUserId;
            const previous = day.messages[index - 1];
            const next = day.messages[index + 1];

            return (
              <MessageBubble
                isGroupEnd={!next || next.authorId !== message.authorId}
                isGroupStart={!previous || previous.authorId !== message.authorId}
                isOwn={isOwn}
                key={message.id}
                message={message}
              />
            );
          })}
        </section>
      ))}

      {isTyping ? <TypingIndicator participant={participant} /> : null}

      <div ref={bottomRef} />
    </div>
  );
}

/**
 * Typing state, said twice: three animated dots, and the sentence underneath
 * them. The dots stop under `prefers-reduced-motion`, at which point the
 * sentence is the whole signal, which is why it is not decoration.
 */
function TypingIndicator({ participant }: { participant: ChatParticipant }) {
  return (
    <div aria-live="polite" className="mt-3 flex items-end gap-2">
      <ChatAvatar participant={participant} showPresence={false} size="sm" />
      <div className="rounded-2xl rounded-bl-md border border-slate-200/80 bg-white px-3.5 py-3 shadow-xs">
        <span aria-hidden="true" className="flex items-center gap-1">
          {[0, 1, 2].map((dot) => (
            <span
              className="size-1.5 animate-bounce rounded-full bg-teal-500 motion-reduce:animate-none"
              key={dot}
              style={{ animationDelay: `${dot * 140}ms` }}
            />
          ))}
        </span>
      </div>
      <span className="pb-1 text-xs font-medium text-slate-500">
        {participant.name.split(" ")[0]} is typing
      </span>
    </div>
  );
}
