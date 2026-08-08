import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { mockProductCategories, mockProducts } from "@/data/mock/products";
import { formatCurrencyUsd } from "@/lib/formatters";

export const metadata = {
  title: "Store - Elite Central Vacuum",
  description:
    "Shop central vacuum accessories, replacement parts, and home-care tools.",
};

export default function StorePage() {
  return (
    <main className="bg-[#F8FAFA] pb-20 pt-10">
      <div className="max-w-360 mx-auto px-4">
        <section className="rounded-[2rem] bg-linear-to-br from-teal-800 to-teal-700 px-6 py-10 text-white shadow-xl md:px-10">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-100">
            Parts and Accessories
          </p>
          <h1 className="mt-3 max-w-3xl text-4xl font-bold md:text-5xl">
            Shop accessories and replacement parts that fit the service workflow.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-teal-100 md:text-base">
            Public customers can browse and purchase products here, while authenticated users review order history and product reviews from the dashboard.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild className="bg-white text-teal-800 hover:bg-teal-50">
              <Link href="/cart">View cart</Link>
            </Button>
            <Button
              asChild
              className="border-white/30 bg-white/10 text-white hover:bg-white/20"
              variant="outline"
            >
              <Link href="/auth/login">Customer sign in</Link>
            </Button>
          </div>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          {mockProductCategories.map((category) => (
            <div className="rounded-3xl border border-teal-100 bg-white p-5 shadow-sm" key={category.id}>
              <p className="text-sm font-semibold text-teal-700">{category.name}</p>
              <p className="mt-2 text-sm leading-6 text-gray-600">{category.description}</p>
            </div>
          ))}
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-3">
          {mockProducts.map((product) => (
            <article
              className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm"
              key={product.id}
            >
              <div className="h-48 rounded-2xl bg-gradient-to-br from-[#E8EDEE] to-[#D8E4E4]" />
              <p className="mt-5 text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">
                {mockProductCategories.find((category) => category.id === product.categoryId)?.name}
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-gray-900">{product.name}</h2>
              <p className="mt-2 text-sm text-gray-500">{product.summary}</p>
              <p className="mt-4 text-sm leading-6 text-gray-600">{product.description}</p>
              <div className="mt-6 flex items-center justify-between">
                <span className="text-lg font-semibold text-gray-900">
                  {formatCurrencyUsd(product.priceUsd)}
                </span>
                <Link
                  className="inline-flex items-center gap-2 font-semibold text-teal-700 transition hover:text-teal-800"
                  href={`/store/${product.slug}`}
                >
                  View product
                  <ArrowRight size={16} />
                </Link>
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
