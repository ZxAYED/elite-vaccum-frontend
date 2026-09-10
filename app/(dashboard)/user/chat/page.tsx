import { ChatDemo } from "@/components/chat/ChatDemo";
import { PageHeader } from "@/components/customer-portal/PageHeader";

export default function UserChatPage() {
  return (
    <div className="pb-4">
      <PageHeader
        description="Talk to your assigned technician, the support desk, and billing in one place."
        eyebrow="Conversations"
        title="Messages"
      />
      <ChatDemo />
    </div>
  );
}
