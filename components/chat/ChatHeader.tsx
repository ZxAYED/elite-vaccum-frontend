"use client";

import { ArrowLeft, MoreVertical, Phone, Video } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

import { ChatAvatar } from "./ChatAvatar";
import { PRESENCE_TONE, presenceLabel } from "./presence";
import type { ChatParticipant } from "./types";

/**
 * The thread header: who you are talking to, whether they are there, and the
 * thread-level actions. The back control only exists below `lg`, where the
 * list and the thread share one column.
 */
export function ChatHeader({
  participant,
  subject,
  onBack,
  className,
}: {
  participant: ChatParticipant;
  subject?: string;
  /** Rendered only when supplied; the two-pane layout has no use for it. */
  onBack?: () => void;
  className?: string;
}) {
  const tone = PRESENCE_TONE[participant.presence];
  const label = presenceLabel(participant.presence, participant.lastActiveAt);

  return (
    <header
      className={cn(
        "flex shrink-0 items-center gap-3 border-b border-slate-100 bg-white px-4 py-3 sm:px-5",
        className,
      )}
    >
      {onBack ? (
        <Button
          aria-label="Back to conversations"
          className="text-primary lg:hidden"
          onClick={onBack}
          size="icon-sm"
          type="button"
          variant="ghost"
        >
          <ArrowLeft size={18} />
        </Button>
      ) : null}

      <ChatAvatar participant={participant} size="md" />

      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-primary">{participant.name}</p>
        <p className="flex min-w-0 items-center gap-1.5 text-xs">
          <span
            aria-hidden="true"
            className={cn("size-2 shrink-0 rounded-full", tone.dot)}
          />
          <span className={cn("font-medium", tone.text)}>{label}</span>
          {participant.role ? (
            <>
              <span aria-hidden="true" className="text-slate-300">
                ·
              </span>
              <span className="truncate text-slate-500">{participant.role}</span>
            </>
          ) : null}
        </p>
      </div>

      {subject ? (
        <span className="hidden max-w-56 truncate rounded-full bg-[var(--brand-soft)] px-3 py-1 text-xs font-semibold text-primary xl:inline-block">
          {subject}
        </span>
      ) : null}

      <div className="flex shrink-0 items-center gap-1">
        <Button
          aria-label="Start a voice call"
          className="hidden text-primary sm:inline-flex"
          size="icon-sm"
          type="button"
          variant="ghost"
        >
          <Phone size={17} />
        </Button>
        <Button
          aria-label="Start a video call"
          className="hidden text-primary sm:inline-flex"
          size="icon-sm"
          type="button"
          variant="ghost"
        >
          <Video size={17} />
        </Button>
        <Button
          aria-label="Conversation options"
          className="text-slate-500"
          size="icon-sm"
          type="button"
          variant="ghost"
        >
          <MoreVertical size={17} />
        </Button>
      </div>
    </header>
  );
}
