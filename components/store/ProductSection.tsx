import { FadeIn, StaggerGroup, StaggerItem } from "@/components/motion/Animated";
import type { Product } from "@/types/domain";

import { Pagination } from "./Pagination";
import { ProductCard } from "./ProductCard";
import { StoreSortSelect } from "./StoreSortSelect";

interface ProductSectionProps {
  title: string;
  products: Product[];
  sortValue: string;
  currentPage: number;
  pageSize: number;
  onSortChange: (value: string) => void;
  onPageChange: (page: number) => void;
  delay?: number;
}

export function ProductSection({
  title,
  products,
  sortValue,
  currentPage,
  pageSize,
  onSortChange,
  onPageChange,
  delay = 0,
}: ProductSectionProps) {
  const startIndex = (currentPage - 1) * pageSize;
  const visibleProducts = products.slice(startIndex, startIndex + pageSize);

  if (products.length === 0) {
    return null;
  }

  return (
    <section className="mt-10 first:mt-0">
      <FadeIn
        className="flex flex-col gap-4 border-b border-teal-100/90 pb-5 md:flex-row md:items-center md:justify-between"
        delay={delay}
      >
        <div>
          <h2 className="text-3xl font-semibold uppercase tracking-[0.24em] text-[#0f6766]">
            {title}
          </h2>
        </div>

        <div className="flex items-center text-sm">
          <StoreSortSelect value={sortValue} onValueChange={onSortChange} />
        </div>
      </FadeIn>

      <StaggerGroup
        className="mt-6 grid auto-rows-fr gap-5 md:grid-cols-2 xl:grid-cols-3"
        delay={delay + 0.04}
      >
        {visibleProducts.map((product, index) => (
          <StaggerItem key={product.id}>
            <ProductCard product={product} priority={index < 3} />
          </StaggerItem>
        ))}
      </StaggerGroup>

      <Pagination
        currentPage={currentPage}
        totalItems={products.length}
        pageSize={pageSize}
        onPageChange={onPageChange}
      />
    </section>
  );
}
