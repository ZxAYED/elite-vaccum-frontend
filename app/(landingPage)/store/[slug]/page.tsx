import {
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { FadeIn, Pressable, StaggerGroup, StaggerItem } from "@/components/motion/Animated";
import { ProductCard } from "@/components/store/ProductCard";
import { ProductDetailExperience } from "@/components/store/ProductDetailExperience";
import { ProductDetailTabs } from "@/components/store/ProductDetailTabs";
import { getProductBySlug } from "@/data/mock/customer-portal";
import { mockProductCategories, mockProducts } from "@/data/mock/products";

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
    .filter((item) => item.id !== product.id)
    .slice(0, 4);
  const relatedOrderHistoryCount = 2;

  return (
    <main className="bg-[#f7fbfa] pb-20 pt-8 sm:pt-10">
      <div className="mx-auto max-w-360 px-4">
        <FadeIn className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
          <Pressable className="w-fit">
            <Link
              className="inline-flex items-center gap-2 font-semibold text-teal-700 transition hover:text-teal-800"
              href="/store"
            >
              <ArrowLeft size={16} />
              Back to store
            </Link>
          </Pressable>
          <span className="text-slate-300">/</span>
          <span>{category?.name ?? "Store"}</span>
        </FadeIn>

        <ProductDetailExperience
          product={product}
          categoryName={category?.name ?? "Store item"}
        />

        <FadeIn className="mt-10" delay={0.12}>
          <ProductDetailTabs product={product} />
        </FadeIn>

        <section className="mt-10 landing-card landing-card-soft p-6 sm:p-8">
          <FadeIn className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between" delay={0.14}>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-700/80">
                You may also like
              </p>
              <h2 className="mt-2 text-3xl font-semibold text-slate-950">
                Related accessories and support tools
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
                Customers can review these later from order history in the portal.
              </p>
            </div>

            <p className="text-sm text-slate-500">
              {relatedOrderHistoryCount} demo order records available in the customer
              dashboard
            </p>
          </FadeIn>

          <StaggerGroup className="mt-6 grid gap-5 md:grid-cols-2 2xl:grid-cols-4" delay={0.08}>
            {relatedProducts.map((relatedProduct) => (
              <StaggerItem key={relatedProduct.id}>
                <ProductCard product={relatedProduct} />
              </StaggerItem>
            ))}
          </StaggerGroup>
        </section>
      </div>
    </main>
  );
}
