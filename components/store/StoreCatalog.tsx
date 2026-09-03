"use client";

import { Search, SlidersHorizontal, X } from "lucide-react";
import { useDeferredValue, useMemo, useState } from "react";

import { FadeIn } from "@/components/motion/Animated";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/RadioGroup";
import { mockProductCategories } from "@/data/mock/products";
import { cn } from "@/lib/utils";
import type { Product, ProductAvailability } from "@/types/domain";

import { useGetCategoriesQuery } from "@/redux/api/categoriesApi";
import { useGetProductsQuery, type GetProductsParams } from "@/redux/api/productsApi";

import { ProductSection } from "./ProductSection";

const PAGE_SIZE = 10;
const PRODUCT_CATEGORY_ID = "cat-units";

const priceRanges = [
  { value: "all", label: "All prices", min: 0, max: Number.POSITIVE_INFINITY },
  { value: "under-50", label: "Under $50", min: 0, max: 49.99 },
  { value: "50-150", label: "$50-$150", min: 50, max: 150 },
  { value: "150-300", label: "$150-$300", min: 150, max: 300 },
  { value: "300-plus", label: "$300+", min: 300.01, max: Number.POSITIVE_INFINITY },
] as const;

const availabilityOptions = [
  { value: "all", label: "All" },
  { value: "in-stock", label: "In stock" },
  { value: "special-order", label: "Special order" },
] as const;

type SortValue = "popularity" | "price-low-high" | "price-high-low" | "newest";
type AvailabilityFilter = "all" | ProductAvailability;

interface StoreCatalogProps {
  products: Product[];
}

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

export function StoreCatalog({ products }: StoreCatalogProps) {
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState("all");
  const [priceRange, setPriceRange] = useState("all");
  const [availability, setAvailability] = useState<AvailabilityFilter>("all");
  const [productSort, setProductSort] = useState<SortValue>("popularity");
  const [accessorySort, setAccessorySort] = useState<SortValue>("popularity");
  const [productPage, setProductPage] = useState(1);
  const [accessoryPage, setAccessoryPage] = useState(1);
  const deferredQuery = useDeferredValue(query);

  // 1. Fetch categories dynamically from API with fallback to mockProductCategories
  const { data: categoriesData } = useGetCategoriesQuery({ status: "ACTIVE" });
  const categoryApiItems = categoriesData?.items;

  const categoriesList: CatalogCategoryItem[] = useMemo(() => {
    if (categoryApiItems && categoryApiItems.length > 0) {
      return categoryApiItems.map((cat) => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug || cat.id,
        description: cat.description || "",
        productCount: (cat as { productCount?: number }).productCount,
      }));
    }
    return mockProductCategories;
  }, [categoryApiItems]);

  // 2. Fetch products dynamically from API with parameters
  const selectedCategoryObj = categoriesList.find(
    (c) => c.id === categoryId || c.slug === categoryId,
  );
  const categoryParam =
    categoryId === "all"
      ? undefined
      : selectedCategoryObj?.slug || selectedCategoryObj?.id || categoryId;

  const sortParam: GetProductsParams["sortBy"] =
    productSort === "price-low-high"
      ? "price_asc"
      : productSort === "price-high-low"
      ? "price_desc"
      : productSort === "newest"
      ? "newest"
      : "popularity";

  const { data: apiProductsData } = useGetProductsQuery({
    category: categoryParam,
    search: deferredQuery.trim() || undefined,
    sortBy: sortParam,
    status: "ACTIVE",
  });
  const productApiItems = apiProductsData?.items;

  // Blend API products with fallback mock products
  const activeProducts = useMemo(() => {
    if (productApiItems && productApiItems.length > 0) {
      return productApiItems;
    }
    return products;
  }, [productApiItems, products]);

  const categoryCounts = useMemo(() => {
    return categoriesList.map((category) => {
      const count =
        typeof category.productCount === "number" && category.productCount > 0
          ? category.productCount
          : products.filter((product) => {
              const p = product as Product & {
                category?: { id?: string; slug?: string };
                categorySlug?: string;
              };
              return (
                p.categoryId === category.id ||
                p.category?.id === category.id ||
                p.category?.slug === category.slug ||
                p.categorySlug === category.slug
              );
            }).length;

      return {
        ...category,
        count,
      };
    });
  }, [categoriesList, products]);

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
        categoryId === "all" ||
        p.categoryId === categoryId ||
        p.category?.id === categoryId ||
        p.category?.slug === categoryId ||
        p.categorySlug === categoryId;

      const price =
        typeof p.priceUsd === "number"
          ? p.priceUsd
          : Number(p.priceUsd) || 0;
      const matchesPrice =
        price >= selectedPriceRange.min && price <= selectedPriceRange.max;

      const matchesAvailability =
        availability === "all" || p.availability === availability;

      return matchesQuery && matchesCategory && matchesPrice && matchesAvailability;
    });
  }, [activeProducts, availability, categoryId, deferredQuery, priceRange]);

  const productItems = useMemo(
    () =>
      sortProducts(
        filteredProducts.filter((product) => {
          const p = product as Product & {
            category?: { id?: string; slug?: string; name?: string };
          };
          return (
            p.categoryId === PRODUCT_CATEGORY_ID ||
            p.category?.slug === "central-vacuum-units" ||
            p.category?.name?.toLowerCase().includes("unit")
          );
        }),
        productSort,
      ),
    [filteredProducts, productSort],
  );

  const accessoryItems = useMemo(
    () =>
      sortProducts(
        filteredProducts.filter((product) => {
          const p = product as Product & {
            category?: { id?: string; slug?: string; name?: string };
          };
          return (
            p.categoryId !== PRODUCT_CATEGORY_ID &&
            p.category?.slug !== "central-vacuum-units" &&
            !p.category?.name?.toLowerCase().includes("unit")
          );
        }),
        accessorySort,
      ),
    [accessorySort, filteredProducts],
  );

  const resetPages = () => {
    setProductPage(1);
    setAccessoryPage(1);
  };

  const hasActiveFilters =
    query.length > 0 ||
    categoryId !== "all" ||
    priceRange !== "all" ||
    availability !== "all";

  const clearAllFilters = () => {
    setQuery("");
    setCategoryId("all");
    setPriceRange("all");
    setAvailability("all");
    resetPages();
  };

  const handleQueryChange = (nextQuery: string) => {
    setQuery(nextQuery);
    resetPages();
  };

  return (
    <div className="mt-8 grid gap-8 xl:grid-cols-[18rem_minmax(0,1fr)]">
      <FadeIn className="self-start" delay={0.06}>
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
                className="text-xs font-semibold text-teal-700 hover:text-primary"
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
                  className="text-xs font-medium text-teal-700 hover:text-primary"
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
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X size={14} />
                </button>
              ) : null}
            </div>
          </div>

          <div className="mt-6 border-t border-teal-100 pt-6">
            <p className="text-sm font-semibold text-slate-900">Categories</p>
            <RadioGroup
              className="mt-3"
              value={categoryId}
              onValueChange={(value) => {
                setCategoryId(value);
                resetPages();
              }}
            >
              <FilterOption
                id="category-all"
                value="all"
                label="All categories"
                count={activeProducts.length}
              />
              {categoryCounts.map((category) => (
                <FilterOption
                  key={category.id}
                  id={`category-${category.id}`}
                  value={category.slug || category.id}
                  label={category.name}
                  count={category.count}
                />
              ))}
            </RadioGroup>
          </div>

          <div className="mt-6 border-t border-teal-100 pt-6">
            <p className="text-sm font-semibold text-slate-900">Price ranges</p>
            <RadioGroup
              className="mt-3 grid grid-cols-2 gap-2"
              value={priceRange}
              onValueChange={(value) => {
                setPriceRange(value);
                resetPages();
              }}
            >
              {priceRanges.map((range) => (
                <label
                  key={range.value}
                  htmlFor={`price-${range.value}`}
                  className={cn(
                    "flex items-center gap-2 rounded-full border border-teal-100 bg-white px-3 py-2 text-sm text-slate-600 transition hover:border-teal-200 hover:text-primary",
                    priceRange === range.value && "border-teal-200 bg-[var(--brand-soft)] text-primary",
                  )}
                >
                  <RadioGroupItem
                    id={`price-${range.value}`}
                    value={range.value}
                    className="sr-only"
                  />
                  {range.label}
                </label>
              ))}
            </RadioGroup>
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
        </section>
      </FadeIn>

      <div>
        <ProductSection
          title="Products"
          products={productItems}
          sortValue={productSort}
          currentPage={productPage}
          pageSize={PAGE_SIZE}
          onSortChange={(value) => {
            setProductSort(value as SortValue);
            setProductPage(1);
          }}
          onPageChange={setProductPage}
          delay={0.12}
        />
        <ProductSection
          title="Accessories"
          products={accessoryItems}
          sortValue={accessorySort}
          currentPage={accessoryPage}
          pageSize={PAGE_SIZE}
          onSortChange={(value) => {
            setAccessorySort(value as SortValue);
            setAccessoryPage(1);
          }}
          onPageChange={setAccessoryPage}
          delay={0.18}
        />

        {productItems.length === 0 && accessoryItems.length === 0 ? (
          <FadeIn className="landing-card landing-card-soft mt-10 p-8 text-center">
            <p className="text-lg font-semibold text-slate-950">No matching products</p>
            <p className="mt-2 text-sm text-slate-500">
              Adjust the filters or search query to see more Elite store items.
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
          </FadeIn>
        ) : null}
      </div>
    </div>
  );
}
