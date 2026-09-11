"use client";

import { MessageSquareDashed, Star } from "lucide-react";
import { useState } from "react";

import { FadeIn } from "@/components/motion/Animated";
import { Pagination } from "@/components/store/Pagination";
import { formatLongDate } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { useGetProductReviewsQuery } from "@/redux/api/reviewsApi";

const PAGE_SIZE = 5;
const RATING_ROWS = [5, 4, 3, 2, 1] as const;

interface ProductReviewsProps {
  productId: string;
  productName: string;
  className?: string;
}

/** Read-only star row. The glyphs carry the colour; adjacent text stays ink. */
function Stars({
  rating,
  size = 14,
  className,
}: {
  rating: number;
  size?: number;
  className?: string;
}) {
  return (
    <span
      aria-label={`${rating} out of 5 stars`}
      className={cn("inline-flex items-center gap-0.5", className)}
      role="img"
    >
      {[1, 2, 3, 4, 5].map((value) => (
        <Star
          key={value}
          size={size}
          aria-hidden="true"
          className={cn(
            value <= Math.round(rating)
              ? "fill-amber-400 text-amber-400"
              : "fill-transparent text-slate-300",
          )}
        />
      ))}
    </span>
  );
}

export function ProductReviews({
  productId,
  productName,
  className,
}: ProductReviewsProps) {
  const [activeRating, setActiveRating] = useState<number | null>(null);
  const [page, setPage] = useState(1);

  const { data, isLoading, isFetching } = useGetProductReviewsQuery(
    {
      productId,
      page,
      limit: PAGE_SIZE,
      ...(activeRating ? { rating: activeRating } : {}),
    },
    { skip: !productId },
  );

  const summary = data?.summary;
  const totalReviews = summary?.totalReviews ?? 0;
  const items = data?.items ?? [];

  function selectRating(rating: number) {
    setActiveRating((current) => (current === rating ? null : rating));
    setPage(1);
  }

  return (
    <section
      className={cn(
        "landing-card landing-card-soft flex flex-col p-6 sm:p-8",
        className,
      )}
    >
      <FadeIn>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-700/80">
          Customer Reviews
        </p>
        <h2 className="mt-2 text-3xl font-semibold text-primary">
          What owners say
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
          Verified feedback from customers who bought the {productName}.
        </p>
      </FadeIn>

      {isLoading ? (
        <ReviewsSkeleton />
      ) : totalReviews === 0 ? (
        <EmptyReviews />
      ) : (
        <div className="mt-7 grid gap-8 xl:grid-cols-[minmax(0,16rem)_minmax(0,1fr)] xl:gap-10">
          <div>
            {/*
              Hero figure for the section: proportional figures, since a large
              standalone number looks loose with tabular digits.
            */}
            <div className="flex items-end gap-3">
              <span className="text-4xl font-semibold leading-none text-primary">
                {summary?.averageRating.toFixed(1)}
              </span>
              <span className="pb-0.5 text-sm text-slate-500">out of 5</span>
            </div>
            <Stars className="mt-2.5" rating={summary?.averageRating ?? 0} size={16} />
            <p className="mt-2 text-sm text-slate-500">
              {totalReviews} review{totalReviews === 1 ? "" : "s"}
            </p>

            {/*
              Rating distribution. One series, so one hue for all five bars and
              no legend — the star column names each row. Bars are thin with a
              rounded data-end, on a recessive neutral track, and every value is
              labelled at the tip. Rows double as the rating filter.
            */}
            <div className="mt-6 space-y-1.5">
              {RATING_ROWS.map((rating) => {
                const count = Number(summary?.distribution?.[String(rating)] ?? 0);
                const percent = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                const isActive = activeRating === rating;

                return (
                  <button
                    aria-label={`Show only ${rating} star reviews (${count})`}
                    aria-pressed={isActive}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition",
                      isActive ? "bg-[#eef7f5]" : "hover:bg-slate-50",
                    )}
                    key={rating}
                    onClick={() => selectRating(rating)}
                    title={`${count} of ${totalReviews} (${Math.round(percent)}%)`}
                    type="button"
                  >
                    <span className="flex w-7 shrink-0 items-center gap-1 text-xs font-medium text-slate-600">
                      {rating}
                      <Star
                        aria-hidden="true"
                        className="fill-amber-400 text-amber-400"
                        size={11}
                      />
                    </span>

                    <span className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                      <span
                        className="block h-full rounded-r-[4px] bg-amber-400 transition-[width] duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </span>

                    <span className="w-7 shrink-0 text-right text-xs tabular-nums text-slate-500">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {activeRating ? (
              <button
                className="mt-3 text-xs font-semibold text-teal-700 transition hover:text-teal-800"
                onClick={() => {
                  setActiveRating(null);
                  setPage(1);
                }}
                type="button"
              >
                Clear {activeRating}-star filter
              </button>
            ) : null}
          </div>

          <div className={cn("transition-opacity", isFetching && "opacity-60")}>
            {items.length === 0 ? (
              <div className="rounded-[1.3rem] border border-dashed border-teal-200/80 bg-white/70 p-8 text-center">
                <p className="text-sm font-normal text-slate-600">
                  No {activeRating}-star reviews yet.
                </p>
                <button
                  className="mt-2 text-xs font-semibold text-teal-700 transition hover:text-teal-800"
                  onClick={() => {
                    setActiveRating(null);
                    setPage(1);
                  }}
                  type="button"
                >
                  Show all reviews
                </button>
              </div>
            ) : (
              <>
                <ul className="space-y-3">
                  {items.map((review) => (
                    <li
                      className="rounded-[1.3rem] border border-[#2F3131]/5 bg-white p-5"
                      key={review.id}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-teal-50 text-xs font-semibold text-teal-800">
                            {review.customerName.trim().charAt(0).toUpperCase()}
                          </span>
                          <span className="text-sm font-medium text-slate-800">
                            {review.customerName}
                          </span>
                        </div>
                        <Stars rating={review.rating} />
                      </div>

                      {review.title ? (
                        <p className="mt-3 text-sm font-semibold text-slate-900">
                          {review.title}
                        </p>
                      ) : null}

                      {review.body ? (
                        <p className="mt-1.5 text-sm font-normal leading-6 text-slate-600">
                          {review.body}
                        </p>
                      ) : null}

                      {review.submittedAt ? (
                        <p className="mt-3 text-xs text-slate-400">
                          {formatLongDate(review.submittedAt)}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ul>

                <Pagination
                  className="mt-6"
                  currentPage={data?.meta.page ?? page}
                  onPageChange={setPage}
                  pageSize={data?.meta.limit ?? PAGE_SIZE}
                  totalItems={data?.meta.totalItems ?? items.length}
                />
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

/** Deliberately not a bold heading — an absent review count is not an error. */
function EmptyReviews() {
  return (
    <div className="mt-7 rounded-[1.3rem] border border-dashed border-teal-200/80 bg-white/70 p-8 text-center sm:p-10">
      <span className="mx-auto flex size-11 items-center justify-center rounded-full bg-teal-50 text-teal-700">
        <MessageSquareDashed aria-hidden="true" size={20} />
      </span>
      <p className="mx-auto mt-4 max-w-md text-sm font-normal leading-7 text-slate-600">
        No reviews yet. Once this unit has been delivered, verified owners can
        rate it from their order details and their feedback will appear here.
      </p>
    </div>
  );
}

function ReviewsSkeleton() {
  return (
    <div
      aria-label="Loading reviews"
      className="mt-7 grid animate-pulse gap-8 xl:grid-cols-[minmax(0,16rem)_minmax(0,1fr)] xl:gap-10"
      role="status"
    >
      <div className="space-y-3">
        <div className="h-10 w-28 rounded-lg bg-slate-100" />
        {RATING_ROWS.map((rating) => (
          <div className="h-4 w-full rounded-full bg-slate-100" key={rating} />
        ))}
      </div>
      <div className="space-y-3">
        {[1, 2, 3].map((row) => (
          <div className="h-28 w-full rounded-[1.3rem] bg-slate-100" key={row} />
        ))}
      </div>
    </div>
  );
}
