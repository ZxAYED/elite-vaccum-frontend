import { ShoppingBag } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/Button";
import { mockProductImagesById } from "@/data/mock/product-images";
import { mockProducts } from "@/data/mock/products";
import { formatCurrencyUsd } from "@/lib/formatters";

export default function StoreSection() {
  return (
    <section className="bg-[#f9f9f9] py-12 md:py-28">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-10 flex flex-col items-center justify-between gap-8 md:flex-row">
          <h2 className="text-3xl font-bold text-primary md:text-4xl">Store</h2>
          <Link
            className="font-semibold text-primary transition-opacity hover:opacity-80"
            href="/contact"
          >
            See all products
          </Link>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-4">
          {mockProducts.map((product) => (
            <div
              className="overflow-hidden rounded-xl border border-border bg-white transition-shadow hover:shadow-lg"
              key={product.name}
            >
              <div className="relative rounded-2xl bg-linear-to-br from-primary/10 to-accent/10">
                <Image
                  alt={product.imageAlt}
                  className="h-80 rounded-2xl object-cover"
                  height={800}
                  src={mockProductImagesById[product.id]}
                  width={800}
                />
              </div>

              <div className="p-4">
                <h3 className="mb-3 font-semibold">{product.name}</h3>
                <p className="mb-1 text-sm text-muted-foreground">
                  {product.summary}
                </p>
                <div className="py-2 text-lg font-bold text-black">
                  {formatCurrencyUsd(product.priceUsd)}
                </div>

                <Button className="w-full text-lg">
                  <ShoppingBag aria-hidden="true" /> Buy Now
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
