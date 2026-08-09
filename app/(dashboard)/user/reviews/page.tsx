import Link from "next/link";
import { MessageSquareQuote, Star } from "lucide-react";

import { PageHeader } from "@/components/customer-portal/PageHeader";
import { StatusBadge } from "@/components/customer-portal/StatusBadge";
import { TypeBadge } from "@/components/customer-portal/TypeBadge";
import { Button } from "@/components/ui/Button";
import { mockCustomerReviews } from "@/data/mock/customer-portal";
import { formatLongDate } from "@/lib/formatters";

export default function ReviewsPage() {
  return (
    <div className="min-h-screen">
      <PageHeader
        actions={
          <Button asChild variant="outline">
            <Link href="/user/orders">Open orders</Link>
          </Button>
        }
        description="Review delivered product orders and completed service orders from one place."
        eyebrow="Feedback"
        title="Reviews"
      />

      <div className="space-y-5">
        {mockCustomerReviews.map((review) => (
          <article
            className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm"
            key={review.id}
          >
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <TypeBadge type={review.kind === "service" ? "SERVICE" : "PRODUCT"} />
                  <StatusBadge status={review.status} />
                </div>
                <h2 className="mt-4 text-xl font-semibold text-primary">
                  {review.title}
                </h2>
                <p className="mt-2 text-sm text-gray-600">
                  Related to {review.relatedLabel}
                </p>

                {review.excerpt ? (
                  <div className="mt-4 rounded-2xl bg-gray-50 px-4 py-4 text-sm text-gray-700">
                    &ldquo;{review.excerpt}&rdquo;
                  </div>
                ) : null}

                {review.submittedAt ? (
                  <p className="mt-4 text-sm text-gray-500">
                    Submitted on {formatLongDate(review.submittedAt)}
                  </p>
                ) : null}
              </div>

              <div className="w-full max-w-sm rounded-2xl bg-teal-50 p-5">
                {review.rating ? (
                  <div className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-2 text-amber-600">
                    <Star className="fill-current" size={16} />
                    {review.rating}/5
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-gray-700">
                    <MessageSquareQuote size={16} />
                    Awaiting review
                  </div>
                )}

                <Button asChild className="mt-5 w-full">
                  <Link href={review.href}>
                    {review.status === "submitted" ? "View related item" : "Leave review"}
                  </Link>
                </Button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
