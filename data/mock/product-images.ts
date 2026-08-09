import type { StaticImageData } from "next/image";

import { mockProducts } from "@/data/mock/products";
import productImage from "@/public/product.png";
import carpetVacuum from "@/public/landing/service/products/canister.jpg";
import cordlessVacuum from "@/public/landing/service/products/cordless.jpg";
import vacuumHandTool from "@/public/landing/service/products/vacume.jpg";

export const mockProductImagesById: Record<string, StaticImageData> =
  Object.fromEntries(
    mockProducts.map((product) => [product.id, productImage]),
  ) as Record<string, StaticImageData>;

const sharedGalleryImages = [
  productImage,
  vacuumHandTool,
  carpetVacuum,
  cordlessVacuum,
] as const;

export const mockProductGalleryImagesById: Record<string, StaticImageData[]> =
  Object.fromEntries(
    mockProducts.map((product, index) => {
      const rotation = [
        sharedGalleryImages[index % sharedGalleryImages.length],
        sharedGalleryImages[(index + 1) % sharedGalleryImages.length],
        sharedGalleryImages[(index + 2) % sharedGalleryImages.length],
        sharedGalleryImages[(index + 3) % sharedGalleryImages.length],
      ];

      return [product.id, rotation];
    }),
  ) as Record<string, StaticImageData[]>;

export { sharedGalleryImages };
