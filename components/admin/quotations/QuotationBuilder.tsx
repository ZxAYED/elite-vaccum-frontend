"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarDays, Plus, Send, Trash2 } from "lucide-react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { useMemo, useState } from "react";

import { AdminSurface } from "@/components/admin/AdminPageShell";
import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/Popover";
import { Textarea } from "@/components/ui/Textarea";
import { calculateQuotationTotals } from "@/data/mock/quotations";
import { formatCurrencyUsd } from "@/lib/formatters";
import {
  quotationBuilderSchema,
  type QuotationBuilderValues,
} from "@/lib/validation";
import { cn } from "@/lib/utils";
import type { AdminQuotation } from "@/types/domain";

interface QuotationBuilderProps {
  initialQuotation: AdminQuotation;
  mode: "create" | "edit" | "revise";
  onSaveDraft?: (values: QuotationBuilderValues) => void;
  onSend?: (values: QuotationBuilderValues) => void;
}

export function QuotationBuilder({
  initialQuotation,
  mode,
  onSaveDraft,
  onSend,
}: QuotationBuilderProps) {
  const [confirmSendOpen, setConfirmSendOpen] = useState(false);
  const [lastAction, setLastAction] = useState<string | null>(null);
  const [expiryOpen, setExpiryOpen] = useState(false);

  const form = useForm<QuotationBuilderValues>({
    resolver: zodResolver(quotationBuilderSchema),
    defaultValues: {
      lineItems: initialQuotation.lineItems,
      discountUsd: initialQuotation.discountUsd,
      taxUsd: initialQuotation.taxUsd,
      notes: initialQuotation.notes ?? "",
      terms: initialQuotation.terms ?? "",
      expiresAt: initialQuotation.expiresAt
        ? initialQuotation.expiresAt.slice(0, 10)
        : "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "lineItems",
  });

  const watchedItems = useWatch({
    control: form.control,
    name: "lineItems",
  });
  const watchedTax =
    useWatch({
      control: form.control,
      name: "taxUsd",
    }) ?? 0;
  const watchedDiscount =
    useWatch({
      control: form.control,
      name: "discountUsd",
    }) ?? 0;
  const watchedExpiry =
    useWatch({
      control: form.control,
      name: "expiresAt",
    }) ?? "";

  const totals = useMemo(
    () =>
      calculateQuotationTotals(
        watchedItems ?? [],
        Number(watchedTax || 0),
        Number(watchedDiscount || 0),
      ),
    [watchedDiscount, watchedItems, watchedTax],
  );

  const saveDraft = form.handleSubmit((values) => {
    setLastAction("Draft saved locally.");
    onSaveDraft?.(values);
  });

  const sendQuote = form.handleSubmit(() => {
    setConfirmSendOpen(true);
  });

  const confirmSend = form.handleSubmit((values) => {
    setConfirmSendOpen(false);
    setLastAction("Quotation sent locally.");
    onSend?.(values);
  });

  return (
    <AdminSurface className="space-y-5">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.34em] text-teal-700">
          Quotation Builder
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-primary">
          {mode === "create"
            ? "Create quotation"
            : mode === "revise"
              ? `Revise ${initialQuotation.id}`
              : `Edit ${initialQuotation.id}`}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Flexible line items, optional expiry, and local-only draft/send actions.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_19rem]">
        <div className="space-y-3.5">
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="rounded-lg border border-teal-100 bg-teal-50/25 p-4"
            >
              <div className="mb-2.5 flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-primary">
                  Item {index + 1}
                </p>
                {fields.length > 1 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => remove(index)}
                    aria-label="Remove line item"
                  >
                    <Trash2 size={16} />
                  </Button>
                ) : null}
              </div>

              <div className="grid gap-3 md:grid-cols-[1fr_7rem_9rem]">
                <label className="space-y-1.5 text-sm font-medium text-slate-700">
                  <span>Description</span>
                  <Input
                    {...form.register(`lineItems.${index}.description`)}
                    placeholder="Labor, parts, inspection..."
                  />
                </label>
                <label className="space-y-1.5 text-sm font-medium text-slate-700">
                  <span>Qty</span>
                  <Input
                    type="number"
                    step="0.01"
                    {...form.register(`lineItems.${index}.quantity`, {
                      valueAsNumber: true,
                    })}
                  />
                </label>
                <label className="space-y-1.5 text-sm font-medium text-slate-700">
                  <span>Unit price</span>
                  <Input
                    type="number"
                    step="0.01"
                    {...form.register(`lineItems.${index}.unitPriceUsd`, {
                      valueAsNumber: true,
                    })}
                  />
                </label>
              </div>

              <label className="mt-3 block space-y-1.5 text-sm font-medium text-slate-700">
                <span>Optional item note</span>
                <Input
                  {...form.register(`lineItems.${index}.note`)}
                  placeholder="Internal or customer-facing note"
                />
              </label>
            </div>
          ))}

          {form.formState.errors.lineItems?.message ? (
            <p className="text-sm text-red-600">
              {form.formState.errors.lineItems.message}
            </p>
          ) : null}

          <Button
            type="button"
            variant="soft"
            onClick={() =>
              append({
                id: `qline-${Date.now()}`,
                description: "",
                quantity: 1,
                unitPriceUsd: 0,
                note: "",
              })
            }
          >
            <Plus size={16} />
            Add line item
          </Button>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1.5 text-sm font-medium text-slate-700">
              <span>Customer notes</span>
              <Textarea
                {...form.register("notes")}
                placeholder="Scope notes, exclusions, or inspection guidance..."
              />
            </label>
            <label className="space-y-1.5 text-sm font-medium text-slate-700">
              <span>Terms</span>
              <Textarea
                {...form.register("terms")}
                placeholder="Approval terms and authorization language..."
              />
            </label>
          </div>
        </div>

        <aside className="h-fit rounded-lg border border-teal-100 bg-white p-4">
          <h3 className="text-lg font-semibold text-primary">Pricing summary</h3>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-slate-500">Subtotal</span>
              <strong>{formatCurrencyUsd(totals.subtotalUsd)}</strong>
            </div>
            <label className="space-y-1.5 text-slate-700">
              <span>Tax</span>
              <Input
                type="number"
                step="0.01"
                {...form.register("taxUsd", { valueAsNumber: true })}
              />
            </label>
            <label className="space-y-1.5 text-slate-700">
              <span>Discount</span>
              <Input
                type="number"
                step="0.01"
                {...form.register("discountUsd", { valueAsNumber: true })}
              />
            </label>
            <label className="space-y-1.5 text-slate-700">
              <span>Optional expiry</span>
              <Popover open={expiryOpen} onOpenChange={setExpiryOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      "flex h-12 w-full items-center justify-between rounded-[var(--radius-control)] border border-teal-100 bg-white px-4 text-left text-sm text-slate-800 shadow-[0_18px_36px_-30px_rgba(28,79,80,0.25)] outline-none transition hover:border-teal-200 focus-visible:border-teal-200 focus-visible:ring-2 focus-visible:ring-[color:var(--focus-ring)]",
                      !watchedExpiry && "text-slate-400",
                    )}
                  >
                    <span>{watchedExpiry || "Select expiry date"}</span>
                    <CalendarDays size={16} className="text-slate-400" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-[18rem] p-3">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-primary">
                        Quotation expiry
                      </p>
                      {watchedExpiry ? (
                        <button
                          type="button"
                          onClick={() => {
                            form.setValue("expiresAt", "");
                            setExpiryOpen(false);
                          }}
                          className="text-xs font-medium text-slate-500 transition hover:text-teal-700"
                        >
                          Clear
                        </button>
                      ) : null}
                    </div>
                    <Input
                      type="date"
                      value={watchedExpiry}
                      onChange={(event) => {
                        form.setValue("expiresAt", event.target.value, {
                          shouldDirty: true,
                          shouldValidate: true,
                        });
                        if (event.target.value) {
                          setExpiryOpen(false);
                        }
                      }}
                    />
                    <p className="text-xs leading-5 text-slate-500">
                      Expiry remains optional and is shown only when the quotation
                      includes a date.
                    </p>
                  </div>
                </PopoverContent>
              </Popover>
            </label>
            {form.formState.errors.discountUsd?.message ? (
              <p className="text-sm text-red-600">
                {form.formState.errors.discountUsd.message}
              </p>
            ) : null}
            <div className="border-t border-teal-100 pt-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700">Total</span>
                <strong className="text-2xl text-primary">
                  {formatCurrencyUsd(totals.totalUsd)}
                </strong>
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-3">
            <Button type="button" variant="outline" onClick={saveDraft}>
              Save Draft
            </Button>
            <Button type="button" onClick={sendQuote}>
              <Send size={16} />
              Send Quotation
            </Button>
            {lastAction ? (
              <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">
                {lastAction}
              </p>
            ) : null}
          </div>
        </aside>
      </div>

      <Dialog open={confirmSendOpen} onOpenChange={setConfirmSendOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send quotation?</DialogTitle>
            <DialogDescription>
              This marks the quotation as sent in the local admin preview. The
              customer dashboard can then review the quote.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmSendOpen(false)}>
              Keep editing
            </Button>
            <Button onClick={confirmSend}>Send quotation</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminSurface>
  );
}
