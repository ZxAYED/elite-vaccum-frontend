"use client";

import { Paperclip, SendHorizontal, X } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { toast } from "sonner";

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
  onTyping,
  disabled = false,
  className,
}: {
  participant: ChatParticipant;
  /** The UI only guarantees a non-empty body or at least one attachment. */
  onSend?: (body: string, attachments: ChatAttachment[]) => Promise<void> | void;
  /** Fires on the transitions only, never on every keystroke. */
  onTyping?: (isTyping: boolean) => void;
  disabled?: boolean;
  className?: string;
}) {
  const [draft, setDraft] = useState("");
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [isSending, setIsSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Height is a property of the DOM node, not React state: writing it here
  // keeps the growth in one paint and avoids a state write inside an effect.
  useLayoutEffect(() => {
    const node = textareaRef.current;
    if (!node) return;
    node.style.height = "auto";
    node.style.height = `${Math.min(node.scrollHeight, MAX_COMPOSER_HEIGHT)}px`;
  }, [draft]);

  // Typing heartbeat: emit every 2.5s while draft is non-empty so the 4s receiver timer never dies
  const isDrafting = draft.trim().length > 0;
  useEffect(() => {
    if (!isDrafting) {
      onTyping?.(false);
      return;
    }

    onTyping?.(true);
    const interval = setInterval(() => {
      onTyping?.(true);
    }, 2500);

    return () => {
      clearInterval(interval);
    };
  }, [isDrafting, onTyping]);

  const canSend = draft.trim().length > 0 || attachments.length > 0;
  const isOffline = participant.presence === "offline";

  async function send() {
    if (!canSend || disabled || isSending) return;
    const currentDraft = draft.trim();
    const currentAttachments = [...attachments];

    setIsSending(true);
    try {
      await onSend?.(currentDraft, currentAttachments);
      setDraft("");
      setAttachments([]);
      onTyping?.(false);
    } catch {
      // Keep draft & attachments intact on error so typed message is not lost
    } finally {
      setIsSending(false);
    }
  }

  function updateDraft(next: string) {
    setDraft(next);
  }

  /**
   * Only images and videos are supported for chat attachments.
   */
  function addFiles(fileList: FileList | null) {
    if (!fileList?.length) return;

    const validFiles: File[] = [];
    let hasInvalid = false;

    for (const file of Array.from(fileList)) {
      const isImage = file.type.startsWith("image/");
      const isVideo = file.type.startsWith("video/");
      if (isImage || isVideo) {
        validFiles.push(file);
      } else {
        hasInvalid = true;
      }
    }

    if (hasInvalid) {
      toast.error("Only image and video attachments are supported");
    }

    if (!validFiles.length) {
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setAttachments((current) => [
      ...current,
      ...validFiles.map((file) => ({
        id: crypto.randomUUID(),
        name: file.name,
        size: file.size,
        kind: file.type.startsWith("image/")
          ? ("image" as const)
          : ("video" as const),
        file,
      })),
    ]);

    // Clearing the input means picking the same file twice still fires change.
    if (fileInputRef.current) fileInputRef.current.value = "";
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
        <input
          accept="image/*,video/*"
          className="sr-only"
          multiple
          onChange={(event) => addFiles(event.target.files)}
          ref={fileInputRef}
          tabIndex={-1}
          type="file"
        />
        <Button
          aria-label="Attach a file"
          className="shrink-0 text-slate-500 hover:text-primary"
          disabled={disabled}
          onClick={() => fileInputRef.current?.click()}
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
          onChange={(event) => updateDraft(event.target.value)}
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

      {/* Keyboard hint only where there is a keyboard to hint about. */}
      <p className="mt-1.5 hidden px-1 text-[11px] text-slate-400 sm:block">
        <kbd className="font-sans font-semibold text-slate-500">Enter</kbd> to
        send,{" "}
        <kbd className="font-sans font-semibold text-slate-500">Shift</kbd> +{" "}
        <kbd className="font-sans font-semibold text-slate-500">Enter</kbd> for
        a new line
      </p>
    </div>
  );
}
