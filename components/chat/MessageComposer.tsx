"use client";

import { Paperclip, SendHorizontal, Smile, X } from "lucide-react";
import { useLayoutEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

import { formatBytes } from "./format";
import type { ChatAttachment, ChatParticipant } from "./types";

/** Roughly six lines before the box stops growing and starts scrolling. */
const MAX_COMPOSER_HEIGHT = 160;

/**
 * The composer.
 *
 * Enter sends, Shift+Enter breaks the line, and the box grows with the draft
 * up to a ceiling and then scrolls — so a long message never pushes the
 * transcript off screen.
 */
export function MessageComposer({
  participant,
  onSend,
  disabled = false,
  className,
}: {
  participant: ChatParticipant;
  /** Wired to the API later; the UI only guarantees a non-empty body. */
  onSend?: (body: string, attachments: ChatAttachment[]) => void;
  disabled?: boolean;
  className?: string;
}) {
  const [draft, setDraft] = useState("");
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Height is a property of the DOM node, not React state: writing it here
  // keeps the growth in one paint and avoids a state write inside an effect.
  useLayoutEffect(() => {
    const node = textareaRef.current;
    if (!node) return;
    node.style.height = "auto";
    node.style.height = `${Math.min(node.scrollHeight, MAX_COMPOSER_HEIGHT)}px`;
  }, [draft]);

  const canSend = draft.trim().length > 0 || attachments.length > 0;
  const isOffline = participant.presence === "offline";

  function send() {
    if (!canSend || disabled) return;
    onSend?.(draft.trim(), attachments);
    setDraft("");
    setAttachments([]);
  }

  return (
    <div
      className={cn(
        "shrink-0 border-t border-slate-100 bg-white px-3 py-3 sm:px-4",
        className,
      )}
    >
      {/*
        Offline is stated rather than enforced: the message still sends, the
        line only sets the expectation about when it will be read.
      */}
      {isOffline ? (
        <p className="mb-2 rounded-lg bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-500">
          {participant.name.split(" ")[0]} is offline. Your message will be
          waiting when they return.
        </p>
      ) : null}

      {attachments.length > 0 ? (
        <ul className="mb-2 flex flex-wrap gap-2">
          {attachments.map((attachment) => (
            <li
              className="flex items-center gap-2 rounded-lg border border-teal-100 bg-[var(--brand-soft)] px-2.5 py-1.5 text-xs font-medium text-primary"
              key={attachment.id}
            >
              <Paperclip aria-hidden="true" size={13} />
              <span className="max-w-40 truncate">{attachment.name}</span>
              <span className="tabular-nums text-teal-700/70">
                {formatBytes(attachment.size)}
              </span>
              <button
                aria-label={`Remove ${attachment.name}`}
                className="rounded-md p-0.5 text-teal-700 transition hover:bg-white/70"
                onClick={() =>
                  setAttachments((current) =>
                    current.filter((item) => item.id !== attachment.id),
                  )
                }
                type="button"
              >
                <X size={13} />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <div
        className={cn(
          "flex items-end gap-1.5 rounded-[var(--radius-control)] border border-teal-100 bg-slate-50/70 p-1.5 transition",
          "focus-within:border-teal-200 focus-within:bg-white focus-within:ring-2 focus-within:ring-[color:var(--focus-ring)]",
          disabled && "opacity-60",
        )}
      >
        <Button
          aria-label="Attach a file"
          className="shrink-0 text-slate-500 hover:text-primary"
          disabled={disabled}
          size="icon-sm"
          type="button"
          variant="ghost"
        >
          <Paperclip size={18} />
        </Button>

        <label className="sr-only" htmlFor="chat-composer">
          Write a message to {participant.name}
        </label>
        <textarea
          className={cn(
            "min-h-9 flex-1 resize-none border-0 bg-transparent py-2 text-sm leading-relaxed",
            "text-slate-800 outline-none placeholder:text-slate-400",
          )}
          disabled={disabled}
          id="chat-composer"
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              send();
            }
          }}
          placeholder="Write a message"
          ref={textareaRef}
          rows={1}
          value={draft}
        />

        <Button
          aria-label="Insert an emoji"
          className="shrink-0 text-slate-500 hover:text-primary"
          disabled={disabled}
          size="icon-sm"
          type="button"
          variant="ghost"
        >
          <Smile size={18} />
        </Button>

        <Button
          aria-label="Send message"
          className="shrink-0"
          disabled={!canSend || disabled}
          onClick={send}
          size="icon-sm"
          type="button"
        >
          <SendHorizontal size={17} />
        </Button>
      </div>

      <p className="mt-1.5 px-1 text-[11px] text-slate-400">
        <kbd className="font-sans font-semibold text-slate-500">Enter</kbd> to
        send,{" "}
        <kbd className="font-sans font-semibold text-slate-500">Shift</kbd> +{" "}
        <kbd className="font-sans font-semibold text-slate-500">Enter</kbd> for
        a new line
      </p>
    </div>
  );
}
