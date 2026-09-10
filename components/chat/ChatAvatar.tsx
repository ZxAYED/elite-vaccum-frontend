"use client";

import Image from "next/image";

import { cn } from "@/lib/utils";

import { initialsOf, PRESENCE_TONE, presenceLabel } from "./presence";
import type { ChatParticipant } from "./types";

const SIZES = {
  sm: { box: "size-9", text: "text-xs", dot: "size-2.5", px: 36 },
  md: { box: "size-11", text: "text-sm", dot: "size-3", px: 44 },
  lg: { box: "size-12", text: "text-base", dot: "size-3.5", px: 48 },
} as const;

/**
 * Avatar with an optional presence dot. The dot never carries the state alone
 * — it has an accessible name, and every surface using it prints the same
 * label in text nearby.
 */
export function ChatAvatar({
  participant,
  size = "md",
  showPresence = true,
  className,
}: {
  participant: ChatParticipant;
  size?: keyof typeof SIZES;
  showPresence?: boolean;
  className?: string;
}) {
  const scale = SIZES[size];
  const tone = PRESENCE_TONE[participant.presence];
  const label = presenceLabel(participant.presence, participant.lastActiveAt);

  return (
    <span className={cn("relative inline-flex shrink-0", className)}>
      <span
        className={cn(
          "flex items-center justify-center overflow-hidden rounded-full",
          "bg-[var(--brand-soft)] font-semibold text-primary",
          "ring-1 ring-teal-100",
          scale.box,
          scale.text,
        )}
      >
        {participant.avatarUrl ? (
          <Image
            alt=""
            className="size-full object-cover"
            height={scale.px}
            src={participant.avatarUrl}
            width={scale.px}
          />
        ) : (
          initialsOf(participant.name)
        )}
      </span>

      {showPresence ? (
        <span
          aria-label={label}
          className={cn(
            "absolute -bottom-0.5 -right-0.5 rounded-full ring-2 ring-white",
            scale.dot,
            tone.dot,
          )}
          role="img"
        />
      ) : null}
    </span>
  );
}
