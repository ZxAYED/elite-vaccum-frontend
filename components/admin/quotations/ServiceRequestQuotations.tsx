"use client";

import { useMemo, useState } from "react";
import {
  CalendarDays,
  FileText,
  Loader2,
  Pencil,
  Plus,
  ReceiptText,
  Send,
  Trash2,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { StatusBadge } from "@/components/customer-portal/StatusBadge";
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
  getSharedQuotations,
  deleteSharedQuotation,
  upsertSharedQuotation,
} from "@/data/mock/shared-business-store";
import { useSharedBusinessStoreVersion } from "@/hooks/useSharedBusinessStoreVersion";
import {
  formatCurrencyUsd,
  formatMonthDay,
  formatShortDateTime,
} from "@/lib/formatters";
import { formatStatusLabel } from "@/lib/status-labels";
import {
  useGetAdminQuotationsQuery,
  useDeleteQuotationMutation,
  useReviseQuotationMutation,
} from "@/redux/api/quotationsApi";
import type { AdminQuotation, ServiceRequest } from "@/types/domain";
import { QuotationModal } from "./QuotationModal";

interface ServiceRequestQuotationsProps {
  serviceRequest: ServiceRequest;
  isAccepted?: boolean;
}

export function ServiceRequestQuotations({
  serviceRequest,
  isAccepted = false,
}: ServiceRequestQuotationsProps) {
  useSharedBusinessStoreVersion();

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [activeQuotation, setActiveQuotation] = useState<AdminQuotation | null>(
    null,
  );
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const { data: apiResponse } = useGetAdminQuotationsQuery();
  const [deleteQuotationMutation, { isLoading: isDeleting }] =
    useDeleteQuotationMutation();
  const [reviseQuotationMutation] = useReviseQuotationMutation();

  const quotations = useMemo(() => {
    const map = new Map<string, AdminQuotation>();

    // 1. Attached quotations from service request itself
    if (serviceRequest.quotations && Array.isArray(serviceRequest.quotations)) {
      serviceRequest.quotations.forEach((q) => {
        if (q?.id) map.set(q.id, q);
      });
    }

    // 2. Quotations from API
    const apiItems = apiResponse?.items || [];
    apiItems.forEach((q) => {
      if (q.serviceRequestId === serviceRequest.id) {
        map.set(q.id, q);
      }
    });

    // 3. Quotations from shared business store
    const localItems = getSharedQuotations();
    localItems.forEach((q) => {
      if (q.serviceRequestId === serviceRequest.id) {
        map.set(q.id, q);
      }
    });

    return Array.from(map.values()).sort(
      (a, b) =>
        new Date(b.createdAt || b.issuedAt).getTime() -
        new Date(a.createdAt || a.issuedAt).getTime(),
    );
  }, [serviceRequest, apiResponse]);

  function handleCreateClick() {
    setActiveQuotation(null);
    setModalMode("create");
    setModalOpen(true);
  }

  function handleEditClick(quotation: AdminQuotation) {
    setActiveQuotation(quotation);
    setModalMode("edit");
    setModalOpen(true);
  }

  async function handleSendDraft(quotation: AdminQuotation) {
    try {
      await reviseQuotationMutation({
        id: quotation.id,
        body: {
          serviceRequestId: quotation.serviceRequestId,
          lineItems: quotation.lineItems,
          discountUsd: quotation.discountUsd,
          taxUsd: quotation.taxUsd,
          notes: quotation.notes,
        },
      }).unwrap();
    } catch {
      // Fallback handled locally
    }

    upsertSharedQuotation({
      id: quotation.id,
      requestId: quotation.serviceRequestId,
      serviceId: quotation.serviceId,
      customerId: quotation.customerId,
      lineItems: quotation.lineItems,
      discountUsd: quotation.discountUsd,
      taxUsd: quotation.taxUsd,
      notes: quotation.notes,
      terms: quotation.terms,
      expiresAt: quotation.expiresAt || undefined,
      status: "sent",
    });

    toast.success("Quotation sent to customer", {
      description: `Quotation ${quotation.id} is now awaiting customer review.`,
    });
  }

  async function handleConfirmDelete() {
    if (!deleteTargetId) return;

    try {
      await deleteQuotationMutation(deleteTargetId).unwrap();
    } catch {
      // Fallback handled locally
    }

    deleteSharedQuotation(deleteTargetId);
    toast.success("Quotation deleted successfully");
    setDeleteTargetId(null);
  }

  return (
    <section className="rounded-xl border border-teal-100 bg-white p-5 shadow-[0_14px_44px_-36px_rgba(28,79,80,0.34)]">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-teal-50 text-primary">
            <ReceiptText className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold text-teal-950">
                Service Quotations
              </h2>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                {quotations.length}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Manage itemized pricing, revisions, and customer proposals
            </p>
          </div>
        </div>

        <Button
          onClick={handleCreateClick}
          size="sm"
          className="gap-1.5 self-start sm:self-auto"
        >
          <Plus size={16} />
          Create Quotation
        </Button>
      </div>

      {/* Content */}
      <div className="mt-5 space-y-4">
        {quotations.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center">
            <FileText className="mx-auto size-10 text-slate-400" />
            <h3 className="mt-3 text-base font-medium text-slate-800">
              No quotations created yet
            </h3>
            <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
              {isAccepted
                ? "This service request has been accepted. Prepare and send an itemized quotation to the customer."
                : "Accept this service request first, or create a proposal draft now."}
            </p>
            <Button
              onClick={handleCreateClick}
              variant="outline"
              size="sm"
              className="mt-4 gap-1.5"
            >
              <Plus size={15} />
              Create First Quotation
            </Button>
          </div>
        ) : (
          quotations.map((quotation) => (
            <div
              key={quotation.id}
              className="rounded-xl border border-teal-100 bg-slate-50/40 p-4 transition-all hover:bg-slate-50/80"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="text-base font-medium text-primary">
                      {quotation.businessId || quotation.id}
                    </span>
                    <StatusBadge
                      label={formatStatusLabel(quotation.status)}
                      status={quotation.status}
                    />
                    {quotation.version ? (
                      <span className="rounded bg-slate-200/80 px-1.5 py-0.5 text-[11px] font-medium text-slate-600">
                        v{quotation.version}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Created {formatShortDateTime(quotation.createdAt || quotation.issuedAt)}
                    {quotation.sentAt ? ` · Sent ${formatShortDateTime(quotation.sentAt)}` : ""}
                  </p>
                </div>

                <div className="text-left sm:text-right">
                  <div className="text-xl font-semibold text-teal-950">
                    {formatCurrencyUsd(quotation.totalUsd)}
                  </div>
                  <div className="text-xs text-slate-500">
                    Subtotal: {formatCurrencyUsd(quotation.subtotalUsd)}
                    {quotation.discountUsd > 0
                      ? ` · Disc: -${formatCurrencyUsd(quotation.discountUsd)}`
                      : ""}
                    {quotation.taxUsd > 0
                      ? ` · Tax: +${formatCurrencyUsd(quotation.taxUsd)}`
                      : ""}
                  </div>
                </div>
              </div>

              {/* Line Items Overview */}
              {quotation.lineItems && quotation.lineItems.length > 0 ? (
                <div className="mt-3.5 rounded-lg border border-slate-200/70 bg-white p-3">
                  <div className="divide-y divide-slate-100 text-xs">
                    {quotation.lineItems.map((item, idx) => (
                      <div
                        key={item.id || idx}
                        className="flex items-center justify-between py-1.5 first:pt-0 last:pb-0"
                      >
                        <span className="font-medium text-slate-700">
                          {item.description}
                          <span className="ml-2 font-normal text-slate-400">
                            × {item.quantity}
                          </span>
                        </span>
                        <span className="font-medium text-slate-800">
                          {formatCurrencyUsd(item.quantity * item.unitPriceUsd)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Notes */}
              {quotation.notes ? (
                <p className="mt-2 text-xs text-slate-600 italic">
                  Note: {quotation.notes}
                </p>
              ) : null}

              {/* Expiry */}
              {quotation.expiresAt ? (
                <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                  <CalendarDays size={13} className="text-slate-400" />
                  <span>Valid until {formatMonthDay(quotation.expiresAt)}</span>
                </div>
              ) : null}

              {/* Actions */}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/60 pt-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditClick(quotation)}
                    className="h-8 gap-1 text-xs"
                  >
                    <Pencil size={13} />
                    Edit
                  </Button>

                  {quotation.status === "draft" ? (
                    <Button
                      size="sm"
                      onClick={() => handleSendDraft(quotation)}
                      className="h-8 gap-1 text-xs"
                    >
                      <Send size={13} />
                      Send to Customer
                    </Button>
                  ) : null}

                  {quotation.status !== "accepted" ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteTargetId(quotation.id)}
                      className="h-8 gap-1 text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                    >
                      <Trash2 size={13} />
                      Delete
                    </Button>
                  ) : null}
                </div>

                <Link
                  href={`/admin/quotations/${quotation.id}`}
                  className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                  <span>Full View</span>
                  <ExternalLink size={12} />
                </Link>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create / Edit Modal */}
      <QuotationModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        serviceRequest={serviceRequest}
        initialQuotation={activeQuotation}
        mode={modalMode}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={Boolean(deleteTargetId)}
        onOpenChange={(open) => !open && setDeleteTargetId(null)}
      >
        <DialogContent className="max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-slate-900">
              Delete Quotation
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-600">
              Are you sure you want to delete quotation{" "}
              <span className="font-semibold text-slate-800">{deleteTargetId}</span>?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-5 flex justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() => setDeleteTargetId(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? <Loader2 className="size-4 animate-spin mr-1.5" /> : null}
              Delete Quotation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
