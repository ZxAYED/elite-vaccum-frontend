import type { PresenceState } from "./types";

/**
 * Presence, described three ways at once: a colour, a shape and a sentence.
 *
 * The dot alone would carry the state by colour, which fails anyone who cannot
 * separate the hues, so every surface that shows a dot also shows `label`
 * somewhere the reader can reach it.
 */
export const PRESENCE_TONE: Record<
  PresenceState,
  { dot: string; ring: string; text: string; label: string }
> = {
  online: {
    dot: "bg-emerald-500",
    ring: "ring-emerald-100",
    text: "text-emerald-700",
    label: "Active now",
  },
  away: {
    dot: "bg-amber-400",
    ring: "ring-amber-100",
    text: "text-amber-700",
    label: "Away",
  },
  offline: {
    dot: "bg-slate-300",
    ring: "ring-slate-100",
    text: "text-slate-500",
    label: "Offline",
  },
};

/**
 * "Active 20m ago" beats a bare "Offline" — it tells the reader whether a
 * reply is plausible in the next minute or not until tomorrow. Falls back to
 * the flat label when the timestamp is missing.
 */
export function presenceLabel(
  presence: PresenceState,
  lastActiveAt?: string,
): string {
  if (presence === "online") return PRESENCE_TONE.online.label;
  if (!lastActiveAt) return PRESENCE_TONE[presence].label;

  const elapsedMinutes = Math.round(
    (Date.now() - new Date(lastActiveAt).getTime()) / 60_000,
  );

  if (!Number.isFinite(elapsedMinutes) || elapsedMinutes < 0) {
    return PRESENCE_TONE[presence].label;
  }
  if (elapsedMinutes < 1) return "Active moments ago";
  if (elapsedMinutes < 60) return `Active ${elapsedMinutes}m ago`;

  const elapsedHours = Math.round(elapsedMinutes / 60);
  if (elapsedHours < 24) return `Active ${elapsedHours}h ago`;

  const elapsedDays = Math.round(elapsedHours / 24);
  return elapsedDays === 1 ? "Active yesterday" : `Active ${elapsedDays}d ago`;
}

/** Two initials at most, so the avatar stays legible at 40px. */
export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}
