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
}: ProductSectionProps) {
  const startIndex = (currentPage - 1) * pageSize;
  const visibleProducts = products.slice(startIndex, startIndex + pageSize);

  if (products.length === 0) {
    return null;
  }

  return (
    <section className="mt-10 first:mt-0">
      <div className="flex flex-col gap-4 border-b border-teal-100/90 pb-5 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-semibold uppercase tracking-[0.24em] text-[#0f6766]">
            {title}
          </h2>
        </div>

        <div className="flex items-center text-sm">
          <StoreSortSelect value={sortValue} onValueChange={onSortChange} />
        </div>
      </div>

      <div className="mt-6 grid auto-rows-fr gap-5 md:grid-cols-2 xl:grid-cols-3">
        {visibleProducts.map((product, index) => (
          <div key={product.id} className="h-full">
            <ProductCard product={product} priority={index < 3} />
          </div>
        ))}
      </div>

      <Pagination
        currentPage={currentPage}
        totalItems={products.length}
        pageSize={pageSize}
        onPageChange={onPageChange}
      />
    </section>
  );
}
