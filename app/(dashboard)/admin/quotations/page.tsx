"use client";

import {
  ArrowRight,
  Edit3,
  FileText,
  Plus,
  Send,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import {
  AdminPageHeader,
  AdminPageShell,
  AdminStatCard,
  AdminSurface,
} from "@/components/admin/AdminPageShell";
import { AdminSearchInput } from "@/components/admin/AdminSearchInput";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import {
  getQuotationCustomer,
  getQuotationRequest,
  getQuotationService,
  type AdminQuotationFilterStatus,
} from "@/data/mock/quotations";
import {
  deleteSharedQuotation,
  getSharedQuotations,
  upsertSharedQuotation,
} from "@/data/mock/shared-business-store";
import { useSharedBusinessStoreVersion } from "@/hooks/useSharedBusinessStoreVersion";
import { formatCurrencyUsd, formatShortDate } from "@/lib/formatters";
import { formatStatusLabel } from "@/lib/status-labels";
import type { AdminQuotation } from "@/types/domain";

const statusOptions: Array<{ label: string; value: AdminQuotationFilterStatus }> = [
  { label: "All", value: "all" },
  { label: "Draft", value: "draft" },
  { label: "Sent", value: "sent" },
  { label: "Viewed", value: "viewed" },
  { label: "Accepted", value: "accepted" },
  { label: "Rejected", value: "rejected" },
  { label: "Expired", value: "expired" },
];

type SortValue = "newest" | "oldest" | "amount-high" | "amount-low" | "expiry";

export default function AdminQuotationsPage() {
  useSharedBusinessStoreVersion();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<AdminQuotationFilterStatus>("all");
  const [sort, setSort] = useState<SortValue>("newest");
  const [deleteTarget, setDeleteTarget] = useState<AdminQuotation | null>(null);
  const quotations = getSharedQuotations();

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return quotations
      .filter((quote) => {
        if (status !== "all" && quote.status !== status) return false;

        const customer = getQuotationCustomer(quote);
        const service = getQuotationService(quote);
        const haystack = [
          quote.id,
          quote.serviceRequestId,
          customer?.displayName,
          customer?.email,
          service?.name,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return !normalizedQuery || haystack.includes(normalizedQuery);
      })
      .sort((left, right) => {
        if (sort === "oldest") {
          return (
            new Date(left.updatedAt).getTime() - new Date(right.updatedAt).getTime()
          );
        }
        if (sort === "amount-high") return right.totalUsd - left.totalUsd;
        if (sort === "amount-low") return left.totalUsd - right.totalUsd;
        if (sort === "expiry") {
          const leftExpiry = left.expiresAt
            ? new Date(left.expiresAt).getTime()
            : Number.MAX_SAFE_INTEGER;
          const rightExpiry = right.expiresAt
            ? new Date(right.expiresAt).getTime()
            : Number.MAX_SAFE_INTEGER;
          return leftExpiry - rightExpiry;
        }
        return (
          new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
        );
      });
  }, [query, quotations, sort, status]);

  const stats = {
    total: quotations.length,
    draft: quotations.filter((quote) => quote.status === "draft").length,
    awaiting: quotations.filter((quote) =>
      ["sent", "viewed"].includes(quote.status),
    ).length,
    accepted: quotations.filter((quote) => quote.status === "accepted").length,
  };

  function markSent(quotationId: string) {
    const quote = quotations.find((item) => item.id === quotationId);
    if (!quote) return;
    upsertSharedQuotation({
      requestId: quote.serviceRequestId,
      serviceId: quote.serviceId,
      customerId: quote.customerId,
      lineItems: quote.lineItems,
      taxUsd: quote.taxUsd,
      discountUsd: quote.discountUsd,
      notes: quote.notes,
      terms: quote.terms,
      expiresAt: quote.expiresAt || undefined,
      status: "sent",
      id: quote.id,
    });
  }

  function deleteQuotation() {
    if (!deleteTarget) return;
    deleteSharedQuotation(deleteTarget.id);
    setDeleteTarget(null);
  }

  return (
    <AdminPageShell>
      <AdminPageHeader
        eyebrow="Revenue operations"
        title="Quotations"
        description="Create, revise, send, and track service quotations without mixing them with service requests or orders."
        action={
          <Button asChild>
            <Link href="/admin/service-requests">
              <Plus size={16} />
              Create from request
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard label="Total Quotes" value={stats.total} />
        <AdminStatCard label="Drafts" value={stats.draft} tone="soft" />
        <AdminStatCard label="Awaiting Customer" value={stats.awaiting} />
        <AdminStatCard label="Accepted" value={stats.accepted} tone="success" />
      </div>

      <AdminSurface className="space-y-4">
        <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_12rem_12rem]">
          <AdminSearchInput
            value={query}
            onChange={setQuery}
            placeholder="Search quote, request, customer, or service..."
            ariaLabel="Search quotations"
          />
          <Select
            value={status}
            onValueChange={(value) =>
              setStatus(value as AdminQuotationFilterStatus)
            }
          >
            <SelectTrigger className="h-12">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={(value) => setSort(value as SortValue)}>
            <SelectTrigger className="h-12">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
              <SelectItem value="amount-high">Amount high-low</SelectItem>
              <SelectItem value="amount-low">Amount low-high</SelectItem>
              <SelectItem value="expiry">Expiring soon</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {filtered.length ? (
          <div className="overflow-hidden rounded-lg border border-teal-100">
            <div className="hidden grid-cols-[1.1fr_1.2fr_1fr_0.8fr_0.8fr_1.2fr] bg-teal-50/60 px-4 py-3 text-xs font-bold uppercase tracking-[0.24em] text-slate-500 lg:grid">
              <span>Quote</span>
              <span>Customer</span>
              <span>Status</span>
              <span>Total</span>
              <span>Expiry</span>
              <span className="text-right">Actions</span>
            </div>
            <div className="divide-y divide-teal-100">
              {filtered.map((quote) => {
                const customer = getQuotationCustomer(quote);
                const service = getQuotationService(quote);
                const request = getQuotationRequest(quote);

                return (
                  <article
                    key={quote.id}
                    className="grid gap-4 px-4 py-4 lg:grid-cols-[1.1fr_1.2fr_1fr_0.8fr_0.8fr_1.2fr] lg:items-center"
                  >
                    <div>
                      <Link
                        href={`/admin/quotations/${quote.id}`}
                        className="font-semibold text-primary hover:text-teal-700"
                      >
                        {quote.id}
                      </Link>
                      <p className="text-sm text-slate-500">
                        {`${request?.id ?? quote.serviceRequestId} · v${quote.version}`}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">
                        {customer?.displayName ?? "Unknown customer"}
                      </p>
                      <p className="text-sm text-slate-500">
                        {service?.name ?? "Unknown service"}
                      </p>
                    </div>
                    <div className="flex">
                      <StatusBadge
                        status={quote.status}
                        label={formatStatusLabel(quote.status)}
                      />
                    </div>
                    <strong className="text-primary">
                      {formatCurrencyUsd(quote.totalUsd)}
                    </strong>
                    <span className="text-sm text-slate-500">
                      {quote.expiresAt ? formatShortDate(quote.expiresAt) : "No expiry"}
                    </span>
                    <div className="flex flex-wrap justify-start gap-2 lg:justify-end">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/admin/quotations/${quote.id}`}>
                          Details <ArrowRight size={15} />
                        </Link>
                      </Button>
                      {quote.status === "draft" ? (
                        <>
                          <Button asChild variant="soft" size="sm">
                            <Link href={`/admin/quotations/${quote.id}?mode=edit`}>
                              <Edit3 size={15} />
                              Edit
                            </Link>
                          </Button>
                          <Button size="sm" onClick={() => markSent(quote.id)}>
                            <Send size={15} />
                            Send
                          </Button>
                        </>
                      ) : null}
                      {["sent", "viewed", "rejected", "expired"].includes(
                        quote.status,
                      ) ? (
                        <Button asChild variant="soft" size="sm">
                          <Link href={`/admin/quotations/${quote.id}?mode=revise`}>
                            Revise
                          </Link>
                        </Button>
                      ) : null}
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setDeleteTarget(quote)}
                        aria-label={`Delete ${quote.id}`}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-teal-200 bg-teal-50/40 p-8 text-center">
            <FileText className="mx-auto size-8 text-teal-700" />
            <h2 className="mt-3 text-xl font-semibold text-primary">
              No quotations found
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Adjust your filters or create a quotation from an accepted service request.
            </p>
          </div>
        )}
      </AdminSurface>

      <Dialog open={Boolean(deleteTarget)} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete quotation?</DialogTitle>
            <DialogDescription>
              {deleteTarget?.status === "accepted"
                ? "This accepted quotation is linked to a service order. This local preview will remove the quote from the admin list, but production should archive instead of deleting order history."
                : "This removes the quotation from the local admin preview."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={deleteQuotation}>
              Delete quotation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminPageShell>
  );
}
