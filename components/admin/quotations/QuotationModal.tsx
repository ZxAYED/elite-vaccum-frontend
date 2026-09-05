"use client";

import { useState } from "react";
import { Loader2, Plus, Trash2, ReceiptText, Send } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/Button";
import { DatePicker } from "@/components/ui/DatePicker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import {
  useCreateQuotationMutation,
  useReviseQuotationMutation,
} from "@/redux/api/quotationsApi";
import {
  upsertSharedQuotation,
  getSharedPublicServices,
} from "@/data/mock/shared-business-store";
import { formatCurrencyUsd } from "@/lib/formatters";
import type {
  AdminQuotation,
  FlexibleQuotationLineItem,
  ServiceRequest,
} from "@/types/domain";

interface QuotationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serviceRequest: ServiceRequest;
  initialQuotation?: AdminQuotation | null;
  mode?: "create" | "edit";
  onSuccess?: (quotation: AdminQuotation) => void;
}

interface FormLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPriceUsd: number;
}

export function QuotationModal({
  open,
  onOpenChange,
  serviceRequest,
  initialQuotation,
  mode = "create",
  onSuccess,
}: QuotationModalProps) {
  const matchedService = getSharedPublicServices().find(
    (s) => s.serviceId === serviceRequest.serviceId,
  );
  const serviceName =
    matchedService?.title || serviceRequest.title || "Central Vacuum Service";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(95vw,46rem)] max-w-3xl max-h-[90vh] overflow-y-auto p-6 sm:p-7">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary">
            <ReceiptText className="size-5" />
            <DialogTitle className="text-2xl font-medium tracking-[-0.03em] text-primary">
              {mode === "edit" ? "Edit Quotation" : "Create Service Quotation"}
            </DialogTitle>
          </div>
          <DialogDescription className="text-sm text-slate-600">
            For Request <span className="font-medium text-slate-800">{serviceRequest.id}</span> · {serviceName}
          </DialogDescription>
        </DialogHeader>

        {open ? (
          <QuotationModalForm
            key={initialQuotation?.id || "new"}
            serviceRequest={serviceRequest}
            initialQuotation={initialQuotation}
            mode={mode}
            serviceName={serviceName}
            onClose={() => onOpenChange(false)}
            onSuccess={onSuccess}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

interface QuotationModalFormProps {
  serviceRequest: ServiceRequest;
  initialQuotation?: AdminQuotation | null;
  mode: "create" | "edit";
  serviceName: string;
  onClose: () => void;
  onSuccess?: (quotation: AdminQuotation) => void;
}

function QuotationModalForm({
  serviceRequest,
  initialQuotation,
  mode,
  serviceName,
  onClose,
  onSuccess,
}: QuotationModalFormProps) {
  const [createQuotationMutation, { isLoading: isCreating }] =
    useCreateQuotationMutation();
  const [reviseQuotationMutation, { isLoading: isRevising }] =
    useReviseQuotationMutation();
  const isLoading = isCreating || isRevising;

  const [lineItems, setLineItems] = useState<FormLineItem[]>(() => {
    if (mode === "edit" && initialQuotation) {
      return initialQuotation.lineItems.map((item, idx) => ({
        id: item.id || `item-${idx}`,
        description: item.description,
        quantity: item.quantity,
        unitPriceUsd: item.unitPriceUsd,
      }));
    }
    const baseEstimate = serviceRequest.estimatedAmountUsd || 150;
    return [
      {
        id: `item-1`,
        description: `${serviceName} - Inspection & Service`,
        quantity: 1,
        unitPriceUsd: baseEstimate,
      },
    ];
  });

  const [discountUsd, setDiscountUsd] = useState<number | string>(() => {
    if (mode === "edit" && initialQuotation) {
      const d = Number(initialQuotation.discountUsd);
      return Number.isNaN(d) ? 0 : d;
    }
    return 0;
  });

  const [taxUsd, setTaxUsd] = useState<number | string>(() => {
    if (mode === "edit" && initialQuotation) {
      const t = Number(initialQuotation.taxUsd);
      return Number.isNaN(t) ? 0 : t;
    }
    return 0;
  });

  const [notes, setNotes] = useState<string>(() => {
    return mode === "edit" && initialQuotation
      ? initialQuotation.notes || ""
      : "Includes 1-year warranty on parts and labor.";
  });

  const [expiresAt, setExpiresAt] = useState<string>(() => {
    if (mode === "edit" && initialQuotation?.expiresAt) {
      return initialQuotation.expiresAt.slice(0, 10);
    }
    const defaultExp = new Date();
    defaultExp.setDate(defaultExp.getDate() + 14);
    return defaultExp.toISOString().slice(0, 10);
  });

  const [errorMsg, setErrorMsg] = useState<string>("");

  const numericDiscount = Number(discountUsd) || 0;
  const numericTax = Number(taxUsd) || 0;

  const subtotal = lineItems.reduce(
    (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPriceUsd) || 0),
    0,
  );
  const total = Math.max(0, subtotal + numericTax - numericDiscount);

  function handleAddLineItem() {
    setLineItems((prev) => [
      ...prev,
      {
        id: `item-${Date.now()}`,
        description: "",
        quantity: 1,
        unitPriceUsd: 0,
      },
    ]);
  }

  function handleRemoveLineItem(index: number) {
    if (lineItems.length <= 1) {
      toast.error("Quotation must have at least one line item.");
      return;
    }
    setLineItems((prev) => prev.filter((_, i) => i !== index));
  }

  function handleItemChange(
    index: number,
    field: keyof FormLineItem,
    value: string | number,
  ) {
    setLineItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    );
  }

  async function handleSubmit() {
    const invalidItems = lineItems.filter(
      (item) => !item.description.trim() || Number(item.quantity) <= 0,
    );
    if (invalidItems.length > 0) {
      setErrorMsg("All line items must have a description and quantity greater than zero.");
      return;
    }
    setErrorMsg("");

    const formattedLineItems: FlexibleQuotationLineItem[] = lineItems.map(
      (item, idx) => ({
        id: item.id || `qline-${Date.now()}-${idx}`,
        description: item.description.trim(),
        quantity: Number(item.quantity) || 1,
        unitPriceUsd: Number(item.unitPriceUsd) || 0,
      }),
    );

    const toastId = toast.loading(
      mode === "edit"
        ? "Updating quotation, please wait..."
        : "Creating quotation, please wait...",
    );

    if (mode === "edit" && initialQuotation) {
      try {
        const res = await reviseQuotationMutation({
          id: initialQuotation.id,
          body: {
            serviceRequestId: serviceRequest.id,
            lineItems: formattedLineItems.map((li) => ({
              description: li.description,
              quantity: li.quantity,
              unitPriceUsd: li.unitPriceUsd,
            })),
            discountUsd: numericDiscount,
            taxUsd: numericTax,
            notes: notes.trim() || undefined,
            expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
          },
        }).unwrap();

        let updated: AdminQuotation | undefined;
        try {
          updated = upsertSharedQuotation({
            id: initialQuotation.id,
            requestId: serviceRequest.id,
            serviceId:
              serviceRequest.serviceId ||
              ((serviceRequest as unknown as Record<string, unknown>).serviceSlug as string) ||
              "serv-101",
            customerId: serviceRequest.customerId || "cust-default",
            lineItems: formattedLineItems,
            discountUsd: numericDiscount,
            taxUsd: numericTax,
            notes: notes.trim() || undefined,
            expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
            status: initialQuotation.status,
            revisionReason: "Admin revised quotation on service request page",
          });
        } catch (localStoreErr) {
          console.warn("Local mock store synchronization skipped:", localStoreErr);
        }

        const successMsg =
          (res as unknown as { message?: string })?.message ||
          (res as unknown as { quotation?: { message?: string } })?.quotation?.message ||
          "Quotation revised successfully and revision history captured";

        toast.success(successMsg, { id: toastId });

        const quoteObj =
          (res as unknown as { quotation?: AdminQuotation })?.quotation ||
          ((res as AdminQuotation)?.id ? (res as AdminQuotation) : updated);
        if (quoteObj) {
          onSuccess?.(quoteObj);
        }
        onClose();
      } catch (err: unknown) {
        const errObj = err as {
          data?: { message?: string; error?: string };
          message?: string;
        };
        const msg =
          errObj?.data?.message ||
          errObj?.message ||
          "Failed to update quotation.";
        toast.error(msg, { id: toastId, duration: 8000 });
        setErrorMsg(msg);
      }
    } else {
      try {
        const createdFromApi = await createQuotationMutation({
          serviceRequestId: serviceRequest.id,
          lineItems: formattedLineItems.map((li) => ({
            description: li.description,
            quantity: li.quantity,
            unitPriceUsd: li.unitPriceUsd,
          })),
          discountUsd: numericDiscount,
          taxUsd: numericTax,
          notes: notes.trim() || undefined,
          expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
        }).unwrap();

        const createdQuote =
          (createdFromApi as unknown as { quotation?: AdminQuotation })?.quotation ||
          (createdFromApi as AdminQuotation);

        let localCreated: AdminQuotation | undefined;
        try {
          localCreated = upsertSharedQuotation({
            id: createdQuote?.id || `QUO-${Date.now().toString(36).toUpperCase()}`,
            requestId: serviceRequest.id,
            serviceId:
              serviceRequest.serviceId ||
              ((serviceRequest as unknown as Record<string, unknown>).serviceSlug as string) ||
              "serv-101",
            customerId: serviceRequest.customerId || "cust-default",
            lineItems: formattedLineItems,
            discountUsd: numericDiscount,
            taxUsd: numericTax,
            notes: notes.trim() || undefined,
            expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
            status: "sent",
          });
        } catch (localStoreErr) {
          console.warn("Local mock store synchronization skipped:", localStoreErr);
        }

        const finalQuotation = createdQuote || localCreated;
        const successMsg =
          (createdFromApi as unknown as { message?: string })?.message ||
          (createdFromApi as unknown as { quotation?: { message?: string } })?.quotation?.message ||
          `Quotation ${finalQuotation?.id || ""} created & issued to customer.`;

        toast.success(successMsg, { id: toastId });
        if (finalQuotation) {
          onSuccess?.(finalQuotation);
        }
        onClose();
      } catch (err: unknown) {
        const errObj = err as {
          data?: { message?: string; error?: string; code?: string };
          message?: string;
        };
        const msg =
          errObj?.data?.message ||
          errObj?.message ||
          "Failed to create quotation.";
        toast.error(msg, { id: toastId, duration: 8000 });
        setErrorMsg(msg);
      }
    }
  }

  return (
    <div className="mt-4 space-y-5">
      {errorMsg ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">
          {errorMsg}
        </div>
      ) : null}

      {/* Line Items */}
      <div>
        <div className="mb-2.5 flex items-center justify-between">
          <label className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Line Items
          </label>
          <button
            type="button"
            onClick={handleAddLineItem}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline cursor-pointer"
          >
            <Plus size={14} />
            Add Line Item
          </button>
        </div>

        <div className="space-y-2.5">
          {lineItems.map((item, index) => {
            const itemTotal =
              (Number(item.quantity) || 0) * (Number(item.unitPriceUsd) || 0);
            return (
              <div
                key={item.id}
                className="flex flex-col gap-2 rounded-xl border border-teal-100/80 bg-teal-50/20 p-3 sm:flex-row sm:items-center"
              >
                <div className="flex-1">
                  <Input
                    value={item.description}
                    onChange={(e) =>
                      handleItemChange(index, "description", e.target.value)
                    }
                    placeholder="Item or service description..."
                    className="h-9.5 text-sm bg-white"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-20">
                    <Input
                      type="number"
                      min="1"
                      step="1"
                      value={item.quantity}
                      onChange={(e) =>
                        handleItemChange(
                          index,
                          "quantity",
                          Math.max(1, Number(e.target.value)),
                        )
                      }
                      placeholder="Qty"
                      className="h-9.5 text-sm bg-white text-center"
                    />
                  </div>
                  <div className="w-28">
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                        $
                      </span>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitPriceUsd}
                        onChange={(e) =>
                          handleItemChange(
                            index,
                            "unitPriceUsd",
                            Math.max(0, Number(e.target.value)),
                          )
                        }
                        placeholder="0.00"
                        className="h-9.5 pl-6 text-sm bg-white"
                      />
                    </div>
                  </div>
                  <div className="w-24 text-right text-sm font-medium text-slate-700">
                    {formatCurrencyUsd(itemTotal)}
                  </div>
                  {lineItems.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => handleRemoveLineItem(index)}
                      className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                      aria-label="Remove item"
                    >
                      <Trash2 size={15} />
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pricing Adjustments */}
      <div className="rounded-xl border border-teal-100 bg-slate-50/70 p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1.5 text-sm font-medium text-slate-700">
            <span>Discount ($)</span>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={discountUsd === 0 && mode === "create" ? "" : discountUsd}
              onChange={(e) => {
                const val = e.target.value;
                setDiscountUsd(val === "" ? "" : Math.max(0, Number(val)));
              }}
              placeholder="0.00"
              className="bg-white h-9.5"
            />
          </label>
          <label className="space-y-1.5 text-sm font-medium text-slate-700">
            <span>Tax ($)</span>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={taxUsd === 0 && mode === "create" ? "" : taxUsd}
              onChange={(e) => {
                const val = e.target.value;
                setTaxUsd(val === "" ? "" : Math.max(0, Number(val)));
              }}
              placeholder="0.00"
              className="bg-white h-9.5"
            />
          </label>
        </div>

        <div className="mt-4 flex flex-col gap-1 border-t border-slate-200 pt-3 text-right">
          <div className="flex justify-between text-xs text-slate-500">
            <span>Subtotal</span>
            <span>{formatCurrencyUsd(subtotal)}</span>
          </div>
          {numericDiscount > 0 ? (
            <div className="flex justify-between text-xs text-emerald-600">
              <span>Discount</span>
              <span>-{formatCurrencyUsd(numericDiscount)}</span>
            </div>
          ) : null}
          {numericTax > 0 ? (
            <div className="flex justify-between text-xs text-slate-500">
              <span>Tax</span>
              <span>+{formatCurrencyUsd(numericTax)}</span>
            </div>
          ) : null}
          <div className="flex justify-between text-base font-semibold text-primary pt-1">
            <span>Total Quotation</span>
            <span>{formatCurrencyUsd(total)}</span>
          </div>
        </div>
      </div>

      {/* Expiration & Notes */}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1.5 text-sm font-medium text-slate-700 sm:col-span-2">
          <span>Customer Notes / Scope of Work</span>
          <Textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Details on parts, warranty, and estimated hours..."
            className="bg-white text-sm"
          />
        </label>
        <div className="space-y-1.5 text-sm font-medium text-slate-700">
          <span>Quotation Expiration Date</span>
          <DatePicker
            value={expiresAt}
            onChange={(val) => setExpiresAt(val)}
            minDate={new Date().toISOString().slice(0, 10)}
            size="sm"
            placeholder="Select expiration date..."
            className="bg-white"
          />
        </div>
      </div>

      <DialogFooter className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between sm:space-x-2">
        <Button
          type="button"
          variant="ghost"
          onClick={onClose}
          disabled={isLoading}
        >
          Cancel
        </Button>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="size-4 animate-spin mr-2" />
            ) : mode === "create" ? (
              <Send size={15} className="mr-1.5" />
            ) : null}
            {mode === "create" ? "Create & Send" : "Save Changes"}
          </Button>
        </div>
      </DialogFooter>
    </div>
  );
}
