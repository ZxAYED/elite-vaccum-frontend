"use client";

import { ChatExperience } from "./ChatExperience";
import { CURRENT_USER_ID, MOCK_CONVERSATIONS, MOCK_MESSAGES } from "./mock";

/**
 * Renders the chat surfaces against placeholder data so the UI can be seen and
 * reviewed before the API exists.
 *
 * At integration time this is the only file that changes shape: swap the three
 * mock imports for the real query hooks, pass `onSend` a mutation, and delete
 * `mock.ts`. Nothing inside `ChatExperience` and below is aware of where its
 * data came from.
 */
export function ChatDemo() {
  return (
    <ChatExperience
      conversations={MOCK_CONVERSATIONS}
      currentUserId={CURRENT_USER_ID}
      messagesByConversation={MOCK_MESSAGES}
      // Shows the typing indicator on the pinned thread so the state is
      // visible in review; drop this prop once the socket drives it.
      typingConversationId="c-1"
    />
  );
}
