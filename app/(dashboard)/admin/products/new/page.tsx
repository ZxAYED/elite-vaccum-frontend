"use client";

import { useMemo } from "react";
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

export default function AdminNewProductPage() {
  const { data: apiCategoriesData } = useGetCategoriesQuery({ limit: 100 });
  const [createProductMutation] = useCreateProductMutation();

  const sharedCategories = getSharedCategories();
  const categories = useMemo(() => {
    if (apiCategoriesData?.items && apiCategoriesData.items.length > 0) {
      return apiCategoriesData.items;
    }
    return sharedCategories;
  }, [apiCategoriesData?.items, sharedCategories]);

  async function submit(values: ProductValues) {
    const rawImages = values.images
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    createSharedProduct({
      ...values,
      sku: values.sku || undefined,
      model: values.model || undefined,
      shippingLabel: values.shippingLabel || undefined,
      images: rawImages,
    });

    try {
      await createProductMutation({
        name: values.name,
        categoryId: values.categoryId,
        model: values.model || undefined,
        sku: values.sku || undefined,
        priceUsd: values.priceUsd,
        quantity: values.quantity,
        status: values.status,
        availability: values.availability,
        summary: values.summary || "",
        description: values.description || "",
        isFeatured: values.isFeatured,
        shippingLabel: values.shippingLabel || undefined,
      }).unwrap();
      toast.success("Product created successfully");
    } catch {
      // Local fallback active
    }

    window.location.href = "/admin/products";
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
          onCancelHref="/admin/products"
          onSubmit={submit}
          submitLabel="Create Product"
        />
      </AdminSurface>
    </AdminPageShell>
  );
}
