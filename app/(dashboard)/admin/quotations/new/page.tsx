import { AdminQuotationDetailClient } from "@/components/admin/quotations/AdminQuotationDetailClient";

interface NewAdminQuotationPageProps {
  searchParams: Promise<{
    requestId?: string;
  }>;
}

export default async function NewAdminQuotationPage({
  searchParams,
}: NewAdminQuotationPageProps) {
  const { requestId } = await searchParams;

  return <AdminQuotationDetailClient requestId={requestId} mode="create" />;
}
