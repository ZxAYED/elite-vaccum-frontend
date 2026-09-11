import type {
  ChatMessageDto,
  ConversationDto,
  ConversationParticipant,
} from "@/redux/api/chatApi";

import type { ChatMessage, ChatParticipant, Conversation } from "./types";

/**
 * The seam between the API's shapes and the ones the surfaces render.
 *
 * Keeping it here means a change on either side is a change to one file, and
 * the components never learn the wire format.
 */

function displayName(user: ConversationParticipant["user"]): string {
  const full = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  return full || user.email || "Elite team";
}

/** Title-cases the API's SCREAMING_SNAKE roles for display. */
function displayRole(role?: string | null): string | undefined {
  if (!role) return undefined;
  return role
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * The person on the other end. A thread has exactly two sides here — a
 * customer and whoever from Elite picked it up — so "not me" identifies them.
 * Falls back to the first participant when the viewer is not in the list,
 * which is the case for an admin reading someone else's thread.
 */
export function otherParticipant(
  conversation: ConversationDto,
  currentUserId: string,
): ChatParticipant {
  const participants = conversation.participants ?? [];
  const other =
    participants.find((participant) => participant.userId !== currentUserId) ??
    participants[0];

  if (!other) {
    return { id: "unknown", name: conversation.title || "Conversation", presence: "offline" };
  }

  return {
    id: other.userId,
    name: displayName(other.user),
    role: displayRole(other.user.role),
    // The API exposes presence as a single boolean and no last-seen time, so
    // `away` is unreachable and `presenceLabel` falls back to "Offline"
    // instead of "Active 20m ago". Both light up if `lastSeenAt` is added.
    presence: conversation.isOtherOnline ? "online" : "offline",
  };
}

export function toConversation(
  dto: ConversationDto,
  currentUserId: string,
): Conversation {
  const preview = dto.lastMessage;

  return {
    id: dto.id,
    participant: otherParticipant(dto, currentUserId),
    // `title` is generated server-side ("Support Chat - jane@doe.com"), which
    // is the counterparty's name again. The order or job reference is the part
    // worth the line, so a linked record wins over the title.
    subject: dto.orderId
      ? `Order ${dto.orderId}`
      : dto.serviceOrderId
        ? `Service ${dto.serviceOrderId}`
        : undefined,
    unreadCount: dto.unreadCount ?? 0,
    lastMessage:
      preview || dto.lastMessageText
        ? {
            body: preview?.content ?? dto.lastMessageText ?? "",
            sentAt:
              preview?.createdAt ??
              dto.lastMessageAt ??
              dto.updatedAt ??
              new Date().toISOString(),
            authorId: preview?.senderId ?? "",
          }
        : undefined,
  };
}

export function toMessage(dto: ChatMessageDto & { status?: ChatMessage["status"] }): ChatMessage {
  return {
    id: dto.id,
    conversationId: dto.conversationId,
    authorId: dto.senderId,
    body: dto.content,
    sentAt: dto.createdAt,
    // Preserve optimistic status if present; otherwise fall back to read or sent
    status: dto.status ?? (dto.isRead ? "read" : "sent"),
    attachments: dto.attachments?.map((attachment) => ({
      id: attachment.id,
      name: attachment.fileName,
      size: attachment.fileSize,
      kind: attachment.fileType?.startsWith("image/")
        ? "image"
        : attachment.fileType?.startsWith("video/")
          ? "video"
          : "file",
      url: attachment.fileUrl,
    })),
  };
}
