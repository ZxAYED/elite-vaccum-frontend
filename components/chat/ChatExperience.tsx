"use client";

import { Loader2, MessagesSquare } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

import { ChatHeader } from "./ChatHeader";
import { ConversationList } from "./ConversationList";
import { MessageComposer } from "./MessageComposer";
import { MessageList } from "./MessageList";
import type { ChatAttachment, ChatMessage, Conversation } from "./types";

/**
 * The chat screen: a conversation rail beside a thread.
 *
 * Selection is controlled from above, because the owner of the selection is
 * also what decides which message query runs. The only state left here is
 * which pane a phone is showing, which nothing outside the component cares
 * about.
 *
 * Below `lg` the two panes share one column and the selection swaps between
 * them, which is why `onBack` exists at all.
 */
export function ChatExperience({
  conversations,
  selectedId,
  onSelect,
  messages,
  currentUserId,
  typingName,
  isLoadingConversations = false,
  isLoadingMessages = false,
  hasMoreOlder = false,
  isLoadingOlder = false,
  onLoadOlder,
  onCompose,
  onSend,
  onTyping,
  className,
}: {
  conversations: Conversation[];
  selectedId?: string;
  onSelect: (conversationId: string) => void;
  messages: ChatMessage[];
  currentUserId: string;
  /** Name of whoever is typing in the open thread, if anyone. */
  typingName?: string;
  isLoadingConversations?: boolean;
  isLoadingMessages?: boolean;
  hasMoreOlder?: boolean;
  isLoadingOlder?: boolean;
  onLoadOlder?: () => void;
  onCompose?: () => void;
  onSend?: (body: string, attachments: ChatAttachment[]) => Promise<void> | void;
  onTyping?: (isTyping: boolean) => void;
  className?: string;
}) {
  // Only meaningful under `lg`, where the rail and the thread share a column.
  const [isThreadOpenOnMobile, setIsThreadOpenOnMobile] = useState(false);

  const selected = conversations.find(
    (conversation) => conversation.id === selectedId,
  );

  function openConversation(conversationId: string) {
    onSelect(conversationId);
    setIsThreadOpenOnMobile(true);
  }

  return (
    <div
      className={cn(
        // Exactly the space the dashboard leaves, never more: a min-height
        // here is what pushed the composer off the bottom of a phone screen.
        // Each dashboard declares its own --dashboard-chrome-h; the fallback
        // covers anywhere the variable was not set.
        "grid h-[calc(100dvh-var(--dashboard-chrome-h,2rem))] min-h-0",
        "overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm",
        "lg:grid-cols-[19rem_1fr] xl:grid-cols-[22rem_1fr]",
        className,
      )}
    >
      <ConversationList
        className={cn(
          "min-h-0 min-w-0 border-slate-100 lg:border-r",
          // One column below `lg`: whichever pane is not in focus is removed
          // from the layout rather than squeezed into it.
          isThreadOpenOnMobile ? "hidden lg:flex" : "flex",
        )}
        conversations={conversations}
        currentUserId={currentUserId}
        isLoading={isLoadingConversations}
        onCompose={onCompose}
        onSelect={openConversation}
        selectedId={selectedId}
      />

      <section
        className={cn(
          // `min-h-0` is what lets the transcript scroll instead of stretching
          // the grid row and taking the composer below the fold with it.
          "min-h-0 min-w-0 flex-col",
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
            {isLoadingMessages && messages.length === 0 ? (
              <ThreadLoading />
            ) : (
              <MessageList
                currentUserId={currentUserId}
                hasMoreOlder={hasMoreOlder}
                isLoadingOlder={isLoadingOlder}
                isTyping={Boolean(typingName)}
                key={selected.id}
                messages={messages}
                onLoadOlder={onLoadOlder}
                participant={selected.participant}
                unreadCount={selected.unreadCount}
              />
            )}
            <MessageComposer
              onSend={onSend}
              onTyping={onTyping}
              participant={selected.participant}
            />
          </>
        ) : (
          <EmptyThread isLoading={isLoadingConversations} />
        )}
      </section>
    </div>
  );
}

function ThreadLoading() {
  return (
    <div
      aria-busy="true"
      className="flex min-h-0 flex-1 items-center justify-center bg-[linear-gradient(180deg,#f8fbfa_0%,#f4f7f6_100%)]"
      role="status"
    >
      <Loader2 aria-hidden="true" className="animate-spin text-teal-600" size={24} />
      <span className="sr-only">Loading messages</span>
    </div>
  );
}

function EmptyThread({ isLoading }: { isLoading: boolean }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 bg-[linear-gradient(180deg,#f8fbfa_0%,#f4f7f6_100%)] px-6 text-center">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-[var(--brand-soft)] text-primary">
        <MessagesSquare size={26} />
      </span>
      <div>
        <p className="font-semibold text-primary">
          {isLoading ? "Loading conversations" : "No conversation selected"}
        </p>
        <p className="mt-1 max-w-xs text-sm text-slate-500">
          {isLoading
            ? "One moment."
            : "Pick a thread on the left to read it, or start a new one with the support team."}
        </p>
      </div>
    </div>
  );
}
