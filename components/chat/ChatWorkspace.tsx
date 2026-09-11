"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { useChatSocket } from "@/hooks/useChatSocket";
import { readApiMessage } from "@/lib/api-error";
import { cn } from "@/lib/utils";
import {
  useGetConversationsQuery,
  useGetConversationMessagesQuery,
  useSendConversationMessageMutation,
  useStartConversationMutation,
} from "@/redux/api/chatApi";
import { useAppSelector } from "@/redux/hooks";

import { toConversation, toMessage } from "./adapters";
import { ChatExperience } from "./ChatExperience";

const MESSAGE_PAGE_SIZE = 30;

/**
 * The whole messages screen, shared by every dashboard that has one.
 *
 * There is no page heading above it on purpose: a chat is a fixed-height
 * surface with its own header, and a title plus a description line above it
 * costs roughly 8rem of the viewport that the transcript and the composer
 * need. The sidebar already says which screen this is.
 *
 * `className` is where each dashboard declares its own chrome height as
 * `--dashboard-chrome-h` (its header plus its content padding), which is the
 * only value that differs between the customer and admin shells.
 */
export function ChatWorkspace({ className }: { className?: string }) {
  const searchParams = useSearchParams();
  const queryConversationId = searchParams.get("conversationId") ?? undefined;

  const currentUserId = useAppSelector((state) => state.auth.user?.id) ?? "";
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const [olderCursor, setOlderCursor] = useState<string | undefined>();
  const lastFetchedCursorRef = useRef<string | null>(null);

  const {
    data: conversationData,
    isLoading: isLoadingConversations,
    isSuccess: hasLoadedConversations,
  } = useGetConversationsQuery({ page: 1, limit: 50 });

  const conversations = useMemo(
    () =>
      (conversationData?.items ?? []).map((dto) =>
        toConversation(dto, currentUserId),
      ),
    [conversationData?.items, currentUserId],
  );

  const activeSelectedId = selectedId ?? queryConversationId ?? conversations[0]?.id;

  // Reading a thread marks it read server-side, so this only ever runs for the
  // thread the customer actually opened.
  const { data: messageData, isFetching: isLoadingMessages } =
    useGetConversationMessagesQuery(
      activeSelectedId
        ? {
            conversationId: activeSelectedId,
            limit: MESSAGE_PAGE_SIZE,
            ...(olderCursor ? { before: olderCursor } : {}),
          }
        : { conversationId: "" },
      { skip: !activeSelectedId },
    );

  const [sendMessage] = useSendConversationMessageMutation();
  const [startConversation] = useStartConversationMutation();
  const { typingName, emitTyping } = useChatSocket(activeSelectedId);

  // Reset pagination cursor when switching threads
  function handleSelectConversation(conversationId: string) {
    setSelectedId(conversationId);
    setOlderCursor(undefined);
    lastFetchedCursorRef.current = null;
  }

  const hasMoreOlder = useMemo(() => {
    if (!messageData) return false;
    if (messageData.meta?.totalItems === 0 || !messageData.items?.length) {
      return false;
    }
    if (!olderCursor) {
      return (messageData.items?.length ?? 0) < (messageData.meta?.totalItems ?? 0);
    }
    return (messageData.meta?.totalItems ?? 0) > 0;
  }, [messageData, olderCursor]);

  const isLoadingOlder = Boolean(isLoadingMessages && olderCursor);

  function handleLoadOlder() {
    if (isLoadingMessages || !hasMoreOlder) return;
    const oldestMessage = messageData?.items?.[0];
    if (!oldestMessage?.createdAt) return;

    if (lastFetchedCursorRef.current === oldestMessage.createdAt) return;
    lastFetchedCursorRef.current = oldestMessage.createdAt;

    setOlderCursor(oldestMessage.createdAt);
  }

  const messages = useMemo(
    () => (messageData?.items ?? []).map(toMessage),
    [messageData?.items],
  );

  // A customer arriving with no history has nothing to select and no way to
  // start a thread, so the support room is opened for them. `type: SUPPORT`
  // is deduped server-side, and the ref keeps a re-render from asking twice.
  const hasRequestedRoom = useRef(false);
  useEffect(() => {
    if (!hasLoadedConversations || hasRequestedRoom.current) return;
    if (conversations.length > 0 || !currentUserId) return;

    hasRequestedRoom.current = true;
    void startConversation({ type: "SUPPORT" })
      .unwrap()
      .then((res) => {
        if (res?.id) setSelectedId(res.id);
      })
      .catch(() => {
        // The empty state already explains there is nothing here; a toast on
        // first paint would be noise.
      });
  }, [conversations.length, currentUserId, hasLoadedConversations, startConversation]);

  async function handleCompose() {
    try {
      const res = await startConversation({ type: "SUPPORT" }).unwrap();
      if (res?.id) {
        handleSelectConversation(res.id);
      }
    } catch (err) {
      toast.error("Could not start conversation", {
        description: readApiMessage(err, "Please try again."),
      });
    }
  }

  async function handleSend(
    body: string,
    attachments: Parameters<
      NonNullable<React.ComponentProps<typeof ChatExperience>["onSend"]>
    >[1],
  ) {
    if (!activeSelectedId) return;

    // Only drafts carry a `File`; anything read back from the API does not.
    const files = attachments
      .map((attachment) => attachment.file)
      .filter((file): file is File => Boolean(file));

    try {
      await sendMessage({
        conversationId: activeSelectedId,
        content: body,
        files: files.length ? files : undefined,
      }).unwrap();
    } catch (err) {
      toast.error("Message not sent", {
        description: readApiMessage(err, "Please try again in a moment."),
      });
      throw err; // Re-throw so composer preserves user draft
    }
  }

  return (
    <ChatExperience
      className={cn(className)}
      conversations={conversations}
      currentUserId={currentUserId}
      hasMoreOlder={hasMoreOlder}
      isLoadingConversations={isLoadingConversations}
      isLoadingMessages={isLoadingMessages && !olderCursor}
      isLoadingOlder={isLoadingOlder}
      messages={messages}
      onCompose={handleCompose}
      onLoadOlder={handleLoadOlder}
      onSelect={handleSelectConversation}
      onSend={handleSend}
      onTyping={emitTyping}
      selectedId={activeSelectedId}
      typingName={typingName}
    />
  );
}
