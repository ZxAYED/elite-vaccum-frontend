import { AdminOrderDetailClient } from "@/components/admin/orders/AdminOrderDetailClient";
import { getAdminOrderById } from "@/data/mock/admin-orders";
import { notFound } from "next/navigation";

interface AdminOrderDetailPageProps {
  params: Promise<{
    orderId: string;
  }>;
}

export default async function AdminOrderDetailPage({
  params,
}: AdminOrderDetailPageProps) {
  const { orderId } = await params;

  if (!getAdminOrderById(orderId)) {
    notFound();
  }

  return <AdminOrderDetailClient orderId={orderId} />;
}
