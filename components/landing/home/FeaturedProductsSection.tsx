"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { FadeIn, StaggerGroup, StaggerItem } from "@/components/motion/Animated";
import { ProductCard } from "@/components/store/ProductCard";
import { useGetProductsQuery } from "@/redux/api/productsApi";

export function FeaturedProductsSection() {
  // Featured products come from `GET /products?isFeatured=true` (Phase 3.1).
  const { data: apiData, isLoading } = useGetProductsQuery({
    isFeatured: true,
    status: "ACTIVE",
    limit: 8,
  });

  const featuredProducts = (apiData?.items ?? []).slice(0, 4);

  // Nothing featured (or the catalog is unreachable): omit the section rather
  // than leaving an empty grid on the home page.
  if (!isLoading && featuredProducts.length === 0) return null;

  return (
    <section className="py-10 md:py-16">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
        <FadeIn
          className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between"
          y={24}
          duration={0.65}
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-700">
              The Collection
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-[-0.03em] text-primary md:text-4xl">
              Featured Performance Units
            </h2>
          </div>
          <Link
            className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-teal-700 transition hover:text-teal-800"
            href="/store"
          >
            View All Products
            <ArrowRight size={16} />
          </Link>
        </FadeIn>

        {isLoading ? (
          <div
            className="mt-8 grid auto-rows-fr gap-4 sm:mt-10 sm:gap-6 sm:grid-cols-2 xl:grid-cols-4"
            aria-busy
          >
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-80 animate-pulse rounded-2xl bg-slate-100/80"
              />
            ))}
            <span className="sr-only">Loading featured products</span>
          </div>
        ) : (
          <StaggerGroup
            className="mt-8 grid auto-rows-fr gap-4 sm:mt-10 sm:gap-6 sm:grid-cols-2 xl:grid-cols-4"
            delay={0.05}
            once
          >
            {featuredProducts.map((product, index) => (
              <StaggerItem key={product.id}>
                <ProductCard product={product} priority={index < 4} />
              </StaggerItem>
            ))}
          </StaggerGroup>
        )}
      </div>
    </section>
  );
}

