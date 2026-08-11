"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Archive,
  CheckCircle2,
  ChevronDown,
  Edit3,
  MoreHorizontal,
  PackageCheck,
  Plus,
  Search,
  Trash2,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { FormField } from "@/components/forms/FormField";
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
import { Textarea } from "@/components/ui/Textarea";
import { mockProductCategories, mockProducts } from "@/data/mock/products";
import { cn } from "@/lib/utils";
import {
  productCategorySchema,
  type ProductCategoryValues,
} from "@/lib/validation";
import type { ProductCategory, ProductCategoryStatus } from "@/types/domain";

type CategoryFilter = "all" | "ACTIVE" | "INACTIVE";
type CategorySort =
  | "newest"
  | "oldest"
  | "name-asc"
  | "name-desc"
  | "most-products"
  | "fewest-products";

const statusFilterOptions: Array<{ label: string; value: CategoryFilter }> = [
  { label: "All", value: "all" },
  { label: "Active", value: "ACTIVE" },
  { label: "Inactive", value: "INACTIVE" },
];

const sortOptions: Array<{ label: string; value: CategorySort }> = [
  { label: "Newest", value: "newest" },
  { label: "Oldest", value: "oldest" },
  { label: "Name A-Z", value: "name-asc" },
  { label: "Name Z-A", value: "name-desc" },
  { label: "Most Products", value: "most-products" },
  { label: "Fewest Products", value: "fewest-products" },
];

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

function createId(name: string) {
  return `cat-${slugify(name)}-${Date.now().toString(36).slice(-4)}`;
}

function StatusPill({ status }: { status: ProductCategoryStatus }) {
  const isActive = status === "ACTIVE";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
        isActive ? "bg-teal-50 text-teal-800" : "bg-slate-100 text-slate-600",
      )}
    >
      {isActive ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
      {isActive ? "Active" : "Inactive"}
    </span>
  );
}

interface CategoryFormDialogProps {
  categories: ProductCategory[];
  editingCategory: ProductCategory | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (values: ProductCategoryValues, editingId?: string) => void;
}

function CategoryFormDialog({
  categories,
  editingCategory,
  open,
  onOpenChange,
  onSave,
}: CategoryFormDialogProps) {
  const [slugEdited, setSlugEdited] = useState(Boolean(editingCategory));
  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
    reset,
    setError,
    setValue,
  } = useForm<ProductCategoryValues>({
    resolver: zodResolver(productCategorySchema),
    defaultValues: {
      name: editingCategory?.name ?? "",
      slug: editingCategory?.slug ?? "",
      description: editingCategory?.description ?? "",
      status: editingCategory?.status ?? "ACTIVE",
    },
  });

  function resetForm(nextOpen: boolean) {
    onOpenChange(nextOpen);
    if (!nextOpen) {
      setSlugEdited(false);
      return;
    }

    reset({
      name: editingCategory?.name ?? "",
      slug: editingCategory?.slug ?? "",
      description: editingCategory?.description ?? "",
      status: editingCategory?.status ?? "ACTIVE",
    });
    setSlugEdited(Boolean(editingCategory));
  }

  function submit(values: ProductCategoryValues) {
    const duplicateName = categories.some(
      (category) =>
        category.id !== editingCategory?.id &&
        category.name.toLowerCase() === values.name.toLowerCase(),
    );
    const duplicateSlug = categories.some(
      (category) =>
        category.id !== editingCategory?.id &&
        category.slug.toLowerCase() === values.slug.toLowerCase(),
    );

    if (duplicateName) {
      setError("name", {
        message: "A category with this name already exists.",
        type: "manual",
      });
      return;
    }

    if (duplicateSlug) {
      setError("slug", {
        message: "A category with this slug already exists.",
        type: "manual",
      });
      return;
    }

    onSave(values, editingCategory?.id);
    resetForm(false);
  }

  return (
    <Dialog open={open} onOpenChange={resetForm}>
      <DialogContent className="w-[min(94vw,42rem)]">
        <DialogHeader>
          <DialogTitle>
            {editingCategory ? "Edit Category" : "Add Category"}
          </DialogTitle>
          <DialogDescription>
            Categories stay flat and drive store filters, product assignment,
            and admin reporting.
          </DialogDescription>
        </DialogHeader>

        <form className="mt-6 space-y-5" onSubmit={handleSubmit(submit)}>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              error={errors.name?.message}
              htmlFor="category-name"
              label="Category Name"
              required
            >
              <Input
                id="category-name"
                placeholder="Central Vacuum Units"
                {...register("name", {
                  onChange: (event) => {
                    if (!slugEdited) {
                      setValue("slug", slugify(event.target.value), {
                        shouldValidate: true,
                      });
                    }
                  },
                })}
              />
            </FormField>

            <FormField
              error={errors.slug?.message}
              htmlFor="category-slug"
              hint="Lowercase URL slug."
              label="Slug"
              required
            >
              <Input
                id="category-slug"
                placeholder="central-vacuum-units"
                {...register("slug", {
                  onChange: () => setSlugEdited(true),
                })}
              />
            </FormField>
          </div>

          <FormField
            error={errors.description?.message}
            htmlFor="category-description"
            label="Description"
          >
            <Textarea
              className="min-h-28"
              id="category-description"
              placeholder="Main vacuum and power units."
              {...register("description")}
            />
          </FormField>

          <FormField
            error={errors.status?.message}
            htmlFor="category-status"
            label="Status"
            required
          >
            <Controller
              control={control}
              name="status"
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger id="category-status">
                    <SelectValue placeholder="Choose status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </FormField>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => resetForm(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              {editingCategory ? "Save Changes" : "Create Category"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<ProductCategory[]>(
    mockProductCategories,
  );
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<CategoryFilter>("all");
  const [sort, setSort] = useState<CategorySort>("newest");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] =
    useState<ProductCategory | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProductCategory | null>(
    null,
  );
  const [blockedDelete, setBlockedDelete] = useState<{
    category: ProductCategory;
    count: number;
  } | null>(null);

  const productCounts = useMemo(() => {
    return mockProducts.reduce<Record<string, number>>((counts, product) => {
      counts[product.categoryId] = (counts[product.categoryId] ?? 0) + 1;
      return counts;
    }, {});
  }, []);

  const filteredCategories = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return categories
      .filter((category) => {
        const matchesSearch =
          normalizedQuery.length === 0 ||
          category.name.toLowerCase().includes(normalizedQuery) ||
          category.slug.toLowerCase().includes(normalizedQuery);
        const matchesStatus =
          statusFilter === "all" || category.status === statusFilter;

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        const aCount = productCounts[a.id] ?? 0;
        const bCount = productCounts[b.id] ?? 0;

        switch (sort) {
          case "oldest":
            return (
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            );
          case "name-asc":
            return a.name.localeCompare(b.name);
          case "name-desc":
            return b.name.localeCompare(a.name);
          case "most-products":
            return bCount - aCount || a.name.localeCompare(b.name);
          case "fewest-products":
            return aCount - bCount || a.name.localeCompare(b.name);
          case "newest":
          default:
            return (
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
        }
      });
  }, [categories, productCounts, query, sort, statusFilter]);

  const totals = useMemo(() => {
    return categories.reduce(
      (stats, category) => {
        stats.total += 1;
        if (category.status === "ACTIVE") stats.active += 1;
        if (category.status === "INACTIVE") stats.inactive += 1;
        stats.products += productCounts[category.id] ?? 0;
        return stats;
      },
      { active: 0, inactive: 0, products: 0, total: 0 },
    );
  }, [categories, productCounts]);

  function openCreateDialog() {
    setEditingCategory(null);
    setDialogOpen(true);
  }

  function openEditDialog(category: ProductCategory) {
    setEditingCategory(category);
    setDialogOpen(true);
  }

  function saveCategory(values: ProductCategoryValues, editingId?: string) {
    const today = new Date().toISOString().slice(0, 10);

    setCategories((current) => {
      if (editingId) {
        return current.map((category) =>
          category.id === editingId
            ? {
                ...category,
                ...values,
                description: values.description ?? "",
                updatedAt: today,
              }
            : category,
        );
      }

      return [
        {
          id: createId(values.name),
          name: values.name,
          slug: values.slug,
          description: values.description ?? "",
          status: values.status,
          createdAt: today,
          updatedAt: today,
        },
        ...current,
      ];
    });
  }

  function toggleStatus(category: ProductCategory) {
    const nextStatus: ProductCategoryStatus =
      category.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    const today = new Date().toISOString().slice(0, 10);

    setCategories((current) =>
      current.map((item) =>
        item.id === category.id
          ? { ...item, status: nextStatus, updatedAt: today }
          : item,
      ),
    );
  }

  function requestDelete(category: ProductCategory) {
    const count = productCounts[category.id] ?? 0;
    if (count > 0) {
      setBlockedDelete({ category, count });
      return;
    }

    setDeleteTarget(category);
  }

  function confirmDelete() {
    if (!deleteTarget) return;

    setCategories((current) =>
      current.filter((category) => category.id !== deleteTarget.id),
    );
    setDeleteTarget(null);
  }

  return (
    <main className="min-h-screen bg-[#f4f7f7] text-slate-950">
      <section className="space-y-4">
        <div className="flex flex-col gap-3 rounded-xl border border-teal-100 bg-white p-4 shadow-[0_18px_48px_-42px_rgba(28,79,80,0.32)] lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.32em] text-teal-700">
              Catalog
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em] text-teal-950">
              Categories
            </h1>
            <p className="mt-2 max-w-2xl text-base leading-7 text-slate-600">
              Manage product categories used in the store.
            </p>
          </div>
          <Button className="h-11 rounded-xl px-5" onClick={openCreateDialog}>
            <Plus size={18} />
            Add Category
          </Button>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          {[
            { label: "Total Categories", value: totals.total },
            { label: "Active", value: totals.active },
            { label: "Inactive", value: totals.inactive },
            { label: "Assigned Products", value: totals.products },
          ].map((stat) => (
            <div
              className="rounded-xl border border-teal-100 bg-white p-4 shadow-[0_14px_44px_-36px_rgba(28,79,80,0.34)]"
              key={stat.label}
            >
              <p className="text-sm text-slate-500">{stat.label}</p>
              <p className="mt-2 text-3xl font-semibold text-teal-950">
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-teal-100 bg-white p-4 shadow-[0_18px_56px_-44px_rgba(28,79,80,0.34)]">
          <div className="grid gap-3 lg:grid-cols-[1fr_24rem_18rem]">
            <div className="relative">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                size={18}
              />
              <Input
                aria-label="Search categories"
                className="pl-11"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by name or slug..."
                value={query}
              />
            </div>

            <div className="grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-1">
              {statusFilterOptions.map((option) => (
                <button
                  className={cn(
                    "h-10 rounded-[1rem] text-sm font-semibold transition",
                    statusFilter === option.value
                      ? "bg-primary text-white shadow-[0_14px_30px_-22px_rgba(28,79,80,0.9)]"
                      : "text-slate-600 hover:bg-white hover:text-teal-800",
                  )}
                  key={option.value}
                  onClick={() => setStatusFilter(option.value)}
                  type="button"
                >
                  {option.label}
                </button>
              ))}
            </div>

            <Select
              onValueChange={(value) => setSort(value as CategorySort)}
              value={sort}
            >
              <SelectTrigger>
                <span className="flex items-center gap-2 text-slate-500">
                  <ChevronDown size={16} />
                  <SelectValue />
                </span>
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {filteredCategories.length === 0 ? (
            <div className="mt-5 rounded-xl border border-dashed border-teal-200 bg-teal-50/40 px-6 py-10 text-center">
              <Archive className="mx-auto text-teal-700" size={34} />
              <h2 className="mt-4 text-xl font-semibold text-teal-950">
                No categories found
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Adjust the search/filter or create a new category.
              </p>
              <Button className="mt-5" onClick={openCreateDialog}>
                Add Category
              </Button>
            </div>
          ) : (
            <>
              <div className="mt-5 hidden overflow-hidden rounded-xl border border-teal-100 lg:block">
                <table className="w-full border-collapse text-left">
                  <thead className="bg-[#f7fbfa] text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                    <tr>
                      <th className="px-5 py-4">Category</th>
                      <th className="px-5 py-4">Slug</th>
                      <th className="px-5 py-4">Products</th>
                      <th className="px-5 py-4">Status</th>
                      <th className="px-5 py-4">Updated</th>
                      <th className="px-5 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-teal-100">
                    {filteredCategories.map((category) => (
                      <tr className="bg-white" key={category.id}>
                        <td className="px-5 py-5">
                          <p className="font-semibold text-teal-950">
                            {category.name}
                          </p>
                          <p className="mt-1 max-w-md text-sm text-slate-500">
                            {category.description || "No description added."}
                          </p>
                        </td>
                        <td className="px-5 py-5">
                          <code className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600">
                            {category.slug}
                          </code>
                        </td>
                        <td className="px-5 py-5">
                          <span className="inline-flex items-center gap-2 font-semibold text-teal-950">
                            <PackageCheck size={17} />
                            {productCounts[category.id] ?? 0}
                          </span>
                        </td>
                        <td className="px-5 py-5">
                          <StatusPill status={category.status} />
                        </td>
                        <td className="px-5 py-5 text-sm text-slate-600">
                          {formatDate(category.updatedAt)}
                        </td>
                        <td className="px-5 py-5 text-right">
                          <CategoryActions
                            category={category}
                            onDelete={requestDelete}
                            onEdit={openEditDialog}
                            onToggleStatus={toggleStatus}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-5 grid gap-4 lg:hidden">
                {filteredCategories.map((category) => (
                  <article
                    className="rounded-xl border border-teal-100 bg-white p-4 shadow-[0_14px_44px_-36px_rgba(28,79,80,0.34)]"
                    key={category.id}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <StatusPill status={category.status} />
                        <h2 className="mt-3 text-xl font-semibold text-teal-950">
                          {category.name}
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                          {category.description || "No description added."}
                        </p>
                      </div>
                      <CategoryActions
                        category={category}
                        onDelete={requestDelete}
                        onEdit={openEditDialog}
                        onToggleStatus={toggleStatus}
                      />
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-slate-500">Slug</p>
                        <p className="mt-1 break-all font-semibold text-teal-950">
                          {category.slug}
                        </p>
                      </div>
                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-slate-500">Products</p>
                        <p className="mt-1 font-semibold text-teal-950">
                          {productCounts[category.id] ?? 0}
                        </p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {dialogOpen ? (
        <CategoryFormDialog
          categories={categories}
          editingCategory={editingCategory}
          key={editingCategory?.id ?? "create-category"}
          onOpenChange={setDialogOpen}
          onSave={saveCategory}
          open={dialogOpen}
        />
      ) : null}

      <Dialog
        open={Boolean(deleteTarget)}
        onOpenChange={() => setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Category?</DialogTitle>
            <DialogDescription>
              This permanently removes{" "}
              <span className="font-semibold text-slate-800">
                {deleteTarget?.name}
              </span>
              . This is only allowed when no products use the category.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(blockedDelete)}
        onOpenChange={() => setBlockedDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cannot Delete Category</DialogTitle>
            <DialogDescription>
              {blockedDelete?.category.name} is used by {blockedDelete?.count}{" "}
              product{blockedDelete?.count === 1 ? "" : "s"}. Deactivate it to
              stop new assignments, or move those products before deleting.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setBlockedDelete(null)}>Understood</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}

interface CategoryActionsProps {
  category: ProductCategory;
  onDelete: (category: ProductCategory) => void;
  onEdit: (category: ProductCategory) => void;
  onToggleStatus: (category: ProductCategory) => void;
}

function CategoryActions({
  category,
  onDelete,
  onEdit,
  onToggleStatus,
}: CategoryActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          aria-label={`Open actions for ${category.name}`}
          size="icon"
          variant="outline"
        >
          <MoreHorizontal size={18} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={() => onEdit(category)}>
          <Edit3 size={16} />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onToggleStatus(category)}>
          {category.status === "ACTIVE" ? (
            <XCircle size={16} />
          ) : (
            <CheckCircle2 size={16} />
          )}
          {category.status === "ACTIVE" ? "Deactivate" : "Activate"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-red-700 focus:bg-red-50 focus:text-red-800"
          onSelect={() => onDelete(category)}
        >
          <Trash2 size={16} />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
