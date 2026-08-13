"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ImagePlus, Trash2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Controller, useForm, useWatch } from "react-hook-form";
import { useMemo, useRef, useState } from "react";

import { FormField } from "@/components/forms/FormField";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Input } from "@/components/ui/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { cn } from "@/lib/utils";
import { productSchema, type ProductValues } from "@/lib/validation";
import type { Product, ProductCategory } from "@/types/domain";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

interface AdminProductFormProps {
  categories: ProductCategory[];
  existingProducts: Product[];
  initialProduct?: Product;
  submitLabel: string;
  onCancelHref: string;
  onSubmit: (values: ProductValues) => void;
}

export function AdminProductForm({
  categories,
  existingProducts,
  initialProduct,
  submitLabel,
  onCancelHref,
  onSubmit,
}: AdminProductFormProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const activeCategories = useMemo(
    () =>
      categories.filter(
        (category) =>
          category.status === "ACTIVE" ||
          category.id === initialProduct?.categoryId,
      ),
    [categories, initialProduct?.categoryId],
  );
  const [imagePreviews, setImagePreviews] = useState<string[]>(
    initialProduct?.images?.length ? initialProduct.images : [],
  );

  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
    setError,
    clearErrors,
    setValue,
  } = useForm<ProductValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: initialProduct?.name ?? "",
      slug: initialProduct?.slug ?? "",
      categoryId: initialProduct?.categoryId ?? "",
      sku: initialProduct?.sku ?? "",
      model: initialProduct?.model ?? "",
      summary: initialProduct?.summary ?? "",
      description: initialProduct?.description ?? "",
      priceUsd: initialProduct?.priceUsd ?? 0,
      availability: initialProduct?.availability ?? "in-stock",
      status: initialProduct?.status ?? "active",
      taxable: initialProduct?.taxable ?? false,
      shippingLabel: initialProduct?.shippingLabel ?? "",
      images: initialProduct?.images?.join("\n") ?? "",
    },
  });

  const selectedCategoryId = useWatch({
    control,
    name: "categoryId",
  });

  function syncImages(nextImages: string[]) {
    setImagePreviews(nextImages);
    setValue("images", nextImages.join("\n"), {
      shouldDirty: true,
      shouldValidate: true,
    });
    if (nextImages.length) {
      clearErrors("images");
    }
  }

  function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    const pickedFiles = Array.from(files);
    const validFiles = pickedFiles.filter((file) =>
      /image\/(png|jpeg|jpg|webp)/.test(file.type),
    );

    if (validFiles.length !== pickedFiles.length) {
      setError("images", {
        type: "manual",
        message: "Only PNG, JPG, JPEG, or WEBP images are supported.",
      });
      return;
    }

    Promise.all(
      validFiles.map(
        (file) =>
          new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result ?? ""));
            reader.onerror = () =>
              reject(new Error(`Unable to read ${file.name}.`));
            reader.readAsDataURL(file);
          }),
      ),
    )
      .then((results) => {
        syncImages([...imagePreviews, ...results]);
      })
      .catch(() => {
        setError("images", {
          type: "manual",
          message: "We could not read the selected image files.",
        });
      });
  }

  function removeImage(index: number) {
    syncImages(imagePreviews.filter((_, currentIndex) => currentIndex !== index));
  }

  function submit(values: ProductValues) {
    const duplicateName = existingProducts.some(
      (product) =>
        product.id !== initialProduct?.id &&
        product.name.toLowerCase() === values.name.toLowerCase(),
    );
    const duplicateSlug = existingProducts.some(
      (product) =>
        product.id !== initialProduct?.id &&
        product.slug.toLowerCase() === values.slug.toLowerCase(),
    );
    const duplicateSku =
      values.sku &&
      existingProducts.some(
        (product) =>
          product.id !== initialProduct?.id &&
          product.sku?.toLowerCase() === values.sku?.toLowerCase(),
      );

    if (duplicateName) {
      setError("name", {
        type: "manual",
        message: "A product with this name already exists.",
      });
      return;
    }

    if (duplicateSlug) {
      setError("slug", {
        type: "manual",
        message: "A product with this slug already exists.",
      });
      return;
    }

    if (duplicateSku) {
      setError("sku", {
        type: "manual",
        message: "A product with this SKU already exists.",
      });
      return;
    }

    if (!imagePreviews.length) {
      setError("images", {
        type: "manual",
        message: "Upload at least 1 product image.",
      });
      return;
    }

    onSubmit(values);
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit(submit)}>
      <div className="grid gap-4 md:grid-cols-2">
        <FormField error={errors.name?.message} htmlFor="product-name" label="Name" required>
          <Input
            id="product-name"
            placeholder="Elite 500 Performance"
            {...register("name", {
              onChange: (event) => {
                if (!initialProduct) {
                  setValue("slug", slugify(event.target.value), {
                    shouldValidate: true,
                  });
                }
              },
            })}
          />
        </FormField>

        <FormField error={errors.slug?.message} htmlFor="product-slug" label="Slug" required>
          <Input
            id="product-slug"
            placeholder="elite-500-performance"
            {...register("slug")}
          />
        </FormField>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <FormField error={errors.categoryId?.message} htmlFor="product-category" label="Category" required>
          <Controller
            control={control}
            name="categoryId"
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger id="product-category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {activeCategories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                      {category.status === "INACTIVE" ? " (Inactive)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </FormField>

        <FormField error={errors.sku?.message} htmlFor="product-sku" label="SKU">
          <Input id="product-sku" placeholder="ELT-500-PERF" {...register("sku")} />
        </FormField>

        <FormField error={errors.model?.message} htmlFor="product-model" label="Model">
          <Input id="product-model" placeholder="Elite 500" {...register("model")} />
        </FormField>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <FormField error={errors.summary?.message} htmlFor="product-summary" label="Summary" required>
          <Input
            id="product-summary"
            placeholder="Quiet-flow technology"
            {...register("summary")}
          />
        </FormField>

        <FormField error={errors.priceUsd?.message} htmlFor="product-price" label="Price (USD)" required>
          <Input
            id="product-price"
            inputMode="decimal"
            type="number"
            min={0}
            step="0.01"
            {...register("priceUsd", { valueAsNumber: true })}
          />
        </FormField>
      </div>

      <FormField error={errors.description?.message} htmlFor="product-description" label="Description" required>
        <Textarea
          id="product-description"
          className="min-h-28"
          placeholder="Describe the product clearly for admin and storefront use."
          {...register("description")}
        />
      </FormField>

      <div className="grid gap-4 md:grid-cols-1">
        <FormField error={errors.shippingLabel?.message} htmlFor="product-shipping" label="Shipping Information">
          <Input
            id="product-shipping"
            placeholder="Ships in 2 business days"
            {...register("shippingLabel")}
          />
        </FormField>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <FormField error={errors.availability?.message} htmlFor="product-availability" label="Availability" required>
          <Controller
            control={control}
            name="availability"
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger id="product-availability">
                  <SelectValue placeholder="Choose availability" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in-stock">In stock</SelectItem>
                  <SelectItem value="special-order">Special order</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </FormField>

        <FormField error={errors.status?.message} htmlFor="product-status" label="Status" required>
          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger id="product-status">
                  <SelectValue placeholder="Choose status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="archived">Inactive</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </FormField>

        <div className="flex items-end">
          <Controller
            control={control}
            name="taxable"
            render={({ field }) => (
              <Checkbox
                checked={field.value}
                label="Taxable product"
                onChange={(event) => field.onChange(event.target.checked)}
              />
            )}
          />
        </div>
      </div>

      <input type="hidden" {...register("images")} />

      <FormField
        error={errors.images?.message}
        htmlFor="product-images"
        hint="Upload at least 1 image. PNG, JPG, JPEG, and WEBP are supported."
        label="Product Images"
        required
      >
        <div className="space-y-4">
          <button
            id="product-images"
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex min-h-36 w-full flex-col items-center justify-center rounded-[1.25rem] border border-dashed border-teal-200 bg-teal-50/40 px-6 py-8 text-center transition hover:border-teal-300 hover:bg-teal-50"
          >
            <span className="flex size-12 items-center justify-center rounded-2xl bg-white text-teal-800 shadow-sm">
              <ImagePlus size={22} />
            </span>
            <span className="mt-4 text-base font-semibold text-slate-900">
              Upload product images
            </span>
            <span className="mt-1 text-sm text-slate-500">
              Click to browse files from your device.
            </span>
          </button>
          <input
            ref={fileInputRef}
            className="hidden"
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            multiple
            onChange={(event) => {
              handleFiles(event.target.files);
              event.currentTarget.value = "";
            }}
          />

          {imagePreviews.length ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {imagePreviews.map((image, index) => (
                <div
                  key={`${image.slice(0, 20)}-${index}`}
                  className="overflow-hidden rounded-[1.25rem] border border-teal-100 bg-white"
                >
                  <div className="relative aspect-[4/3] bg-slate-50">
                    <Image
                      src={image}
                      alt={`Product upload ${index + 1}`}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <div className="flex items-center justify-between gap-3 px-4 py-3">
                    <p className="truncate text-sm font-medium text-slate-700">
                      Image {index + 1}
                    </p>
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      onClick={() => removeImage(index)}
                      aria-label={`Remove image ${index + 1}`}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </FormField>

      <div className={cn("rounded-xl border border-teal-100 bg-teal-50/50 p-4 text-sm text-slate-600")}>
        Selected category:{" "}
        <span className="font-semibold text-slate-900">
          {categories.find((category) => category.id === selectedCategoryId)?.name ??
            "None"}
        </span>
      </div>

      <div className="flex flex-wrap justify-end gap-3">
        <Button asChild variant="outline">
          <Link href={onCancelHref}>Cancel</Link>
        </Button>
        <Button type="submit">{submitLabel}</Button>
      </div>
    </form>
  );
}
