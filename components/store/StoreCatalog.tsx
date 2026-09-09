"use client";

import { Search, SlidersHorizontal, X } from "lucide-react";
import { useDeferredValue, useMemo, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/RadioGroup";
import { cn } from "@/lib/utils";
import type { Product, ProductAvailability } from "@/types/domain";

import { useGetCategoriesQuery } from "@/redux/api/categoriesApi";
import { useGetProductsQuery, type GetProductsParams } from "@/redux/api/productsApi";

import { ProductSection } from "./ProductSection";

const PAGE_SIZE = 20;

const priceRanges = [
  { value: "all", label: "All prices", min: 0, max: Number.POSITIVE_INFINITY },
  { value: "under-500", label: "Under $500", min: 0, max: 499.99 },
  { value: "500-1000", label: "$500 - $1,000", min: 500, max: 1000 },
  { value: "1000-plus", label: "$1,000+", min: 1000.01, max: Number.POSITIVE_INFINITY },
] as const;

const availabilityOptions = [
  { value: "all", label: "All" },
  { value: "in-stock", label: "In stock" },
  { value: "special-order", label: "Special order" },
] as const;

type SortValue = "popularity" | "price-low-high" | "price-high-low" | "newest";
type AvailabilityFilter = "all" | ProductAvailability;

function normalizeSearch(value: string) {
  return value.trim().toLowerCase();
}

function sortProducts(products: Product[], sortValue: string) {
  const sortedProducts = [...products];

  switch (sortValue as SortValue) {
    case "price-low-high":
      return sortedProducts.sort((left, right) => left.priceUsd - right.priceUsd);
    case "price-high-low":
      return sortedProducts.sort((left, right) => right.priceUsd - left.priceUsd);
    case "newest":
      return sortedProducts.sort(
        (left, right) =>
          new Date(right.addedAt ?? "1970-01-01").getTime() -
          new Date(left.addedAt ?? "1970-01-01").getTime(),
      );
    case "popularity":
    default:
      return sortedProducts.sort(
        (left, right) =>
          (left.popularityRank ?? Number.MAX_SAFE_INTEGER) -
          (right.popularityRank ?? Number.MAX_SAFE_INTEGER),
      );
  }
}

function FilterOption({
  id,
  value,
  label,
  count,
}: {
  id: string;
  value: string;
  label: string;
  count?: number;
}) {
  return (
    <label
      htmlFor={id}
      className="flex items-center justify-between gap-3 rounded-[0.9rem] px-1 py-1 text-sm text-slate-600 transition hover:text-primary cursor-pointer"
    >
      <span className="flex min-w-0 items-center gap-3">
        <RadioGroupItem id={id} value={value} />
        <span className="truncate">{label}</span>
      </span>
      {typeof count === "number" ? (
        <span className="shrink-0 text-slate-400">{count}</span>
      ) : null}
    </label>
  );
}

interface CatalogCategoryItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  productCount?: number;
}

export function StoreCatalog() {
  const [query, setQuery] = useState("");
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState("all");
  const [availability, setAvailability] = useState<AvailabilityFilter>("all");
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [productSort, setProductSort] = useState<SortValue>("popularity");
  const [productPage, setProductPage] = useState(1);
  const deferredQuery = useDeferredValue(query);

  // Categories come from `GET /categories` (Phase 2.1) only.
  const { data: categoriesData } = useGetCategoriesQuery({ status: "ACTIVE" });
  const categoryApiItems = categoriesData?.items;

  const categoriesList: CatalogCategoryItem[] = useMemo(
    () =>
      (categoryApiItems ?? []).map((cat) => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug || cat.id,
        description: cat.description || "",
        productCount: (cat as { productCount?: number }).productCount,
      })),
    [categoryApiItems],
  );

  // If exactly 1 category is selected, pass it to API parameters
  const singleSelectedCat =
    selectedCategoryIds.length === 1
      ? categoriesList.find(
          (c) => c.id === selectedCategoryIds[0] || c.slug === selectedCategoryIds[0],
        )
      : undefined;

  const sortParam: GetProductsParams["sortBy"] =
    productSort === "price-low-high"
      ? "price_asc"
      : productSort === "price-high-low"
      ? "price_desc"
      : productSort === "newest"
      ? "newest"
      : "popularity";

  const selectedPriceObj = priceRanges.find((r) => r.value === priceRange);
  const minPriceParam =
    priceRange !== "all" && selectedPriceObj && selectedPriceObj.min > 0
      ? selectedPriceObj.min
      : undefined;
  const maxPriceParam =
    priceRange !== "all" && selectedPriceObj && Number.isFinite(selectedPriceObj.max)
      ? selectedPriceObj.max
      : undefined;

  const {
    data: apiProductsData,
    isLoading: isLoadingProducts,
    isError: isProductsError,
  } = useGetProductsQuery({
    page: 1,
    limit: 100,
    search: deferredQuery.trim() || undefined,
    category: singleSelectedCat?.slug,
    categoryId: singleSelectedCat?.id,
    categorySlug: singleSelectedCat?.slug,
    status: "ACTIVE",
    availability: availability !== "all" ? availability : undefined,
    priceRange: priceRange !== "all" ? priceRange : undefined,
    minPrice: minPriceParam,
    maxPrice: maxPriceParam,
    sort: productSort,
    sortBy: sortParam,
    sortOrder: productSort === "price-high-low" ? "desc" : "asc",
    isFeatured: featuredOnly ? true : undefined,
  });
  // Products come from `GET /products` (Phase 3.1) only.
  const activeProducts = useMemo(
    () => apiProductsData?.items ?? [],
    [apiProductsData?.items],
  );

  const categoryCounts = useMemo(() => {
    return categoriesList.map((category) => {
      const targetValues = [category.id, category.slug].filter(Boolean);
      const count = activeProducts.filter((product) => {
        const p = product as Product & {
          category?: { id?: string; slug?: string };
          categorySlug?: string;
        };
        return (
          (p.categoryId && targetValues.includes(p.categoryId)) ||
          (p.category?.id && targetValues.includes(p.category.id)) ||
          (p.category?.slug && targetValues.includes(p.category.slug)) ||
          (p.categorySlug && targetValues.includes(p.categorySlug))
        );
      }).length;

      return {
        ...category,
        count,
      };
    });
  }, [activeProducts, categoriesList]);

  const priceCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: activeProducts.length,
      "under-500": 0,
      "500-1000": 0,
      "1000-plus": 0,
    };
    for (const product of activeProducts) {
      const p = product as Product;
      const price = typeof p.priceUsd === "number" ? p.priceUsd : Number(p.priceUsd) || 0;
      if (price < 500) counts["under-500"]++;
      if (price >= 500 && price <= 1000) counts["500-1000"]++;
      if (price > 1000) counts["1000-plus"]++;
    }
    return counts;
  }, [activeProducts]);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = normalizeSearch(deferredQuery);
    const selectedPriceRange =
      priceRanges.find((range) => range.value === priceRange) ?? priceRanges[0];

    return activeProducts.filter((product) => {
      const p = product as Product & {
        category?: { id?: string; slug?: string };
        categorySlug?: string;
      };
      const matchesQuery =
        normalizedQuery.length === 0 ||
        [p.name, p.summary, p.description, p.eyebrow]
          .filter(Boolean)
          .some((value) => value?.toLowerCase().includes(normalizedQuery));

      const matchesCategory =
        selectedCategoryIds.length === 0 ||
        selectedCategoryIds.some((selectedId) => {
          const matchedCat = categoriesList.find(
            (c) => c.id === selectedId || c.slug === selectedId,
          );
          const targetValues = [selectedId, matchedCat?.id, matchedCat?.slug].filter(Boolean);
          return (
            (p.categoryId && targetValues.includes(p.categoryId)) ||
            (p.category?.id && targetValues.includes(p.category.id)) ||
            (p.category?.slug && targetValues.includes(p.category.slug)) ||
            (p.categorySlug && targetValues.includes(p.categorySlug))
          );
        });

      const price =
        typeof p.priceUsd === "number"
          ? p.priceUsd
          : Number(p.priceUsd) || 0;
      const matchesPrice =
        price >= selectedPriceRange.min && price <= selectedPriceRange.max;

      const matchesAvailability =
        availability === "all" || p.availability === availability;

      const matchesFeatured = !featuredOnly || Boolean(p.isFeatured);

      return (
        matchesQuery &&
        matchesCategory &&
        matchesPrice &&
        matchesAvailability &&
        matchesFeatured
      );
    });
  }, [activeProducts, availability, categoriesList, deferredQuery, featuredOnly, priceRange, selectedCategoryIds]);

  const productItems = useMemo(
    () => sortProducts(filteredProducts, productSort),
    [filteredProducts, productSort],
  );

  const resetPages = () => {
    setProductPage(1);
  };

  const toggleCategory = (catId: string) => {
    setSelectedCategoryIds((prev) => {
      if (prev.includes(catId)) {
        return prev.filter((id) => id !== catId);
      }
      return [...prev, catId];
    });
    resetPages();
  };

  const hasActiveFilters =
    query.length > 0 ||
    selectedCategoryIds.length > 0 ||
    priceRange !== "all" ||
    availability !== "all" ||
    featuredOnly;

  const clearAllFilters = () => {
    setQuery("");
    setSelectedCategoryIds([]);
    setPriceRange("all");
    setAvailability("all");
    setFeaturedOnly(false);
    resetPages();
  };

  const handleQueryChange = (nextQuery: string) => {
    setQuery(nextQuery);
    resetPages();
  };

  const currentCategoryTitle =
    selectedCategoryIds.length === 0
      ? "Products"
      : selectedCategoryIds.length === 1
      ? singleSelectedCat?.name || "Products"
      : `${selectedCategoryIds.length} Categories Selected`;

  return (
    <div className="mt-8 grid gap-8 xl:grid-cols-[18rem_minmax(0,1fr)]">
      <div className="self-start">
        <section className="landing-card landing-card-soft p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-teal-700">
              <SlidersHorizontal size={16} />
              Filter by
            </div>
            {hasActiveFilters ? (
              <button
                type="button"
                onClick={clearAllFilters}
                className="text-xs font-semibold text-teal-700 hover:text-primary cursor-pointer"
              >
                Reset all
              </button>
            ) : null}
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-900">Quick search</p>
              {query ? (
                <button
                  type="button"
                  onClick={() => handleQueryChange("")}
                  className="text-xs font-medium text-teal-700 hover:text-primary cursor-pointer"
                >
                  Clear
                </button>
              ) : null}
            </div>
            <div className="mt-3 flex items-center gap-3 rounded-[1rem] border border-teal-100 bg-white px-4 py-3">
              <Search size={16} className="text-slate-400" />
              <Input
                type="text"
                value={query}
                onChange={(event) => handleQueryChange(event.target.value)}
                placeholder="Model or part number..."
                className="h-auto rounded-none border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => handleQueryChange("")}
                  aria-label="Clear search"
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X size={14} />
                </button>
              ) : null}
            </div>
          </div>

          {/* Multiple Category Filter */}
          <div className="mt-6 border-t border-teal-100 pt-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-900">Categories</p>
              {selectedCategoryIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategoryIds([]);
                    resetPages();
                  }}
                  className="text-xs font-semibold text-teal-700 hover:text-primary cursor-pointer"
                >
                  Clear ({selectedCategoryIds.length})
                </button>
              )}
            </div>

            <div className="mt-3 space-y-1">
              <label
                htmlFor="category-all"
                className="flex items-center justify-between gap-3 rounded-[0.9rem] px-2 py-1.5 text-sm text-slate-700 transition hover:bg-teal-50/60 hover:text-teal-900 cursor-pointer"
              >
                <span className="flex min-w-0 items-center gap-2.5">
                  <input
                    id="category-all"
                    type="checkbox"
                    checked={selectedCategoryIds.length === 0}
                    onChange={() => {
                      setSelectedCategoryIds([]);
                      resetPages();
                    }}
                    className="size-4 rounded border-teal-300 text-teal-700 focus:ring-teal-500 cursor-pointer accent-teal-700"
                  />
                  <span className={cn("truncate", selectedCategoryIds.length === 0 && "font-semibold text-teal-950")}>
                    All categories
                  </span>
                </span>
                <span className="shrink-0 text-xs font-medium text-slate-400">
                  {activeProducts.length}
                </span>
              </label>

              {categoryCounts.map((category) => {
                const isSelected =
                  selectedCategoryIds.includes(category.id) ||
                  (Boolean(category.slug) && selectedCategoryIds.includes(category.slug));

                return (
                  <label
                    key={category.id}
                    htmlFor={`category-${category.id}`}
                    className="flex items-center justify-between gap-3 rounded-[0.9rem] px-2 py-1.5 text-sm text-slate-700 transition hover:bg-teal-50/60 hover:text-teal-900 cursor-pointer"
                  >
                    <span className="flex min-w-0 items-center gap-2.5">
                      <input
                        id={`category-${category.id}`}
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleCategory(category.id)}
                        className="size-4 rounded border-teal-300 text-teal-700 focus:ring-teal-500 cursor-pointer accent-teal-700"
                      />
                      <span className={cn("truncate", isSelected && "font-semibold text-teal-950")}>
                        {category.name}
                      </span>
                    </span>
                    <span className="shrink-0 text-xs font-medium text-slate-400">
                      {category.count}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Price Range Filter */}
          <div className="mt-6 border-t border-teal-100 pt-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-900">Price ranges</p>
              {priceRange !== "all" && (
                <button
                  type="button"
                  onClick={() => {
                    setPriceRange("all");
                    resetPages();
                  }}
                  className="text-xs font-semibold text-teal-700 hover:text-primary cursor-pointer"
                >
                  Reset
                </button>
              )}
            </div>
            <RadioGroup
              className="mt-3 space-y-1"
              value={priceRange}
              onValueChange={(value) => {
                setPriceRange(value);
                resetPages();
              }}
            >
              {priceRanges.map((range) => (
                <FilterOption
                  key={range.value}
                  id={`price-${range.value}`}
                  value={range.value}
                  label={range.label}
                  count={priceCounts[range.value]}
                />
              ))}
            </RadioGroup>
          </div>

          <div className="mt-6 border-t border-teal-100 pt-6">
            <p className="text-sm font-semibold text-slate-900">Featured items</p>
            <div className="mt-3 flex items-center justify-between rounded-[0.9rem] px-1 py-1">
              <label
                htmlFor="filter-featured-only"
                className="text-sm text-slate-600 hover:text-primary cursor-pointer"
              >
                Featured only
              </label>
              <input
                id="filter-featured-only"
                type="checkbox"
                checked={featuredOnly}
                onChange={(e) => {
                  setFeaturedOnly(e.target.checked);
                  resetPages();
                }}
                className="size-4 rounded border-teal-300 text-teal-600 focus:ring-teal-500 cursor-pointer accent-teal-700"
              />
            </div>
          </div>

          <div className="mt-6 border-t border-teal-100 pt-6">
            <p className="text-sm font-semibold text-slate-900">Availability</p>
            <RadioGroup
              className="mt-3"
              value={availability}
              onValueChange={(value) => {
                setAvailability(value as AvailabilityFilter);
                resetPages();
              }}
            >
              {availabilityOptions.map((option) => (
                <FilterOption
                  key={option.value}
                  id={`availability-${option.value}`}
                  value={option.value}
                  label={option.label}
                />
              ))}
            </RadioGroup>
          </div>

          {/* Clear Filter Button at Bottom */}
          <div className="mt-6 border-t border-teal-100 pt-5">
            <Button
              type="button"
              variant="outline"
              onClick={clearAllFilters}
              disabled={!hasActiveFilters}
              className="w-full justify-center rounded-xl border border-teal-200/90 bg-white font-semibold text-teal-800 shadow-xs hover:border-teal-300 hover:bg-teal-50/80 hover:text-teal-900 disabled:opacity-40"
            >
              Clear filters
            </Button>
          </div>
        </section>
      </div>

      <div>
        <ProductSection
          title={currentCategoryTitle}
          products={productItems}
          sortValue={productSort}
          currentPage={productPage}
          pageSize={PAGE_SIZE}
          onSortChange={(value) => {
            setProductSort(value as SortValue);
            setProductPage(1);
          }}
          onPageChange={setProductPage}
        />

        {isLoadingProducts ? (
          <div
            className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-3"
            aria-busy
          >
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-80 animate-pulse rounded-2xl bg-slate-100/80"
              />
            ))}
            <span className="sr-only">Loading products</span>
          </div>
        ) : isProductsError ? (
          <div className="landing-card landing-card-soft mt-10 p-8 text-center">
            <p className="text-lg font-semibold text-slate-950">
              We couldn&apos;t load the store
            </p>
            <p className="mt-2 text-sm text-slate-500">
              The product catalog is temporarily unavailable. Please try again in a
              moment.
            </p>
          </div>
        ) : productItems.length === 0 ? (
          <div className="landing-card landing-card-soft mt-10 p-8 text-center">
            <p className="text-lg font-semibold text-slate-950">No matching products</p>
            <p className="mt-2 text-sm text-slate-500">
              {hasActiveFilters
                ? "Adjust the filters or search query to see more Elite store items."
                : "No products are published in the store yet. Please check back soon."}
            </p>
            {hasActiveFilters ? (
              <div className="mt-5">
                <Button
                  type="button"
                  size="pill"
                  variant="outline"
                  onClick={clearAllFilters}
                >
                  Clear all filters
                </Button>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
