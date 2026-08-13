"use client";

import Link from "next/link";
import { MessageSquareQuote, Star } from "lucide-react";
import { useState } from "react";

import { PageHeader } from "@/components/customer-portal/PageHeader";
import { StatusBadge } from "@/components/customer-portal/StatusBadge";
import { TypeBadge } from "@/components/customer-portal/TypeBadge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import {
  dashboardProductOrders,
  getDashboardServiceOrders,
} from "@/data/mock/customer-dashboard";
import {
  createSharedReview,
  getSharedReviews,
  hasSharedReviewForOrder,
} from "@/data/mock/shared-business-store";
import { mockCurrentCustomer, mockCurrentUser } from "@/data/mock/user";
import { useSharedBusinessStoreVersion } from "@/hooks/useSharedBusinessStoreVersion";
import { formatLongDate } from "@/lib/formatters";

type ComposeType = "product" | "service" | null;

interface ReviewsExperienceProps {
  initialComposeType: ComposeType;
  initialOrderId?: string;
}

type DraftState = {
  rating: 1 | 2 | 3 | 4 | 5;
  title: string;
  body: string;
};

const emptyDraft: DraftState = {
  rating: 5,
  title: "",
  body: "",
};

export function ReviewsExperience({
  initialComposeType,
  initialOrderId,
}: ReviewsExperienceProps) {
  useSharedBusinessStoreVersion();
  const [selectedOrderId, setSelectedOrderId] = useState(initialOrderId ?? "");
  const [composeType, setComposeType] = useState<ComposeType>(initialComposeType);
  const [draft, setDraft] = useState<DraftState>(emptyDraft);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);

  const customerReviews = getSharedReviews().filter(
    (review) => review.customerId === mockCurrentUser.customerId,
  );

  const eligibleProductOrders = dashboardProductOrders.filter(
    (order) => order.status === "delivered" && !hasSharedReviewForOrder(order.id),
  );
  const eligibleServiceOrders = getDashboardServiceOrders().filter(
    (order) => order.status === "completed" && !hasSharedReviewForOrder(order.id),
  );

  const selectedProductOrder =
    composeType === "product"
      ? eligibleProductOrders.find((order) => order.id === selectedOrderId)
      : undefined;
  const selectedServiceOrder =
    composeType === "service"
      ? eligibleServiceOrders.find((order) => order.id === selectedOrderId)
      : undefined;

  function startReview(type: ComposeType, orderId: string) {
    setComposeType(type);
    setSelectedOrderId(orderId);
    setDraft(emptyDraft);
    setSubmitMessage(null);
  }

  function submitReview() {
    if (!composeType) return;
    if (!draft.title.trim() || draft.body.trim().length < 20) return;

    if (composeType === "product") {
      const firstItem = selectedProductOrder?.items[0];
      if (!firstItem) return;

      createSharedReview({
        type: "PRODUCT",
        customerId: mockCurrentUser.customerId ?? mockCurrentCustomer.id,
        customerName: mockCurrentCustomer.displayName,
        relatedOrderId: selectedProductOrder.id,
        relatedEntityId: firstItem.productId,
        relatedName: firstItem.name,
        title: draft.title.trim(),
        body: draft.body.trim(),
        rating: draft.rating,
      });
    } else {
      if (!selectedServiceOrder) return;

      createSharedReview({
        type: "SERVICE",
        customerId: mockCurrentUser.customerId ?? mockCurrentCustomer.id,
        customerName: mockCurrentCustomer.displayName,
        relatedOrderId: selectedServiceOrder.id,
        relatedEntityId: selectedServiceOrder.serviceRequestId,
        relatedName: selectedServiceOrder.serviceName,
        title: draft.title.trim(),
        body: draft.body.trim(),
        rating: draft.rating,
      });
    }

    setSubmitMessage("Review submitted. It now appears in your history and awaits moderation.");
    setDraft(emptyDraft);
    setComposeType(null);
    setSelectedOrderId("");
  }

  return (
    <div className="min-h-screen">
      <PageHeader
        actions={
          <Button asChild variant="outline">
            <Link href="/user/orders">Open orders</Link>
          </Button>
        }
        description="Submit feedback only after product delivery or completed service visits."
        eyebrow="Feedback"
        title="Reviews"
      />

      {(eligibleProductOrders.length || eligibleServiceOrders.length) && (
        <section className="mb-8 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-primary">Write a review</h2>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                Reviews are available only once a product order is delivered or a service
                order is completed. Each order can be reviewed once.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {eligibleProductOrders.map((order) => (
                <Button
                  key={order.id}
                  type="button"
                  variant="outline"
                  onClick={() => startReview("product", order.id)}
                >
                  Review {order.items[0]?.name ?? order.id}
                </Button>
              ))}
              {eligibleServiceOrders.map((order) => (
                <Button
                  key={order.id}
                  type="button"
                  variant="outline"
                  onClick={() => startReview("service", order.id)}
                >
                  Review {order.serviceName}
                </Button>
              ))}
            </div>
          </div>

          {(composeType === "product" && selectedProductOrder) ||
          (composeType === "service" && selectedServiceOrder) ? (
            <div className="mt-6 rounded-2xl bg-slate-50 p-5">
              <div className="flex flex-wrap items-center gap-3">
                <TypeBadge type={composeType === "product" ? "PRODUCT" : "SERVICE"} />
                <p className="text-sm text-gray-600">
                  Reviewing{" "}
                  <span className="font-semibold text-primary">
                    {composeType === "product"
                      ? selectedProductOrder?.items[0]?.name
                      : selectedServiceOrder?.serviceName}
                  </span>{" "}
                  for order{" "}
                  {composeType === "product"
                    ? selectedProductOrder?.id
                    : selectedServiceOrder?.id}
                </p>
              </div>

              <div className="mt-5">
                <p className="text-sm font-semibold text-primary">Rating</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      type="button"
                      aria-label={`Rate ${value} star${value > 1 ? "s" : ""}`}
                      onClick={() =>
                        setDraft((current) => ({
                          ...current,
                          rating: value as DraftState["rating"],
                        }))
                      }
                      className={`inline-flex size-11 items-center justify-center rounded-2xl border text-sm font-semibold transition ${
                        draft.rating === value
                          ? "border-teal-700 bg-teal-700 text-white"
                          : "border-gray-200 bg-white text-gray-700"
                      }`}
                    >
                      <Star
                        size={16}
                        className={draft.rating >= value ? "fill-current" : ""}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-5 grid gap-5">
                <div>
                  <label
                    htmlFor="review-title"
                    className="mb-2 block text-sm font-semibold text-primary"
                  >
                    Review title
                  </label>
                  <Input
                    id="review-title"
                    value={draft.title}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, title: event.target.value }))
                    }
                    placeholder="Summarize your experience"
                  />
                </div>
                <div>
                  <label
                    htmlFor="review-body"
                    className="mb-2 block text-sm font-semibold text-primary"
                  >
                    Review details
                  </label>
                  <Textarea
                    id="review-body"
                    value={draft.body}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, body: event.target.value }))
                    }
                    placeholder="Share what went well, what could improve, and whether you would recommend it."
                  />
                  <p className="mt-2 text-xs text-gray-500">
                    Minimum 20 characters.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button
                    type="button"
                    onClick={submitReview}
                    disabled={!draft.title.trim() || draft.body.trim().length < 20}
                  >
                    Submit Review
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setComposeType(null);
                      setSelectedOrderId("");
                      setDraft(emptyDraft);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          ) : null}

          {submitMessage ? (
            <div className="mt-5 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
              {submitMessage}
            </div>
          ) : null}
        </section>
      )}

      {!customerReviews.length ? (
        <section className="rounded-3xl border border-dashed border-gray-200 bg-white p-10 text-center shadow-sm">
          <MessageSquareQuote className="mx-auto text-teal-700" size={28} />
          <h2 className="mt-4 text-xl font-semibold text-primary">No reviews yet</h2>
          <p className="mt-2 text-sm text-gray-600">
            Once you review a delivered product order or completed service visit, it
            will appear here.
          </p>
        </section>
      ) : (
        <div className="space-y-5">
          {customerReviews.map((review) => (
            <article
              className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm"
              key={review.id}
            >
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <TypeBadge type={review.type} />
                    <StatusBadge
                      label={
                        review.status === "PENDING"
                          ? "Pending"
                          : review.status === "PUBLISHED"
                            ? "Published"
                            : "Hidden"
                      }
                      status={review.status.toLowerCase()}
                    />
                  </div>
                  <h2 className="mt-4 text-xl font-semibold text-primary">
                    {review.title}
                  </h2>
                  <p className="mt-2 text-sm text-gray-600">
                    Related to {review.relatedName} · {review.relatedOrderId}
                  </p>

                  <div className="mt-4 rounded-2xl bg-gray-50 px-4 py-4 text-sm leading-6 text-gray-700">
                    {review.body}
                  </div>

                  <p className="mt-4 text-sm text-gray-500">
                    Submitted on {formatLongDate(review.submittedAt)}
                  </p>
                </div>

                <div className="w-full max-w-sm rounded-2xl bg-teal-50 p-5">
                  <div className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-2 text-amber-600">
                    <Star className="fill-current" size={16} />
                    {review.rating}/5
                  </div>

                  <Button asChild className="mt-5 w-full">
                    <Link
                      href={
                        review.type === "SERVICE"
                          ? `/user/orders/${review.relatedOrderId}`
                          : `/user/orders/${review.relatedOrderId}`
                      }
                    >
                      View related order
                    </Link>
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
