import { UserScheduleDetailClient } from "@/components/customer-portal/UserScheduleDetailClient";

interface ScheduleDetailPageProps {
  params: Promise<{ requestId: string }>;
}

export default async function ScheduleDetailPage({
  params,
}: ScheduleDetailPageProps) {
  const { requestId } = await params;

  return <UserScheduleDetailClient requestId={requestId} />;
}
