"use client";

import { Star } from "lucide-react";
import Image, { StaticImageData } from "next/image";

interface TestimonialCardProps {
  quote: string;
  author: string;
  title: string;
  image: StaticImageData;
  rating: number;
}

export function TestimonialCard({
  quote,
  author,
  title,
  image,
  rating,
}: TestimonialCardProps) {
  return (
    <article className="landing-card flex h-full min-h-[300px] w-full shrink-0 snap-start flex-col p-6 sm:w-[23rem]">
      <div className="mb-5 flex gap-1">
        {Array.from({ length: rating }).map((_, i) => (
          <Star key={i} size={18} className="fill-teal-600 text-teal-600" />
        ))}
      </div>

      <p className="flex-1 text-sm leading-8 text-slate-600">
        &apos;{quote}&apos;
      </p>

      <div className="mt-6 flex items-center gap-3 border-t border-teal-100 pt-5">
        <div className="relative h-12 w-12 overflow-hidden rounded-full">
          <Image src={image} alt={author} fill className="object-cover" />
        </div>
        <div>
          <p className="font-semibold text-slate-900">{author}</p>
          <p className="text-sm text-slate-500">{title}</p>
        </div>
      </div>
    </article>
  );
}
