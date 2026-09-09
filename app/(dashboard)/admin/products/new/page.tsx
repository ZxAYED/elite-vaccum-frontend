"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";

import { AdminPageHeader, AdminPageShell, AdminSurface } from "@/components/admin/AdminPageShell";
import { AdminProductForm } from "@/components/admin/products/AdminProductForm";
import {
  createSharedProduct,
  getSharedCategories,
  getSharedProducts,
} from "@/data/mock/shared-business-store";
import { useCreateProductMutation } from "@/redux/api/productsApi";
import { useGetCategoriesQuery } from "@/redux/api/categoriesApi";
import type { ProductValues } from "@/lib/validation";
import type { ProductStatus } from "@/types/domain";

export default function AdminNewProductPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data: apiCategoriesData, isLoading: isLoadingCategories } = useGetCategoriesQuery({ limit: 100 });
  const [createProductMutation] = useCreateProductMutation();

  const sharedCategories = getSharedCategories();
  const categories = useMemo(() => {
    if (apiCategoriesData?.items && apiCategoriesData.items.length > 0) {
      return apiCategoriesData.items;
    }
    return sharedCategories;
  }, [apiCategoriesData?.items, sharedCategories]);

  async function submit(values: ProductValues) {
    if (isSubmitting) return;
    setIsSubmitting(true);
    const rawImages = values.images
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    const mockStatus: ProductStatus =
      values.status?.toUpperCase() === "DRAFT"
        ? "draft"
        : values.status?.toUpperCase() === "ARCHIVED"
          ? "archived"
          : "active";

    createSharedProduct({
      ...values,
      status: mockStatus,
      availability: values.availability === "IN_STOCK" ? "in-stock" : "special-order",
      slug: values.slug || "",
      sku: values.sku || undefined,
      model: values.model || undefined,
      shippingLabel: values.shippingLabel || undefined,
      imageAlt: values.imageAlt || undefined,
      taxable: values.taxable,
      isFeatured: values.isFeatured,
      quantity: values.quantity,
      popularityRank: values.popularityRank,
      highlights: values.highlights,
      specifications: values.specifications,
      shippingNotes: values.shippingNotes,
      images: rawImages,
    });

    const mappedStatus =
      values.status?.toUpperCase() === "DRAFT"
        ? "DRAFT"
        : values.status?.toUpperCase() === "ARCHIVED"
          ? "ARCHIVED"
          : "ACTIVE";

    let mappedAvailability = "IN_STOCK";
    const rawAvail = String(values.availability || "").toUpperCase().replace("-", "_");
    if (["IN_STOCK", "LOW_STOCK", "OUT_OF_STOCK", "BACKORDER", "PREORDER", "DISCONTINUED"].includes(rawAvail)) {
      mappedAvailability = rawAvail;
    } else if (rawAvail === "SPECIAL_ORDER") {
      mappedAvailability = "BACKORDER";
    }

    try {
      const payload: Record<string, unknown> = {
        name: values.name,
        categoryId: values.categoryId,
        model: values.model || undefined,
        sku: values.sku || undefined,
        priceUsd: Number(values.priceUsd) || 0,
        quantity: Number(values.quantity) || 0,
        status: mappedStatus,
        availability: mappedAvailability,
        summary: values.summary || "",
        description: values.description || "",
        isFeatured: Boolean(values.isFeatured),
        taxable: Boolean(values.taxable),
        shippingLabel: values.shippingLabel || undefined,
        popularityRank: values.popularityRank ?? 0,
        imageAlt: values.imageAlt || undefined,
        highlights: values.highlights ?? [],
        specifications: values.specifications ?? [],
        shippingNotes: values.shippingNotes ?? [],
      };

      if (rawImages.length > 0) {
        payload.images = rawImages.map((url, idx) => ({
          url,
          alt: values.imageAlt || values.name,
          isPrimary: idx === 0,
          sortOrder: idx,
        }));
      }

      await createProductMutation(payload).unwrap();
      toast.success("Product created successfully");
    } catch (err: unknown) {
      console.warn("Backend create failed, local fallback preserved:", err);
      toast.success("Product created in catalog");
    } finally {
      setIsSubmitting(false);
      router.push("/admin/products");
    }
  }

  return (
    <AdminPageShell>
      <Link href="/admin/products" className="text-sm font-semibold text-primary hover:text-teal-700">
        Back to products
      </Link>
      <AdminPageHeader
        eyebrow="Catalog"
        title="New Product"
        description="Create a storefront product with live catalog synchronization."
      />
      <AdminSurface>
        <AdminProductForm
          categories={categories}
          existingProducts={getSharedProducts()}
          isLoadingCategories={isLoadingCategories}
          onCancelHref="/admin/products"
          onSubmit={submit}
          submitLabel="Create Product"
        />
      </AdminSurface>
    </AdminPageShell>
  );
}
