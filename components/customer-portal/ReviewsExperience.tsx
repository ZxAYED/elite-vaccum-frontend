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
    <div className="space-y-6 pb-8">
      <PageHeader
        actions={
          <Button asChild variant="outline" size="sm" className="rounded-md font-medium">
            <Link href="/user/orders">Open orders</Link>
          </Button>
        }
        description="Submit feedback only after product delivery or completed service visits."
        eyebrow="Feedback"
        title="Reviews"
      />

      {(eligibleProductOrders.length || eligibleServiceOrders.length) ? (
        <section className="rounded-lg border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">Write a review</h2>
              <p className="mt-0.5 text-xs text-slate-500 font-normal">
                Reviews are available once a product order is delivered or a service visit is completed.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {eligibleProductOrders.map((order) => (
                <Button
                  key={order.id}
                  type="button"
                  size="sm"
                  variant="outline"
                  className="rounded-md text-xs font-medium"
                  onClick={() => startReview("product", order.id)}
                >
                  Review {order.items[0]?.name ?? order.id}
                </Button>
              ))}
              {eligibleServiceOrders.map((order) => (
                <Button
                  key={order.id}
                  type="button"
                  size="sm"
                  variant="outline"
                  className="rounded-md text-xs font-medium"
                  onClick={() => startReview("service", order.id)}
                >
                  Review {order.serviceName}
                </Button>
              ))}
            </div>
          </div>

          {(composeType === "product" && selectedProductOrder) ||
          (composeType === "service" && selectedServiceOrder) ? (
            <div className="rounded-md border border-slate-200 bg-slate-50/70 p-4 sm:p-5 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <TypeBadge type={composeType === "product" ? "PRODUCT" : "SERVICE"} />
                <p className="text-xs text-slate-600 font-medium">
                  Reviewing{" "}
                  <strong className="text-slate-900">
                    {composeType === "product"
                      ? selectedProductOrder?.items[0]?.name
                      : selectedServiceOrder?.serviceName}
                  </strong>{" "}
                  (Order: {composeType === "product" ? selectedProductOrder?.id : selectedServiceOrder?.id})
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-700">Rating</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
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
                      className={`inline-flex size-9 items-center justify-center rounded-md border text-xs font-semibold transition ${
                        draft.rating >= value
                          ? "border-amber-400 bg-amber-50 text-amber-600"
                          : "border-slate-200 bg-white text-slate-400 hover:bg-slate-50"
                      }`}
                    >
                      <Star
                        size={14}
                        className={draft.rating >= value ? "fill-amber-400" : ""}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-3">
                <div>
                  <label
                    htmlFor="review-title"
                    className="mb-1 block text-xs font-semibold text-slate-700"
                  >
                    Review headline
                  </label>
                  <Input
                    id="review-title"
                    value={draft.title}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, title: event.target.value }))
                    }
                    placeholder="Summarize your experience"
                    className="h-9 rounded-md text-xs"
                  />
                </div>
                <div>
                  <label
                    htmlFor="review-body"
                    className="mb-1 block text-xs font-semibold text-slate-700"
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
                    className="min-h-20 rounded-md text-xs"
                  />
                  <p className="mt-1 text-[11px] text-slate-400">
                    Minimum 20 characters.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button
                    type="button"
                    size="sm"
                    className="rounded-md font-medium"
                    onClick={submitReview}
                    disabled={!draft.title.trim() || draft.body.trim().length < 20}
                  >
                    Submit Review
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-md font-medium"
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
            <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs font-medium text-emerald-800">
              {submitMessage}
            </div>
          ) : null}
        </section>
      ) : null}

      {!customerReviews.length ? (
        <section className="rounded-lg border border-dashed border-teal-200 bg-teal-50/30 p-10 text-center shadow-xs">
          <div className="mx-auto flex size-12 items-center justify-center rounded-lg bg-teal-100 text-teal-800 shadow-xs">
            <MessageSquareQuote size={22} />
          </div>
          <h2 className="mt-3 text-base font-semibold text-slate-900">No reviews submitted yet</h2>
          <p className="mx-auto mt-1 max-w-sm text-xs text-slate-600 font-normal">
            Once you review a delivered product order or completed service visit, your verified feedback will appear here.
          </p>
        </section>
      ) : (
        <div className="space-y-4">
          {customerReviews.map((review) => (
            <article
              className="rounded-lg border border-slate-200 bg-white p-5 sm:p-6 shadow-xs transition hover:border-teal-400 hover:shadow-sm"
              key={review.id}
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
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
                  <h2 className="text-base sm:text-lg font-bold text-slate-900">
                    {review.title}
                  </h2>
                  <p className="text-xs text-slate-500">
                    Related to <strong className="text-slate-700">{review.relatedName}</strong> · Order {review.relatedOrderId}
                  </p>

                  <div className="rounded-md border border-slate-200 bg-slate-50/60 p-3 text-xs leading-relaxed text-slate-700">
                    {review.body}
                  </div>

                  <p className="text-[11px] text-slate-400">
                    Submitted on {formatLongDate(review.submittedAt)}
                  </p>
                </div>

                <div className="w-full lg:max-w-xs rounded-md border border-teal-200/80 bg-teal-50/50 p-4 space-y-3 shrink-0">
                  <div className="inline-flex items-center gap-1.5 rounded-md border border-amber-200 bg-white px-2.5 py-1 text-xs font-bold text-amber-700 shadow-xs">
                    <Star className="fill-amber-400 text-amber-500" size={13} />
                    {review.rating} / 5 Stars
                  </div>

                  <Button asChild size="sm" variant="outline" className="w-full rounded-md font-medium text-xs">
                    <Link
                      href={
                        review.type === "SERVICE"
                          ? `/user/orders/${review.relatedOrderId}`
                          : `/user/orders/${review.relatedOrderId}`
                      }
                    >
                      View Related Order
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
