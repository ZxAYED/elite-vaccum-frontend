"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  FileCheck2,
  FileText,
  Loader2,
  MapPin,
  Search,
  Wrench,
  X,
  Zap,
} from "lucide-react";

import { PageHeader } from "@/components/customer-portal/PageHeader";
import { StatusBadge } from "@/components/customer-portal/StatusBadge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { useGetMyServiceRequestsQuery } from "@/redux/api/serviceRequestsApi";
import { useGetMyQuotationsQuery } from "@/redux/api/quotationsApi";
import { getCustomerServiceRequests } from "@/data/mock/customer-portal";
import { useSharedBusinessStoreVersion } from "@/hooks/useSharedBusinessStoreVersion";
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
  useSharedBusinessStoreVersion();
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

  const mockRequests = useMemo(() => getCustomerServiceRequests(), []);

  // Server response with fallback to mock data when API is offline or empty
  const displayedRequests = useMemo(() => {
    const apiItems = apiResponse?.items;
    if (apiItems && apiItems.length > 0) {
      return apiItems;
    }
    // If backend returns empty array specifically for an active search or filter
    if (apiItems && apiItems.length === 0 && (selectedFilter !== "all" || searchQuery.trim())) {
      return [];
    }
    // Offline / demo fallback with corresponding filter
    if (selectedFilter === "all" && !searchQuery.trim()) {
      return mockRequests;
    }
    return mockRequests.filter((r) => {
      if (selectedFilter !== "all" && r.status.toLowerCase() !== selectedFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          r.title?.toLowerCase().includes(q) ||
          r.id?.toLowerCase().includes(q) ||
          r.serviceAddress?.city?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [apiResponse, mockRequests, selectedFilter, searchQuery]);

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

      {/* SEARCH AND BACKEND FILTER BAR */}
      <div className="flex flex-col gap-3 rounded-lg border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          {filters.map((filter) => {
            const isSelected = selectedFilter === filter.value;
            return (
              <Button
                key={filter.value}
                size="sm"
                variant={isSelected ? "default" : "outline"}
                onClick={() => setSelectedFilter(filter.value)}
                className={`rounded-md text-xs sm:text-sm font-medium h-9 px-4 transition-colors ${
                  isSelected
                    ? "bg-teal-700 text-white hover:bg-teal-800"
                    : "border-slate-200/80 text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                {filter.label}
              </Button>
            );
          })}
        </div>

        <div className="relative flex items-center pt-1">
          <Search size={16} className="pointer-events-none absolute left-3.5 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by request title, customer address, or keyword..."
            className="h-11 rounded-md border-slate-200/80 bg-slate-50/60 pl-10 pr-10 text-xs sm:text-sm font-medium focus-visible:bg-white focus-visible:ring-teal-600"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              aria-label="Clear search"
              className="absolute right-3 flex size-6 items-center justify-center rounded-md text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition"
            >
              <X size={14} />
            </button>
          ) : null}
        </div>
      </div>

      {isLoadingRequests && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-slate-200/80 bg-white py-20 text-teal-700 shadow-xs">
          <Loader2 size={28} className="animate-spin text-teal-600" />
          <span className="mt-3 text-xs sm:text-sm font-medium text-slate-700">Loading service requests...</span>
        </div>
      )}

      {!isLoadingRequests && (
        <div className="space-y-4 sm:space-y-5">
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
                <article
                  key={request.id}
                  className="rounded-lg border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs transition-all hover:border-teal-300 hover:shadow-sm"
                >
                  {/* CARD TOP HEADER: Badges and Submission Time */}
                  <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={request.status} />

                      {request.urgency && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-amber-100/80 px-2.5 py-0.5 text-xs font-medium text-amber-900">
                          <Zap size={12} className="text-amber-700" />
                          {request.urgency} Priority
                        </span>
                      )}

                      {request.service?.category && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-teal-50 px-2.5 py-0.5 text-xs font-medium text-teal-800">
                          {request.service.category.replace(/_/g, " ")}
                        </span>
                      )}
                    </div>

                    <span className="text-xs text-slate-500 font-medium">
                      Submitted:{" "}
                      <span className="text-slate-700 font-medium">
                        {request.submittedAt || reqAny.createdAt
                          ? formatShortDateTime(request.submittedAt || reqAny.createdAt || "")
                          : formatLongDate(new Date().toISOString())}
                      </span>
                    </span>
                  </div>

                  {/* CARD BODY: Clean Title & Optional Cancellation Showcase */}
                  <div className="pt-1 pb-4">
                    <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-primary">
                      <Link
                        href={`/user/services/${request.id}`}
                        className="hover:opacity-80 transition"
                      >
                        {displayTitle}
                      </Link>
                    </h2>

                    {cancelReason && (
                      <div className="mt-2.5 inline-flex items-center gap-2 rounded-md bg-rose-50 border border-rose-200/80 px-3 py-1.5 text-xs sm:text-sm font-medium text-rose-800">
                        <span className="font-semibold text-rose-950">Cancellation Reason:</span>
                        <span>{cancelReason}</span>
                      </div>
                    )}
                  </div>

                  {/* CARD FOOTER: Essential Facts & Direct Action */}
                  <div className="border-t border-slate-100 pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3.5">
                    {/* Key Facts */}
                    <div className="flex flex-wrap items-center gap-5 sm:gap-7 text-xs sm:text-sm">
                      {/* Preferred Slot */}
                      <div className="flex items-center gap-2">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-teal-50 text-teal-700">
                          <CalendarDays size={15} />
                        </div>
                        <div>
                          <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                            Preferred Slot
                          </span>
                          <span className="font-medium text-slate-800">
                            {displaySchedule}
                          </span>
                        </div>
                      </div>

                      {/* Location */}
                      <div className="flex items-center gap-2">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-600">
                          <MapPin size={15} />
                        </div>
                        <div>
                          <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                            Service Location
                          </span>
                          <span className="font-medium text-slate-800 truncate max-w-[180px] sm:max-w-[220px] block">
                            {displayAddress}
                          </span>
                        </div>
                      </div>

                      {/* Quotation preview if present */}
                      {quoteTotal ? (
                        <div className="flex items-center gap-2">
                          <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-amber-50 text-amber-800">
                            <FileCheck2 size={15} />
                          </div>
                          <div>
                            <span className="block text-[10px] font-semibold uppercase tracking-wider text-amber-800">
                              Official Quote
                            </span>
                            <span className="font-semibold text-slate-800">
                              {formatCurrencyUsd(quoteTotal)}
                            </span>
                          </div>
                        </div>
                      ) : null}
                    </div>

                    {/* Actions */}
                    <div className="flex shrink-0 items-center gap-2">
                      {isQuoted && quotation && (
                        <Button
                          asChild
                          size="sm"
                          className="rounded-md bg-amber-600 text-white hover:bg-amber-700 font-medium shadow-xs text-xs sm:text-sm"
                        >
                          <Link href={`/user/services/${request.id}#quotation`}>
                            <FileText size={14} className="mr-1" />
                            Review Quotation
                          </Link>
                        </Button>
                      )}

                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="rounded-md text-slate-800 hover:bg-slate-50 font-medium text-xs sm:text-sm"
                      >
                        <Link href={`/user/services/${request.id}`}>
                          View Details
                          <ArrowRight size={14} className="ml-1 text-teal-600" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
