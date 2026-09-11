/**
 * The shapes the chat UI renders. Nothing here talks to the network — the API
 * layer lands later and only has to produce these, so every component below
 * stays untouched when it does.
 */

/**
 * Presence is a union rather than a boolean because "inactive" is not one
 * state: a participant who left five minutes ago and one who left last week
 * read very differently to whoever is waiting on a reply.
 */
export type PresenceState = "online" | "away" | "offline";

export interface ChatParticipant {
  id: string;
  name: string;
  /** Falls back to generated initials when absent. */
  avatarUrl?: string;
  /** Shown under the name in the thread header, e.g. "Senior Technician". */
  role?: string;
  presence: PresenceState;
  /** ISO timestamp; drives "Active 20m ago" when not online. */
  lastActiveAt?: string;
}

export type MessageStatus = "sending" | "sent" | "delivered" | "read" | "failed";

export interface ChatMessage {
  id: string;
  conversationId: string;
  authorId: string;
  body: string;
  /** ISO timestamp. */
  sentAt: string;
  /** Only meaningful on the current user's own messages. */
  status?: MessageStatus;
  attachments?: ChatAttachment[];
}

export interface ChatAttachment {
  id: string;
  name: string;
  /** Bytes; formatted for display at render time. */
  size: number;
  kind: "image" | "video" | "file";
  /** Set once the upload endpoint has returned a location. */
  url?: string;
  /**
   * The picked file, present only on a draft the customer has not sent yet.
   * The upload call takes this; everything rendered comes from the fields
   * above, so a message read back from the API needs no `file`.
   */
  file?: File;
}

export interface Conversation {
  id: string;
  participant: ChatParticipant;
  /** Context line: the order or service request the thread hangs off. */
  subject?: string;
  lastMessage?: Pick<ChatMessage, "body" | "sentAt" | "authorId">;
  unreadCount: number;
  /** Pinned threads sort above the rest regardless of recency. */
  isPinned?: boolean;
}

/** Filters over the conversation list. `active` means the participant is online. */
export type ConversationFilter = "all" | "unread" | "active";
