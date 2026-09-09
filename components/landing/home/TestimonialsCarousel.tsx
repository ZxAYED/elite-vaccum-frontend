"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, MessageSquareQuote, Star } from "lucide-react";

import { FadeIn, StaggerGroup, StaggerItem } from "@/components/motion/Animated";
import { useGetPublicReviewsQuery } from "@/redux/api/reviewsApi";

import { TestimonialCard } from "./TestimonialCard";

const SCROLL_STEP = 400;

export function TestimonialsCarousel() {
  const { data, isLoading, isError } = useGetPublicReviewsQuery();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Only published reviews with an actual written body read as a testimonial.
  const testimonials = useMemo(
    () => (data?.items ?? []).filter((review) => review.body.trim().length > 0),
    [data?.items],
  );

  const ratingSummary = data?.ratingSummary;
  const hasTestimonials = testimonials.length > 0;

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (
      !container ||
      !hasTestimonials ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const interval = window.setInterval(() => {
      const isAtEnd =
        container.scrollLeft + container.clientWidth >= container.scrollWidth - 5;

      if (isAtEnd) {
        container.scrollTo({ left: 0, behavior: "smooth" });
        return;
      }

      container.scrollBy({ left: SCROLL_STEP, behavior: "smooth" });
    }, 4000);

    return () => window.clearInterval(interval);
  }, [hasTestimonials]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      setCanScrollLeft(container.scrollLeft > 0);
      setCanScrollRight(
        container.scrollLeft + container.clientWidth < container.scrollWidth - 5,
      );
    };

    container.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => container.removeEventListener("scroll", handleScroll);
  }, [testimonials.length]);

  const scroll = (direction: "left" | "right") => {
    const container = scrollContainerRef.current;
    if (!container) return;

    container.scrollBy({
      left: direction === "left" ? -SCROLL_STEP : SCROLL_STEP,
      behavior: "smooth",
    });
  };

  // Nothing published yet (or the feed is unreachable): drop the section
  // rather than showing an empty shell on the marketing page.
  if (!isLoading && !hasTestimonials) return null;

  return (
    <section className="bg-white py-20 md:py-24">
      <div className="mx-auto max-w-360 px-4 sm:px-6 lg:px-8">
        <FadeIn
          className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between"
          y={24}
          duration={0.65}
        >
          <div className="max-w-3xl">
            <div className="inline-flex rounded-full bg-teal-50 px-5 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-teal-700">
              Service Stories
            </div>
            <h2 className="mt-4 text-3xl font-bold tracking-[-0.03em] text-primary sm:text-4xl md:text-5xl">
              Trusted service for every stage of ownership
            </h2>
            {ratingSummary && ratingSummary.totalReviews > 0 ? (
              <p className="mt-4 flex items-center gap-2 text-sm text-slate-600">
                <Star size={16} className="fill-teal-600 text-teal-600" aria-hidden />
                <span className="font-semibold text-slate-900">
                  {ratingSummary.averageRating.toFixed(1)}
                </span>
                <span>
                  average from {ratingSummary.totalReviews} verified{" "}
                  {ratingSummary.totalReviews === 1 ? "review" : "reviews"}
                </span>
              </p>
            ) : null}
          </div>

          {hasTestimonials ? (
            <div className="flex items-center gap-3">
              <button
                aria-label="Scroll testimonials left"
                className="inline-flex size-11 items-center justify-center rounded-[var(--radius-control)] border border-teal-100 bg-white text-primary shadow-sm transition hover:bg-primary hover:text-white hover:border-primary disabled:opacity-40"
                disabled={!canScrollLeft}
                onClick={() => scroll("left")}
                type="button"
              >
                <ChevronLeft aria-hidden="true" size={20} />
              </button>

              <button
                aria-label="Scroll testimonials right"
                className="inline-flex size-11 items-center justify-center rounded-[var(--radius-control)] border border-teal-100 bg-white text-primary shadow-sm transition hover:bg-primary hover:text-white hover:border-primary disabled:opacity-40"
                disabled={!canScrollRight}
                onClick={() => scroll("right")}
                type="button"
              >
                <ChevronRight aria-hidden="true" size={20} />
              </button>
            </div>
          ) : null}
        </FadeIn>

        {isLoading ? (
          <div className="mt-10 flex gap-6 overflow-hidden" aria-busy>
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="landing-card h-[300px] w-full shrink-0 animate-pulse bg-slate-100/70 sm:w-[23rem]"
              />
            ))}
            <span className="sr-only">Loading customer reviews</span>
          </div>
        ) : isError ? (
          <div className="mt-10 flex items-center gap-3 rounded-2xl border border-dashed border-teal-200 bg-teal-50/40 p-6 text-sm text-slate-600">
            <MessageSquareQuote className="size-5 shrink-0 text-teal-700" aria-hidden />
            Customer reviews are unavailable right now. Please check back shortly.
          </div>
        ) : (
          <StaggerGroup className="mt-10" delay={0.05} once amount={0.15}>
            <div
              className="flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth pb-4"
              ref={scrollContainerRef}
            >
              {testimonials.map((review) => (
                <StaggerItem key={review.id}>
                  <TestimonialCard
                    quote={review.body}
                    author={review.authorName}
                    title={review.serviceType ?? review.title}
                    rating={review.rating}
                    verified={review.verifiedPurchase}
                  />
                </StaggerItem>
              ))}
            </div>
          </StaggerGroup>
        )}
      </div>
    </section>
  );
}
