import { redirect } from "next/navigation";

interface ServiceQuotationRedirectPageProps {
  params: Promise<{ requestId: string }>;
}

export default async function ServiceQuotationRedirectPage({
  params,
}: ServiceQuotationRedirectPageProps) {
  const { requestId } = await params;
  redirect(`/user/services/${requestId}#quotation`);
}

