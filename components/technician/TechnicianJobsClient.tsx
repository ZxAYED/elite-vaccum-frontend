"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CalendarDays, MapPin, Phone, Search, X } from "lucide-react";

import { StatusBadge } from "@/components/customer-portal/StatusBadge";
import {
  AdminSurface,
  TechnicianRouteShell,
} from "@/components/technician/TechnicianRouteShell";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import {
  useGetMyAssignedJobsQuery,
  type GetTechnicianJobsParams,
} from "@/redux/api/technicianApi";

type JobTab = NonNullable<GetTechnicianJobsParams["tab"]>;

const filters: Array<{ label: string; value: JobTab }> = [
  { label: "Today", value: "today" },
  { label: "Upcoming", value: "upcoming" },
  { label: "In Progress", value: "in_progress" },
  { label: "Completed", value: "completed" },
  { label: "All", value: "all" },
];

function CompactCount({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-teal-100 bg-white p-3 shadow-xs">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

export function TechnicianJobsClient() {
  const [activeFilter, setActiveFilter] = useState<JobTab>("today");
  const [searchQuery, setSearchQuery] = useState("");

  // Phase 17.2 `GET /technicians/me/jobs?tab=...`
  const {
    data: jobsData,
    isLoading,
    isError,
  } = useGetMyAssignedJobsQuery({
    tab: activeFilter,
    page: 1,
    limit: 50,
  });

  const counts = {
    today: jobsData?.counts?.today ?? 0,
    upcoming: jobsData?.counts?.upcoming ?? 0,
    active: jobsData?.counts?.active ?? 0,
    completed: jobsData?.counts?.completed ?? 0,
  };

  const jobs = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return (jobsData?.items ?? [])
      .map((item) => ({
        // The detail route resolves by service order id; `businessId` is the
        // human-readable reference shown on the card.
        id: item.id,
        reference: item.businessId || item.id,
        serviceName: item.service?.name || "Central Vacuum Service",
        status: item.status?.toLowerCase() ?? "scheduled",
        customerLabel: item.customer?.displayName || "Customer",
        customerPhone: item.customer?.phone || "",
        addressLabel: item.propertyAddress || "Customer Property",
        scheduleLabel: item.timeWindow || "Scheduled Appointment",
        etaMinutes: item.etaMinutes,
        symptoms: item.symptoms ?? [],
      }))
      .filter((job) => {
        if (!query) return true;
        return (
          job.reference.toLowerCase().includes(query) ||
          job.serviceName.toLowerCase().includes(query) ||
          job.customerLabel.toLowerCase().includes(query) ||
          job.addressLabel.toLowerCase().includes(query)
        );
      });
  }, [jobsData?.items, searchQuery]);

  return (
    <TechnicianRouteShell
      eyebrow="Assigned Work"
      title="My Jobs"
      description="Assigned service orders for this technician only."
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <CompactCount label="Today" value={counts.today} />
        <CompactCount label="Upcoming" value={counts.upcoming} />
        <CompactCount label="Active" value={counts.active} />
        <CompactCount label="Completed" value={counts.completed} />
      </div>

      <AdminSurface className="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {filters.map((filter) => {
              const active = activeFilter === filter.value;
              return (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => setActiveFilter(filter.value)}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                    active
                      ? "bg-primary text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-teal-50 hover:text-primary"
                  }`}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>

          <div className="relative w-full lg:w-72">
            <Search className="pointer-events-none absolute left-3 top-3.5 size-4 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search assigned jobs..."
              className="h-10 pl-9 pr-8 text-sm"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-3 text-slate-400 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3 pt-2" aria-busy>
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="h-40 animate-pulse rounded-xl bg-slate-100"
              />
            ))}
            <span className="sr-only">Loading assigned jobs</span>
          </div>
        ) : isError ? (
          <EmptyState
            icon={CalendarDays}
            title="We couldn't load your jobs"
            description="Your assignment queue is temporarily unavailable. Please refresh in a moment or contact dispatch."
            tone="dashed"
            className="py-12"
          />
        ) : jobs.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="No jobs match your filter"
            description={
              searchQuery
                ? "Try searching with a different customer name, order number, or address."
                : "Assignments in this queue will appear automatically once dispatched."
            }
            tone="dashed"
            className="py-12"
          />
        ) : (
          <div className="space-y-3 pt-2">
            {jobs.map((job) => (
              <article
                key={job.id}
                className="rounded-xl border border-teal-100 bg-slate-50 p-4 transition hover:border-teal-300"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={job.status} />
                      <span className="text-sm font-medium text-slate-500">
                        {job.reference}
                      </span>
                      {job.etaMinutes ? (
                        <span className="rounded-full bg-teal-100 px-2.5 py-0.5 text-xs font-semibold text-teal-800">
                          ETA {job.etaMinutes}m
                        </span>
                      ) : null}
                    </div>

                    <h3 className="mt-2 text-lg font-bold text-primary">
                      {job.serviceName}
                    </h3>
                    <p className="text-sm font-medium text-slate-700">
                      Customer: {job.customerLabel}
                    </p>

                    <div className="mt-3 grid gap-2 sm:grid-cols-2 text-xs text-slate-600">
                      <div className="inline-flex items-center gap-2">
                        <MapPin size={14} className="text-teal-700 shrink-0" />
                        <span className="truncate">{job.addressLabel}</span>
                      </div>
                      <div className="inline-flex items-center gap-2">
                        <CalendarDays size={14} className="text-teal-700 shrink-0" />
                        <span>{job.scheduleLabel}</span>
                      </div>
                      {job.customerPhone && (
                        <div className="inline-flex items-center gap-2">
                          <Phone size={14} className="text-teal-700 shrink-0" />
                          <a href={`tel:${job.customerPhone}`} className="hover:text-teal-700">
                            {job.customerPhone}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="w-full lg:w-44 shrink-0 flex items-center">
                    <Button asChild className="w-full" size="sm">
                      <Link href={`/technician/jobs/${job.id}`}>View Job</Link>
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </AdminSurface>
    </TechnicianRouteShell>
  );
}
