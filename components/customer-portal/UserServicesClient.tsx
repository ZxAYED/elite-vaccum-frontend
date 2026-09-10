"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  FileText,
  MapPin,
  Search,
  Wrench,
  Zap,
} from "lucide-react";

import { PageHeader } from "@/components/customer-portal/PageHeader";
import {
  columnClass,
  PortalCell,
  PortalRecordCell,
  PortalRow,
  PortalRowActions,
  PortalTable,
  PortalTableSkeleton,
  PortalValue,
  type PortalColumn,
} from "@/components/customer-portal/PortalTable";
import {
  PortalCardAction,
  PortalDetailAction,
  PortalFilterBar,
} from "@/components/customer-portal/PortalUI";
import { StatusBadge } from "@/components/customer-portal/StatusBadge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { useGetMyServiceRequestsQuery } from "@/redux/api/serviceRequestsApi";
import { useGetMyQuotationsQuery } from "@/redux/api/quotationsApi";
import {
  formatCurrencyUsd,
  formatLongDate,
  formatMonthDay,
  formatShortDateTime,
} from "@/lib/formatters";
import type { AdminQuotation } from "@/types/domain";

/**
 * Ordered to match the cells below; the indices are referenced directly so a
 * column and its cells can never drift out of alignment. Location, quote and
 * submitted-at fall away on narrower viewports — the request's own screen
 * still carries all of it.
 */
const REQUEST_COLUMNS: ReadonlyArray<PortalColumn> = [
  { key: "request", label: "Request" },
  { key: "status", label: "Status" },
  { key: "urgency", label: "Priority", hideBelow: "lg" },
  { key: "schedule", label: "Preferred Slot", hideBelow: "md" },
  { key: "location", label: "Location", hideBelow: "lg" },
  { key: "quote", label: "Quote", align: "right", hideBelow: "sm" },
  { key: "submitted", label: "Submitted", hideBelow: "lg" },
  { key: "actions", label: "Actions", align: "actions" },
];

const filters = [
  { label: "All", value: "all" },
  { label: "Active", value: "submitted" },
  { label: "Quoted", value: "quoted" },
  { label: "Accepted", value: "accepted" },
  { label: "Rejected", value: "rejected" },
  { label: "Completed", value: "completed" },
] as const;

export function UserServicesClient() {
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Backend Filtering: status and search are sent directly to the server API
  const queryParams = useMemo(() => {
    const p: { status?: string; search?: string } = {};
    if (selectedFilter !== "all") {
      p.status = selectedFilter.toUpperCase();
    }
    if (searchQuery.trim()) {
      p.search = searchQuery.trim();
    }
    return p;
  }, [selectedFilter, searchQuery]);

  const { data: apiResponse, isLoading: isLoadingRequests } =
    useGetMyServiceRequestsQuery(queryParams);
  const { data: myQuotations } = useGetMyQuotationsQuery();

  // Status and search are applied server-side (Phase 8.2), so the response
  // is already the filtered list.
  const displayedRequests = apiResponse?.items ?? [];

  return (
    <div className="space-y-6 sm:space-y-7 pb-12">
      <PageHeader
        eyebrow="Customer Portal"
        title="My Service Requests"
        description="Track all submitted intake requests, diagnostics, and quotation updates in real-time."
        actions={
          <Button asChild className="rounded-md bg-teal-600 hover:bg-teal-500 text-white font-medium shadow-xs">
            <Link href="/services">
              <Wrench size={15} className="mr-1.5" />
              Request New Service
            </Link>
          </Button>
        }
      />

      <PortalFilterBar
        filters={filters}
        onChange={setSelectedFilter}
        onSearchChange={setSearchQuery}
        search={searchQuery}
        searchPlaceholder="Search by request title, customer address, or keyword..."
        value={selectedFilter}
      />

      {isLoadingRequests ? (
        <PortalTableSkeleton columns={REQUEST_COLUMNS} />
      ) : displayedRequests.length === 0 ? (
        <EmptyState
          icon={searchQuery ? Search : Wrench}
          title={searchQuery ? "No matching service requests" : "No service requests found"}
          description={
            searchQuery
              ? `No requests matched "${searchQuery}". Try a different keyword or reset filters.`
              : "Submit an intake ticket to schedule professional inspection, diagnostic repair, or a turnkey central vacuum installation."
          }
          action={{
            label: "Start New Service Request",
            href: "/services",
          }}
          secondaryAction={
            searchQuery
              ? {
                  label: "Clear Search",
                  onClick: () => setSearchQuery(""),
                }
              : undefined
          }
          tone="card"
          className="py-12"
        />
      ) : (
        <PortalTable
          caption="Your service requests, with schedule, quotation and status"
          columns={REQUEST_COLUMNS}
        >
          {displayedRequests.map((request) => {
              const reqAny = request as unknown as {
                createdAt?: string;
                submittedAt?: string;
                address?: string;
                city?: string;
                serviceName?: string;
              };

              // Title formatting
              const serviceName = request.service?.name || reqAny.serviceName || "Central Vacuum Service";
              const rawTitle = request.title || serviceName;
              const displayTitle = rawTitle.includes(" - ") ? rawTitle.split(" - ")[0].trim() : rawTitle;

              // Schedule
              const reqRecord = reqAny as Record<string, unknown>;
              const sched = ((request.requestedSchedule || reqRecord.requestedSchedule || {}) as unknown) as Record<string, unknown>;
              const prefDate =
                (typeof sched.preferredDate === "string" && sched.preferredDate) ||
                (typeof sched.date === "string" && sched.date) ||
                request.preferredDate ||
                (typeof reqRecord.preferredDate === "string" ? reqRecord.preferredDate : undefined);
              const prefTime =
                (typeof sched.timeWindow === "string" && sched.timeWindow) ||
                (typeof sched.time === "string" && sched.time) ||
                request.preferredTime ||
                (typeof reqRecord.timeWindow === "string" ? reqRecord.timeWindow : undefined) ||
                (typeof reqRecord.preferredTime === "string" ? reqRecord.preferredTime : undefined);

              const displaySchedule =
                request.requestedSchedule?.label ??
                (prefDate
                  ? `${formatMonthDay(prefDate)}${prefTime ? ` · ${prefTime}` : ""}`
                  : prefTime || "Pending schedule");

              // Address
              const line1 = request.serviceAddress?.line1 || request.serviceAddress?.address || reqAny.address || "";
              const city = request.serviceAddress?.city || reqAny.city || "";
              const displayAddress = line1 ? (city ? `${line1}, ${city}` : line1) : (city || "Address on file");

              // Quotation matching
              const quotation: AdminQuotation | undefined =
                (request.quotations && request.quotations[0]) ||
                myQuotations?.find(
                  (q) =>
                    q.serviceRequestId === request.id ||
                    q.id === request.id ||
                    (q as unknown as { businessId?: string }).businessId === request.id,
                );

              const quoteTotal = quotation?.totalUsd ? Number(quotation.totalUsd) : undefined;
              const quoteStatusNorm = (quotation?.status || "").toLowerCase().replace(/_/g, "-");
              const isQuoted =
                (request.status || "").toLowerCase().replace(/_/g, "-") === "quoted" ||
                quoteStatusNorm === "sent" ||
                quoteStatusNorm === "under-review" ||
                quoteStatusNorm === "quoted";

              // Extract cancellation reason if present
              const rawNotes = (request as unknown as { additionalNotes?: string }).additionalNotes || "";
              const cancelMatch = rawNotes.match(/\[Cancellation Reason:\s*([^\]]+)\]/i);
              const cancelReason =
                (request as unknown as { cancellationReason?: string }).cancellationReason ||
                (cancelMatch ? cancelMatch[1].trim() : null);

              return (
                <PortalRow key={request.id}>
                  <PortalCell className={columnClass(REQUEST_COLUMNS[0])}>
                    <PortalRecordCell
                      // A quotation waiting on the customer is the only state
                      // on this screen that needs them to act, so it gets the
                      // rail. The "Review Quotation" action says the same
                      // thing in words, so the colour never stands alone.
                      accent={isQuoted && quotation ? "brand" : undefined}
                      href={`/user/services/${request.id}`}
                      subtitle={
                        request.service?.category
                          ? request.service.category.replace(/_/g, " ")
                          : serviceName
                      }
                      title={displayTitle}
                    />
                  </PortalCell>

                  <PortalCell className={columnClass(REQUEST_COLUMNS[1])}>
                    <StatusBadge status={request.status} />
                    {cancelReason ? (
                      <span
                        className="mt-1 block max-w-[220px] truncate text-sm font-medium text-rose-700"
                        title={cancelReason}
                      >
                        {cancelReason}
                      </span>
                    ) : null}
                  </PortalCell>

                  <PortalCell className={columnClass(REQUEST_COLUMNS[2])}>
                    {request.urgency ? (
                      <span className="inline-flex min-h-6 items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1 text-sm font-medium leading-none text-amber-900">
                        <Zap
                          aria-hidden="true"
                          className="text-amber-700"
                          size={13}
                        />
                        {request.urgency}
                      </span>
                    ) : (
                      <span className="text-slate-400">Normal</span>
                    )}
                  </PortalCell>

                  <PortalCell className={columnClass(REQUEST_COLUMNS[3])}>
                    <PortalValue
                      icon={CalendarDays}
                      placeholder="Pending schedule"
                      truncate
                      value={displaySchedule}
                    />
                  </PortalCell>

                  <PortalCell className={columnClass(REQUEST_COLUMNS[4])}>
                    <PortalValue
                      icon={MapPin}
                      placeholder="Address on file"
                      truncate
                      value={displayAddress}
                    />
                  </PortalCell>

                  <PortalCell className={columnClass(REQUEST_COLUMNS[5])}>
                    <PortalValue
                      emphasis
                      placeholder="Awaiting quote"
                      tone="warning"
                      value={
                        quoteTotal ? formatCurrencyUsd(quoteTotal) : undefined
                      }
                    />
                  </PortalCell>

                  <PortalCell className={columnClass(REQUEST_COLUMNS[6])}>
                    <PortalValue
                      value={
                        request.submittedAt || reqAny.createdAt
                          ? formatShortDateTime(
                              request.submittedAt || reqAny.createdAt || "",
                            )
                          : formatLongDate(new Date().toISOString())
                      }
                    />
                  </PortalCell>

                  <PortalCell className={columnClass(REQUEST_COLUMNS[7])}>
                    <PortalRowActions>
                      <PortalDetailAction
                        href={`/user/services/${request.id}`}
                        label="View"
                      />
                      {isQuoted && quotation ? (
                        <PortalCardAction
                          href={`/user/services/${request.id}#quotation`}
                          icon={FileText}
                          label="Review Quote"
                          tone="accent"
                        />
                      ) : null}
                    </PortalRowActions>
                  </PortalCell>
                </PortalRow>
              );
          })}
        </PortalTable>
      )}
    </div>
  );
}
