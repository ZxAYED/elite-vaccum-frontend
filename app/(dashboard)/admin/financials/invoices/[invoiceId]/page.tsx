import { AdminInvoiceDetailClient } from "@/components/admin/financials/AdminInvoiceDetailClient";

interface AdminInvoiceDetailPageProps {
  params: Promise<{ invoiceId: string }>;
}

export default async function AdminInvoiceDetailPage({
  params,
}: AdminInvoiceDetailPageProps) {
  const { invoiceId } = await params;

  return <AdminInvoiceDetailClient invoiceId={invoiceId} />;
}
