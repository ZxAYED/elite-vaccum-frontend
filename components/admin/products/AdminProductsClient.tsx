"use client";

import {
  Archive,
  CheckCircle2,
  ChevronDown,
  Edit3,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { AdminPageHeader, AdminPageShell } from "@/components/admin/AdminPageShell";
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
import { Input } from "@/components/ui/Input";
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
import { formatCurrencyUsd } from "@/lib/formatters";
import { cn } from "@/lib/utils";
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

  const products = getSharedProducts();
  const categories = getSharedCategories();

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

  return (
    <AdminPageShell>
      <AdminPageHeader
        eyebrow="Catalog"
        title="Products"
        description="Manage storefront products from the same shared mock source used by categories and public product data."
        action={
          <Button asChild>
            <Link href="/admin/products/new">
              <Plus size={16} />
              Add Product
            </Link>
          </Button>
        }
      />

      <div className="grid gap-3 md:grid-cols-4">
        {[
          { label: "Total Products", value: totals.total },
          { label: "Active", value: totals.active },
          { label: "Draft", value: totals.draft },
          { label: "Inactive", value: totals.inactive },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-teal-100 bg-white p-4">
            <p className="text-sm text-slate-500">{stat.label}</p>
            <p className="mt-2 text-3xl font-semibold text-primary">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-teal-100 bg-white p-4 shadow-[0_20px_48px_-42px_rgba(28,79,80,0.34)]">
        <div className="grid gap-3 xl:grid-cols-[1fr_12rem_14rem_12rem]">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <Input
              className="pl-11"
              placeholder="Search by name, slug, SKU, or model..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>

          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as ProductStatusFilter)}>
            <SelectTrigger>
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="archived">Inactive</SelectItem>
            </SelectContent>
          </Select>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sort} onValueChange={(value) => setSort(value as ProductSort)}>
            <SelectTrigger>
              <span className="flex items-center gap-2 text-slate-500">
                <ChevronDown size={16} />
                <SelectValue />
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
              <SelectItem value="name-asc">Name A-Z</SelectItem>
              <SelectItem value="name-desc">Name Z-A</SelectItem>
              <SelectItem value="price-high">Price high-low</SelectItem>
              <SelectItem value="price-low">Price low-high</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {filteredProducts.length ? (
          <>
            <div className="mt-5 hidden overflow-hidden rounded-xl border border-teal-100 lg:block">
              <table className="w-full border-collapse text-left">
                <thead className="bg-[#f7fbfa] text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                  <tr>
                    <th className="px-5 py-4">Product</th>
                    <th className="px-5 py-4">Category</th>
                    <th className="px-5 py-4">SKU / Model</th>
                    <th className="px-5 py-4">Price</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-teal-100">
                  {filteredProducts.map((product) => (
                    <tr key={product.id}>
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
                            "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
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
                  className="rounded-xl border border-teal-100 bg-white p-4 shadow-[0_14px_44px_-36px_rgba(28,79,80,0.34)]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-lg font-semibold text-primary">{product.name}</p>
                      <p className="mt-1 text-sm text-slate-500">{product.summary}</p>
                    </div>
                    <ProductActions product={product} onDelete={setDeleteTarget} />
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl bg-slate-50 p-3 text-sm">
                      <p className="text-slate-500">Category</p>
                      <p className="mt-1 font-semibold text-slate-900">{categoryName(product.categoryId)}</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3 text-sm">
                      <p className="text-slate-500">Price</p>
                      <p className="mt-1 font-semibold text-slate-900">{formatCurrencyUsd(product.priceUsd)}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </>
        ) : (
          <div className="mt-5 rounded-xl border border-dashed border-teal-200 bg-teal-50/40 px-6 py-10 text-center">
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
              from the shared mock store.
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
                  deleteSharedProduct(deleteTarget.id);
                }
                setDeleteTarget(null);
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
}: {
  product: Product;
  onDelete: (product: Product) => void;
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
        <DropdownMenuItem onSelect={() => toggleSharedProductStatus(product.id)}>
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
