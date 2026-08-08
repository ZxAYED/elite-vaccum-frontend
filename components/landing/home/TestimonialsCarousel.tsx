"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import avatarOne from "@/public/landing/testimonials/Avatar.png";
import avatarTwo from "@/public/landing/testimonials/Avatar2.png";
import avatarThree from "@/public/landing/testimonials/Avatar3.png";

import { TestimonialCard } from "./TestimonialCard";

const testimonials = [
  {
    quote:
      "Demo review: the service walkthrough made our central vacuum upgrade feel organized from the first site visit through the final testing pass.",
    author: "Demo Homeowner A",
    title: "Greenwich Residence",
    image: avatarOne,
    rating: 5,
  },
  {
    quote:
      "Demo review: our builder needed a clean retrofit plan, and the project notes made it easy to coordinate rough-in work with the rest of the remodel.",
    author: "Demo Builder Partner",
    title: "Westchester Project",
    image: avatarTwo,
    rating: 5,
  },
  {
    quote:
      "Demo review: the maintenance visit caught a worn hose handle before it became a bigger problem, and the technician explained every next step clearly.",
    author: "Demo Homeowner B",
    title: "Fairfield County",
    image: avatarThree,
    rating: 5,
  },
  {
    quote:
      "Demo review: accessory recommendations were practical, not pushy, and the team helped us match new tools to an older system with no guesswork.",
    author: "Demo Customer C",
    title: "Legacy System Upgrade",
    image: avatarOne,
    rating: 5,
  },
  {
    quote:
      "Demo review: the install checklist and testing notes gave us confidence that every inlet was performing before the crew wrapped the job.",
    author: "Demo Customer D",
    title: "New Construction Planning",
    image: avatarTwo,
    rating: 5,
  },
];

export function TestimonialsCarousel() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (
      !container ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const scrollAmount = 400;
    const interval = window.setInterval(() => {
      const isAtEnd =
        container.scrollLeft + container.clientWidth >=
        container.scrollWidth - 5;

      if (isAtEnd) {
        container.scrollTo({ left: 0, behavior: "smooth" });
        return;
      }

      container.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }, 4000);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      setCanScrollLeft(container.scrollLeft > 0);
      setCanScrollRight(
        container.scrollLeft + container.clientWidth <
          container.scrollWidth - 5,
      );
    };

    container.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  const scroll = (direction: "left" | "right") => {
    const container = scrollContainerRef.current;
    if (!container) return;

    container.scrollBy({
      left: direction === "left" ? -400 : 400,
      behavior: "smooth",
    });
  };

  return (
    <section className="bg-white py-20 md:py-24">
      <div className="mx-auto max-w-360 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex rounded-full bg-teal-50 px-5 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-teal-700">
              Service Stories
            </div>
            <h2 className="mt-4 text-3xl font-bold tracking-[-0.03em] text-primary sm:text-4xl md:text-5xl">
              Trusted service for every stage of ownership
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <button
              aria-label="Scroll testimonials left"
              className="inline-flex size-11 items-center justify-center rounded-full border border-teal-100 bg-white text-primary shadow-sm transition hover:bg-teal-50 disabled:opacity-40"
              disabled={!canScrollLeft}
              onClick={() => scroll("left")}
              type="button"
            >
              <ChevronLeft aria-hidden="true" size={20} />
            </button>

            <button
              aria-label="Scroll testimonials right"
              className="inline-flex size-11 items-center justify-center rounded-full border border-teal-100 bg-white text-primary shadow-sm transition hover:bg-teal-50 disabled:opacity-40"
              disabled={!canScrollRight}
              onClick={() => scroll("right")}
              type="button"
            >
              <ChevronRight aria-hidden="true" size={20} />
            </button>
          </div>
        </div>

        <div
          className="mt-10 flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth pb-4"
          ref={scrollContainerRef}
        >
          {testimonials.map((testimonial, index) => (
            <TestimonialCard key={index} {...testimonial} />
          ))}
        </div>
      </div>
    </section>
  );
}
