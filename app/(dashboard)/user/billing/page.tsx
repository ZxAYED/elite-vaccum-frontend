import { UserBillingClient } from "@/components/customer-portal/UserBillingClient";

interface BillingPageProps {
  searchParams: Promise<{
    tab?: string;
    q?: string;
  }>;
}

export default async function BillingPage({ searchParams }: BillingPageProps) {
  const params = await searchParams;
  // `payments` is kept as an alias so older links still land on receipts.
  const tab =
    params.tab === "receipts" || params.tab === "payments"
      ? "receipts"
      : "invoices";

  return (
    <UserBillingClient initialQuery={(params.q ?? "").trim()} initialTab={tab} />
  );
}
