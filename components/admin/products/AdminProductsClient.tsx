"use client";

import {
  Archive,
  CheckCircle2,
  Edit3,
  MoreHorizontal,
  Plus,
  Trash2,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { AdminPageHeader, AdminPageShell, AdminStatCard } from "@/components/admin/AdminPageShell";
import { AdminSearchInput } from "@/components/admin/AdminSearchInput";
import { Button } from "@/components/ui/Button";
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
  const [updateProductStatusMutation] = useUpdateProductStatusMutation();

  const sharedProducts = getSharedProducts();
  const products = (apiProductsData?.items && apiProductsData.items.length > 0)
    ? apiProductsData.items
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
              <SelectTrigger className="w-44">
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
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="archived">Inactive</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={sort}
              onValueChange={(value) => setSort(value as ProductSort)}
            >
              <SelectTrigger className="w-40">
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
                        <p className="font-semibold text-primary">{product.name}</p>
                        <p className="mt-1 max-w-md text-sm text-slate-500">{product.summary}</p>
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
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-5 grid gap-4 lg:hidden">
              {filteredProducts.map((product) => (
                <article
                  key={product.id}
                  className="rounded-lg border border-teal-100 bg-white p-4 shadow-[0_14px_44px_-36px_rgba(28,79,80,0.34)]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-lg font-semibold text-primary">{product.name}</p>
                      <p className="mt-1 text-sm text-slate-500">{product.summary}</p>
                    </div>
                    <ProductActions
                      product={product}
                      onDelete={setDeleteTarget}
                      onToggleStatus={handleToggleStatus}
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
                </article>
              ))}
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
    </AdminPageShell>
  );
}

function ProductActions({
  product,
  onDelete,
  onToggleStatus,
}: {
  product: Product;
  onDelete: (product: Product) => void;
  onToggleStatus: (product: Product) => void;
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
            Edit
          </Link>
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
