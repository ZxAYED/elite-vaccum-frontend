"use client";

import {
  CalendarDays,
  ClipboardCheck,
  Eye,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { useGetAdminServiceRequestsQuery } from "@/redux/api/serviceRequestsApi";

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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import {
  getSharedCustomerById,
  getSharedPublicServices,
  getSharedServiceRequests,
} from "@/data/mock/shared-business-store";
import { useSharedBusinessStoreVersion } from "@/hooks/useSharedBusinessStoreVersion";
import { formatMonthDay, formatShortDate } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import type { ServiceRequest, ServiceRequestStatus } from "@/types/domain";

type AdminRequestStatus =
  | "all"
  | "submitted"
  | "under-review"
  | "accepted"
  | "rejected"
  | "cancelled";

const statusOptions: Array<{ label: string; value: AdminRequestStatus }> = [
  { label: "All", value: "all" },
  { label: "New", value: "submitted" },
  { label: "Under Review", value: "under-review" },
  { label: "Accepted", value: "accepted" },
  { label: "Rejected", value: "rejected" },
  { label: "Cancelled", value: "cancelled" },
];

const quickStatusOptions: Array<{ label: string; value: AdminRequestStatus }> = [
  { label: "All", value: "all" },
  { label: "New", value: "submitted" },
  { label: "Under Review", value: "under-review" },
  { label: "Accepted", value: "accepted" },
];

const acceptedLikeStatuses: ServiceRequestStatus[] = [
  "accepted",
  "quoted",
  "scheduled",
  "in-progress",
  "completed",
];

function getReviewStatus(status: ServiceRequestStatus): AdminRequestStatus {
  if (acceptedLikeStatuses.includes(status)) return "accepted";
  if (status === "rejected") return "rejected";
  if (status === "cancelled") return "cancelled";
  if (status === "under-review") return "under-review";
  return "submitted";
}

function getStatusLabel(status: AdminRequestStatus) {
  const labels: Record<AdminRequestStatus, string> = {
    all: "All",
    submitted: "New",
    "under-review": "Under Review",
    accepted: "Accepted",
    rejected: "Rejected",
    cancelled: "Cancelled",
  };

  return labels[status];
}

function getCustomer(request: ServiceRequest) {
  return getSharedCustomerById(request.customerId);
}

function getServiceName(request: ServiceRequest) {
  return (
    getSharedPublicServices().find(
      (service) => service.serviceId === request.serviceId,
    )?.title ?? request.title
  );
}

function getRequestedSchedule(request: ServiceRequest) {
  return request.requestedSchedule ?? {
    date: request.preferredDate,
    time: request.preferredTime,
  };
}

export default function AdminServiceRequestsPage() {
  useSharedBusinessStoreVersion();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<AdminRequestStatus>("all");
  const [serviceFilter, setServiceFilter] = useState("all");

  const { data: apiResponse } = useGetAdminServiceRequestsQuery();
  const mockServiceRequests = getSharedServiceRequests();

  const serviceRequests = useMemo(() => {
    const apiItems = apiResponse?.items || [];
    if (apiItems.length > 0) {
      return apiItems;
    }
    return mockServiceRequests;
  }, [apiResponse, mockServiceRequests]);
  const services = Array.from(
    new Map(
      getSharedPublicServices().map((service) => [
        service.serviceId,
        { serviceId: service.serviceId, title: service.title },
      ]),
    ).values(),
  );

  const counters = serviceRequests.reduce(
    (stats, request) => {
      const status = getReviewStatus(request.status);
      if (status === "submitted") stats.new += 1;
      if (status === "under-review") stats.underReview += 1;
      if (status === "accepted") stats.accepted += 1;
      if (status === "rejected") stats.rejected += 1;
      return stats;
    },
    { accepted: 0, new: 0, rejected: 0, underReview: 0 },
  );

  const normalizedQuery = query.trim().toLowerCase();
  const filteredRequests = serviceRequests
    .filter((request) => {
      const customer = getCustomer(request);
      const serviceName = getServiceName(request);
      const address = request.serviceAddress;
      const haystack = [
        request.id,
        customer?.displayName,
        customer?.email,
        customer?.phone,
        serviceName,
        address?.line1,
        address?.city,
        address?.state,
        address?.postalCode,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const matchesSearch =
        normalizedQuery.length === 0 || haystack.includes(normalizedQuery);
      const reviewStatus = getReviewStatus(request.status);
      const matchesStatus =
        statusFilter === "all" || reviewStatus === statusFilter;
      const matchesService =
        serviceFilter === "all" || request.serviceId === serviceFilter;

      return matchesSearch && matchesStatus && matchesService;
    })
    .sort(
      (a, b) =>
        new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
    );

  function clearFilters() {
    setQuery("");
    setStatusFilter("all");
    setServiceFilter("all");
  }

  return (
    <AdminPageShell>
      <section className="space-y-4">
        <AdminPageHeader
          eyebrow="Service Operations"
          title="Service Requests"
          description="Review customer service requests and decide the next action."
        />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <AdminStatCard label="New" value={counters.new} />
          <AdminStatCard label="Under Review" value={counters.underReview} />
          <AdminStatCard label="Accepted" value={counters.accepted} tone="success" />
          <AdminStatCard label="Rejected" value={counters.rejected} tone="warning" />
        </div>

        <AdminSurface className="space-y-5">
          <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_24rem_13rem_16rem]">
            <AdminSearchInput
              value={query}
              onChange={setQuery}
              placeholder="Search request ID, customer, service, address..."
              ariaLabel="Search service requests"
            />

            <div className="grid grid-cols-2 gap-2 rounded-lg bg-slate-50 p-1 sm:grid-cols-4">
              {quickStatusOptions.map((option) => (
                <button
                  className={cn(
                    "min-h-10 rounded-lg px-3 text-center text-xs font-semibold transition sm:text-sm",
                    statusFilter === option.value
                      ? "bg-primary text-white shadow-[0_14px_30px_-22px_rgba(28,79,80,0.9)]"
                      : "text-slate-600 hover:bg-white hover:text-teal-800",
                  )}
                  key={option.value}
                  onClick={() => setStatusFilter(option.value)}
                  type="button"
                >
                  {option.label}
                </button>
              ))}
            </div>

            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as AdminRequestStatus)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={serviceFilter} onValueChange={setServiceFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by service" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All services</SelectItem>
                {services.map((service) => (
                  <SelectItem key={service.serviceId} value={service.serviceId}>
                    {service.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {serviceRequests.length === 0 ? (
            <EmptyState
              action={<Button>Refresh</Button>}
              title="No service requests yet."
              text="New customer requests will appear here."
            />
          ) : filteredRequests.length === 0 ? (
            <EmptyState
              action={
                <Button variant="outline" onClick={clearFilters}>
                  Clear Filters
                </Button>
              }
              title="No service requests match your filters."
              text="Try a different search term, service, or status."
            />
          ) : (
            <>
              <div className="hidden overflow-hidden rounded-lg border border-teal-100 lg:block">
                <table className="w-full border-collapse text-left">
                  <thead className="bg-[#f7fbfa] text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                    <tr>
                      <th className="px-5 py-4">Request</th>
                      <th className="px-5 py-4">Customer</th>
                      <th className="px-5 py-4">Service</th>
                      <th className="px-5 py-4">Location</th>
                      <th className="px-5 py-4">Requested Schedule</th>
                      <th className="px-5 py-4">Submitted</th>
                      <th className="px-5 py-4">Status</th>
                      <th className="px-5 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-teal-100">
                    {filteredRequests.map((request) => {
                      const customer = getCustomer(request);
                      const schedule = getRequestedSchedule(request);
                      const reviewStatus = getReviewStatus(request.status);

                      return (
                        <tr className="bg-white" key={request.id}>
                          <td className="px-5 py-5">
                            <p className="font-semibold text-teal-950">
                              {request.id}
                            </p>
                            <p className="mt-1 text-sm text-slate-500">
                              {request.urgency}
                            </p>
                          </td>
                          <td className="px-5 py-5">
                            <div className="flex items-center gap-3">
                              <span className="flex size-10 items-center justify-center rounded-full bg-teal-50 text-teal-800">
                                <UserRound size={17} />
                              </span>
                              <div>
                                <p className="font-semibold text-slate-900">
                                  {customer?.displayName ?? "Pending customer"}
                                </p>
                                <p className="text-sm text-slate-500">
                                  {customer?.email ?? "Not supplied"}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-5 text-sm font-semibold text-slate-800">
                            {getServiceName(request)}
                          </td>
                          <td className="px-5 py-5 text-sm text-slate-600">
                            {request.serviceAddress.city},{" "}
                            {request.serviceAddress.state}
                          </td>
                          <td className="px-5 py-5">
                            <div className="flex items-center gap-2 text-sm text-slate-700">
                              <CalendarDays size={15} />
                              <span>
                                {formatMonthDay(schedule.date)} · {schedule.time}
                              </span>
                            </div>
                          </td>
                          <td className="px-5 py-5 text-sm text-slate-600">
                            {formatMonthDay(request.submittedAt)}
                          </td>
                          <td className="px-5 py-5">
                            <div className="flex">
                              <StatusBadge
                                label={getStatusLabel(reviewStatus)}
                                status={reviewStatus}
                              />
                            </div>
                          </td>
                          <td className="px-5 py-5 text-right">
                            <RequestAction request={request} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="grid gap-4 lg:hidden">
                {filteredRequests.map((request) => {
                  const customer = getCustomer(request);
                  const schedule = getRequestedSchedule(request);
                  const reviewStatus = getReviewStatus(request.status);

                  return (
                    <article
                      className="rounded-lg border border-teal-100 bg-white p-4 shadow-[0_14px_44px_-36px_rgba(28,79,80,0.34)]"
                      key={request.id}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex">
                            <StatusBadge
                              label={getStatusLabel(reviewStatus)}
                              status={reviewStatus}
                            />
                          </div>
                          <h2 className="mt-3 text-xl font-semibold text-teal-950">
                            {request.id}
                          </h2>
                          <p className="mt-1 text-sm text-slate-500">
                            {getServiceName(request)}
                          </p>
                        </div>
                        <RequestAction request={request} />
                      </div>
                      <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
                        <InfoTile
                          label="Customer"
                          value={customer?.displayName ?? "Pending customer"}
                        />
                        <InfoTile
                          label="Requested Schedule"
                          value={`${formatMonthDay(schedule.date)} · ${schedule.time}`}
                        />
                        <InfoTile
                          label="Location"
                          value={`${request.serviceAddress.city}, ${request.serviceAddress.state}`}
                        />
                        <InfoTile
                          label="Submitted"
                          value={formatShortDate(request.submittedAt)}
                        />
                      </div>
                    </article>
                  );
                })}
              </div>
            </>
          )}
        </AdminSurface>
      </section>
    </AdminPageShell>
  );
}

function RequestAction({ request }: { request: ServiceRequest }) {
  const reviewStatus = getReviewStatus(request.status);
  const label =
    reviewStatus === "accepted"
      ? "View"
      : reviewStatus === "rejected"
        ? "View Decision"
        : reviewStatus === "cancelled"
          ? "View Details"
          : "Review";

  return (
    <Button asChild size="sm" variant={reviewStatus === "submitted" ? "default" : "outline"}>
      <Link href={`/admin/service-requests/${request.id}`}>
        <Eye size={15} />
        {label}
      </Link>
    </Button>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
        {label}
      </p>
      <p className="mt-1 font-semibold text-teal-950">{value}</p>
    </div>
  );
}

function EmptyState({
  action,
  text,
  title,
}: {
  action: ReactNode;
  text: string;
  title: string;
}) {
  return (
    <div className="rounded-lg border border-dashed border-teal-200 bg-teal-50/40 px-6 py-10 text-center">
      <ClipboardCheck className="mx-auto text-teal-700" size={34} />
      <h2 className="mt-4 text-xl font-semibold text-teal-950">{title}</h2>
      <p className="mt-2 text-sm text-slate-600">{text}</p>
      <div className="mt-5">{action}</div>
    </div>
  );
}
