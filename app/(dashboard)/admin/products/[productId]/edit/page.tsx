"use client";

import { useMemo } from "react";
import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { toast } from "sonner";

import { AdminPageHeader, AdminPageShell, AdminSurface } from "@/components/admin/AdminPageShell";
import { AdminProductForm } from "@/components/admin/products/AdminProductForm";
import {
  getSharedCategories,
  getSharedProducts,
  updateSharedProduct,
} from "@/data/mock/shared-business-store";
import {
  useGetProductByIdOrSlugQuery,
  useUpdateProductMutation,
} from "@/redux/api/productsApi";
import { useGetCategoriesQuery } from "@/redux/api/categoriesApi";
import { useSharedBusinessStoreVersion } from "@/hooks/useSharedBusinessStoreVersion";
import type { ProductValues } from "@/lib/validation";

export default function AdminEditProductPage() {
  useSharedBusinessStoreVersion();
  const params = useParams<{ productId: string }>();
  const productId = params?.productId ?? "";

  const { data: apiProduct } = useGetProductByIdOrSlugQuery(productId, {
    skip: !productId,
  });
  const { data: apiCategoriesData } = useGetCategoriesQuery({ limit: 100 });
  const [updateProductMutation] = useUpdateProductMutation();

  const sharedProduct = getSharedProducts().find((item) => item.id === productId);
  const resolvedProduct = apiProduct || sharedProduct;

  const sharedCategories = getSharedCategories();
  const categories = useMemo(() => {
    if (apiCategoriesData?.items && apiCategoriesData.items.length > 0) {
      return apiCategoriesData.items;
    }
    return sharedCategories;
  }, [apiCategoriesData?.items, sharedCategories]);

  if (!resolvedProduct) {
    notFound();
  }

  async function submit(values: ProductValues) {
    if (!resolvedProduct) return;

    const rawImages = values.images
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    updateSharedProduct(resolvedProduct.id, {
      ...values,
      sku: values.sku || undefined,
      model: values.model || undefined,
      imageAlt: `${values.name} product image`,
      shippingLabel: values.shippingLabel || undefined,
      images: rawImages,
    });

    try {
      await updateProductMutation({
        id: resolvedProduct.id,
        body: {
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
        },
      }).unwrap();
      toast.success("Product updated successfully");
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
        title={`Edit ${resolvedProduct.name}`}
        description="Update product details with live catalog synchronization."
      />
      <AdminSurface>
        <AdminProductForm
          categories={categories}
          existingProducts={getSharedProducts()}
          initialProduct={resolvedProduct}
          onCancelHref="/admin/products"
          onSubmit={submit}
          submitLabel="Save Changes"
        />
      </AdminSurface>
    </AdminPageShell>
  );
}
