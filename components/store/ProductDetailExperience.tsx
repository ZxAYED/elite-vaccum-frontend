"use client";

import { CheckCircle2, PackageCheck, ShieldCheck, ShoppingCart, Truck, Zap } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { FadeIn, Pressable, StaggerGroup, StaggerItem } from "@/components/motion/Animated";
import { mockProductGalleryImagesById } from "@/data/mock/product-images";
import { formatCurrencyUsd } from "@/lib/formatters";
import { toast } from "sonner";
import { getCookie } from "@/lib/cookies";
import { AUTH_TOKEN_KEY } from "@/redux/constants";
import { useAppSelector } from "@/redux/hooks";
import { useCartSync } from "@/hooks/useCartSync";
import type { Product } from "@/types/domain";

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

  const galleryImages = mockProductGalleryImagesById[product.id] ?? [];
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);

  const totalPrice = useMemo(
    () => formatCurrencyUsd(product.priceUsd * quantity),
    [product.priceUsd, quantity],
  );

  const selectedImage = galleryImages[selectedImageIndex] ?? galleryImages[0];
  const productHighlights = product.highlights ?? [];

  const handleAction = async (destination: "/checkout" | "/cart") => {
    const token = getCookie(AUTH_TOKEN_KEY);

    if (!isAuthenticated && !token) {
      router.push(
        `/auth/login?redirect=${encodeURIComponent(`/store/${product.slug}`)}`
      );
      return;
    }

    await addProduct(product, quantity);

    toast.success("Added to cart", {
      description: `${quantity} × ${product.name} added.`,
    });

    router.push(destination);
  };

  return (
    <section className="mt-6 grid gap-8 xl:grid-cols-[minmax(0,1.15fr)_minmax(22rem,0.85fr)]">
      <FadeIn className="landing-card landing-card-soft overflow-hidden p-5 sm:p-6">
        <div className="rounded-[1.8rem] bg-[linear-gradient(180deg,#f8fcfc_0%,#eaf4f1_100%)] p-5 sm:p-8">
          {selectedImage ? (
            <div className="relative mx-auto aspect-square max-w-[34rem]">
              <Image
                src={selectedImage}
                alt={product.imageAlt}
                fill
                priority
                className="object-contain"
                sizes="(min-width: 1280px) 42rem, (min-width: 768px) 50vw, 95vw"
              />
            </div>
          ) : (
            <div className="aspect-square rounded-[1.4rem] bg-[linear-gradient(180deg,#eff5f4_0%,#dde9e7_100%)]" />
          )}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {galleryImages.map((galleryImage, index) => (
            <Pressable key={`${product.id}-thumb-${index}`} className="w-full">
              <button
                type="button"
                aria-label={`View image ${index + 1} for ${product.name}`}
                onClick={() => setSelectedImageIndex(index)}
                className={`w-full rounded-[1.2rem] p-3 transition ${
                  selectedImageIndex === index
                    ? "bg-[#eef7f5] shadow-[inset_0_0_0_1px_rgba(24,112,108,0.18)]"
                    : "bg-white shadow-[0_18px_34px_-30px_rgba(28,79,80,0.24)]"
                }`}
              >
                <div className="relative mx-auto aspect-square max-w-[6.5rem]">
                  <Image
                    src={galleryImage}
                    alt={`${product.imageAlt} ${index + 1}`}
                    fill
                    className="object-contain"
                    sizes="8rem"
                  />
                </div>
              </button>
            </Pressable>
          ))}
        </div>
      </FadeIn>

      <FadeIn className="landing-card landing-card-soft p-6 sm:p-8" delay={0.08}>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-700">
          {product.eyebrow ?? categoryName}
        </p>
        <h1 className="mt-4 text-4xl font-semibold leading-tight text-slate-950 sm:text-5xl">
          {product.name}
        </h1>
        <p className="mt-3 text-2xl font-medium text-slate-600">{product.summary}</p>
        <p className="mt-6 text-base leading-8 text-slate-600">{product.description}</p>

        <StaggerGroup className="mt-8 grid gap-3 sm:grid-cols-3" delay={0.06}>
          {productHighlights.slice(0, 3).map((highlight, index) => {
            const Icon = productFeatureIcons[index] ?? ShieldCheck;

            return (
              <StaggerItem key={highlight}>
                <div className="rounded-[1.3rem] bg-white/90 p-4 shadow-[0_20px_42px_-34px_rgba(28,79,80,0.26)]">
                  <div className="landing-icon-tile flex size-10 items-center justify-center bg-teal-50 text-teal-700">
                    <Icon size={17} />
                  </div>
                  <p className="mt-4 text-sm font-semibold leading-7 text-slate-900">
                    {highlight}
                  </p>
                </div>
              </StaggerItem>
            );
          })}
        </StaggerGroup>

        <div className="mt-8 flex flex-wrap items-center gap-4">
          <span className="text-4xl font-semibold text-slate-950">{totalPrice}</span>
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
