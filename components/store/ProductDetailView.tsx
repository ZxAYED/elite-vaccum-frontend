"use client";

import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { useMemo } from "react";

import { FadeIn, Pressable, StaggerGroup, StaggerItem } from "@/components/motion/Animated";
import { ProductCard } from "@/components/store/ProductCard";
import { ProductDetailExperience } from "@/components/store/ProductDetailExperience";
import { ProductDetailTabs } from "@/components/store/ProductDetailTabs";
import { useGetProductByIdOrSlugQuery, useGetProductsQuery } from "@/redux/api/productsApi";
import { useGetCategoriesQuery } from "@/redux/api/categoriesApi";
import type { Product } from "@/types/domain";

interface ProductDetailViewProps {
  slug: string;
}

export function ProductDetailView({ slug }: ProductDetailViewProps) {
  // Try fetching the product directly by SKU, slug, or ID using productsApi
  const {
    data: apiProduct,
    isLoading: isProductLoading,
    isError: isProductError,
  } = useGetProductByIdOrSlugQuery(slug, {
    skip: !slug,
  });

  // Categories query to resolve category name
  const { data: categoriesData } = useGetCategoriesQuery({ status: "ACTIVE" });

  const product: Product | undefined = apiProduct;

  // Related products: same category where the product exposes one, so the strip
  // is genuinely relevant rather than the first four rows of the catalog.
  const relatedCategory =
    product?.category?.slug || product?.categorySlug || product?.categoryId;
  const { data: relatedProductsData } = useGetProductsQuery(
    {
      limit: 5,
      status: "ACTIVE",
      ...(relatedCategory ? { category: relatedCategory } : {}),
    },
    { skip: !product },
  );

  const categoryName = useMemo(() => {
    if (!product) return "Store";
    if (product.category?.name) return product.category.name;
    const found = categoriesData?.items?.find((c) => c.id === product.categoryId);
    return found?.name ?? "Store";
  }, [product, categoriesData]);

  const relatedProducts: Product[] = useMemo(
    () =>
      (relatedProductsData?.items ?? [])
        .filter((item) => item.id !== product?.id)
        .slice(0, 4),
    [relatedProductsData?.items, product?.id],
  );

  // Show loading spinner while product is initially loading
  if (isProductLoading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center bg-[#f7fbfa] py-20">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <Loader2 className="size-8 animate-spin text-teal-700" />
          <p className="text-sm font-medium">Loading product details...</p>
        </div>
      </main>
    );
  }

  // If loading finished and no product was found
  if (!product && (isProductError || !isProductLoading)) {
    notFound();
  }

  if (!product) {
    return null;
  }


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
          <span>{categoryName}</span>
        </FadeIn>

        <ProductDetailExperience
          product={product}
          categoryName={categoryName}
        />

        <FadeIn className="mt-10" delay={0.12}>
          <ProductDetailTabs product={product} />
        </FadeIn>

        {relatedProducts.length > 0 ? (
          <section className="mt-10 landing-card landing-card-soft p-6 sm:p-8">
            <FadeIn delay={0.14}>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-700/80">
                You may also like
              </p>
              <h2 className="mt-2 text-3xl font-semibold text-primary">
                Related accessories and support tools
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
                More from {categoryName}, matched to the system you&apos;re viewing.
              </p>
            </FadeIn>

            <StaggerGroup
              className="mt-6 grid gap-5 md:grid-cols-2 2xl:grid-cols-4"
              delay={0.08}
            >
              {relatedProducts.map((relatedProduct) => (
                <StaggerItem key={relatedProduct.id}>
                  <ProductCard product={relatedProduct} />
                </StaggerItem>
              ))}
            </StaggerGroup>
          </section>
        ) : null}
      </div>
    </main>
  );
}
