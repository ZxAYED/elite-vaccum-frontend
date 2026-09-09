import { AdminOrderDetailClient } from "@/components/admin/orders/AdminOrderDetailClient";

interface AdminOrderDetailPageProps {
  params: Promise<{
    orderId: string;
  }>;
}

export default async function AdminOrderDetailPage({
  params,
}: AdminOrderDetailPageProps) {
  const { orderId } = await params;

  // Existence is decided by `GET /store/orders/:id`, which the client owns —
  // the id may be a UUID or a businessId ("ORD-4F92A").
  return <AdminOrderDetailClient orderId={orderId} />;
}
