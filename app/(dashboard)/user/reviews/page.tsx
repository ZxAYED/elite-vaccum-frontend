import { ReviewsExperience } from "@/components/customer-portal/ReviewsExperience";

interface ReviewsPageProps {
  searchParams?: Promise<{
    compose?: string;
    orderId?: string;
  }>;
}

export default async function ReviewsPage({ searchParams }: ReviewsPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const composeParam = resolvedSearchParams?.compose;
  const initialComposeType =
    composeParam === "product" || composeParam === "service" ? composeParam : null;

  return (
    <ReviewsExperience
      initialComposeType={initialComposeType}
      initialOrderId={resolvedSearchParams?.orderId}
    />
  );
}
