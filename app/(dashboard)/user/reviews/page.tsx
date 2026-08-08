import Link from "next/link";
import { MessageSquareQuote, Star } from "lucide-react";

import { PageHeader } from "@/components/customer-portal/PageHeader";
import { StatusBadge } from "@/components/customer-portal/StatusBadge";
import { Button } from "@/components/ui/Button";
import { mockCustomerReviews } from "@/data/mock/customer-portal";
import { formatLongDate } from "@/lib/formatters";

export default function ReviewsPage() {
  return (
    <div className="min-h-screen">
      <PageHeader
        actions={
          <Button asChild variant="outline">
            <Link href="/user/orders">Open product orders</Link>
          </Button>
        }
        description="Service and product reviews are separated so customers can rate completed work independently from purchased parts."
        eyebrow="Feedback"
        title="Reviews"
      />

      <div className="space-y-5">
        {mockCustomerReviews.map((review) => (
          <div
            className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm"
            key={review.id}
          >
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-xl font-semibold text-gray-900">{review.title}</h2>
                  <StatusBadge status={review.status} />
                  <StatusBadge label={review.kind} status={review.kind} />
                </div>
                <p className="mt-2 text-sm text-gray-600">Related to {review.relatedLabel}</p>

                {review.excerpt ? (
                  <div className="mt-4 rounded-2xl bg-gray-50 px-4 py-4 text-sm text-gray-700">
                    “{review.excerpt}”
                  </div>
                ) : null}

                {review.submittedAt ? (
                  <p className="mt-4 text-sm text-gray-500">
                    Submitted on {formatLongDate(review.submittedAt)}
                  </p>
                ) : null}
              </div>

              <div className="w-full max-w-sm rounded-2xl border border-teal-100 bg-teal-50 p-5">
                <div className="flex items-center gap-3">
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
                </div>

                <Button asChild className="mt-5 w-full">
                  <Link href={review.href}>
                    {review.status === "submitted" ? "View related item" : "Leave review"}
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
