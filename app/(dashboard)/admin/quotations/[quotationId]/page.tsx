import { AdminQuotationDetailClient } from "@/components/admin/quotations/AdminQuotationDetailClient";

interface AdminQuotationDetailPageProps {
  params: Promise<{
    quotationId: string;
  }>;
  searchParams: Promise<{
    mode?: string;
  }>;
}

export default async function AdminQuotationDetailPage({
  params,
  searchParams,
}: AdminQuotationDetailPageProps) {
  const [{ quotationId }, { mode }] = await Promise.all([params, searchParams]);

  return <AdminQuotationDetailClient quotationId={quotationId} mode={mode} />;
}
