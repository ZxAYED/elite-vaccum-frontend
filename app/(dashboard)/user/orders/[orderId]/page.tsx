import { UserOrderDetailClient } from "@/components/customer-portal/UserOrderDetailClient";

interface OrderDetailPageProps {
  params: Promise<{ orderId: string }>;
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { orderId } = await params;

  return <UserOrderDetailClient orderId={orderId} />;
}
