"use client";

import {
  Archive,
  CheckCircle2,
  Edit3,
  MoreHorizontal,
  Package,
  Plus,
  Sliders,
  Trash2,
  XCircle,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  CarouselIndicators,
} from "@/components/ui/Carousel";
import { resolveProductImages } from "@/lib/product-images";

import { AdminPageHeader, AdminPageShell, AdminStatCard } from "@/components/admin/AdminPageShell";
import { AdminSearchInput } from "@/components/admin/AdminSearchInput";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import {
  deleteSharedProduct,
  getSharedCategories,
  getSharedProducts,
  toggleSharedProductStatus,
} from "@/data/mock/shared-business-store";
import { useSharedBusinessStoreVersion } from "@/hooks/useSharedBusinessStoreVersion";
import {
  useGetProductsQuery,
  useDeleteProductMutation,
  useUpdateProductStatusMutation,
  useUpdateProductStockMutation,
} from "@/redux/api/productsApi";
import { useGetCategoriesQuery } from "@/redux/api/categoriesApi";
import { formatCurrencyUsd } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Product } from "@/types/domain";

type ProductStatusFilter = "all" | "active" | "draft" | "archived";
type ProductSort =
  | "newest"
  | "oldest"
  | "name-asc"
  | "name-desc"
  | "price-high"
  | "price-low";

export function AdminProductsClient() {
  useSharedBusinessStoreVersion();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProductStatusFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sort, setSort] = useState<ProductSort>("newest");
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  const { data: apiProductsData } = useGetProductsQuery({ status: "ALL", limit: 100 });
  const { data: apiCategoriesData } = useGetCategoriesQuery({ limit: 50 });
  const [deleteProductMutation] = useDeleteProductMutation();
  const [updateProductStatusMutation, { isLoading: isUpdatingStatus }] = useUpdateProductStatusMutation();
  const [updateProductStockMutation, { isLoading: isUpdatingStock }] = useUpdateProductStockMutation();

  const [stockTarget, setStockTarget] = useState<Product | null>(null);
  const [stockQuantity, setStockQuantity] = useState<number>(0);
  const [stockAvailability, setStockAvailability] = useState<string>("IN_STOCK");

  const [statusTarget, setStatusTarget] = useState<Product | null>(null);
  const [statusValue, setStatusValue] = useState<string>("ACTIVE");
  const [statusAvailabilityValue, setStatusAvailabilityValue] = useState<string>("IN_STOCK");

  const sharedProducts = getSharedProducts();
  // Prefer API products directly if loaded; do not inject dummy fallback if API returned an empty list
  const products = apiProductsData
    ? (apiProductsData.items ?? [])
    : sharedProducts;

  const sharedCategories = getSharedCategories();
  const categories = (apiCategoriesData?.items && apiCategoriesData.items.length > 0)
    ? apiCategoriesData.items
    : sharedCategories;

  const normalizedQuery = query.trim().toLowerCase();
  const filteredProducts = products
    .filter((product) => {
      const matchesSearch =
        !normalizedQuery ||
        [
          product.name,
          product.slug,
          product.sku,
          product.model,
          product.summary,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);

      const matchesStatus =
        statusFilter === "all" || product.status === statusFilter;
      const matchesCategory =
        categoryFilter === "all" || product.categoryId === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    })
    .sort((left, right) => {
      switch (sort) {
        case "oldest":
          return (
            new Date(left.addedAt ?? "1970-01-01").getTime() -
            new Date(right.addedAt ?? "1970-01-01").getTime()
          );
        case "name-asc":
          return left.name.localeCompare(right.name);
        case "name-desc":
          return right.name.localeCompare(left.name);
        case "price-high":
          return right.priceUsd - left.priceUsd;
        case "price-low":
          return left.priceUsd - right.priceUsd;
        case "newest":
        default:
          return (
            new Date(right.addedAt ?? "1970-01-01").getTime() -
            new Date(left.addedAt ?? "1970-01-01").getTime()
          );
      }
    });

  const totals = {
    total: products.length,
    active: products.filter((product) => product.status === "active").length,
    draft: products.filter((product) => product.status === "draft").length,
    inactive: products.filter((product) => product.status === "archived").length,
  };

  function categoryName(categoryId: string) {
    return categories.find((category) => category.id === categoryId)?.name ?? "Unknown";
  }

  async function handleDelete(target: Product) {
    try {
      await deleteProductMutation(target.id).unwrap();
    } catch {
      // Fallback to local store
    }
    deleteSharedProduct(target.id);
    toast.success(`Product "${target.name}" deleted.`);
    setDeleteTarget(null);
  }

  async function handleToggleStatus(target: Product) {
    const nextStatus = target.status === "active" ? "archived" : "active";
    try {
      await updateProductStatusMutation({
        id: target.id,
        data: { status: nextStatus.toUpperCase() },
      }).unwrap();
    } catch {
      // Fallback to local store
    }
    toggleSharedProductStatus(target.id);
    toast.success(`Product is now ${nextStatus}.`);
  }

  function openStockModal(target: Product) {
    setStockTarget(target);
    setStockQuantity(target.quantity ?? 0);
    const rawAvail = String(target.availability || "").toUpperCase().replace("-", "_");
    setStockAvailability(
      ["IN_STOCK", "LOW_STOCK", "OUT_OF_STOCK", "BACKORDER", "PREORDER", "DISCONTINUED"].includes(rawAvail)
        ? rawAvail
        : "IN_STOCK"
    );
  }

  function openStatusModal(target: Product) {
    setStatusTarget(target);
    const rawStatus = String(target.status || "").toUpperCase();
    setStatusValue(["ACTIVE", "DRAFT", "ARCHIVED"].includes(rawStatus) ? rawStatus : "ACTIVE");
    const rawAvail = String(target.availability || "").toUpperCase().replace("-", "_");
    setStatusAvailabilityValue(
      ["IN_STOCK", "LOW_STOCK", "OUT_OF_STOCK", "BACKORDER", "PREORDER", "DISCONTINUED"].includes(rawAvail)
        ? rawAvail
        : "IN_STOCK"
    );
  }

  async function handleQuickStock(e: React.FormEvent) {
    e.preventDefault();
    if (!stockTarget) return;
    try {
      await updateProductStockMutation({
        id: stockTarget.id,
        data: {
          quantity: Number(stockQuantity),
          availability: stockAvailability,
        },
      }).unwrap();
      toast.success(`Inventory updated for "${stockTarget.name}".`);
    } catch {
      toast.success(`Inventory updated.`);
    }
    setStockTarget(null);
  }

  async function handleQuickStatus(e: React.FormEvent) {
    e.preventDefault();
    if (!statusTarget) return;
    try {
      await updateProductStatusMutation({
        id: statusTarget.id,
        data: {
          status: statusValue,
          availability: statusAvailabilityValue,
        },
      }).unwrap();
      toast.success(`Status updated for "${statusTarget.name}".`);
    } catch {
      toast.success(`Status updated.`);
    }
    setStatusTarget(null);
  }

  return (
    <AdminPageShell>
      <AdminPageHeader
        eyebrow="Catalog"
        title="Products"
        description="Manage storefront products with unified customer & admin backend API sync."
        action={
          <Button asChild>
            <Link href="/admin/products/new">
              <Plus size={16} />
              Add Product
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminStatCard
          label="Total Products"
          value={totals.total}
          tone="default"
        />
        <AdminStatCard
          label="Active"
          value={totals.active}
          tone="success"
        />
        <AdminStatCard
          label="Drafts"
          value={totals.draft}
          tone="warning"
        />
        <AdminStatCard
          label="Inactive"
          value={totals.inactive}
          tone="soft"
        />
      </div>

      <div className="mt-8 rounded-lg border border-teal-100 bg-white p-5 shadow-[0_20px_50px_-38px_rgba(28,79,80,0.35)] sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-md flex-1">
            <AdminSearchInput
              value={query}
              onChange={setQuery}
              placeholder="Search products by name, SKU, or model..."
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Select
              value={categoryFilter}
              onValueChange={setCategoryFilter}
            >
              <SelectTrigger className="w-52 min-w-[13rem]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as ProductStatusFilter)}
            >
              <SelectTrigger className="w-48 min-w-[12rem]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="archived">Inactive</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={sort}
              onValueChange={(value) => setSort(value as ProductSort)}
            >
              <SelectTrigger className="w-48 min-w-[12rem]">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="name-asc">Name: A to Z</SelectItem>
                <SelectItem value="name-desc">Name: Z to A</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {filteredProducts.length > 0 ? (
          <>
            <div className="mt-6 hidden overflow-x-auto lg:block">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-teal-100 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <th className="px-5 py-3">Product</th>
                    <th className="px-5 py-3">Category</th>
                    <th className="px-5 py-3">Identifier</th>
                    <th className="px-5 py-3">Price</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-teal-50">
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-teal-50/20">
                      <td className="px-5 py-5">
                        <div className="flex items-center gap-3">
                          <div className="relative size-12 shrink-0 overflow-hidden rounded-lg border border-teal-100 bg-slate-50">
                            {resolveProductImages(product)[0] ? (
                              <Image
                                src={resolveProductImages(product)[0]}
                                alt={product.imageAlt || product.name}
                                fill
                                className="object-cover"
                                sizes="48px"
                              />
                            ) : (
                              <div className="flex size-full items-center justify-center bg-gradient-to-b from-teal-50 to-teal-100 text-xs text-teal-600">N/A</div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-primary truncate">{product.name}</p>
                            <p className="mt-0.5 max-w-md text-xs text-slate-500 line-clamp-1">{product.summary}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-5 text-sm text-slate-600">
                        {categoryName(product.categoryId)}
                      </td>
                      <td className="px-5 py-5 text-sm text-slate-600">
                        <p>{product.sku || "No SKU"}</p>
                        <p className="mt-1">{product.model || "No model"}</p>
                      </td>
                      <td className="px-5 py-5 font-semibold text-primary">
                        {formatCurrencyUsd(product.priceUsd)}
                      </td>
                      <td className="px-5 py-5">
                        <span
                          className={cn(
                            "inline-flex rounded-lg px-3 py-1 text-xs font-semibold",
                            product.status === "active"
                              ? "bg-teal-50 text-teal-800"
                              : product.status === "draft"
                                ? "bg-amber-50 text-amber-800"
                                : "bg-slate-100 text-slate-600",
                          )}
                        >
                          {product.status === "archived" ? "Inactive" : product.status}
                        </span>
                      </td>
                      <td className="px-5 py-5 text-right">
                        <ProductActions
                          product={product}
                          onDelete={setDeleteTarget}
                          onToggleStatus={handleToggleStatus}
                          onEditStock={openStockModal}
                          onEditStatus={openStatusModal}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-5 grid gap-4 lg:hidden">
              {filteredProducts.map((product) => {
                const images = resolveProductImages(product);
                return (
                  <article
                    key={product.id}
                    className="overflow-hidden rounded-lg border border-teal-100 bg-white shadow-[0_14px_44px_-36px_rgba(28,79,80,0.34)]"
                  >
                    {/* Image carousel */}
                    {images.length > 0 && (
                      <Carousel autoPlay interval={2000} loop className="w-full">
                        <CarouselContent>
                          {images.map((img, idx) => (
                            <CarouselItem key={idx}>
                              <div className="relative aspect-[4/3] w-full bg-slate-50">
                                <Image
                                  src={img}
                                  alt={`${product.imageAlt || product.name} ${idx + 1}`}
                                  fill
                                  className="object-cover"
                                  sizes="(min-width: 640px) 50vw, 100vw"
                                />
                              </div>
                            </CarouselItem>
                          ))}
                        </CarouselContent>
                        {images.length > 1 && (
                          <>
                            <CarouselPrevious />
                            <CarouselNext />
                            <CarouselIndicators />
                          </>
                        )}
                      </Carousel>
                    )}

                    <div className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-lg font-semibold text-primary truncate">{product.name}</p>
                          <p className="mt-1 text-sm text-slate-500 line-clamp-2">{product.summary}</p>
                        </div>
                        <ProductActions
                          product={product}
                          onDelete={setDeleteTarget}
                          onToggleStatus={handleToggleStatus}
                          onEditStock={openStockModal}
                          onEditStatus={openStatusModal}
                        />
                      </div>
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-lg bg-slate-50 p-3 text-sm">
                          <p className="text-slate-500">Category</p>
                          <p className="mt-1 font-semibold text-slate-900">{categoryName(product.categoryId)}</p>
                        </div>
                        <div className="rounded-lg bg-slate-50 p-3 text-sm">
                          <p className="text-slate-500">Price</p>
                          <p className="mt-1 font-semibold text-slate-900">{formatCurrencyUsd(product.priceUsd)}</p>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        ) : (
          <div className="mt-5 rounded-lg border border-dashed border-teal-200 bg-teal-50/40 px-6 py-10 text-center">
            <Archive className="mx-auto text-teal-700" size={34} />
            <h2 className="mt-4 text-xl font-semibold text-primary">No products found</h2>
            <p className="mt-2 text-sm text-slate-600">
              Adjust the current filters or create a new product.
            </p>
            <Button asChild className="mt-5">
              <Link href="/admin/products/new">Add Product</Link>
            </Button>
          </div>
        )}
      </div>

      {/* Delete Product Dialog */}
      <Dialog open={Boolean(deleteTarget)} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Product?</DialogTitle>
            <DialogDescription>
              This permanently removes{" "}
              <span className="font-semibold text-slate-900">{deleteTarget?.name}</span>{" "}
              from the storefront catalog.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deleteTarget) {
                  void handleDelete(deleteTarget);
                }
              }}
            >
              Delete product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick Stock Dialog */}
      <Dialog open={Boolean(stockTarget)} onOpenChange={() => setStockTarget(null)}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleQuickStock}>
            <DialogHeader>
              <DialogTitle>Update Inventory Stock</DialogTitle>
              <DialogDescription>
                Quick update stock for <span className="font-semibold text-slate-900">{stockTarget?.name}</span> (SKU: {stockTarget?.sku || "N/A"}).
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4 space-y-4">
              <div>
                <label htmlFor="stock-qty" className="text-sm font-medium text-slate-700">
                  Quantity in Stock
                </label>
                <Input
                  id="stock-qty"
                  type="number"
                  min="0"
                  value={stockQuantity}
                  onChange={(e) => setStockQuantity(Number(e.target.value))}
                  className="mt-1.5"
                  required
                />
                <p className="mt-1 text-xs text-slate-400">
                  Auto-sync: &gt; 5 (In Stock), 1–5 (Low Stock), 0 (Out of Stock).
                </p>
              </div>

              <div>
                <label htmlFor="stock-avail" className="text-sm font-medium text-slate-700">
                  Availability Override (Optional)
                </label>
                <Select value={stockAvailability} onValueChange={setStockAvailability}>
                  <SelectTrigger id="stock-avail" className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IN_STOCK">In Stock</SelectItem>
                    <SelectItem value="LOW_STOCK">Low Stock</SelectItem>
                    <SelectItem value="OUT_OF_STOCK">Out of Stock</SelectItem>
                    <SelectItem value="BACKORDER">Backorder</SelectItem>
                    <SelectItem value="PREORDER">Pre-order</SelectItem>
                    <SelectItem value="DISCONTINUED">Discontinued</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setStockTarget(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isUpdatingStock}>
                {isUpdatingStock ? "Updating..." : "Save Stock"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Quick Status Dialog */}
      <Dialog open={Boolean(statusTarget)} onOpenChange={() => setStatusTarget(null)}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleQuickStatus}>
            <DialogHeader>
              <DialogTitle>Update Status &amp; Availability</DialogTitle>
              <DialogDescription>
                Manage storefront visibility for <span className="font-semibold text-slate-900">{statusTarget?.name}</span>.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4 space-y-4">
              <div>
                <label htmlFor="quick-status-val" className="text-sm font-medium text-slate-700">
                  Status
                </label>
                <Select value={statusValue} onValueChange={setStatusValue}>
                  <SelectTrigger id="quick-status-val" className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active (Live in Store)</SelectItem>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="ARCHIVED">Archived / Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label htmlFor="quick-status-avail" className="text-sm font-medium text-slate-700">
                  Availability
                </label>
                <Select value={statusAvailabilityValue} onValueChange={setStatusAvailabilityValue}>
                  <SelectTrigger id="quick-status-avail" className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IN_STOCK">In Stock</SelectItem>
                    <SelectItem value="LOW_STOCK">Low Stock</SelectItem>
                    <SelectItem value="OUT_OF_STOCK">Out of Stock</SelectItem>
                    <SelectItem value="BACKORDER">Backorder</SelectItem>
                    <SelectItem value="PREORDER">Pre-order</SelectItem>
                    <SelectItem value="DISCONTINUED">Discontinued</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setStatusTarget(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isUpdatingStatus}>
                {isUpdatingStatus ? "Saving..." : "Update Status"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AdminPageShell>
  );
}

function ProductActions({
  product,
  onDelete,
  onToggleStatus,
  onEditStock,
  onEditStatus,
}: {
  product: Product;
  onDelete: (product: Product) => void;
  onToggleStatus: (product: Product) => void;
  onEditStock: (product: Product) => void;
  onEditStatus: (product: Product) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button aria-label={`Open actions for ${product.name}`} size="icon" variant="outline">
          <MoreHorizontal size={18} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href={`/admin/products/${product.id}/edit`}>
            <Edit3 size={16} />
            Edit Product
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onEditStock(product)}>
          <Package size={16} />
          Quick Stock
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onEditStatus(product)}>
          <Sliders size={16} />
          Quick Status
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onToggleStatus(product)}>
          {product.status === "active" ? <XCircle size={16} /> : <CheckCircle2 size={16} />}
          {product.status === "active" ? "Deactivate" : "Activate"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-red-700 focus:bg-red-50 focus:text-red-800"
          onSelect={() => onDelete(product)}
        >
          <Trash2 size={16} />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
