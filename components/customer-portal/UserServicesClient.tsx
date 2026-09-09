"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  FileCheck2,
  FileText,
  MapPin,
  Search,
  Wrench,
  Zap,
} from "lucide-react";

import { PageHeader } from "@/components/customer-portal/PageHeader";
import {
  PortalCard,
  PortalCardAction,
  PortalCardFooter,
  PortalCardTitle,
  PortalCardTop,
  PortalDetailAction,
  PortalFact,
  PortalFilterBar,
  PortalList,
  PortalLoading,
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

      {isLoadingRequests && (
        <PortalLoading label="Loading service requests..." />
      )}

      {!isLoadingRequests && (
        <PortalList>
          {displayedRequests.length === 0 ? (
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
            displayedRequests.map((request) => {
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
                <PortalCard key={request.id}>
                  <PortalCardTop
                    badges={
                      <>
                        <StatusBadge status={request.status} />
                        {request.urgency ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-amber-100/80 px-2.5 py-0.5 text-xs font-medium text-amber-900">
                            <Zap className="text-amber-700" size={12} />
                            {request.urgency} Priority
                          </span>
                        ) : null}
                        {request.service?.category ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-teal-50 px-2.5 py-0.5 text-xs font-medium text-teal-800">
                            {request.service.category.replace(/_/g, " ")}
                          </span>
                        ) : null}
                      </>
                    }
                    meta={
                      <>
                        Submitted:{" "}
                        <span className="font-medium text-slate-700">
                          {request.submittedAt || reqAny.createdAt
                            ? formatShortDateTime(
                                request.submittedAt || reqAny.createdAt || "",
                              )
                            : formatLongDate(new Date().toISOString())}
                        </span>
                      </>
                    }
                  />

                  <PortalCardTitle href={`/user/services/${request.id}`}>
                    {displayTitle}
                  </PortalCardTitle>

                  {cancelReason ? (
                    <div className="mb-4 -mt-2 inline-flex items-center gap-2 rounded-md border border-rose-200/80 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-800 sm:text-sm">
                      <span className="font-semibold text-rose-950">
                        Cancellation Reason:
                      </span>
                      <span>{cancelReason}</span>
                    </div>
                  ) : null}

                  <PortalCardFooter
                    actions={
                      <>
                        <PortalDetailAction href={`/user/services/${request.id}`} />
                        {isQuoted && quotation ? (
                          <PortalCardAction
                            href={`/user/services/${request.id}#quotation`}
                            icon={FileText}
                            label="Review Quotation"
                            tone="accent"
                          />
                        ) : null}
                      </>
                    }
                    facts={
                      <>
                        <PortalFact
                          icon={CalendarDays}
                          label="Preferred Slot"
                          placeholder="Pending schedule"
                          tone="brand"
                          value={displaySchedule}
                        />
                        <PortalFact
                          icon={MapPin}
                          label="Service Location"
                          placeholder="Address on file"
                          truncate
                          value={displayAddress}
                        />
                        {quoteTotal ? (
                          <PortalFact
                            emphasis
                            icon={FileCheck2}
                            label="Official Quote"
                            tone="warning"
                            value={formatCurrencyUsd(quoteTotal)}
                          />
                        ) : null}
                      </>
                    }
                  />
                </PortalCard>
              );
            })
          )}
        </PortalList>
      )}
    </div>
  );
}
