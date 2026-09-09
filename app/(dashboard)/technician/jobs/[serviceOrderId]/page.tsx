import { TechnicianJobDetailClient } from "@/components/technician/TechnicianJobDetailClient";

interface TechnicianJobDetailPageProps {
  params: Promise<{ serviceOrderId: string }>;
}

export default async function TechnicianJobDetailPage({
  params,
}: TechnicianJobDetailPageProps) {
  const { serviceOrderId } = await params;

  // The order is fetched client-side from `GET /service-orders/:id` so the
  // technician's bearer token scopes the response.
  return <TechnicianJobDetailClient serviceOrderId={serviceOrderId} />;
}
