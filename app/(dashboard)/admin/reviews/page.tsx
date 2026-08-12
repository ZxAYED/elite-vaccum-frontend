"use client";

import {
  ArrowRight,
  Eye,
  EyeOff,
  Search,
  ShieldCheck,
  Star,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import {
  AdminPageHeader,
  AdminPageShell,
  AdminStatCard,
  AdminSurface,
} from "@/components/admin/AdminPageShell";
import { StatusBadge } from "@/components/customer-portal/StatusBadge";
import { TypeBadge } from "@/components/customer-portal/TypeBadge";
import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import {
  deleteSharedReview,
  getSharedCustomerById,
  getSharedReviews,
  updateSharedReviewStatus,
} from "@/data/mock/shared-business-store";
import { useSharedBusinessStoreVersion } from "@/hooks/useSharedBusinessStoreVersion";
import { formatLongDate } from "@/lib/formatters";
import type { CustomerReview, ReviewStatus } from "@/types/domain";

type TypeFilter = "all" | "PRODUCT" | "SERVICE";
type StatusFilter = "all" | ReviewStatus;
type RatingFilter = "all" | "5" | "4" | "3" | "2" | "1";
type SortValue = "newest" | "oldest" | "rating-high" | "rating-low";

const statusLabelMap: Record<ReviewStatus, string> = {
  HIDDEN: "Hidden",
  PENDING: "Pending",
  PUBLISHED: "Published",
};

function reviewStatusTone(status: ReviewStatus) {
  if (status === "PUBLISHED") return "published";
  if (status === "HIDDEN") return "hidden";
  return "pending";
}

function getRelatedAdminHref(review: CustomerReview) {
  if (review.type === "PRODUCT") {
    return `/admin/orders/${review.relatedOrderId}`;
  }

  return `/admin/orders/${review.relatedOrderId}`;
}

function getRelatedLabel(review: CustomerReview) {
  return review.type === "PRODUCT" ? "Product Order" : "Service Order";
}

function getReviewPreview(review: CustomerReview) {
  return review.preview ?? review.body.slice(0, 120);
}

function ratingStars(rating: number) {
  return Array.from({ length: 5 }, (_, index) => (
    <Star
      key={`${rating}-${index}`}
      size={14}
      className={index < rating ? "fill-current text-amber-500" : "text-slate-300"}
    />
  ));
}

export default function AdminReviewsPage() {
  useSharedBusinessStoreVersion();
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [ratingFilter, setRatingFilter] = useState<RatingFilter>("all");
  const [sort, setSort] = useState<SortValue>("newest");
  const [selectedReview, setSelectedReview] = useState<CustomerReview | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CustomerReview | null>(null);

  const reviews = getSharedReviews();

  const filteredReviews = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return reviews
      .filter((review) => {
        if (typeFilter !== "all" && review.type !== typeFilter) return false;
        if (statusFilter !== "all" && review.status !== statusFilter) return false;
        if (ratingFilter !== "all" && String(review.rating) !== ratingFilter) return false;

        if (!normalizedQuery) return true;

        const haystack = [
          review.id,
          review.customerName,
          review.relatedName,
          review.relatedOrderId,
          review.title,
          review.body,
        ]
          .join(" ")
          .toLowerCase();

        return haystack.includes(normalizedQuery);
      })
      .sort((left, right) => {
        if (sort === "oldest") {
          return (
            new Date(left.submittedAt).getTime() - new Date(right.submittedAt).getTime()
          );
        }
        if (sort === "rating-high") return right.rating - left.rating;
        if (sort === "rating-low") return left.rating - right.rating;
        return (
          new Date(right.submittedAt).getTime() - new Date(left.submittedAt).getTime()
        );
      });
  }, [query, ratingFilter, reviews, sort, statusFilter, typeFilter]);

  const stats = {
    pending: reviews.filter((review) => review.status === "PENDING").length,
    product: reviews.filter((review) => review.type === "PRODUCT").length,
    published: reviews.filter((review) => review.status === "PUBLISHED").length,
    service: reviews.filter((review) => review.type === "SERVICE").length,
    total: reviews.length,
  };

  function moderate(reviewId: string, status: ReviewStatus) {
    updateSharedReviewStatus(reviewId, status, {
      actorLabel: "Admin",
      note:
        status === "PUBLISHED"
          ? "Published from admin moderation."
          : "Hidden from admin moderation.",
    });

    if (selectedReview?.id === reviewId) {
      const next = getSharedReviews().find((review) => review.id === reviewId) ?? null;
      setSelectedReview(next);
    }
  }

  function confirmDelete() {
    if (!deleteTarget) return;
    deleteSharedReview(deleteTarget.id, {
      actorLabel: "Admin",
      reason: "Removed during moderation",
      note: "Review deleted from admin reviews.",
    });
    if (selectedReview?.id === deleteTarget.id) {
      setSelectedReview(null);
    }
    setDeleteTarget(null);
  }

  return (
    <AdminPageShell>
      <AdminPageHeader
        eyebrow="Insights"
        title="Reviews"
        description="Moderate product and service reviews from one shared customer feedback source."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <AdminStatCard label="Total Reviews" value={stats.total} />
        <AdminStatCard label="Pending" value={stats.pending} tone="warning" />
        <AdminStatCard label="Published" value={stats.published} tone="success" />
        <AdminStatCard label="Product Reviews" value={stats.product} tone="soft" />
        <AdminStatCard label="Service Reviews" value={stats.service} tone="soft" />
      </div>

      <AdminSurface className="space-y-4">
        <div className="grid gap-3 xl:grid-cols-[minmax(0,1.5fr)_12rem_12rem_12rem_12rem]">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              className="pl-11"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search customer, item, order ID, or review text..."
            />
          </div>

          <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as TypeFilter)}>
            <SelectTrigger className="h-12">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="PRODUCT">Products</SelectItem>
              <SelectItem value="SERVICE">Services</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as StatusFilter)}
          >
            <SelectTrigger className="h-12">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="PUBLISHED">Published</SelectItem>
              <SelectItem value="HIDDEN">Hidden</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={ratingFilter}
            onValueChange={(value) => setRatingFilter(value as RatingFilter)}
          >
            <SelectTrigger className="h-12">
              <SelectValue placeholder="Rating" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Ratings</SelectItem>
              <SelectItem value="5">5 Star</SelectItem>
              <SelectItem value="4">4 Star</SelectItem>
              <SelectItem value="3">3 Star</SelectItem>
              <SelectItem value="2">2 Star</SelectItem>
              <SelectItem value="1">1 Star</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sort} onValueChange={(value) => setSort(value as SortValue)}>
            <SelectTrigger className="h-12">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
              <SelectItem value="rating-high">Rating high-low</SelectItem>
              <SelectItem value="rating-low">Rating low-high</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {!reviews.length ? (
          <div className="rounded-xl border border-dashed border-teal-200 bg-teal-50/40 px-5 py-12 text-center text-slate-600">
            No reviews yet.
          </div>
        ) : filteredReviews.length ? (
          <>
            <div className="hidden overflow-hidden rounded-xl border border-teal-100 lg:block">
              <div className="grid grid-cols-[1fr_0.8fr_1fr_0.9fr_0.65fr_1.3fr_0.8fr_0.9fr] bg-teal-50/60 px-4 py-3 text-xs font-bold uppercase tracking-[0.24em] text-slate-500">
                <span>Review ID</span>
                <span>Type</span>
                <span>Customer</span>
                <span>Product/Service</span>
                <span>Rating</span>
                <span>Preview</span>
                <span>Submitted</span>
                <span>Actions</span>
              </div>
              <div className="divide-y divide-teal-100 bg-white">
                {filteredReviews.map((review) => (
                  <div
                    key={review.id}
                    className="grid grid-cols-[1fr_0.8fr_1fr_0.9fr_0.65fr_1.3fr_0.8fr_0.9fr] items-start gap-4 px-4 py-4 text-sm text-slate-700"
                  >
                    <div className="space-y-2">
                      <p className="font-semibold text-primary">{review.id}</p>
                      <StatusBadge
                        status={reviewStatusTone(review.status)}
                        label={statusLabelMap[review.status]}
                      />
                    </div>
                    <div className="pt-0.5">
                      <TypeBadge type={review.type} />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{review.customerName}</p>
                      <p className="text-xs text-slate-500">
                        {getSharedCustomerById(review.customerId)?.email}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{review.relatedName}</p>
                      <p className="text-xs text-slate-500">{review.relatedOrderId}</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-1">{ratingStars(review.rating)}</div>
                      <p className="text-xs text-slate-500">{review.rating}/5</p>
                    </div>
                    <p className="line-clamp-3 text-sm text-slate-600">{getReviewPreview(review)}</p>
                    <p className="text-sm text-slate-600">{formatLongDate(review.submittedAt)}</p>
                    <div className="space-y-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full"
                        onClick={() => setSelectedReview(review)}
                      >
                        View
                      </Button>
                      {review.status !== "PUBLISHED" ? (
                        <Button
                          size="sm"
                          className="w-full"
                          onClick={() => moderate(review.id, "PUBLISHED")}
                        >
                          Publish
                        </Button>
                      ) : null}
                      {review.status !== "HIDDEN" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full"
                          onClick={() => moderate(review.id, "HIDDEN")}
                        >
                          Hide
                        </Button>
                      ) : null}
                      <Button
                        size="sm"
                        variant="destructive"
                        className="w-full"
                        onClick={() => setDeleteTarget(review)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4 lg:hidden">
              {filteredReviews.map((review) => (
                <div
                  key={review.id}
                  className="rounded-xl border border-teal-100 bg-white p-4 shadow-[0_18px_40px_-36px_rgba(28,79,80,0.34)]"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <TypeBadge type={review.type} />
                    <StatusBadge
                      status={reviewStatusTone(review.status)}
                      label={statusLabelMap[review.status]}
                    />
                  </div>

                  <div className="mt-4 space-y-2">
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                      {review.id}
                    </p>
                    <h2 className="text-xl font-semibold text-primary">{review.title}</h2>
                    <p className="text-sm text-slate-600">
                      {review.customerName} · {review.relatedName}
                    </p>
                    <div className="flex items-center gap-1">{ratingStars(review.rating)}</div>
                    <p className="text-sm leading-6 text-slate-600">{getReviewPreview(review)}</p>
                    <p className="text-xs text-slate-500">
                      Submitted {formatLongDate(review.submittedAt)}
                    </p>
                  </div>

                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    <Button variant="outline" onClick={() => setSelectedReview(review)}>
                      View details
                    </Button>
                    {review.status !== "PUBLISHED" ? (
                      <Button onClick={() => moderate(review.id, "PUBLISHED")}>
                        Publish
                      </Button>
                    ) : null}
                    {review.status !== "HIDDEN" ? (
                      <Button variant="outline" onClick={() => moderate(review.id, "HIDDEN")}>
                        Hide
                      </Button>
                    ) : null}
                    <Button variant="destructive" onClick={() => setDeleteTarget(review)}>
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="rounded-xl border border-dashed border-teal-200 bg-white px-5 py-12 text-center text-slate-600">
            No reviews match your filters.
          </div>
        )}
      </AdminSurface>

      <Dialog open={Boolean(selectedReview)} onOpenChange={(open) => !open && setSelectedReview(null)}>
        <DialogContent className="w-[min(94vw,56rem)] max-h-[88vh] overflow-y-auto">
          {selectedReview ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex flex-wrap items-center gap-3">
                  <span>{selectedReview.title}</span>
                  <TypeBadge type={selectedReview.type} />
                  <StatusBadge
                    status={reviewStatusTone(selectedReview.status)}
                    label={statusLabelMap[selectedReview.status]}
                  />
                </DialogTitle>
                <DialogDescription>
                  Review details, moderation state, and related customer/order navigation.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="space-y-4">
                  <div className="rounded-xl border border-teal-100 bg-white p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500">
                      Customer
                    </p>
                    <div className="mt-3 space-y-1">
                      <p className="text-lg font-semibold text-primary">
                        {selectedReview.customerName}
                      </p>
                      <p className="text-sm text-slate-600">
                        {getSharedCustomerById(selectedReview.customerId)?.email}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-teal-100 bg-white p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500">
                      Review
                    </p>
                    <div className="mt-3 flex items-center gap-1">
                      {ratingStars(selectedReview.rating)}
                      <span className="ml-2 text-sm font-medium text-slate-600">
                        {selectedReview.rating}/5
                      </span>
                    </div>
                    <p className="mt-4 text-sm leading-7 text-slate-700">
                      {selectedReview.body}
                    </p>
                  </div>

                  <div className="rounded-xl border border-teal-100 bg-white p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500">
                      Moderation History
                    </p>
                    <div className="mt-4 space-y-3">
                      {selectedReview.moderationHistory.map((entry) => (
                        <div
                          key={entry.id}
                          className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600"
                        >
                          <p className="font-medium text-slate-900">
                            {entry.actorLabel} · {entry.action}
                          </p>
                          <p className="mt-1">{formatLongDate(entry.createdAt)}</p>
                          {entry.reason ? <p className="mt-1">Reason: {entry.reason}</p> : null}
                          {entry.note ? <p className="mt-1">{entry.note}</p> : null}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-xl border border-teal-100 bg-white p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500">
                      Related Details
                    </p>
                    <div className="mt-4 space-y-3 text-sm text-slate-600">
                      <div>
                        <p className="font-medium text-slate-900">Product / Service</p>
                        <p>{selectedReview.relatedName}</p>
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">Submitted Date</p>
                        <p>{formatLongDate(selectedReview.submittedAt)}</p>
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">Related Order ID</p>
                        <p>{selectedReview.relatedOrderId}</p>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-2">
                      <Button asChild variant="outline">
                        <Link href={`/admin/customers/${selectedReview.customerId}`}>
                          View Customer
                          <ArrowRight size={16} />
                        </Link>
                      </Button>
                      <Button asChild variant="outline">
                        <Link href={getRelatedAdminHref(selectedReview)}>
                          View {getRelatedLabel(selectedReview)}
                          <ArrowRight size={16} />
                        </Link>
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-xl border border-teal-100 bg-teal-50/60 p-4">
                    <p className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
                      <ShieldCheck size={16} />
                      Moderation Actions
                    </p>
                    <div className="mt-4 grid gap-2">
                      {selectedReview.status !== "PUBLISHED" ? (
                        <Button onClick={() => moderate(selectedReview.id, "PUBLISHED")}>
                          <Eye size={16} />
                          Publish review
                        </Button>
                      ) : null}
                      {selectedReview.status !== "HIDDEN" ? (
                        <Button
                          variant="outline"
                          onClick={() => moderate(selectedReview.id, "HIDDEN")}
                        >
                          <EyeOff size={16} />
                          Hide review
                        </Button>
                      ) : null}
                      <Button
                        variant="destructive"
                        onClick={() => setDeleteTarget(selectedReview)}
                      >
                        <Trash2 size={16} />
                        Delete review
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete review?</DialogTitle>
            <DialogDescription>
              This removes only the review record from admin moderation. Customer,
              order, product, and service data will remain unchanged.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Keep review
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminPageShell>
  );
}
