"use client";

import Link from "next/link";
import { notFound, useParams } from "next/navigation";

import { AdminPageHeader, AdminPageShell, AdminSurface } from "@/components/admin/AdminPageShell";
import { AdminProductForm } from "@/components/admin/products/AdminProductForm";
import {
  getSharedCategories,
  getSharedProducts,
  updateSharedProduct,
} from "@/data/mock/shared-business-store";
import { useSharedBusinessStoreVersion } from "@/hooks/useSharedBusinessStoreVersion";
import type { ProductValues } from "@/lib/validation";

export default function AdminEditProductPage() {
  useSharedBusinessStoreVersion();
  const params = useParams<{ productId: string }>();
  const product = getSharedProducts().find((item) => item.id === params.productId);

  if (!product) {
    notFound();
  }

  const resolvedProduct = product;

  function submit(values: ProductValues) {
    updateSharedProduct(resolvedProduct.id, {
      ...values,
      sku: values.sku || undefined,
      model: values.model || undefined,
      imageAlt: `${values.name} product image`,
      shippingLabel: values.shippingLabel || undefined,
      images: values.images
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean),
    });
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
        description="Update product details without breaking the shared product/category relationships."
      />
      <AdminSurface>
        <AdminProductForm
          categories={getSharedCategories()}
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
