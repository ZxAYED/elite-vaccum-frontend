"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Clock3,
  FileText,
  Loader2,
  MapPin,
  Search,
  Wrench,
  X,
} from "lucide-react";

import { PageHeader } from "@/components/customer-portal/PageHeader";
import { StatusBadge } from "@/components/customer-portal/StatusBadge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useGetMyServiceRequestsQuery } from "@/redux/api/serviceRequestsApi";
import { getCustomerServiceRequests } from "@/data/mock/customer-portal";
import { useSharedBusinessStoreVersion } from "@/hooks/useSharedBusinessStoreVersion";
import { formatLongDate, formatMonthDay } from "@/lib/formatters";

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

export function UserServicesClient() {
  useSharedBusinessStoreVersion();
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: apiResponse, isLoading } = useGetMyServiceRequestsQuery();

  const mockRequests = useMemo(() => getCustomerServiceRequests(), []);

  // Merge API requests with mock fallback
  const allRequests = useMemo(() => {
    const apiItems = apiResponse?.items || [];
    if (apiItems.length > 0) {
      return apiItems;
    }
    return mockRequests;
  }, [apiResponse, mockRequests]);

  const filteredRequests = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allRequests.filter((req) => {
      const matchesTab = matchesFilter(req.status, selectedFilter);
      if (!matchesTab) return false;

      if (!q) return true;

      const idMatch = req.id?.toLowerCase().includes(q) ?? false;
      const titleMatch = (req.title || "").toLowerCase().includes(q);
      const descMatch = (req.description || (req as unknown as { problemDescription?: string }).problemDescription || "").toLowerCase().includes(q);
      const addressMatch =
        (req.serviceAddress?.line1 || (req as unknown as { address?: string }).address || "").toLowerCase().includes(q) ||
        (req.serviceAddress?.city || (req as unknown as { city?: string }).city || "").toLowerCase().includes(q);

      return idMatch || titleMatch || descMatch || addressMatch;
    });
  }, [allRequests, selectedFilter, searchQuery]);

  return (
    <div className="min-h-screen">
      <PageHeader
        eyebrow="Customer Portal"
        title="My Service Requests"
        description="Track all submitted intake requests, diagnostics, and quotation updates in real-time."
        actions={
          <Button asChild size="pill">
            <Link href="/services">
              <Wrench size={18} />
              Request New Service
            </Link>
          </Button>
        }
      />

      <div className="mb-6 flex flex-col gap-4 rounded-3xl border border-teal-100 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => (
            <Button
              key={filter.value}
              size="sm"
              variant={selectedFilter === filter.value ? "default" : "ghost"}
              onClick={() => setSelectedFilter(filter.value)}
              className="rounded-full"
            >
              {filter.label}
            </Button>
          ))}
        </div>

        <div className="relative flex items-center">
          <Search size={16} className="pointer-events-none absolute left-4 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by request ID, description, or address..."
            className="h-11 rounded-2xl border-teal-100 bg-slate-50/50 pl-11 pr-10 text-sm focus-visible:bg-white"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              aria-label="Clear search"
              className="absolute right-3 flex size-6 items-center justify-center rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-600"
            >
              <X size={14} />
            </button>
          ) : null}
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-16 text-teal-700">
          <Loader2 size={32} className="animate-spin" />
          <span className="ml-3 text-sm font-medium text-slate-600">Loading service requests...</span>
        </div>
      )}

      {!isLoading && (
        <div className="space-y-5">
          {filteredRequests.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-teal-200 bg-teal-50/30 p-12 text-center">
              <Wrench size={36} className="mx-auto text-teal-700 opacity-60" />
              <h2 className="mt-4 text-lg font-semibold text-slate-900">
                {searchQuery ? "No matching requests found" : "No service requests yet"}
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                {searchQuery
                  ? "Try searching for a different keyword or resetting your filter."
                  : "Submit a new service request to schedule central vacuum repair or maintenance."}
              </p>
              <Button asChild size="pill" className="mt-6">
                <Link href="/services">Start a Service Request</Link>
              </Button>
            </div>
          ) : (
            filteredRequests.map((request) => {
              const reqAny = request as unknown as {
                createdAt?: string;
                problemDescription?: string;
                address?: string;
                city?: string;
                symptoms?: string[];
              };

              const displayDate =
                request.requestedSchedule?.label ??
                (request.preferredDate
                  ? `${formatMonthDay(request.preferredDate)}${request.preferredTime ? ` at ${request.preferredTime}` : ""}`
                  : formatLongDate(request.submittedAt || reqAny.createdAt || new Date().toISOString()));

              const isQuoted =
                (request.status || "").toLowerCase().replace(/_/g, "-") === "quoted";

              return (
                <article
                  key={request.id}
                  className="rounded-3xl border border-teal-100/80 bg-white p-6 shadow-[0_12px_36px_-24px_rgba(28,79,80,0.15)] transition hover:border-teal-300"
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0 flex-1 space-y-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="font-mono text-sm font-bold text-teal-800">
                          {request.id}
                        </span>
                        <StatusBadge status={request.status} />
                        {request.urgency && (
                          <StatusBadge label={request.urgency} status={request.urgency} />
                        )}
                      </div>

                      <h2 className="text-xl font-bold text-slate-900">
                        {request.title || "Central Vacuum Service Request"}
                      </h2>

                      <p className="line-clamp-2 text-sm leading-relaxed text-slate-600">
                        {request.description || reqAny.problemDescription}
                      </p>

                      <div className="flex flex-wrap items-center gap-y-2 gap-x-5 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1.5 font-medium text-slate-700">
                          <Clock3 size={14} className="text-teal-600" />
                          {displayDate}
                        </span>
                        {(request.serviceAddress?.line1 || reqAny.address) && (
                          <span className="inline-flex items-center gap-1.5">
                            <MapPin size={14} className="text-slate-400" />
                            {request.serviceAddress?.line1 || reqAny.address},{" "}
                            {request.serviceAddress?.city || reqAny.city}
                          </span>
                        )}
                        {reqAny.symptoms && reqAny.symptoms.length > 0 && (
                          <span className="inline-flex flex-wrap gap-1.5">
                            {reqAny.symptoms.slice(0, 3).map((sym: string, idx: number) => (
                              <span
                                key={idx}
                                className="rounded-md bg-teal-50 px-2 py-0.5 text-[11px] font-medium text-teal-700"
                              >
                                {sym.replace(/_/g, " ")}
                              </span>
                            ))}
                            {reqAny.symptoms.length > 3 && (
                              <span className="text-[11px] text-slate-400">
                                +{reqAny.symptoms.length - 3} more
                              </span>
                            )}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-wrap items-center gap-3">
                      {isQuoted && (
                        <Button asChild size="pill" className="bg-amber-600 text-white hover:bg-amber-700">
                          <Link href={`/user/quotations/${request.id}`}>
                            <FileText size={16} />
                            Review Quotation
                          </Link>
                        </Button>
                      )}
                      <Button asChild variant="outline" size="pill">
                        <Link href={`/user/services/${request.id}`}>
                          View Details
                          <ArrowRight size={16} />
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
