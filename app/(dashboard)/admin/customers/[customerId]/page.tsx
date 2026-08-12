import { AdminCustomerDetailClient } from "@/components/admin/customers/AdminCustomerDetailClient";

interface AdminCustomerDetailPageProps {
  params: Promise<{
    customerId: string;
  }>;
}

export default async function AdminCustomerDetailPage({
  params,
}: AdminCustomerDetailPageProps) {
  const { customerId } = await params;

  return <AdminCustomerDetailClient customerId={customerId} />;
}
