import { Suspense } from "react";
import { ChatWorkspace } from "@/components/chat/ChatWorkspace";

/**
 * The customer shell is a 4rem header over a `p-4 md:p-6` content area, so the
 * chat has the viewport less 6rem, or 7rem once the padding steps up at `md`.
 */
export default function UserChatPage() {
  return (
    <Suspense fallback={<div className="h-full w-full animate-pulse bg-slate-50" />}>
      <ChatWorkspace className="[--dashboard-chrome-h:6rem] md:[--dashboard-chrome-h:7rem]" />
    </Suspense>
  );
}
