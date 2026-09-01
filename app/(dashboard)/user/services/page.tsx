import Link from "next/link";
import { ArrowRight, CalendarDays, MapPin, Search, Wrench, X } from "lucide-react";

import { PageHeader } from "@/components/customer-portal/PageHeader";
import { StatusBadge } from "@/components/customer-portal/StatusBadge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { getDashboardServiceOrderByRequestId } from "@/data/mock/customer-dashboard";
import {
  getServiceById,
  getServiceDetailByRequestId,
  getCustomerServiceRequests,
} from "@/data/mock/customer-portal";
import { formatCurrencyUsd, formatLongDate } from "@/lib/formatters";

const filters = [
  { label: "All", value: "all" },
  { label: "Active", value: "active" },
  { label: "Accepted", value: "accepted" },
  { label: "Rejected", value: "rejected" },
  { label: "History", value: "history" },
] as const;

function matchesFilter(status: string, filter: string) {
  if (filter === "all") return true;
  if (filter === "active") {
    return ["submitted", "under-review", "quoted"].includes(status);
  }
  if (filter === "accepted") {
    return ["accepted", "scheduled", "in-progress"].includes(status);
  }
  if (filter === "rejected") return ["rejected", "cancelled"].includes(status);
  return ["completed"].includes(status);
}

interface UserServicesPageProps {
  searchParams?: Promise<{ filter?: string; q?: string }>;
}

export default async function UserServicesPage({
  searchParams,
}: UserServicesPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const activeFilter = resolvedSearchParams?.filter ?? "all";
  const selectedFilter = filters.some((filter) => filter.value === activeFilter)
    ? activeFilter
    : "all";
  const query = (resolvedSearchParams?.q ?? "").trim().toLowerCase();

  const requests = getCustomerServiceRequests().filter((request) => {
    const filterMatch = matchesFilter(request.status, selectedFilter);
    const service = getServiceById(request.serviceId);
    const searchMatch =
      !query ||
      request.id.toLowerCase().includes(query) ||
      request.title.toLowerCase().includes(query) ||
      request.description.toLowerCase().includes(query) ||
      (service?.name.toLowerCase().includes(query) ?? false) ||
      (request.serviceAddress?.line1.toLowerCase().includes(query) ?? false);

    return filterMatch && searchMatch;
  });

  return (
    <div className="min-h-screen">
      <PageHeader
        actions={
          <Button asChild>
            <Link href="/services">
              <Wrench size={18} />
              Request Service
            </Link>
          </Button>
        }
        description="Requests stay separate from orders until a quotation is accepted."
        eyebrow="Service Requests"
        title="Service Requests"
      />

      <div className="mb-6 flex flex-col gap-4 rounded-3xl border border-teal-100 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => (
            <Button
              asChild
              key={filter.value}
              size="sm"
              variant={selectedFilter === filter.value ? "default" : "ghost"}
            >
              <Link href={`/user/services?filter=${filter.value}${query ? `&q=${encodeURIComponent(query)}` : ""}`}>
                {filter.label}
              </Link>
            </Button>
          ))}
        </div>

        <form method="GET" action="/user/services" className="relative flex items-center">
          <input type="hidden" name="filter" value={selectedFilter} />
          <Search size={16} className="pointer-events-none absolute left-4 text-slate-400" />
          <Input
            name="q"
            defaultValue={resolvedSearchParams?.q ?? ""}
            placeholder="Search by request ID, problem, or service..."
            className="h-11 rounded-2xl border-teal-100 bg-slate-50/50 pl-11 pr-10 text-sm focus-visible:bg-white"
          />
          {query ? (
            <Link
              href={`/user/services?filter=${selectedFilter}`}
              aria-label="Clear search"
              className="absolute right-3 flex size-6 items-center justify-center rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-600"
            >
              <X size={14} />
            </Link>
          ) : null}
        </form>
      </div>

      <div className="space-y-5">
        {requests.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-teal-200 bg-teal-50/30 p-10 text-center">
            <Wrench size={32} className="mx-auto text-teal-700 opacity-60" />
            <p className="mt-3 text-lg font-semibold text-slate-900">No matching service requests</p>
            <p className="mt-1 text-sm text-slate-500">
              Try adjusting your search query or filter status.
            </p>
            {(query || selectedFilter !== "all") ? (
              <Button asChild size="sm" variant="outline" className="mt-4">
                <Link href="/user/services">Clear all filters</Link>
              </Button>
            ) : null}
          </div>
        ) : null}
        {requests.map((request) => {
          const service = getServiceById(request.serviceId);
          const detail = getServiceDetailByRequestId(request.id);
          const order = getDashboardServiceOrderByRequestId(request.id);
          const quote = detail?.quote;
          const actionHref = order
            ? `/user/orders/${order.id}`
            : quote
              ? `/user/services/${request.id}/quotation`
              : `/user/services/${request.id}`;
          const actionLabel = order
            ? "View Service Order"
            : quote
              ? "Review Quote"
              : "View Details";

          return (
            <article
              className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm"
              key={request.id}
            >
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <StatusBadge label={request.id} status="submitted" />
                    <p className="text-sm text-gray-500">
                      Submitted {formatLongDate(request.submittedAt)}
                    </p>
                    <StatusBadge status={request.status} />
                  </div>
                  <h2 className="mt-4 text-2xl font-semibold text-primary">
                    {service?.name ?? request.title}
                  </h2>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">
                    {request.description}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-600">
                    <span className="inline-flex items-center gap-2">
                      <MapPin size={16} />
                      {request.serviceAddress.line1}, {request.serviceAddress.city}
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <CalendarDays size={16} />
                      Requested {request.requestedSchedule?.label ?? request.preferredTime}
                    </span>
                  </div>

                  {request.rejectionHistory?.length ? (
                    <div className="mt-5 rounded-2xl bg-rose-50 p-4 text-sm text-rose-800">
                      <span className="font-semibold">Request rejected:</span>{" "}
                      {request.rejectionHistory[0]?.reason}
                    </div>
                  ) : null}

                  {quote ? (
                    <div className="mt-5 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900">
                      <span className="font-semibold">Quote ready:</span>{" "}
                      {formatCurrencyUsd(quote.totalUsd)}
                    </div>
                  ) : null}
                </div>

                <div className="w-full rounded-2xl bg-gray-50 p-4 lg:w-56">
                  <Button asChild className="w-full" variant={quote ? "default" : "outline"}>
                    <Link href={actionHref}>
                      {actionLabel}
                      <ArrowRight size={16} />
                    </Link>
                  </Button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
