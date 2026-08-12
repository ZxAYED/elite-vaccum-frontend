import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { ProductCard } from "@/components/store/ProductCard";
import { mockProducts } from "@/data/mock/products";

const featuredProducts = mockProducts.slice(0, 4);

export function FeaturedProductsSection() {
  return (
    <section className="py-12 md:py-16">
      <div className="mx-auto max-w-360 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
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
        </div>

        <div className="mt-10 grid auto-rows-fr gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {featuredProducts.map((product, index) => (
            <ProductCard key={product.id} product={product} priority={index < 4} />
          ))}
        </div>
      </div>
    </section>
  );
}
