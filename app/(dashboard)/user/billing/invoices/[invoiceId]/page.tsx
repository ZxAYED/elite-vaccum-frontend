import { UserInvoiceDetailClient } from "@/components/customer-portal/UserInvoiceDetailClient";

interface InvoiceDetailsPageProps {
  params: Promise<{ invoiceId: string }>;
}

export default async function InvoiceDetailsPage({
  params,
}: InvoiceDetailsPageProps) {
  const { invoiceId } = await params;

  return <UserInvoiceDetailClient invoiceId={invoiceId} />;
}
