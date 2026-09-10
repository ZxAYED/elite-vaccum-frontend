"use client";

import { MessagesSquare } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

import { ChatHeader } from "./ChatHeader";
import { ConversationList } from "./ConversationList";
import { MessageComposer } from "./MessageComposer";
import { MessageList } from "./MessageList";
import type { ChatMessage, Conversation } from "./types";

/**
 * The chat screen: a conversation rail beside a thread.
 *
 * Below `lg` the two share one column and the selection swaps between them,
 * which is why `onBack` exists at all. The component owns only which thread is
 * selected — messages and conversations are handed in, so wiring the API later
 * means replacing the props, not this file.
 */
export function ChatExperience({
  conversations,
  messagesByConversation,
  currentUserId,
  initialConversationId,
  typingConversationId,
  onSend,
  className,
}: {
  conversations: Conversation[];
  messagesByConversation: Record<string, ChatMessage[]>;
  currentUserId: string;
  initialConversationId?: string;
  /** Renders the typing indicator when it matches the open thread. */
  typingConversationId?: string;
  onSend?: (conversationId: string, body: string) => void;
  className?: string;
}) {
  const [selectedId, setSelectedId] = useState<string | undefined>(
    initialConversationId ?? conversations[0]?.id,
  );
  // Only meaningful under `lg`, where the rail and the thread share a column.
  const [isThreadOpenOnMobile, setIsThreadOpenOnMobile] = useState(false);

  const selected = conversations.find(
    (conversation) => conversation.id === selectedId,
  );
  const messages = selectedId
    ? (messagesByConversation[selectedId] ?? [])
    : [];

  function openConversation(conversationId: string) {
    setSelectedId(conversationId);
    setIsThreadOpenOnMobile(true);
  }

  return (
    <div
      className={cn(
        "grid h-[calc(100dvh-9rem)] min-h-[32rem] overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm",
        "lg:grid-cols-[20rem_1fr] xl:grid-cols-[22rem_1fr]",
        className,
      )}
    >
      <ConversationList
        className={cn(
          "min-w-0 border-slate-100 lg:border-r",
          // One column below `lg`: whichever pane is not in focus is removed
          // from the layout rather than squeezed into it.
          isThreadOpenOnMobile ? "hidden lg:flex" : "flex",
        )}
        conversations={conversations}
        currentUserId={currentUserId}
        onSelect={openConversation}
        selectedId={selectedId}
      />

      <section
        className={cn(
          "min-w-0 flex-col",
          isThreadOpenOnMobile ? "flex" : "hidden lg:flex",
        )}
      >
        {selected ? (
          <>
            <ChatHeader
              onBack={() => setIsThreadOpenOnMobile(false)}
              participant={selected.participant}
              subject={selected.subject}
            />
            <MessageList
              currentUserId={currentUserId}
              isTyping={typingConversationId === selected.id}
              messages={messages}
              participant={selected.participant}
            />
            <MessageComposer
              onSend={(body) => onSend?.(selected.id, body)}
              participant={selected.participant}
            />
          </>
        ) : (
          <EmptyThread />
        )}
      </section>
    </div>
  );
}

function EmptyThread() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 bg-[linear-gradient(180deg,#f8fbfa_0%,#f4f7f6_100%)] px-6 text-center">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-[var(--brand-soft)] text-primary">
        <MessagesSquare size={26} />
      </span>
      <div>
        <p className="font-semibold text-primary">No conversation selected</p>
        <p className="mt-1 max-w-xs text-sm text-slate-500">
          Pick a thread on the left to read it, or start a new one with your
          technician or the support team.
        </p>
      </div>
    </div>
  );
}
