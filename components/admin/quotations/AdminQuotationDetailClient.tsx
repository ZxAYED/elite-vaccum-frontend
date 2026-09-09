"use client";

import {
  ArrowLeft,
  CalendarDays,
  History,
  LinkIcon,
  ReceiptText,
  RefreshCw,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { useMemo, useState } from "react";

import {
  AdminPageHeader,
  AdminPageShell,
  AdminSurface,
} from "@/components/admin/AdminPageShell";
import { QuotationBuilder } from "@/components/admin/quotations/QuotationBuilder";
import { StatusBadge } from "@/components/customer-portal/StatusBadge";
import { MediaGalleryPreview } from "@/components/shared/MediaGalleryPreview";
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
  buildQuotationFromRequest,
  calculateQuotationTotals,
  getQuotationById,
  getQuotationCustomer,
  getQuotationRequest,
  getQuotationService,
} from "@/data/mock/quotations";
import {
  deleteSharedQuotation,
  getSharedServiceRequestById,
  upsertSharedQuotation,
} from "@/data/mock/shared-business-store";
import { useSharedBusinessStoreVersion } from "@/hooks/useSharedBusinessStoreVersion";
import { formatCurrencyUsd, formatShortDate, formatShortDateTime } from "@/lib/formatters";
import { formatStatusLabel } from "@/lib/status-labels";
import {
  useCreateQuotationMutation,
  useReviseQuotationMutation,
} from "@/redux/api/quotationsApi";
import { toast } from "sonner";
import type { QuotationBuilderValues } from "@/lib/validation";
import type { AdminQuotation, QuoteStatus } from "@/types/domain";

interface AdminQuotationDetailClientProps {
  quotationId?: string;
  requestId?: string;
  mode?: string;
}

function applyBuilderValues(
  quotation: AdminQuotation,
  values: QuotationBuilderValues,
  status: QuoteStatus,
) {
  const totals = calculateQuotationTotals(
    values.lineItems,
    values.taxUsd,
    values.discountUsd,
  );
  const now = new Date().toISOString();

  return {
    ...quotation,
    ...totals,
    lineItems: values.lineItems,
    notes: values.notes,
    terms: values.terms,
    expiresAt: values.expiresAt
      ? new Date(`${values.expiresAt}T23:59:00.000Z`).toISOString()
      : "",
    status,
    issuedAt: status === "sent" ? now : quotation.issuedAt,
    sentAt: status === "sent" ? now : quotation.sentAt,
    updatedAt: now,
  };
}

export function AdminQuotationDetailClient({
  quotationId,
  requestId,
  mode,
}: AdminQuotationDetailClientProps) {
  useSharedBusinessStoreVersion();
  const initialQuotation = useMemo(() => {
    if (quotationId) return getQuotationById(quotationId);
    const request = requestId ? getSharedServiceRequestById(requestId) : undefined;
    return request ? buildQuotationFromRequest(request) : undefined;
  }, [quotationId, requestId]);

  if (!initialQuotation) {
    notFound();
  }

  const [deleted, setDeleted] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const quotation = quotationId
    ? getQuotationById(quotationId) ?? initialQuotation
    : initialQuotation;

  if (!quotation) {
    notFound();
  }

  const [createQuotationMutation] = useCreateQuotationMutation();
  const [reviseQuotationMutation] = useReviseQuotationMutation();

  const request = getQuotationRequest(quotation);
  const customer = getQuotationCustomer(quotation);
  const service = getQuotationService(quotation);
  const editingMode =
    !quotationId || mode === "edit" || mode === "revise" || quotation.status === "draft";

  async function save(values: QuotationBuilderValues) {
    const next = applyBuilderValues(quotation, values, "draft");
    upsertSharedQuotation({
      id: next.id,
      requestId: next.serviceRequestId,
      serviceId: next.serviceId,
      customerId: next.customerId,
      lineItems: next.lineItems,
      taxUsd: next.taxUsd,
      discountUsd: next.discountUsd,
      notes: next.notes,
      terms: next.terms,
      expiresAt: next.expiresAt || undefined,
      status: next.status,
    });

    if (!quotationId || mode === "create") {
      try {
        await createQuotationMutation({
          serviceRequestId: quotation.serviceRequestId,
          lineItems: values.lineItems.map((li) => ({
            description: li.description,
            quantity: li.quantity,
            unitPriceUsd: li.unitPriceUsd,
          })),
          discountUsd: values.discountUsd,
          taxUsd: values.taxUsd,
          notes: values.notes,
        }).unwrap();
        toast.success("Quotation draft saved.");
      } catch {
        // Fallback handled locally
      }
    } else {
      try {
        await reviseQuotationMutation({
          id: quotation.id,
          body: {
            serviceRequestId: quotation.serviceRequestId,
            lineItems: values.lineItems.map((li) => ({
              description: li.description,
              quantity: li.quantity,
              unitPriceUsd: li.unitPriceUsd,
            })),
            discountUsd: values.discountUsd,
            taxUsd: values.taxUsd,
            notes: values.notes,
          },
        }).unwrap();
        toast.success("Quotation draft updated.");
      } catch {
        // Fallback handled locally
      }
    }
  }

  async function send(values: QuotationBuilderValues) {
    upsertSharedQuotation({
      id: quotation.id,
      requestId: quotation.serviceRequestId,
      serviceId: quotation.serviceId,
      customerId: quotation.customerId,
      lineItems: values.lineItems,
      taxUsd: values.taxUsd,
      discountUsd: values.discountUsd,
      notes: values.notes,
      terms: values.terms,
      expiresAt: values.expiresAt || undefined,
      status: "sent",
      revisionReason:
        mode === "revise" && quotation.status !== "draft"
          ? "Admin revision before resending."
          : undefined,
    });

    if (!quotationId || mode === "create") {
      try {
        await createQuotationMutation({
          serviceRequestId: quotation.serviceRequestId,
          lineItems: values.lineItems.map((li) => ({
            description: li.description,
            quantity: li.quantity,
            unitPriceUsd: li.unitPriceUsd,
          })),
          discountUsd: values.discountUsd,
          taxUsd: values.taxUsd,
          notes: values.notes,
        }).unwrap();
        toast.success("Quotation issued and sent to customer!");
      } catch {
        // Fallback handled locally
      }
    } else {
      try {
        await reviseQuotationMutation({
          id: quotation.id,
          body: {
            serviceRequestId: quotation.serviceRequestId,
            lineItems: values.lineItems.map((li) => ({
              description: li.description,
              quantity: li.quantity,
              unitPriceUsd: li.unitPriceUsd,
            })),
            discountUsd: values.discountUsd,
            taxUsd: values.taxUsd,
            notes: values.notes,
          },
        }).unwrap();
        toast.success("Quotation revised and sent to customer!");
      } catch {
        // Fallback handled locally
      }
    }
  }

  if (deleted) {
    return (
      <AdminPageShell>
        <AdminSurface className="text-center">
          <ReceiptText className="mx-auto size-9 text-teal-700" />
          <h1 className="mt-4 text-2xl font-semibold text-primary">
            Quotation removed from preview
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            This is a local-only delete. Production should archive accepted quote history.
          </p>
          <Button asChild className="mt-5">
            <Link href="/admin/quotations">Back to quotations</Link>
          </Button>
        </AdminSurface>
      </AdminPageShell>
    );
  }

  return (
    <AdminPageShell>
      <Link
        href="/admin/quotations"
        className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-primary hover:text-teal-700"
      >
        <ArrowLeft size={16} />
        Back to quotations
      </Link>

      <AdminPageHeader
        eyebrow="Quotation"
        title={quotationId ? quotation.id : "New quotation"}
        description={`${service?.name ?? "Service quote"} for ${customer?.displayName ?? "customer"} · Request ${quotation.serviceRequestId}`}
        action={
          <div className="flex flex-wrap gap-2">
            <div className="flex">
              <StatusBadge
                status={quotation.status}
                label={formatStatusLabel(quotation.status)}
              />
            </div>
            {quotation.status !== "draft" && quotation.status !== "accepted" ? (
              <Button asChild variant="soft">
                <Link href={`/admin/quotations/${quotation.id}?mode=revise`}>
                  <RefreshCw size={16} />
                  Revise
                </Link>
              </Button>
            ) : null}
            <Button
              variant="outline"
              onClick={() => setDeleteOpen(true)}
              aria-label="Delete quotation"
            >
              <Trash2 size={16} />
              Delete
            </Button>
          </div>
        }
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-5">
          {editingMode ? (
            <QuotationBuilder
              initialQuotation={quotation}
              mode={!quotationId ? "create" : mode === "revise" ? "revise" : "edit"}
              onSaveDraft={save}
              onSend={send}
            />
          ) : null}

          <AdminSurface>
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-teal-700">
                  Request Summary
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-primary">
                  {request?.title ?? service?.name ?? "Service request"}
                </h2>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href={`/admin/service-requests/${quotation.serviceRequestId}`}>
                  <LinkIcon size={15} />
                  View request
                </Link>
              </Button>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <InfoBlock label="Customer" value={customer?.displayName ?? "Unknown"} />
              <InfoBlock label="Email" value={customer?.email ?? "Unknown"} />
              <InfoBlock
                label="Requested schedule"
                value={request?.requestedSchedule?.label ?? "Not provided"}
              />
              <InfoBlock
                label="Current schedule"
                value={request?.currentSchedule?.label ?? "Not confirmed"}
              />
              <InfoBlock
                label="Location"
                value={
                  request
                    ? `${request.serviceAddress.line1}, ${request.serviceAddress.city}, ${request.serviceAddress.state}`
                    : "Not available"
                }
              />
              <InfoBlock
                label="Submitted"
                value={request ? formatShortDateTime(request.submittedAt) : "Not available"}
              />
            </div>
            {request?.description ? (
              <div className="mt-5 rounded-xl bg-teal-50/60 p-4 text-sm leading-6 text-slate-600">
                {request.description}
              </div>
            ) : null}
          </AdminSurface>

          <AdminSurface>
            <h2 className="text-xl font-semibold text-primary">Quotation items</h2>
            <div className="mt-4 divide-y divide-teal-100">
              {quotation.lineItems.map((item) => (
                <div
                  key={item.id}
                  className="grid gap-3 py-4 md:grid-cols-[minmax(0,1fr)_6rem_8rem_8rem]"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900">{item.description}</p>
                    {item.note ? (
                      <p className="mt-1 text-sm text-slate-500">{item.note}</p>
                    ) : null}
                  </div>
                  <span className="text-sm text-slate-500">Qty {item.quantity}</span>
                  <span className="text-sm text-slate-500">
                    {formatCurrencyUsd(item.unitPriceUsd)}
                  </span>
                  <strong className="text-primary">
                    {formatCurrencyUsd(item.quantity * item.unitPriceUsd)}
                  </strong>
                </div>
              ))}
            </div>
          </AdminSurface>

          <AdminSurface>
            <h2 className="flex items-center gap-2 text-xl font-semibold text-primary">
              <History size={20} />
              History
            </h2>
            <div className="mt-4 space-y-3">
              <HistoryRow label="Created" value={formatShortDateTime(quotation.createdAt)} />
              {quotation.sentAt ? (
                <HistoryRow label="Sent" value={formatShortDateTime(quotation.sentAt)} />
              ) : null}
              {quotation.viewedAt ? (
                <HistoryRow label="Viewed" value={formatShortDateTime(quotation.viewedAt)} />
              ) : null}
              {quotation.acceptedAt ? (
                <HistoryRow
                  label="Accepted"
                  value={`${formatShortDateTime(quotation.acceptedAt)} · ${quotation.serviceOrderId ?? "Service order pending"}`}
                />
              ) : null}
              {quotation.rejectionHistory?.map((entry) => (
                <HistoryRow
                  key={entry.id}
                  label={`Rejected · ${entry.reason}`}
                  value={`${formatShortDateTime(entry.rejectedAt)}${entry.comments ? ` · ${entry.comments}` : ""}`}
                />
              ))}
              {quotation.revisionHistory.map((revision) => (
                <HistoryRow
                  key={revision.id}
                  label={`Revision v${revision.version}`}
                  value={`${formatShortDateTime(revision.createdAt)} · ${formatCurrencyUsd(revision.totalUsd)}`}
                />
              ))}
            </div>
          </AdminSurface>
        </div>

        <aside className="space-y-5">
          <AdminSurface>
            <h2 className="text-xl font-semibold text-primary">Pricing</h2>
            <div className="mt-4 space-y-3 text-sm">
              <SummaryRow label="Subtotal" value={formatCurrencyUsd(quotation.subtotalUsd)} />
              <SummaryRow label="Tax" value={formatCurrencyUsd(quotation.taxUsd)} />
              <SummaryRow
                label="Discount"
                value={`-${formatCurrencyUsd(quotation.discountUsd)}`}
              />
              <div className="border-t border-teal-100 pt-4">
                <SummaryRow
                  label="Total"
                  value={formatCurrencyUsd(quotation.totalUsd)}
                  strong
                />
              </div>
            </div>
            <div className="mt-5 rounded-xl bg-teal-50/70 p-4 text-sm text-slate-600">
              <p>
                <strong className="text-primary">Expiry:</strong>{" "}
                {quotation.expiresAt ? formatShortDate(quotation.expiresAt) : "No expiry set"}
              </p>
              {quotation.serviceOrderId ? (
                <p className="mt-2">
                  <strong className="text-primary">Service order:</strong>{" "}
                  {quotation.serviceOrderId}
                </p>
              ) : null}
            </div>
          </AdminSurface>

          <AdminSurface>
            <h2 className="text-xl font-semibold text-primary">Notes & terms</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {quotation.notes || "No notes added."}
            </p>
            <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
              {quotation.terms || "No custom terms added."}
            </div>
          </AdminSurface>

          {request?.attachments && request.attachments.length > 0 ? (
            <AdminSurface>
              <MediaGalleryPreview
                attachments={request.attachments}
                title="Customer Inspection Media"
                columnsClass="grid-cols-2 sm:grid-cols-2"
                compact
              />
            </AdminSurface>
          ) : null}
        </aside>
      </div>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete quotation?</DialogTitle>
            <DialogDescription>
              {quotation.status === "accepted"
                ? "This quote is linked to an accepted service order. This local preview can remove it, but production should archive instead."
                : "This removes the quote from this local admin preview."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setDeleteOpen(false);
                if (quotationId) {
                  deleteSharedQuotation(quotationId);
                }
                setDeleted(true);
              }}
            >
              Delete quotation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminPageShell>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-xl bg-teal-50/50 p-4">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 break-words text-sm font-semibold text-slate-800">{value}</p>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className={strong ? "font-semibold text-slate-800" : "text-slate-500"}>
        {label}
      </span>
      <span
        className={
          strong
            ? "text-2xl font-semibold tracking-[-0.04em] text-primary"
            : "font-semibold text-slate-900"
        }
      >
        {value}
      </span>
    </div>
  );
}

function HistoryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3 rounded-xl bg-slate-50 p-3 text-sm">
      <CalendarDays className="mt-0.5 size-4 shrink-0 text-teal-700" />
      <div>
        <p className="font-semibold text-slate-900">{label}</p>
        <p className="mt-1 text-slate-500">{value}</p>
      </div>
    </div>
  );
}
