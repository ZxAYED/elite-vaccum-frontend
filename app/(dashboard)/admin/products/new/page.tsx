"use client";

import Link from "next/link";

import { AdminPageHeader, AdminPageShell, AdminSurface } from "@/components/admin/AdminPageShell";
import { AdminProductForm } from "@/components/admin/products/AdminProductForm";
import {
  createSharedProduct,
  getSharedCategories,
  getSharedProducts,
} from "@/data/mock/shared-business-store";
import type { ProductValues } from "@/lib/validation";

export default function AdminNewProductPage() {
  function submit(values: ProductValues) {
    createSharedProduct({
      ...values,
      sku: values.sku || undefined,
      model: values.model || undefined,
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
        title="New Product"
        description="Create a storefront product using the shared admin/store mock source."
      />
      <AdminSurface>
        <AdminProductForm
          categories={getSharedCategories()}
          existingProducts={getSharedProducts()}
          onCancelHref="/admin/products"
          onSubmit={submit}
          submitLabel="Create Product"
        />
      </AdminSurface>
    </AdminPageShell>
  );
}
