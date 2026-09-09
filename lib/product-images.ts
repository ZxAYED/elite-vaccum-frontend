import type { Product } from "@/types/domain";

type ProductImageInput = Pick<Product, "id"> &
  Partial<Product> & { primaryImageUrl?: string | null };

/**
 * Products reach the UI from several boundaries (`GET /products`,
 * `GET /products/:id`, `GET /store/cart`) and each one carries images
 * differently: an `images[]` of objects with `url`/`isPrimary`, an `images[]` of
 * bare strings, or a single flattened `primaryImageUrl`. Resolve them in one
 * place so every surface renders the same artwork for a product.
 *
 * Returns an empty array when a product genuinely has no image — callers are
 * expected to render an empty state rather than a stand-in asset.
 */
export function resolveProductImages(product: ProductImageInput): string[] {
  const entries = (product.images ?? [])
    .map((image, index) =>
      typeof image === "string"
        ? { url: image, isPrimary: false, sortOrder: index }
        : {
            url: image?.url ?? "",
            isPrimary: Boolean(image?.isPrimary),
            sortOrder: image?.sortOrder ?? index,
          },
    )
    .filter((entry) => entry.url.trim().length > 0);

  // Primary image first, then declared sort order.
  entries.sort((a, b) => {
    if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1;
    return a.sortOrder - b.sortOrder;
  });

  const urls = entries.map((entry) => entry.url);

  const primary = product.primaryImageUrl?.trim();
  if (primary) urls.unshift(primary);

  return Array.from(new Set(urls));
}

/** First resolvable image for a product, or `null` when it has none. */
export function resolveProductImage(product: ProductImageInput): string | null {
  return resolveProductImages(product)[0] ?? null;
}
