import { ArrowRight, ShoppingBag } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { mockProductImagesById } from "@/data/mock/product-images";
import { mockProducts } from "@/data/mock/products";
import { formatCurrencyUsd } from "@/lib/formatters";

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
            className="inline-flex items-center gap-2 text-sm font-semibold text-teal-700 transition hover:text-teal-800"
            href="/store"
          >
            View All Products
            <ArrowRight size={16} />
          </Link>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {featuredProducts.map((product) => {
            const image = mockProductImagesById[product.id];

            return (
              <article
                className="group rounded-[2rem] border border-teal-100 bg-white p-4 shadow-[0_28px_60px_-48px_rgba(28,79,80,0.45)] transition-transform duration-200 hover:-translate-y-1"
                key={product.id}
              >
                <Link
                  className="block rounded-[1.5rem] bg-[linear-gradient(180deg,#fbfdfd_0%,#edf5f3_100%)]"
                  href={`/store/${product.slug}`}
                >
                  <div className="relative flex h-56 items-center justify-center overflow-hidden rounded-[1.5rem] p-5">
                    <Image
                      src={image}
                      alt={product.imageAlt}
                      sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 24vw"
                      className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                  </div>
                </Link>

                <div className="px-1 pb-1 pt-5">
                  <p className="text-sm font-medium text-slate-500">{product.summary}</p>
                  <h3 className="mt-2 text-xl font-semibold text-slate-900">
                    <Link href={`/store/${product.slug}`}>{product.name}</Link>
                  </h3>
                  <div className="mt-5 flex items-center justify-between gap-4">
                    <span className="text-xl font-semibold text-primary">
                      {formatCurrencyUsd(product.priceUsd)}
                    </span>
                    <Link
                      aria-label={`View ${product.name}`}
                      className="inline-flex size-11 items-center justify-center rounded-full border border-teal-100 bg-teal-50 text-teal-700 transition hover:bg-teal-100"
                      href={`/store/${product.slug}`}
                    >
                      <ShoppingBag size={18} />
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
