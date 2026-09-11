import { Suspense } from "react";
import { ChatWorkspace } from "@/components/chat/ChatWorkspace";

/**
 * The admin shell is a 4rem header over a 14px-padded content area, so the
 * chat has the viewport less 5.75rem at every breakpoint.
 */
export default function AdminChatPage() {
  return (
    <Suspense fallback={<div className="h-full w-full animate-pulse bg-slate-50" />}>
      <ChatWorkspace className="[--dashboard-chrome-h:5.75rem]" />
    </Suspense>
  );
}
