import { UserBillingClient } from "@/components/customer-portal/UserBillingClient";

interface BillingPageProps {
  searchParams: Promise<{
    tab?: string;
    type?: string;
    q?: string;
  }>;
}

export default async function BillingPage({ searchParams }: BillingPageProps) {
  const params = await searchParams;
  const tab = params.tab === "payments" ? "payments" : "invoices";
  const type =
    params.type === "PRODUCT" || params.type === "SERVICE"
      ? params.type
      : "ALL";
  const query = (params.q ?? "").trim();

  return (
    <UserBillingClient
      initialTab={tab}
      initialType={type}
      initialQuery={query}
    />
  );
}
