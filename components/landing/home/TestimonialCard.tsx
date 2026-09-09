"use client";

import { BadgeCheck, Star } from "lucide-react";

interface TestimonialCardProps {
  quote: string;
  author: string;
  title: string;
  rating: number;
  verified?: boolean;
}

/** Two-letter monogram — the public review feed carries no author avatar. */
function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

export function TestimonialCard({
  quote,
  author,
  title,
  rating,
  verified = false,
}: TestimonialCardProps) {
  return (
    <article className="landing-card flex h-full min-h-[300px] w-full shrink-0 snap-start flex-col p-6 sm:w-[23rem]">
      <div className="mb-5 flex gap-1" aria-label={`${rating} out of 5 stars`}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            size={18}
            aria-hidden
            className={
              i < rating
                ? "fill-teal-600 text-teal-600"
                : "fill-slate-200 text-slate-200"
            }
          />
        ))}
      </div>

      <p className="flex-1 text-sm leading-8 text-slate-600">
        &apos;{quote}&apos;
      </p>

      <div className="mt-6 flex items-center gap-3 border-t border-teal-100 pt-5">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-teal-50 text-sm font-bold text-teal-800">
          {initialsOf(author)}
        </div>
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 font-semibold text-slate-900">
            <span className="truncate">{author}</span>
            {verified ? (
              <BadgeCheck
                size={15}
                className="shrink-0 text-teal-600"
                aria-label="Verified purchase"
              />
            ) : null}
          </p>
          {title ? <p className="truncate text-sm text-slate-500">{title}</p> : null}
        </div>
      </div>
    </article>
  );
}
