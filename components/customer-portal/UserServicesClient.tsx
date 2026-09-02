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
  PowerOff,
  Search,
  ShieldAlert,
  Tag,
  Volume2,
  Wind,
  Wrench,
  X,
  Zap,
} from "lucide-react";

import { PageHeader } from "@/components/customer-portal/PageHeader";
import { StatusBadge } from "@/components/customer-portal/StatusBadge";
import { Button } from "@/components/ui/Button";
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
  { label: "Active", value: "active" },
  { label: "Quoted", value: "quoted" },
  { label: "Accepted", value: "accepted" },
  { label: "Rejected", value: "rejected" },
  { label: "Completed", value: "completed" },
] as const;

function matchesFilter(status: string, filter: string) {
  const norm = (status || "").toLowerCase().replace(/_/g, "-");
  if (filter === "all") return true;
  if (filter === "active") {
    return ["submitted", "under-review", "under_review", "quoted"].includes(norm);
  }
  if (filter === "quoted") {
    return norm === "quoted";
  }
  if (filter === "accepted") {
    return ["accepted", "scheduled", "in-progress", "in_progress"].includes(norm);
  }
  if (filter === "rejected") {
    return ["rejected", "cancelled"].includes(norm);
  }
  if (filter === "completed") {
    return norm === "completed";
  }
  return true;
}

function getSymptomIcon(symptom: string) {
  const s = symptom.toLowerCase();
  if (s.includes("suction") || s.includes("clog") || s.includes("air")) return Wind;
  if (s.includes("shut off") || s.includes("turn on") || s.includes("power") || s.includes("electrical")) return PowerOff;
  if (s.includes("inlet") || s.includes("wall") || s.includes("valve")) return ShieldAlert;
  if (s.includes("hose") || s.includes("pipe") || s.includes("wand")) return Wrench;
  if (s.includes("noise") || s.includes("sound") || s.includes("motor")) return Volume2;
  return Tag;
}

export function UserServicesClient() {
  useSharedBusinessStoreVersion();
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: apiResponse, isLoading: isLoadingRequests } = useGetMyServiceRequestsQuery();
  const { data: myQuotations } = useGetMyQuotationsQuery();

  const mockRequests = useMemo(() => getCustomerServiceRequests(), []);

  // Merge API requests with mock fallback
  const allRequests = useMemo(() => {
    const apiItems = apiResponse?.items || [];
    if (apiItems.length > 0) {
      return apiItems;
    }
    return mockRequests;
  }, [apiResponse, mockRequests]);

  // Pre-calculate count for each filter tab
  const filterCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: allRequests.length,
      active: 0,
      quoted: 0,
      accepted: 0,
      rejected: 0,
      completed: 0,
    };
    for (const req of allRequests) {
      for (const f of filters) {
        if (f.value !== "all" && matchesFilter(req.status, f.value)) {
          counts[f.value] = (counts[f.value] || 0) + 1;
        }
      }
    }
    return counts;
  }, [allRequests]);

  const filteredRequests = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allRequests.filter((req) => {
      const matchesTab = matchesFilter(req.status, selectedFilter);
      if (!matchesTab) return false;

      if (!q) return true;

      const reqAny = req as unknown as Record<string, unknown>;
      const idMatch =
        (req.id?.toLowerCase().includes(q) ?? false) ||
        ((reqAny.businessId as string)?.toLowerCase().includes(q) ?? false);
      const titleMatch = (req.title || "").toLowerCase().includes(q);
      const descMatch = (req.description || (reqAny.problemDescription as string) || "").toLowerCase().includes(q);
      const addressMatch =
        (req.serviceAddress?.line1 || (reqAny.address as string) || "").toLowerCase().includes(q) ||
        (req.serviceAddress?.city || (reqAny.city as string) || "").toLowerCase().includes(q);

      return idMatch || titleMatch || descMatch || addressMatch;
    });
  }, [allRequests, selectedFilter, searchQuery]);

  return (
    <div className="space-y-6 sm:space-y-7 pb-12">
      <PageHeader
        eyebrow="Customer Portal"
        title="My Service Requests"
        description="Track all submitted intake requests, diagnostics, and quotation updates in real-time."
        actions={
          <Button asChild size="sm" className="rounded-md bg-teal-600 hover:bg-teal-500 text-white font-semibold shadow-xs">
            <Link href="/services">
              <Wrench size={14} className="mr-1.5" />
              Request New Service
            </Link>
          </Button>
        }
      />

      {/* SEARCH AND FILTER BAR */}
      <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:p-5 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          {filters.map((filter) => {
            const count = filterCounts[filter.value] || 0;
            const isSelected = selectedFilter === filter.value;
            return (
              <Button
                key={filter.value}
                size="sm"
                variant={isSelected ? "default" : "outline"}
                onClick={() => setSelectedFilter(filter.value)}
                className={`rounded-md text-xs font-semibold h-8 px-3 transition-colors ${
                  isSelected
                    ? "bg-teal-700 text-white hover:bg-teal-800"
                    : "border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                {filter.label}
                <span
                  className={`ml-1.5 rounded-full px-1.5 py-0.2 text-[11px] font-bold ${
                    isSelected
                      ? "bg-teal-800 text-teal-100"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {count}
                </span>
              </Button>
            );
          })}
        </div>

        <div className="relative flex items-center pt-1">
          <Search size={16} className="pointer-events-none absolute left-3.5 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by request ID, title, reported issue, or address..."
            className="h-10 rounded-md border-slate-200 bg-slate-50/60 pl-10 pr-10 text-xs sm:text-sm focus-visible:bg-white focus-visible:ring-teal-600"
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
        <div className="flex flex-col items-center justify-center rounded-lg border border-slate-200 bg-white py-20 text-teal-700 shadow-xs">
          <Loader2 size={28} className="animate-spin text-teal-600" />
          <span className="mt-3 text-xs sm:text-sm font-semibold text-slate-700">Loading service requests...</span>
        </div>
      )}

      {!isLoadingRequests && (
        <div className="space-y-4 sm:space-y-5">
          {filteredRequests.length === 0 ? (
            <div className="rounded-lg border border-dashed border-teal-200 bg-teal-50/30 p-12 text-center">
              <div className="mx-auto flex size-14 items-center justify-center rounded-lg bg-teal-100 text-teal-800 shadow-xs">
                <Wrench size={26} />
              </div>
              <h2 className="mt-4 text-base sm:text-lg font-bold text-slate-900">
                {searchQuery ? "No matching service requests found" : "No service requests yet"}
              </h2>
              <p className="mx-auto mt-1.5 max-w-md text-xs sm:text-sm text-slate-600 leading-relaxed">
                {searchQuery
                  ? `No service requests matched "${searchQuery}". Try a different keyword or switch filter tabs.`
                  : "Submit a new service intake ticket to schedule diagnostic inspection, repair, or maintenance for your central vacuum."}
              </p>
              <Button asChild size="sm" className="mt-6 rounded-md bg-teal-600 hover:bg-teal-500 font-semibold text-white shadow-xs">
                <Link href="/services">Start New Service Request</Link>
              </Button>
            </div>
          ) : (
            filteredRequests.map((request) => {
              const reqAny = request as unknown as {
                createdAt?: string;
                submittedAt?: string;
                problemDescription?: string;
                address?: string;
                city?: string;
                state?: string;
                zipCode?: string;
                symptoms?: string[];
                businessId?: string;
                serviceName?: string;
              };

              const displayId = request.businessId || reqAny.businessId || request.id;

              // Title formatting
              const serviceName = request.service?.name || reqAny.serviceName || "Central Vacuum Maintenance";
              const rawTitle = request.title || serviceName;
              const cleanTitle = rawTitle.includes(" - ") ? rawTitle.split(" - ")[0].trim() : rawTitle;

              // Problem Description
              const description =
                request.description ||
                reqAny.problemDescription ||
                "Customer requested diagnostic evaluation and inspection.";

              // Schedule
              const displaySchedule =
                request.requestedSchedule?.label ??
                (request.preferredDate
                  ? `${formatMonthDay(request.preferredDate)}${request.preferredTime ? ` · ${request.preferredTime}` : ""}`
                  : "Pending schedule");

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

              const symptoms = request.symptoms || reqAny.symptoms || [];

              return (
                <article
                  key={request.id}
                  className="rounded-lg border border-slate-200 bg-white p-5 sm:p-6 shadow-xs transition-all hover:border-teal-300 hover:shadow-sm"
                >
                  {/* CARD TOP HEADER: ID, Badges, Submitted Time */}
                  <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-slate-100 pb-3.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-md">
                        ID: {displayId}
                      </span>
                      <StatusBadge status={request.status} />

                      {request.urgency && (
                        <span className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800">
                          <Zap size={11} className="text-amber-600" />
                          {request.urgency} Priority
                        </span>
                      )}

                      {request.service?.category && (
                        <span className="inline-flex items-center gap-1 rounded-md border border-teal-200 bg-teal-50 px-2 py-0.5 text-xs font-semibold text-teal-800">
                          {request.service.category.replace(/_/g, " ")}
                        </span>
                      )}
                    </div>

                    <span className="text-xs text-slate-500 font-normal">
                      Submitted:{" "}
                      <strong className="text-slate-700 font-medium">
                        {request.submittedAt || reqAny.createdAt
                          ? formatShortDateTime(request.submittedAt || reqAny.createdAt || "")
                          : formatLongDate(new Date().toISOString())}
                      </strong>
                    </span>
                  </div>

                  {/* CARD BODY: Title, Narrative, Symptoms */}
                  <div className="mt-3.5 space-y-2">
                    <h2 className="text-base sm:text-lg font-bold tracking-tight text-slate-900">
                      <Link
                        href={`/user/services/${request.id}`}
                        className="hover:text-teal-700 transition"
                      >
                        {cleanTitle}
                      </Link>
                    </h2>

                    <p className="line-clamp-2 text-xs sm:text-sm leading-relaxed text-slate-600 font-normal">
                      &ldquo;{description}&rdquo;
                    </p>

                    {/* Symptoms Chips */}
                    {symptoms.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-xs font-semibold text-slate-400 mr-0.5">Symptoms:</span>
                        {symptoms.slice(0, 4).map((sym: string, idx: number) => {
                          const SymptomIcon = getSymptomIcon(sym);
                          return (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1 rounded-md bg-teal-50 border border-teal-200/70 px-2 py-0.5 text-[11px] font-semibold text-teal-950"
                            >
                              <SymptomIcon size={11} className="text-teal-700" />
                              {sym.replace(/_/g, " ")}
                            </span>
                          );
                        })}
                        {symptoms.length > 4 && (
                          <span className="text-[11px] font-medium text-slate-400">
                            +{symptoms.length - 4} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* CARD FOOTER: Structured Metadata & Actions */}
                  <div className="mt-4 border-t border-slate-100 pt-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3.5">
                    {/* Key Facts */}
                    <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs">
                      {/* Schedule */}
                      <div className="flex items-center gap-2">
                        <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-teal-50 text-teal-700 border border-teal-200/60">
                          <CalendarDays size={14} />
                        </div>
                        <div>
                          <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                            Preferred Slot
                          </span>
                          <span className="font-semibold text-slate-900">
                            {displaySchedule}
                          </span>
                        </div>
                      </div>

                      {/* Location */}
                      <div className="flex items-center gap-2">
                        <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-600 border border-slate-200/60">
                          <MapPin size={14} />
                        </div>
                        <div>
                          <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                            Service Location
                          </span>
                          <span className="font-semibold text-slate-800 truncate max-w-[180px] sm:max-w-[220px] block">
                            {displayAddress}
                          </span>
                        </div>
                      </div>

                      {/* Quotation preview if present */}
                      {quoteTotal ? (
                        <div className="flex items-center gap-2">
                          <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-amber-50 text-amber-800 border border-amber-200/60">
                            <FileCheck2 size={14} />
                          </div>
                          <div>
                            <span className="block text-[10px] font-semibold uppercase tracking-wider text-amber-800">
                              Official Quote
                            </span>
                            <span className="font-bold text-slate-900">
                              {formatCurrencyUsd(quoteTotal)}
                            </span>
                          </div>
                        </div>
                      ) : null}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex shrink-0 items-center gap-2">
                      {isQuoted && quotation && (
                        <Button
                          asChild
                          size="sm"
                          className="rounded-md bg-amber-600 text-white hover:bg-amber-700 font-semibold shadow-xs text-xs"
                        >
                          <Link href={`/user/quotations/${quotation.id}`}>
                            <FileText size={13} className="mr-1" />
                            Review Quotation
                          </Link>
                        </Button>
                      )}

                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="rounded-md border-slate-200 text-slate-800 hover:bg-slate-50 font-semibold text-xs"
                      >
                        <Link href={`/user/services/${request.id}`}>
                          View Details
                          <ArrowRight size={13} className="ml-1 text-teal-600" />
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
