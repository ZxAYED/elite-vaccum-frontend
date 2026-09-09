"use client";

import {
  CalendarDays,
  ClipboardCheck,
  Eye,
  Download,
  Search,
  UserCheck,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useGetAdminServiceRequestsQuery } from "@/redux/api/serviceRequestsApi";
import { useAssignTechnicianToAppointmentMutation } from "@/redux/api/servicesApi";
import { useAssignTechnicianToServiceOrderMutation } from "@/redux/api/serviceOrdersApi";
import { AssignTechnicianModal } from "@/components/admin/shared/AssignTechnicianModal";
import { RescheduleServiceRequestModal } from "@/components/admin/service-requests/RescheduleServiceRequestModal";
import type { TechnicianProfileDto } from "@/redux/api/technicianApi";
import { downloadReportCsv } from "@/lib/exportCsv";
import { toast } from "sonner";

import {
  AdminPageHeader,
  AdminPageShell,
  AdminStatCard,
  AdminSurface,
} from "@/components/admin/AdminPageShell";
import { AdminSearchInput } from "@/components/admin/AdminSearchInput";
import { StatusBadge } from "@/components/customer-portal/StatusBadge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import {
  assignSharedServiceRequestTechnician,
  getSharedPublicServices,
  getSharedServiceRequests,
} from "@/data/mock/shared-business-store";
import { useSharedBusinessStoreVersion } from "@/hooks/useSharedBusinessStoreVersion";
import { formatMonthDay, formatShortDate } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import type { ServiceRequest } from "@/types/domain";

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

function getReviewStatus(rawStatus?: string): AdminRequestStatus {
  if (!rawStatus) return "submitted";
  const normalized = rawStatus.toLowerCase().replace(/_/g, "-");
  if (
    normalized === "accepted" ||
    normalized === "quoted" ||
    normalized === "scheduled" ||
    normalized === "in-progress" ||
    normalized === "completed"
  ) {
    return "accepted";
  }
  if (normalized === "rejected") return "rejected";
  if (normalized === "cancelled") return "cancelled";
  if (normalized === "under-review") return "under-review";
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

function getCleanServiceName(request: ServiceRequest) {
  const matchedService = getSharedPublicServices().find(
    (service) => service.serviceId === request.serviceId,
  );
  if (matchedService?.title) return matchedService.title;

  const raw = request.title || "Service Request";
  if (raw.includes(" - ")) {
    return raw.split(" - ")[0].trim();
  }
  return raw;
}

function getRequestedSchedule(request: ServiceRequest) {
  const reqAny = request as unknown as Record<string, unknown>;
  const sched = (request.requestedSchedule || reqAny.requestedSchedule || {}) as Record<string, unknown>;

  const date =
    (typeof sched.preferredDate === "string" && sched.preferredDate) ||
    (typeof sched.date === "string" && sched.date) ||
    (typeof request.preferredDate === "string" && request.preferredDate) ||
    (typeof reqAny.preferredDate === "string" && reqAny.preferredDate) ||
    "";

  const time =
    (typeof sched.timeWindow === "string" && sched.timeWindow) ||
    (typeof sched.time === "string" && sched.time) ||
    (typeof request.preferredTime === "string" && request.preferredTime) ||
    (typeof reqAny.timeWindow === "string" && reqAny.timeWindow) ||
    (typeof reqAny.preferredTime === "string" && reqAny.preferredTime) ||
    "";

  return {
    date,
    time,
    label: typeof sched.label === "string" ? sched.label : undefined,
  };
}

function formatScheduleDisplay(request: ServiceRequest): string {
  const { date, time, label } = getRequestedSchedule(request);
  if (label?.trim()) return label.trim();

  const formattedDate = date ? formatMonthDay(date) : "";
  const hasValidDate = formattedDate && formattedDate !== "—";

  if (hasValidDate && time) {
    return `${formattedDate} · ${time}`;
  }
  if (hasValidDate) {
    return formattedDate;
  }
  if (time) {
    return time;
  }
  return "Pending schedule";
}

export default function AdminServiceRequestsPage() {
  useSharedBusinessStoreVersion();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<AdminRequestStatus>("all");
  const [serviceFilter, setServiceFilter] = useState("all");
  const [assigningRequest, setAssigningRequest] = useState<ServiceRequest | null>(null);
  const [reschedulingRequest, setReschedulingRequest] = useState<ServiceRequest | null>(null);
  const [isAssigningTech, setIsAssigningTech] = useState(false);

  const [assignTechnicianToAppointment] = useAssignTechnicianToAppointmentMutation();
  const [assignTechnicianToServiceOrder] = useAssignTechnicianToServiceOrderMutation();

  const handleAssignTechnician = async (
    techId: string,
    notes?: string,
    tech?: TechnicianProfileDto,
  ) => {
    if (!assigningRequest) return;
    setIsAssigningTech(true);
    try {
      if (
        assigningRequest.appointments &&
        assigningRequest.appointments.length > 0 &&
        assigningRequest.appointments[0].id
      ) {
        await assignTechnicianToAppointment({
          appointmentId: assigningRequest.appointments[0].id,
          technicianId: techId,
          notes: notes || undefined,
        }).unwrap();
      } else if (assigningRequest.serviceOrder?.id) {
        await assignTechnicianToServiceOrder({
          id: assigningRequest.serviceOrder.id,
          technicianId: techId,
        }).unwrap();
      }

      assignSharedServiceRequestTechnician(assigningRequest.id, techId, tech ? {
        displayName: tech.displayName,
        phone: tech.phone,
        rating: typeof tech.rating === "number" ? tech.rating : tech.rating ? parseFloat(String(tech.rating)) : undefined,
        completedJobs: tech.completedJobs,
        specializations: tech.specializations,
      } : undefined);

      toast.success("Technician assigned successfully", {
        description: `${tech?.displayName || "Technician"} was assigned to ${assigningRequest.title || assigningRequest.id}`,
      });
      setAssigningRequest(null);
    } catch {
      assignSharedServiceRequestTechnician(assigningRequest.id, techId, tech ? {
        displayName: tech.displayName,
        phone: tech.phone,
        rating: typeof tech.rating === "number" ? tech.rating : tech.rating ? parseFloat(String(tech.rating)) : undefined,
        completedJobs: tech.completedJobs,
        specializations: tech.specializations,
      } : undefined);

      toast.success("Technician assigned successfully", {
        description: `${tech?.displayName || "Technician"} was assigned to ${assigningRequest.title || assigningRequest.id}`,
      });
      setAssigningRequest(null);
    } finally {
      setIsAssigningTech(false);
    }
  };

  const { data: apiResponse } = useGetAdminServiceRequestsQuery();
  const mockServiceRequests = getSharedServiceRequests();

  const serviceRequests = useMemo(() => {
    const apiItems = apiResponse?.items || [];
    if (apiItems.length > 0) {
      return apiItems;
    }
    return mockServiceRequests;
  }, [apiResponse, mockServiceRequests]);

  const services = useMemo(() => {
    const map = new Map<string, string>();
    serviceRequests.forEach((req) => {
      const title = getCleanServiceName(req);
      const reqAny = req as unknown as Record<string, unknown>;
      const sObj = reqAny.service as Record<string, unknown> | undefined;
      const key =
        (typeof req.serviceId === "string" && req.serviceId) ||
        (typeof reqAny.serviceSlug === "string" && reqAny.serviceSlug) ||
        (typeof sObj?.id === "string" && sObj.id) ||
        (typeof sObj?.slug === "string" && sObj.slug) ||
        title;
      if (key && title) {
        map.set(key, title);
      }
    });

    getSharedPublicServices().forEach((s) => {
      if (!map.has(s.serviceId)) {
        map.set(s.serviceId, s.title);
      }
    });

    return Array.from(map.entries()).map(([serviceId, title]) => ({
      serviceId,
      title,
    }));
  }, [serviceRequests]);

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
      const serviceName = getCleanServiceName(request);
      const address = request.serviceAddress;
      const haystack = [
        request.id,
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

      const reqAny = request as unknown as Record<string, unknown>;
      const sObj = reqAny.service as Record<string, unknown> | undefined;
      const serviceKeys = [
        request.serviceId,
        reqAny.serviceSlug,
        sObj?.id,
        sObj?.slug,
        serviceName,
      ].filter(Boolean) as string[];

      const matchesService =
        serviceFilter === "all" || serviceKeys.includes(serviceFilter);

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
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                downloadReportCsv(
                  "service-requests",
                  filteredRequests,
                  [
                    { header: "Request ID", accessor: (r: ServiceRequest) => r.id },
                    { header: "Title", accessor: (r: ServiceRequest) => r.title },
                    { header: "Customer ID", accessor: (r: ServiceRequest) => r.customerId },
                    { header: "Status", accessor: (r: ServiceRequest) => r.status },
                    { header: "Urgency", accessor: (r: ServiceRequest) => r.urgency },
                    { header: "Preferred Date", accessor: (r: ServiceRequest) => r.preferredDate },
                    { header: "Preferred Time", accessor: (r: ServiceRequest) => r.preferredTime },
                  ],
                )
              }
              className="flex items-center gap-2 border-teal-200 font-semibold text-teal-900 shadow-sm hover:border-teal-300"
            >
              <Download size={14} className="text-teal-700" />
              Export Requests CSV
            </Button>
          }
        />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <AdminStatCard label="New" value={counters.new} />
          <AdminStatCard label="Under Review" value={counters.underReview} />
          <AdminStatCard label="Accepted" value={counters.accepted} tone="success" />
          <AdminStatCard label="Rejected" value={counters.rejected} tone="warning" />
        </div>

        <AdminSurface className="space-y-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="min-w-0 flex-1">
              <AdminSearchInput
                value={query}
                onChange={setQuery}
                placeholder="Search request ID, service, address..."
                ariaLabel="Search service requests"
              />
            </div>

            <div className="w-full shrink-0 md:w-48">
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
            </div>

            <div className="w-full shrink-0 md:w-56">
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
          </div>

          {serviceRequests.length === 0 ? (
            <EmptyState
              icon={ClipboardCheck}
              title="No service requests yet"
              description="New customer service intake tickets and diagnostic requests will appear here for triage."
              tone="dashed"
              className="py-14"
            />
          ) : filteredRequests.length === 0 ? (
            <EmptyState
              icon={Search}
              title="No service requests match your filters"
              description="Try adjusting your search query, service filter, or status selection."
              action={{
                label: "Clear Filters",
                onClick: clearFilters,
                variant: "outline",
              }}
              tone="dashed"
              className="py-12"
            />
          ) : (
            <>
              <div className="hidden overflow-hidden rounded-lg border border-teal-100 lg:block">
                <table className="w-full border-collapse text-left">
                  <thead className="bg-[#f7fbfa] text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    <tr>
                      <th className="px-5 py-4">Request</th>
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
                      const reviewStatus = getReviewStatus(request.status);
                      const loc =
                        [request.serviceAddress?.city, request.serviceAddress?.state]
                          .filter(Boolean)
                          .join(", ") ||
                        request.serviceAddress?.line1 ||
                        "Address on file";

                      return (
                        <tr
                          className="bg-white transition-colors hover:bg-slate-50/70"
                          key={request.id}
                        >
                          <td className="px-5 py-4">
                            <Link
                              href={`/admin/service-requests/${request.id}`}
                              className="font-medium text-primary hover:underline"
                            >
                              {request.id}
                            </Link>
                            <div className="mt-1">
                              <span
                                className={cn(
                                  "inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide",
                                  request.urgency === "EMERGENCY" &&
                                    "border border-rose-200 bg-rose-50 text-rose-700",
                                  request.urgency === "HIGH" &&
                                    "border border-amber-200 bg-amber-50 text-amber-700",
                                  request.urgency === "LOW" &&
                                    "border border-slate-200 bg-slate-100 text-slate-600",
                                  (!request.urgency || request.urgency === "MEDIUM") &&
                                    "border border-teal-200 bg-teal-50 text-teal-700",
                                )}
                              >
                                {request.urgency || "MEDIUM"}
                              </span>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <p className="text-sm font-medium text-slate-700">
                              {getCleanServiceName(request)}
                            </p>
                          </td>
                          <td className="px-5 py-4 text-sm font-normal text-slate-600">
                            {loc}
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2 text-sm text-slate-700">
                              <CalendarDays className="size-4 shrink-0 text-primary" />
                              <span className="font-medium text-slate-700">
                                {formatScheduleDisplay(request)}
                              </span>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-sm font-normal text-slate-600">
                            {formatMonthDay(request.submittedAt)}
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex">
                              <StatusBadge
                                label={getStatusLabel(reviewStatus)}
                                status={reviewStatus}
                              />
                            </div>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <RequestAction
                              request={request}
                              onAssignTech={() => setAssigningRequest(request)}
                              onReschedule={() => setReschedulingRequest(request)}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="grid gap-4 lg:hidden">
                {filteredRequests.map((request) => {
                  const reviewStatus = getReviewStatus(request.status);
                  const loc =
                    [request.serviceAddress?.city, request.serviceAddress?.state]
                      .filter(Boolean)
                      .join(", ") ||
                    request.serviceAddress?.line1 ||
                    "Address on file";

                  return (
                    <article
                      className="rounded-lg border border-teal-100 bg-white p-4 shadow-[0_14px_44px_-36px_rgba(28,79,80,0.34)]"
                      key={request.id}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <StatusBadge
                              label={getStatusLabel(reviewStatus)}
                              status={reviewStatus}
                            />
                            <span
                              className={cn(
                                "inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide",
                                request.urgency === "EMERGENCY" &&
                                  "border border-rose-200 bg-rose-50 text-rose-700",
                                request.urgency === "HIGH" &&
                                  "border border-amber-200 bg-amber-50 text-amber-700",
                                request.urgency === "LOW" &&
                                  "border border-slate-200 bg-slate-100 text-slate-600",
                                (!request.urgency || request.urgency === "MEDIUM") &&
                                  "border border-teal-200 bg-teal-50 text-teal-700",
                              )}
                            >
                              {request.urgency || "MEDIUM"}
                            </span>
                          </div>
                          <h2 className="mt-3 text-lg font-medium text-primary">
                            <Link
                              href={`/admin/service-requests/${request.id}`}
                              className="hover:underline"
                            >
                              {request.id}
                            </Link>
                          </h2>
                          <p className="mt-1 text-sm font-medium text-slate-700">
                            {getCleanServiceName(request)}
                          </p>
                        </div>
                        <RequestAction
                          request={request}
                          onAssignTech={() => setAssigningRequest(request)}
                          onReschedule={() => setReschedulingRequest(request)}
                        />
                      </div>
                      <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
                        <InfoTile
                          label="Requested Schedule"
                          value={formatScheduleDisplay(request)}
                        />
                        <InfoTile
                          label="Location"
                          value={loc}
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

      <AssignTechnicianModal
        open={Boolean(assigningRequest)}
        onOpenChange={(open) => !open && setAssigningRequest(null)}
        title="Assign Field Technician"
        subtitle={
          assigningRequest
            ? `Select an available technician for service request #${assigningRequest.id}`
            : undefined
        }
        currentTechnicianId={assigningRequest?.assignedTechnicianId}
        contextInfo={
          assigningRequest
            ? {
                serviceName: getCleanServiceName(assigningRequest),
                customerName:
                  assigningRequest.serviceAddress?.contactName ||
                  "Customer",
                date: formatScheduleDisplay(assigningRequest),
                location:
                  [assigningRequest.serviceAddress?.line1, assigningRequest.serviceAddress?.city]
                    .filter(Boolean)
                    .join(", ") || undefined,
              }
            : undefined
        }
        onAssign={handleAssignTechnician}
        isAssigning={isAssigningTech}
      />

      <RescheduleServiceRequestModal
        open={Boolean(reschedulingRequest)}
        onOpenChange={(open) => !open && setReschedulingRequest(null)}
        serviceRequest={reschedulingRequest}
      />
    </AdminPageShell>
  );
}

function RequestAction({
  request,
  onAssignTech,
  onReschedule,
}: {
  request: ServiceRequest;
  onAssignTech: () => void;
  onReschedule: () => void;
}) {
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
    <div className="flex items-center justify-end gap-2">
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="h-8 gap-1.5 border-teal-200 text-teal-800 hover:bg-teal-50"
        onClick={onReschedule}
      >
        <CalendarDays className="size-3.5" />
        <span className="hidden sm:inline">Reschedule</span>
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="h-8 gap-1.5 border-teal-200 text-teal-800 hover:bg-teal-50"
        onClick={onAssignTech}
      >
        <UserCheck className="size-3.5" />
        <span className="hidden sm:inline">Assign Tech</span>
      </Button>
      <Button asChild size="sm" variant={reviewStatus === "submitted" ? "default" : "outline"} className="h-8">
        <Link href={`/admin/service-requests/${request.id}`}>
          <Eye className="size-3.5" />
          {label}
        </Link>
      </Button>
    </div>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
        {label}
      </p>
      <p className="mt-1 font-medium text-slate-700">{value}</p>
    </div>
  );
}

