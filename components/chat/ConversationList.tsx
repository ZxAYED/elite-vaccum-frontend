"use client";

import { MessageSquarePlus, Pin, Search, X } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

import { ChatAvatar } from "./ChatAvatar";
import { conversationTime } from "./format";
import { PRESENCE_TONE, presenceLabel } from "./presence";
import type { Conversation, ConversationFilter } from "./types";

const FILTERS: ReadonlyArray<{ label: string; value: ConversationFilter }> = [
  { label: "All", value: "all" },
  { label: "Unread", value: "unread" },
  { label: "Active", value: "active" },
];

/**
 * The thread rail: search, three filters, and the conversation rows.
 *
 * A row's selected state is drawn with a brand-tinted surface plus a left
 * rail, never colour alone — `aria-current` carries the same fact to anyone
 * not looking at it, and the unread count is a number rather than a dot so it
 * survives being read aloud.
 */
export function ConversationList({
  conversations,
  selectedId,
  onSelect,
  currentUserId,
  onCompose,
  className,
}: {
  conversations: Conversation[];
  selectedId?: string;
  onSelect: (conversationId: string) => void;
  currentUserId: string;
  onCompose?: () => void;
  className?: string;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<ConversationFilter>("all");

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return conversations
      .filter((conversation) => {
        if (filter === "unread" && conversation.unreadCount === 0) return false;
        if (filter === "active" && conversation.participant.presence !== "online") {
          return false;
        }
        if (!needle) return true;
        return (
          conversation.participant.name.toLowerCase().includes(needle) ||
          conversation.subject?.toLowerCase().includes(needle) ||
          conversation.lastMessage?.body.toLowerCase().includes(needle)
        );
      })
      // Pinned threads hold the top regardless of recency; everything else is
      // most-recent-first.
      .sort((a, b) => {
        if (Boolean(a.isPinned) !== Boolean(b.isPinned)) {
          return a.isPinned ? -1 : 1;
        }
        return (
          new Date(b.lastMessage?.sentAt ?? 0).getTime() -
          new Date(a.lastMessage?.sentAt ?? 0).getTime()
        );
      });
  }, [conversations, filter, query]);

  const unreadTotal = conversations.reduce(
    (sum, conversation) => sum + conversation.unreadCount,
    0,
  );

  return (
    <div className={cn("flex min-h-0 flex-col bg-white", className)}>
      <div className="shrink-0 space-y-3 border-b border-slate-100 p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-base font-semibold text-primary">
            Messages
            {unreadTotal > 0 ? (
              <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-bold tabular-nums text-white">
                {unreadTotal > 99 ? "99+" : unreadTotal}
              </span>
            ) : null}
          </h2>
          {onCompose ? (
            <Button
              aria-label="Start a new conversation"
              className="text-primary"
              onClick={onCompose}
              size="icon-sm"
              type="button"
              variant="ghost"
            >
              <MessageSquarePlus size={18} />
            </Button>
          ) : null}
        </div>

        <div className="relative flex items-center">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3.5 text-slate-400"
            size={16}
          />
          <input
            aria-label="Search conversations"
            className={cn(
              "h-11 w-full rounded-[var(--radius-control)] border border-teal-100 bg-slate-50/70",
              "pl-10 pr-10 text-sm text-slate-800 outline-none transition",
              "placeholder:text-slate-400 focus-visible:border-teal-200 focus-visible:bg-white",
              "focus-visible:ring-2 focus-visible:ring-[color:var(--focus-ring)]",
            )}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search people or subjects"
            type="search"
            value={query}
          />
          {query ? (
            <button
              aria-label="Clear search"
              className="absolute right-3 flex size-6 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-200 hover:text-slate-600"
              onClick={() => setQuery("")}
              type="button"
            >
              <X size={14} />
            </button>
          ) : null}
        </div>

        <div className="flex items-center gap-1.5">
          {FILTERS.map((option) => {
            const isSelected = filter === option.value;
            return (
              <button
                aria-pressed={isSelected}
                className={cn(
                  "h-8 rounded-full px-3.5 text-xs font-semibold transition",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600",
                  isSelected
                    ? "bg-primary text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-[var(--brand-soft)] hover:text-primary",
                )}
                key={option.value}
                onClick={() => setFilter(option.value)}
                type="button"
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {visible.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-slate-500">
            {query
              ? `Nothing matched "${query.trim()}".`
              : filter === "unread"
                ? "You're all caught up."
                : "No one is active right now."}
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {visible.map((conversation) => (
              <ConversationRow
                conversation={conversation}
                currentUserId={currentUserId}
                isSelected={conversation.id === selectedId}
                key={conversation.id}
                onSelect={onSelect}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function ConversationRow({
  conversation,
  isSelected,
  onSelect,
  currentUserId,
}: {
  conversation: Conversation;
  isSelected: boolean;
  onSelect: (conversationId: string) => void;
  currentUserId: string;
}) {
  const { participant, lastMessage, unreadCount } = conversation;
  const isUnread = unreadCount > 0;
  const tone = PRESENCE_TONE[participant.presence];
  const preview = lastMessage
    ? `${lastMessage.authorId === currentUserId ? "You: " : ""}${lastMessage.body}`
    : "No messages yet";

  return (
    <li>
      <button
        aria-current={isSelected ? "true" : undefined}
        className={cn(
          "relative flex w-full items-start gap-3 px-4 py-3.5 text-left transition",
          "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-teal-600",
          isSelected
            ? "bg-[var(--brand-soft)]"
            : "hover:bg-slate-50 active:bg-slate-100",
          // The rail repeats what the tint says, so the selected row is still
          // distinguishable if the tint washes out.
          isSelected &&
            "before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-primary before:content-['']",
        )}
        onClick={() => onSelect(conversation.id)}
        type="button"
      >
        <ChatAvatar participant={participant} />

        <span className="min-w-0 flex-1">
          <span className="flex items-baseline justify-between gap-2">
            <span
              className={cn(
                "flex min-w-0 items-center gap-1.5 truncate",
                isUnread || isSelected
                  ? "font-semibold text-primary"
                  : "font-medium text-slate-800",
              )}
            >
              {conversation.isPinned ? (
                <Pin
                  aria-label="Pinned"
                  className="shrink-0 text-teal-600"
                  size={12}
                />
              ) : null}
              <span className="truncate">{participant.name}</span>
            </span>
            <span
              className={cn(
                "shrink-0 text-[11px] tabular-nums",
                isUnread ? "font-semibold text-primary" : "text-slate-400",
              )}
            >
              {lastMessage ? conversationTime(lastMessage.sentAt) : ""}
            </span>
          </span>

          {conversation.subject ? (
            <span className="mt-0.5 block truncate text-[11px] font-medium uppercase tracking-wide text-teal-700">
              {conversation.subject}
            </span>
          ) : null}

          <span className="mt-1 flex items-end justify-between gap-2">
            <span
              className={cn(
                "line-clamp-1 min-w-0 flex-1 text-xs",
                isUnread ? "font-medium text-slate-700" : "text-slate-500",
              )}
            >
              {preview}
            </span>
            {isUnread ? (
              <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-bold tabular-nums text-white">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            ) : null}
          </span>

          <span className={cn("mt-1 block text-[11px] font-medium", tone.text)}>
            {presenceLabel(participant.presence, participant.lastActiveAt)}
          </span>
        </span>
      </button>
    </li>
  );
}
