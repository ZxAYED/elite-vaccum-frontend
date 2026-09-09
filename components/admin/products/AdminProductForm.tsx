"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ImagePlus, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { useMemo, useRef, useState } from "react";

import { FormField } from "@/components/forms/FormField";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { Switch } from "@/components/ui/Switch";
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
  isLoadingCategories?: boolean;
  submitLabel: string;
  onCancelHref: string;
  onSubmit: (values: ProductValues) => void;
}

export function AdminProductForm({
  categories,
  existingProducts,
  initialProduct,
  isLoadingCategories = false,
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
    initialProduct?.images?.length
      ? initialProduct.images.map((img) => (typeof img === "string" ? img : img.url))
      : [],
  );
  const [deletedImageIds, setDeletedImageIds] = useState<string[]>([]);

  const initialHighlights =
    initialProduct?.highlights?.map((h, i) => ({
      text: typeof h === "string" ? h : (h as { text: string }).text,
      sortOrder: i,
    })) ?? [];

  const initialSpecs =
    initialProduct?.specifications?.map((s, i) => ({
      label: s.label,
      value: s.value,
      sortOrder: i,
    })) ?? [];

  const initialShippingNotes =
    initialProduct?.shippingNotes?.map((n, i) => ({
      text: typeof n === "string" ? n : (n as { text: string }).text,
      sortOrder: i,
    })) ?? [];

  const {
    control,
    formState: { errors, isSubmitting },
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
      quantity: initialProduct?.quantity ?? 0,
      popularityRank: initialProduct?.popularityRank ?? 0,
      availability: (() => {
        const raw = String(initialProduct?.availability || "").toUpperCase().replace("-", "_");
        if (raw === "IN_STOCK" || raw === "LOW_STOCK" || raw === "OUT_OF_STOCK" || raw === "BACKORDER" || raw === "PREORDER" || raw === "DISCONTINUED") {
          return raw;
        }
        if (raw === "SPECIAL_ORDER") return "BACKORDER" as const;
        return "IN_STOCK" as const;
      })(),
      status: (() => {
        const raw = String(initialProduct?.status || "").toUpperCase();
        if (raw === "ACTIVE" || raw === "DRAFT" || raw === "ARCHIVED") {
          return raw;
        }
        return "ACTIVE" as const;
      })(),
      taxable: initialProduct?.taxable ?? true,
      isFeatured: initialProduct?.isFeatured ?? false,
      shippingLabel: initialProduct?.shippingLabel ?? "",
      imageAlt: initialProduct?.imageAlt ?? "",
      highlights: initialHighlights,
      specifications: initialSpecs,
      shippingNotes: initialShippingNotes,
      images:
        initialProduct?.images
          ?.map((img) => (typeof img === "string" ? img : img.url))
          .join("\n") ?? "",
      deleteImageIds: [],
    },
  });

  const {
    fields: highlightFields,
    append: appendHighlight,
    remove: removeHighlight,
  } = useFieldArray({
    control,
    name: "highlights",
  });

  const {
    fields: specFields,
    append: appendSpec,
    remove: removeSpec,
  } = useFieldArray({
    control,
    name: "specifications",
  });

  const {
    fields: noteFields,
    append: appendNote,
    remove: removeNote,
  } = useFieldArray({
    control,
    name: "shippingNotes",
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
    const rawImg = initialProduct?.images?.[index];
    if (rawImg && typeof rawImg === "object" && "id" in rawImg && rawImg.id) {
      setDeletedImageIds((prev) => [...prev, String(rawImg.id)]);
    }
    syncImages(imagePreviews.filter((_, currentIndex) => currentIndex !== index));
  }

  function submit(values: ProductValues) {
    const duplicateName = existingProducts.some(
      (product) =>
        product.id !== initialProduct?.id &&
        product.name.toLowerCase() === values.name.toLowerCase(),
    );
    if (duplicateName) {
      setError("name", {
        type: "manual",
        message: "A product with this name already exists.",
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

    const resolvedSlug =
      initialProduct?.slug ||
      (values.slug?.trim() ? slugify(values.slug) : slugify(values.name));

    const sanitizedHighlights = values.highlights
      ?.filter((h) => h.text.trim())
      .map((h, i) => ({ text: h.text.trim(), sortOrder: i }));

    const sanitizedSpecs = values.specifications
      ?.filter((s) => s.label.trim() && s.value.trim())
      .map((s, i) => ({
        label: s.label.trim(),
        value: s.value.trim(),
        sortOrder: i,
      }));

    const sanitizedShippingNotes = values.shippingNotes
      ?.filter((n) => n.text.trim())
      .map((n, i) => ({ text: n.text.trim(), sortOrder: i }));

    onSubmit({
      ...values,
      slug: resolvedSlug,
      highlights: sanitizedHighlights,
      specifications: sanitizedSpecs,
      shippingNotes: sanitizedShippingNotes,
      deleteImageIds: deletedImageIds,
    });
  }

  return (
    <form
      className="space-y-8"
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        handleSubmit(
          submit,
          (formErrors) => {
            console.error("Product form validation errors:", formErrors);
          }
        )(e);
      }}
    >
      {/* 1. Basic Product Identity */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-slate-900">Basic Information</h3>
        <FormField error={errors.name?.message} htmlFor="product-name" label="Name" required>
          <Input
            id="product-name"
            placeholder="Silent Master S900 Central Vacuum Power Unit"
            {...register("name")}
          />
        </FormField>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField error={errors.categoryId?.message} htmlFor="product-category" label="Category" required>
            <Controller
              control={control}
              name="categoryId"
              render={({ field }) => (
                <Select
                  disabled={isLoadingCategories || activeCategories.length === 0}
                  onValueChange={field.onChange}
                  value={field.value}
                >
                  <SelectTrigger id="product-category">
                    <SelectValue
                      placeholder={
                        isLoadingCategories
                          ? "Loading categories..."
                          : activeCategories.length === 0
                          ? "No categories found"
                          : "Select category"
                      }
                    />
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

          <FormField error={errors.model?.message} htmlFor="product-model" label="Model">
            <Input id="product-model" placeholder="S900-PRO-ELITE" {...register("model")} />
          </FormField>
        </div>

        <FormField error={errors.summary?.message} htmlFor="product-summary" label="Summary" required>
          <Input
            id="product-summary"
            placeholder="Heavy-duty central vacuum designed for homes up to 10,000 sq ft."
            {...register("summary")}
          />
        </FormField>

        <FormField error={errors.description?.message} htmlFor="product-description" label="Description" required>
          <Textarea
            id="product-description"
            className="min-h-28"
            placeholder="<p>Detailed description of features, durability, and filtration system.</p>"
            {...register("description")}
          />
        </FormField>
      </section>

      {/* 2. Pricing, Inventory & Settings */}
      <section className="space-y-4 pt-4 border-t border-slate-100">
        <h3 className="text-base font-semibold text-slate-900">Pricing, Inventory & Flags</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

          <FormField error={errors.quantity?.message} htmlFor="product-quantity" label="Quantity">
            <Input
              id="product-quantity"
              type="number"
              min={0}
              placeholder="0"
              {...register("quantity", { valueAsNumber: true })}
            />
          </FormField>

          <FormField error={errors.popularityRank?.message} htmlFor="product-popularity" label="Popularity Rank">
            <Input
              id="product-popularity"
              type="number"
              min={0}
              placeholder="0"
              {...register("popularityRank", { valueAsNumber: true })}
            />
          </FormField>

          <FormField error={errors.shippingLabel?.message} htmlFor="product-shipping" label="Shipping Label">
            <Input
              id="product-shipping"
              placeholder="Free Standard Freight Shipping"
              {...register("shippingLabel")}
            />
          </FormField>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
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
                    <SelectItem value="IN_STOCK">In Stock</SelectItem>
                    <SelectItem value="LOW_STOCK">Low Stock</SelectItem>
                    <SelectItem value="OUT_OF_STOCK">Out of Stock</SelectItem>
                    <SelectItem value="BACKORDER">Backorder</SelectItem>
                    <SelectItem value="PREORDER">Pre-order</SelectItem>
                    <SelectItem value="DISCONTINUED">Discontinued</SelectItem>
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
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="ARCHIVED">Archived / Inactive</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </FormField>
        </div>

        {/* Feature & Tax switches */}
        <div className="grid gap-4 sm:grid-cols-2 pt-2">
          <div className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50/50 p-4">
            <div className="space-y-0.5">
              <label htmlFor="product-is-featured" className="text-sm font-medium text-slate-800 cursor-pointer">
                Featured Product
              </label>
              <p className="text-xs text-slate-500">Showcase this unit prominently in storefront banners.</p>
            </div>
            <Controller
              control={control}
              name="isFeatured"
              render={({ field }) => (
                <Switch
                  id="product-is-featured"
                  checked={Boolean(field.value)}
                  onCheckedChange={field.onChange}
                />
              )}
            />
          </div>

          <div className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50/50 p-4">
            <div className="space-y-0.5">
              <label htmlFor="product-taxable" className="text-sm font-medium text-slate-800 cursor-pointer">
                Taxable Item
              </label>
              <p className="text-xs text-slate-500">Apply standard sales tax calculation at checkout.</p>
            </div>
            <Controller
              control={control}
              name="taxable"
              render={({ field }) => (
                <Switch
                  id="product-taxable"
                  checked={Boolean(field.value)}
                  onCheckedChange={field.onChange}
                />
              )}
            />
          </div>
        </div>
      </section>

      {/* 3. Product Highlights */}
      <section className="space-y-4 pt-4 border-t border-slate-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Highlights</h3>
            <p className="text-xs text-slate-500">Key bullet points displayed on product detail cards.</p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => appendHighlight({ text: "", sortOrder: highlightFields.length })}
            className="gap-1.5"
          >
            <Plus size={15} /> Add Highlight
          </Button>
        </div>

        {highlightFields.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-xs text-slate-400">
            No highlights added. Click above to add product selling points.
          </p>
        ) : (
          <div className="space-y-2.5">
            {highlightFields.map((field, index) => (
              <div key={field.id} className="flex items-center gap-2">
                <Input
                  placeholder="e.g. Ultra-quiet 58 dB sound level"
                  {...register(`highlights.${index}.text`)}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => removeHighlight(index)}
                  className="text-slate-400 hover:text-red-600"
                  aria-label={`Remove highlight ${index + 1}`}
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 4. Specifications */}
      <section className="space-y-4 pt-4 border-t border-slate-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Technical Specifications</h3>
            <p className="text-xs text-slate-500">Structured label/value attributes (e.g. Air Watts, Coverage).</p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => appendSpec({ label: "", value: "", sortOrder: specFields.length })}
            className="gap-1.5"
          >
            <Plus size={15} /> Add Specification
          </Button>
        </div>

        {specFields.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-xs text-slate-400">
            No specifications added. Click above to add technical parameters.
          </p>
        ) : (
          <div className="space-y-2.5">
            {specFields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-1 sm:grid-cols-[1fr_1.5fr_auto] items-center gap-2">
                <Input
                  placeholder="Label (e.g. Motor Type)"
                  {...register(`specifications.${index}.label`)}
                />
                <Input
                  placeholder="Value (e.g. Dual-Stage 120V)"
                  {...register(`specifications.${index}.value`)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => removeSpec(index)}
                  className="text-slate-400 hover:text-red-600"
                  aria-label={`Remove specification ${index + 1}`}
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 5. Shipping Notes */}
      <section className="space-y-4 pt-4 border-t border-slate-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Shipping & Delivery Notes</h3>
            <p className="text-xs text-slate-500">Handling, signature, and dispatch guidelines.</p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => appendNote({ text: "", sortOrder: noteFields.length })}
            className="gap-1.5"
          >
            <Plus size={15} /> Add Shipping Note
          </Button>
        </div>

        {noteFields.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-xs text-slate-400">
            No shipping notes added. Click above to add dispatch details.
          </p>
        ) : (
          <div className="space-y-2.5">
            {noteFields.map((field, index) => (
              <div key={field.id} className="flex items-center gap-2">
                <Input
                  placeholder="e.g. Ships within 1-2 business days via FedEx Ground"
                  {...register(`shippingNotes.${index}.text`)}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => removeNote(index)}
                  className="text-slate-400 hover:text-red-600"
                  aria-label={`Remove note ${index + 1}`}
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 6. Media & Image Alt */}
      <section className="space-y-4 pt-4 border-t border-slate-100">
        <h3 className="text-base font-semibold text-slate-900">Product Images & Accessibility</h3>
        <FormField error={errors.imageAlt?.message} htmlFor="product-image-alt" label="Image Alt Description">
          <Input
            id="product-image-alt"
            placeholder="Silent Master S900 Power Unit front main view"
            {...register("imageAlt")}
          />
        </FormField>

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
                      <div className="flex items-center gap-2 truncate">
                        <p className="truncate text-sm font-medium text-slate-700">
                          Image {index + 1}
                        </p>
                        {index === 0 && (
                          <span className="rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-semibold text-teal-800">
                            Primary
                          </span>
                        )}
                      </div>
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
      </section>

      <div className={cn("rounded-xl border border-teal-100 bg-teal-50/50 p-4 text-sm text-slate-600")}>
        Selected category:{" "}
        <span className="font-semibold text-slate-900">
          {categories.find((category) => category.id === selectedCategoryId)?.name ??
            "None"}
        </span>
      </div>

      <div className="flex flex-wrap justify-end gap-3 pt-2">
        <Button asChild variant="outline">
          <Link href={onCancelHref}>Cancel</Link>
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
