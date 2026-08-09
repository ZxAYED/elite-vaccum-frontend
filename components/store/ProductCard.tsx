import { ArrowRight, ShoppingCart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Pressable } from "@/components/motion/Animated";
import { Button } from "@/components/ui/Button";
import { mockProductImagesById } from "@/data/mock/product-images";
import { formatCurrencyUsd } from "@/lib/formatters";
import type { Product } from "@/types/domain";

interface ProductCardProps {
  product: Product;
  priority?: boolean;
}

export function ProductCard({ product, priority = false }: ProductCardProps) {
  const productImage = mockProductImagesById[product.id];

  return (
    <article className="landing-card landing-card-soft flex h-full flex-col overflow-hidden p-4">
      <Pressable className="w-full">
        <Link
          aria-label={`View ${product.name}`}
          className="block w-full rounded-[1rem] bg-white p-4 shadow-[inset_0_0_0_1px_rgba(215,225,228,0.72)]"
          href={`/store/${product.slug}`}
        >
          {productImage ? (
            <div className="relative mx-auto aspect-square w-full max-w-[15rem]">
              <Image
                src={productImage}
                alt={product.imageAlt}
                fill
                priority={priority}
                className="object-contain"
                sizes="(min-width: 1280px) 18rem, (min-width: 768px) 30vw, 90vw"
              />
            </div>
          ) : (
            <div className="aspect-[4/3] rounded-[1.15rem] bg-[linear-gradient(180deg,#eff5f4_0%,#dde9e7_100%)]" />
          )}
        </Link>
      </Pressable>

      <div className="mt-5 flex h-full flex-col">
        <Pressable className="w-fit">
          <Link href={`/store/${product.slug}`}>
            <h2 className="text-xl font-semibold leading-tight text-primary transition hover:text-teal-800">
              {product.name}
            </h2>
          </Link>
        </Pressable>
        <p className="mt-2 min-h-5 text-sm text-slate-500">{product.summary}</p>

        <div className="mt-7 flex items-end justify-between gap-4">
          <div>
            <p className="text-xl font-semibold text-[#0f5255]">
              {formatCurrencyUsd(product.priceUsd)}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Pressable>
              <Button asChild size="icon-sm" variant="soft">
                <Link aria-label={`Add ${product.name} to cart`} href="/cart">
                  <ShoppingCart size={16} data-icon="inline-start" />
                </Link>
              </Button>
            </Pressable>
            <Pressable className="w-fit">
              <Link
                className="inline-flex items-center gap-2 text-sm font-semibold text-teal-700 transition hover:text-teal-800"
                href={`/store/${product.slug}`}
              >
                View details
                <ArrowRight size={15} data-icon="inline-end" />
              </Link>
            </Pressable>
          </div>
        </div>
      </div>
    </article>
  );
}
