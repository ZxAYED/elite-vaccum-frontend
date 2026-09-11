"use client";

import { ArrowDown, Loader2 } from "lucide-react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import { cn } from "@/lib/utils";

import { ChatAvatar } from "./ChatAvatar";
import { groupByDay } from "./format";
import { MessageBubble } from "./MessageBubble";
import type { ChatMessage, ChatParticipant } from "./types";

/**
 * The transcript.
 *
 * Messages are bucketed by day, then by consecutive author. Supports upward
 * scroll pagination with scroll anchoring so prepending older history does not
 * jump the viewport, and follows the newest message only when near the bottom.
 */
export function MessageList({
  messages,
  currentUserId,
  participant,
  isTyping = false,
  hasMoreOlder = false,
  isLoadingOlder = false,
  onLoadOlder,
  unreadCount = 0,
  className,
}: {
  messages: ChatMessage[];
  currentUserId: string;
  participant: ChatParticipant;
  isTyping?: boolean;
  hasMoreOlder?: boolean;
  isLoadingOlder?: boolean;
  onLoadOlder?: () => void;
  unreadCount?: number;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const topSentinelRef = useRef<HTMLDivElement>(null);

  const prevScrollHeightRef = useRef<number>(0);
  const prevFirstMessageIdRef = useRef<string | null>(null);
  const prevMessagesLengthRef = useRef<number>(messages.length);
  const isNearBottomRef = useRef<boolean>(true);

  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [hasNewMessagesSinceScroll, setHasNewMessagesSinceScroll] = useState(false);

  // Top sentinel intersection observer for loading older messages
  useEffect(() => {
    const sentinel = topSentinelRef.current;
    if (!sentinel || !hasMoreOlder || isLoadingOlder) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMoreOlder && !isLoadingOlder) {
          onLoadOlder?.();
        }
      },
      { root: containerRef.current, threshold: 0.1 },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMoreOlder, isLoadingOlder, onLoadOlder]);

  function handleScroll() {
    const el = containerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const isNear = distanceFromBottom < 120;
    isNearBottomRef.current = isNear;

    if (isNear) {
      setShowScrollBottom(false);
      setHasNewMessagesSinceScroll(false);
    } else {
      setShowScrollBottom(true);
    }
  }

  // Scroll anchoring on prepends & auto-scroll on new messages
  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const currentFirstId = messages[0]?.id ?? null;
    const prevFirstId = prevFirstMessageIdRef.current;
    const prevHeight = prevScrollHeightRef.current;

    if (
      prevFirstId &&
      currentFirstId &&
      currentFirstId !== prevFirstId &&
      messages.length > prevMessagesLengthRef.current
    ) {
      // Older messages were prepended to the top: anchor scroll position
      const heightDiff = el.scrollHeight - prevHeight;
      el.scrollTop += heightDiff;
    } else if (isNearBottomRef.current || !prevFirstId) {
      // Initial mount or user is already near bottom: scroll to bottom
      el.scrollTop = el.scrollHeight;
    } else if (messages.length > prevMessagesLengthRef.current) {
      // User is scrolled up and a new message arrived at bottom: notify via pill
      requestAnimationFrame(() => {
        setHasNewMessagesSinceScroll(true);
      });
    }

    prevScrollHeightRef.current = el.scrollHeight;
    prevFirstMessageIdRef.current = currentFirstId;
    prevMessagesLengthRef.current = messages.length;
  }, [messages]);

  // Typing scroll if near bottom
  useEffect(() => {
    if (isTyping && isNearBottomRef.current) {
      bottomRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
    }
  }, [isTyping]);

  const days = useMemo(() => groupByDay(messages), [messages]);

  // Determine the message id where unread divider should sit
  const firstUnreadMessageId = useMemo(() => {
    if (!unreadCount || unreadCount <= 0) return null;
    const incoming = messages.filter((m) => m.authorId !== currentUserId);
    if (!incoming.length) return null;
    const unreadIncoming = incoming.slice(-unreadCount);
    return unreadIncoming[0]?.id ?? null;
  }, [currentUserId, messages, unreadCount]);

  return (
    <div
      className={cn(
        "relative min-h-0 flex-1 overflow-y-auto bg-[linear-gradient(180deg,#f8fbfa_0%,#f4f7f6_100%)] px-4 py-4 sm:px-6",
        className,
      )}
      onScroll={handleScroll}
      ref={containerRef}
    >
      {/* Top loader or sentinel */}
      {isLoadingOlder ? (
        <div className="flex items-center justify-center gap-2 py-3 text-xs text-slate-500">
          <Loader2 aria-hidden="true" className="animate-spin text-teal-600" size={16} />
          <span>Loading older messages...</span>
        </div>
      ) : hasMoreOlder ? (
        <div className="h-4 w-full" ref={topSentinelRef} />
      ) : messages.length > 0 ? (
        <p className="py-2 text-center text-[11px] font-medium text-slate-400">
          Beginning of conversation history
        </p>
      ) : null}

      {days.length === 0 && !isLoadingOlder ? (
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
            const showUnreadDivider = message.id === firstUnreadMessageId;

            return (
              <div key={message.id}>
                {showUnreadDivider ? (
                  <div className="my-3 flex items-center justify-center gap-2">
                    <div className="h-px flex-1 bg-teal-200" />
                    <span className="rounded-full border border-teal-200 bg-teal-50 px-3 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-teal-800 shadow-xs">
                      New Messages
                    </span>
                    <div className="h-px flex-1 bg-teal-200" />
                  </div>
                ) : null}

                <MessageBubble
                  isGroupEnd={!next || next.authorId !== message.authorId}
                  isGroupStart={!previous || previous.authorId !== message.authorId}
                  isOwn={isOwn}
                  message={message}
                />
              </div>
            );
          })}
        </section>
      ))}

      {isTyping ? <TypingIndicator participant={participant} /> : null}

      <div ref={bottomRef} />

      {/* Floating scroll to bottom / new messages button */}
      {showScrollBottom ? (
        <button
          className="sticky bottom-2 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-xs font-semibold text-white shadow-md transition hover:bg-teal-700"
          onClick={() => {
            const el = containerRef.current;
            if (el) {
              el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
              setShowScrollBottom(false);
              setHasNewMessagesSinceScroll(false);
            }
          }}
          type="button"
        >
          <span>{hasNewMessagesSinceScroll ? "New messages" : "Latest messages"}</span>
          <ArrowDown size={14} />
        </button>
      ) : null}
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
