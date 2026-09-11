/**
 * Time and size formatting for the chat surfaces.
 *
 * Everything is derived from the ISO strings the API will supply, so the
 * components never hold a preformatted string that could go stale between a
 * render and a refetch.
 */

function startOfDay(value: Date): number {
  return new Date(
    value.getFullYear(),
    value.getMonth(),
    value.getDate(),
  ).getTime();
}

/** Whole days between two instants, ignoring the time of day. */
function daysApart(from: Date, to: Date): number {
  return Math.round((startOfDay(to) - startOfDay(from)) / 86_400_000);
}

/** Clock time on a message bubble: "14:03". */
export function messageTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Timestamp in the conversation list, which has room for roughly six
 * characters: the clock today, a weekday this week, a date beyond that.
 */
export function conversationTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  const elapsedDays = daysApart(date, new Date());
  if (elapsedDays === 0) return messageTime(iso);
  if (elapsedDays === 1) return "Yesterday";
  if (elapsedDays < 7) {
    return date.toLocaleDateString(undefined, { weekday: "short" });
  }
  return date.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

/** Separator above the first message of each day. */
export function dayLabel(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  const elapsedDays = daysApart(date, new Date());
  if (elapsedDays === 0) return "Today";
  if (elapsedDays === 1) return "Yesterday";
  if (elapsedDays < 7) {
    return date.toLocaleDateString(undefined, { weekday: "long" });
  }
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
    year: date.getFullYear() === new Date().getFullYear() ? undefined : "numeric",
  });
}

/** Groups messages under one day heading each, preserving order. */
export function groupByDay<T extends { sentAt: string }>(messages: T[]) {
  const groups: Array<{ key: string; label: string; messages: T[] }> = [];

  for (const message of messages) {
    const key = new Date(message.sentAt).toDateString();
    const current = groups[groups.length - 1];
    if (current?.key === key) {
      current.messages.push(message);
    } else {
      groups.push({ key, label: dayLabel(message.sentAt), messages: [message] });
    }
  }

  return groups;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
