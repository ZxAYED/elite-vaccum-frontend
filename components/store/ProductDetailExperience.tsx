"use client";

import { CheckCircle2, PackageCheck, ShieldCheck, ShoppingCart, Truck, Zap } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { FadeIn, Pressable, StaggerGroup, StaggerItem } from "@/components/motion/Animated";
import { formatCurrencyUsd } from "@/lib/formatters";
import { resolveProductImages } from "@/lib/product-images";
import { toast } from "sonner";
import { getCookie } from "@/lib/cookies";
import { AUTH_TOKEN_KEY } from "@/redux/constants";
import { useAppSelector } from "@/redux/hooks";
import { useCartSync } from "@/hooks/useCartSync";
import { useGetProductByIdOrSlugQuery } from "@/redux/api/productsApi";
import type { Product } from "@/types/domain";

import { ProductReviews } from "./ProductReviews";
import { QuantityControl } from "./QuantityControl";

const productFeatureIcons = [ShieldCheck, Truck, ShoppingCart];
const assuranceIcons = [CheckCircle2, Zap, PackageCheck];

interface ProductDetailExperienceProps {
  product: Product;
  categoryName: string;
}

export function ProductDetailExperience({
  product,
  categoryName,
}: ProductDetailExperienceProps) {
  const router = useRouter();
  const { addProduct } = useCartSync();
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  const productIdentifier = product.sku || product.slug || product.id;
  const { data: apiProduct } = useGetProductByIdOrSlugQuery(productIdentifier, {
    skip: !productIdentifier,
  });
  const currentProduct = apiProduct || product;

  const galleryImages = useMemo(
    () => resolveProductImages(currentProduct),
    [currentProduct],
  );

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);

  const totalPrice = useMemo(
    () => formatCurrencyUsd(currentProduct.priceUsd * quantity),
    [currentProduct.priceUsd, quantity],
  );

  const selectedImage = galleryImages[selectedImageIndex] ?? galleryImages[0];
  const productHighlights = currentProduct.highlights ?? [];

  const handleAction = async (destination: "/checkout" | "/cart") => {
    const token = getCookie(AUTH_TOKEN_KEY);

    if (!isAuthenticated && !token) {
      router.push(
        `/auth/login?redirect=${encodeURIComponent(`/store/${productIdentifier}`)}`
      );
      return;
    }

    await addProduct(currentProduct, quantity);

    toast.success("Added to cart", {
      description: `${quantity} × ${currentProduct.name} added.`,
    });

    router.push(destination);
  };

  return (
    /*
      No `items-start`: the columns stretch to the taller of the two, and the
      reviews card below the gallery takes the leftover height, so the 60/40
      split ends level on both sides instead of leaving dead space under the
      image.
    */
    <section className="mt-6 flex flex-col gap-6 lg:flex-row">
      <div className="flex w-full min-w-0 flex-col gap-6 lg:w-3/5">
        <FadeIn className="landing-card landing-card-soft w-full min-w-0 overflow-hidden p-3 sm:p-4">
          {/*
            Product shots are mostly landscape, so a square stage left a deep band
            of empty gradient above and below. A 4:3 stage with no width cap lets
            the image use the full panel.
          */}
          <div className="rounded-[1.8rem] bg-[linear-gradient(180deg,#f8fcfc_0%,#eaf4f1_100%)] p-3 sm:p-4">
            {selectedImage ? (
              <div className="relative aspect-[4/3] w-full">
                <Image
                  src={selectedImage}
                  alt={product.imageAlt || product.name}
                  fill
                  priority
                  className="object-contain"
                  sizes="(min-width: 1024px) 60vw, 95vw"
                />
              </div>
            ) : (
              <div className="flex aspect-[4/3] items-center justify-center rounded-[1.4rem] bg-[linear-gradient(180deg,#eff5f4_0%,#dde9e7_100%)] text-slate-400">
                <span className="text-xs font-semibold uppercase tracking-wider">
                  No image available
                </span>
              </div>
            )}
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2.5 sm:grid-cols-5">
            {(galleryImages.length > 1 ? galleryImages : []).map((galleryImage, index) => (
              <Pressable key={`${product.id}-thumb-${index}`} className="w-full">
                <button
                  type="button"
                  aria-label={`View image ${index + 1} for ${product.name}`}
                  onClick={() => setSelectedImageIndex(index)}
                  className={`w-full rounded-2xl p-1.5 transition ${
                    selectedImageIndex === index
                      ? "bg-[#eef7f5] shadow-[inset_0_0_0_1px_rgba(24,112,108,0.18)]"
                      : "bg-white shadow-[0_18px_34px_-30px_rgba(28,79,80,0.24)]"
                  }`}
                >
                  {/* Matches the main stage ratio so the crop reads the same. */}
                  <div className="relative aspect-[4/3] w-full">
                    <Image
                      src={galleryImage}
                      alt={`${product.imageAlt || product.name} ${index + 1}`}
                      fill
                      className="object-contain"
                      sizes="(min-width: 1280px) 12rem, 30vw"
                    />
                  </div>
                </button>
              </Pressable>
            ))}
          </div>
        </FadeIn>

        {/* flex-1 so the gallery + reviews stack fills the row height. */}
        <ProductReviews
          className="flex-1"
          productId={currentProduct.id || productIdentifier}
          productName={currentProduct.name}
        />
      </div>

      <FadeIn
        className="landing-card landing-card-soft w-full min-w-0 p-6 sm:p-8 lg:w-2/5"
        delay={0.08}
      >
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-700">
          {product.eyebrow ?? categoryName}
        </p>
        {/* Sized for the 40% column — 5xl only once it is actually wide. */}
        <h1 className="mt-4 text-3xl font-semibold leading-tight text-primary sm:text-4xl xl:text-5xl">
          {product.name}
        </h1>
        <p className="mt-3 text-xl font-medium text-slate-600">{product.summary}</p>
        <p className="mt-5 text-base leading-7 text-slate-600">{product.description}</p>

        <StaggerGroup
          className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-3"
          delay={0.06}
        >
          {productHighlights.slice(0, 3).map((highlight, index) => {
            const Icon = productFeatureIcons[index] ?? ShieldCheck;
            const text = typeof highlight === "string" ? highlight : highlight?.text || "";
            const key = typeof highlight === "string" ? highlight : highlight?.id || `highlight-${index}`;

            // StaggerItem is the grid item, so it needs h-full as well —
            // without it the card sizes to its own text and the three
            // highlights end up ragged instead of one even row.
            return (
              <StaggerItem key={key} className="h-full">
                <div className="flex h-full flex-col rounded-[1.3rem] border border-[#2F3131]/5 bg-white p-4">
                  <div className="landing-icon-tile flex size-10 shrink-0 items-center justify-center bg-teal-50 text-teal-700">
                    <Icon size={17} />
                  </div>
                  <p className="mt-3 text-sm font-normal leading-6 text-slate-600">
                    {text}
                  </p>
                </div>
              </StaggerItem>
            );
          })}
        </StaggerGroup>

        <div className="mt-8 flex flex-wrap items-center gap-4">
          <span className="text-4xl font-semibold text-primary">{totalPrice}</span>
          <QuantityControl
            quantity={quantity}
            onDecrease={() => setQuantity((current) => Math.max(1, current - 1))}
            onIncrease={() => setQuantity((current) => current + 1)}
          />
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Pressable>
            <button
              type="button"
              onClick={() => handleAction("/checkout")}
              className="inline-flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-[var(--radius-control)] bg-primary px-6 text-[15px] font-semibold text-white shadow-[0_20px_40px_-28px_rgba(28,79,80,0.72)] hover:bg-teal-900 transition-colors"
            >
              <ShieldCheck size={16} />
              Buy now
            </button>
          </Pressable>
          <Pressable>
            <button
              type="button"
              onClick={() => handleAction("/cart")}
              className="inline-flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-[var(--radius-control)] bg-white px-6 text-[15px] font-semibold text-primary shadow-[inset_0_0_0_1px_rgba(28,79,80,0.12)] hover:bg-slate-50 transition-colors"
            >
              <ShoppingCart size={16} />
              Add to cart
            </button>
          </Pressable>
        </div>

        <div className="mt-8 border-t border-teal-100 pt-6">
          <div className="space-y-4">
            {[
              "10-year comprehensive guidance from the Elite service team.",
              "Complimentary compatibility review before recommended installs.",
              "Clean fulfillment tracking with dashboard-visible order history.",
            ].map((assurance, index) => {
              const Icon = assuranceIcons[index] ?? CheckCircle2;

              return (
                <div key={assurance} className="flex items-start gap-3 text-sm text-slate-600">
                  <Icon size={18} className="mt-0.5 text-teal-700" />
                  <span>{assurance}</span>
                </div>
              );
            })}
          </div>
        </div>
      </FadeIn>
    </section>
  );
}
