import Image from "next/image";

import {
  FadeIn,
} from "@/components/motion/Animated";
import { StoreCatalog } from "@/components/store/StoreCatalog";
import { mockProducts } from "@/data/mock/products";
import img from "../../../public/store.png";
export const metadata = {
  title: "Store - Elite Central Vacuum",
  description:
    "Shop central vacuum accessories, replacement parts, and portable support tools.",
};

export default function StorePage() {
  const featuredProduct =
    mockProducts.find((product) => product.id === "prd-canister") ??
    mockProducts[0];

  return (
    <main className="bg-[#f7fbfa] pb-20 pt-8 sm:pt-10">
      <div className="mx-auto max-w-360 px-4">
        <FadeIn>
          <section className="overflow-hidden rounded-[calc(var(--radius-card)+0.25rem)]  bg-[radial-gradient(circle_at_top_left,rgba(14,165,183,0.12),transparent_40%),linear-gradient(180deg,#f9fdfc_0%,#edf7f4_100%)] px-6 py-2 lg:px-10">
            <div className="grid  items-center gap-10 lg:grid-cols-[minmax(0,1.1fr)_22rem] xl:grid-cols-[minmax(0,1.05fr)_24rem]">
              <div className="lg:max-w-xl">
                <p className="text-sm text-slate-500">Home &gt; Store</p>
                <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight text-[#0f5255] sm:text-5xl">
                  Shop central vacuum products for cleaner, quieter home care.
                </h1>
              </div>

              <div className="overflow-hidden ">
                <div className="">
                  <div className="relative mx-auto aspect-[1/1] max-w-[18rem]">
                    <Image
                      src={img}
                      alt={featuredProduct.imageAlt}
                      fill
                      priority
                      className="object-contain"
                      sizes="(min-width: 1280px) 24rem, (min-width: 1024px) 20rem, 70vw"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>
        </FadeIn>

        <StoreCatalog products={mockProducts} />
      </div>
    </main>
  );
}
