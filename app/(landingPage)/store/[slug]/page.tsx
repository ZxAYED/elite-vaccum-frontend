import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ShieldCheck, ShoppingCart, Truck } from "lucide-react";

import { Button } from "@/components/ui/Button";
import {
  getProductBySlug,
  mockCustomerProductOrders,
} from "@/data/mock/customer-portal";
import { mockProductCategories, mockProducts } from "@/data/mock/products";
import { formatCurrencyUsd } from "@/lib/formatters";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const category = mockProductCategories.find((item) => item.id === product.categoryId);
  const relatedProducts = mockProducts
    .filter((item) => item.categoryId === product.categoryId && item.id !== product.id)
    .slice(0, 3);

  return (
    <main className="bg-[#F8FAFA] pb-20 pt-10">
      <div className="max-w-360 mx-auto px-4">
        <Link
          className="inline-flex items-center gap-2 text-sm font-semibold text-teal-700 transition hover:text-teal-800"
          href="/store"
        >
          <ArrowLeft size={16} />
          Back to store
        </Link>

        <div className="mt-6 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="h-[420px] rounded-[2rem] bg-gradient-to-br from-[#E8EDEE] to-[#D6E6E6]" />
          </section>

          <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">
              {category?.name ?? "Store item"}
            </p>
            <h1 className="mt-3 text-4xl font-bold text-gray-900">{product.name}</h1>
            <p className="mt-3 text-lg text-gray-500">{product.summary}</p>
            <p className="mt-6 text-sm leading-7 text-gray-600">{product.description}</p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-gray-50 p-4 text-sm text-gray-700">
                <ShieldCheck className="text-teal-700" size={18} />
                <p className="mt-3 font-semibold text-gray-900">Verified compatibility guidance</p>
              </div>
              <div className="rounded-2xl bg-gray-50 p-4 text-sm text-gray-700">
                <Truck className="text-teal-700" size={18} />
                <p className="mt-3 font-semibold text-gray-900">Tracked fulfillment and dashboard order history</p>
              </div>
              <div className="rounded-2xl bg-gray-50 p-4 text-sm text-gray-700">
                <ShoppingCart className="text-teal-700" size={18} />
                <p className="mt-3 font-semibold text-gray-900">Fast checkout flow for repeat customers</p>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <span className="text-3xl font-semibold text-gray-900">
                {formatCurrencyUsd(product.priceUsd)}
              </span>
              <Button asChild>
                <Link href="/cart">
                  <ShoppingCart size={18} />
                  Add to cart
                </Link>
              </Button>
            </div>
          </section>
        </div>

        <section className="mt-10 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">Related accessories</h2>
              <p className="mt-1 text-sm text-gray-500">
                Customers can review these later from order history in the portal.
              </p>
            </div>
            <p className="text-sm text-gray-500">
              {mockCustomerProductOrders.length} demo order records available in the customer dashboard
            </p>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {relatedProducts.map((relatedProduct) => (
              <Link
                className="rounded-2xl border border-gray-200 p-4 transition hover:border-teal-200 hover:bg-teal-50"
                href={`/store/${relatedProduct.slug}`}
                key={relatedProduct.id}
              >
                <p className="font-semibold text-gray-900">{relatedProduct.name}</p>
                <p className="mt-2 text-sm text-gray-600">{relatedProduct.summary}</p>
                <p className="mt-4 text-sm font-semibold text-teal-700">
                  {formatCurrencyUsd(relatedProduct.priceUsd)}
                </p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
