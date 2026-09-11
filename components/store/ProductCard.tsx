"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import { ArrowRight, ShoppingCart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  CarouselIndicators,
} from "@/components/ui/Carousel";
import { formatCurrencyUsd } from "@/lib/formatters";
import { resolveProductImages } from "@/lib/product-images";
import { toast } from "sonner";
import { getCookie } from "@/lib/cookies";
import { AUTH_TOKEN_KEY } from "@/redux/constants";
import { useAppSelector } from "@/redux/hooks";
import { useCartSync } from "@/hooks/useCartSync";
import type { Product } from "@/types/domain";

interface ProductCardProps {
  product: Product;
  priority?: boolean;
}

const SPRING = { type: "spring", stiffness: 320, damping: 28 } as const;

// Hover state is declared once on the card and propagated to every child
// motion element through Framer Motion's variant context.
const cardVariants: Variants = {
  rest: {
    boxShadow: "0 1px 2px 0 rgba(15, 23, 42, 0.04)",
  },
  hover: {
    boxShadow: "0 18px 40px -24px rgba(19, 78, 74, 0.35)",
  },
};

const mediaVariants: Variants = {
  rest: { scale: 1 },
  hover: { scale: 1.06 },
};

const controlsVariants: Variants = {
  rest: { opacity: 0 },
  hover: { opacity: 1 },
};

const arrowVariants: Variants = {
  rest: { x: 0 },
  hover: { x: 3 },
};

export function ProductCard({ product, priority = false }: ProductCardProps) {
  const router = useRouter();
  const { addProduct } = useCartSync();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const prefersReducedMotion = useReducedMotion();

  const images = resolveProductImages(product);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const token = getCookie(AUTH_TOKEN_KEY);

    if (!isAuthenticated && !token) {
      router.push(`/auth/login?redirect=${encodeURIComponent("/store")}`);
      return;
    }

    await addProduct(product, 1);
    toast.success("Added to cart", {
      description: `${product.name} has been added to your cart.`,
    });
  };

  const isSpecialOrder = product.availability === "special-order";
  const productPath = product.sku || product.slug || product.id;
  const productDetailHref = `/store/${encodeURIComponent(productPath)}`;

  return (
    <div className="h-full">
      <motion.article
        variants={cardVariants}
        initial="rest"
        animate="rest"
        whileHover="hover"
        whileFocus="hover"
        transition={SPRING}
        className="group flex h-full flex-col overflow-hidden rounded-2xl bg-white p-3 sm:p-3.5"
      >
        {/* Media Frame with Carousel */}
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-slate-100/70">
          {images.length > 0 ? (
            <Carousel
              autoPlay
              interval={4200}
              transitionDuration={750}
              loop
              totalSlides={images.length}
              className="relative h-full w-full"
            >
              <CarouselContent className="h-full">
                {images.map((img, idx) => (
                  <CarouselItem key={idx} className="h-full">
                    <Link
                      aria-label={`View ${product.name}`}
                      href={productDetailHref}
                      className="relative block h-full w-full overflow-hidden"
                    >
                      <motion.div
                        variants={prefersReducedMotion ? undefined : mediaVariants}
                        transition={{ duration: 0.6, ease: [0.22, 0.61, 0.36, 1] }}
                        className="relative h-full w-full will-change-transform"
                      >
                        <Image
                          src={img}
                          alt={`${product.imageAlt || product.name} ${idx + 1}`}
                          fill
                          priority={priority && idx === 0}
                          className="object-cover"
                          sizes="(min-width: 1280px) 22rem, (min-width: 768px) 45vw, 95vw"
                        />
                      </motion.div>
                    </Link>
                  </CarouselItem>
                ))}
              </CarouselContent>

              {images.length > 1 && (
                <>
                  <motion.div
                    variants={controlsVariants}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="pointer-events-none absolute inset-0 z-10"
                  >
                    <CarouselPrevious className="left-2 size-7 sm:size-8" />
                    <CarouselNext className="right-2 size-7 sm:size-8" />
                  </motion.div>
                  <CarouselIndicators className="bottom-2" />
                </>
              )}
            </Carousel>
          ) : (
            <Link
              aria-label={`View ${product.name}`}
              href={productDetailHref}
              className="flex h-full w-full items-center justify-center bg-slate-50 text-slate-300"
            >
              <span className="text-xs font-medium uppercase tracking-wider">No Image</span>
            </Link>
          )}

          {/* Status Badges Overlay */}
          <div className="pointer-events-none absolute top-2.5 left-2.5 z-20 flex flex-wrap gap-1.5">
            {product.isFeatured && (
              <span className="inline-flex items-center rounded-md bg-teal-600 px-2 py-0.5 text-[11px] font-semibold text-white shadow-xs">
                Featured
              </span>
            )}
            {isSpecialOrder && (
              <span className="inline-flex items-center rounded-md bg-amber-500/90 px-2 py-0.5 text-[11px] font-semibold text-white shadow-xs">
                Special order
              </span>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="mt-3.5 flex flex-1 flex-col justify-between">
          <div>
            <Link href={productDetailHref} className="group/title block">
              <h2 className="line-clamp-2 text-base font-semibold leading-snug text-slate-900 transition-colors duration-150 group-hover/title:text-teal-700 sm:text-lg">
                {product.name}
              </h2>
            </Link>
          </div>

          {/* Price & Action Bar */}
          <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
            <div>
              <p className="text-[11px] font-medium text-slate-400">Price</p>
              <p className="text-xl font-bold tracking-tight text-teal-900 sm:text-2xl">
                {formatCurrencyUsd(product.priceUsd)}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                aria-label={`Add ${product.name} to cart`}
                onClick={handleAddToCart}
                size="icon-sm"
                variant="soft"
                type="button"
                className="size-9 rounded-xl border border-teal-200/80 bg-teal-50 text-teal-800 hover:bg-teal-600 hover:text-white"
              >
                <ShoppingCart size={16} data-icon="inline-start" />
              </Button>

              <Button
                asChild
                size="sm"
                variant="ghost"
                className="gap-1.5 rounded-xl border border-transparent bg-slate-50 px-3 text-xs font-semibold text-teal-800 hover:border-teal-200 hover:bg-teal-50/80 sm:text-sm"
              >
                <Link href={productDetailHref}>
                  <span>Details</span>
                  <motion.span
                    variants={prefersReducedMotion ? undefined : arrowVariants}
                    transition={SPRING}
                    className="inline-flex"
                  >
                    <ArrowRight size={14} data-icon="inline-end" />
                  </motion.span>
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </motion.article>
    </div>
  );
}
