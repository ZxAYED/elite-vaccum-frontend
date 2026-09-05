"use client";

import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  Mail,
  MapPin,
  Phone,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import {
  AdminPageHeader,
  AdminPageShell,
  AdminSurface,
} from "@/components/admin/AdminPageShell";
import { StatusBadge } from "@/components/customer-portal/StatusBadge";
import { Button } from "@/components/ui/Button";
import {
  getAdminTechnicianById,
  getTechnicianUpcomingSchedules,
  updateAdminTechnician,
} from "@/data/mock/technicians";
import { getSharedCustomerById } from "@/data/mock/shared-business-store";
import { formatLongDate } from "@/lib/formatters";
import type { TechnicianValues } from "@/lib/validation";
import { toast } from "sonner";
import {
  useGetTechnicianByIdQuery,
  useUpdateTechnicianMutation,
  type TechnicianProfileDto,
} from "@/redux/api/technicianApi";
import type { AdminTechnician, AdminTechnicianStatus, TechnicianAvailability } from "@/types/domain";

import { TechnicianFormDialog } from "./TechnicianFormDialog";
import {
  getTechnicianAvailabilityMeta,
  getTechnicianRecentCompletedOrders,
  getTechnicianTodaySummary,
  getTechnicianUpcomingServiceOrders,
} from "./technician-utils";

interface AdminTechnicianDetailClientProps {
  technicianId: string;
}

function mapProfileDtoToAdminTechnician(rawDto: TechnicianProfileDto | unknown): AdminTechnician {
  const dto =
    rawDto && typeof rawDto === "object" && "data" in rawDto && (rawDto as { data?: unknown }).data
      ? ((rawDto as { data: TechnicianProfileDto }).data)
      : (rawDto as TechnicianProfileDto);

  const fallbackName =
    dto.displayName ||
    (dto.user
      ? `${dto.user.firstName || ""} ${dto.user.lastName || ""}`.trim()
      : "") ||
    dto.email ||
    "Technician";

  return {
    id: dto.id,
    userId: dto.userId || `user-${dto.id}`,
    displayName: fallbackName,
    email: dto.email || dto.user?.email || "",
    phone: dto.phone || "",
    status: (dto.status === "INACTIVE" ? "INACTIVE" : "ACTIVE") as AdminTechnicianStatus,
    availability: (dto.availability as TechnicianAvailability) || "AVAILABLE",
    rating: typeof dto.rating === "number" ? dto.rating : parseFloat(dto.rating || "5") || 5,
    completedJobs: dto.completedJobs ?? dto._count?.assignedJobs ?? dto.stats?.completedJobs ?? 0,
    verified: dto.isVerified ?? true,
    specializations: dto.specializations && dto.specializations.length > 0 ? dto.specializations : ["General Service"],
    notes: dto.adminNotes || dto.bio || undefined,
    createdAt: dto.createdAt || new Date().toISOString(),
    updatedAt: dto.updatedAt || new Date().toISOString(),
  };
}

export function AdminTechnicianDetailClient({
  technicianId,
}: AdminTechnicianDetailClientProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [version, setVersion] = useState(0);

  const { data: apiTech, refetch } = useGetTechnicianByIdQuery(technicianId);
  const [updateTechnicianApi] = useUpdateTechnicianMutation();

  const technician = apiTech
    ? mapProfileDtoToAdminTechnician(apiTech)
    : getAdminTechnicianById(technicianId);

  const availabilityMeta = getTechnicianAvailabilityMeta(
    technician ?? {
      id: technicianId,
      userId: `user-${technicianId}`,
      displayName: "Technician",
      email: "",
      phone: "",
      status: "ACTIVE",
      availability: "AVAILABLE",
      rating: 5,
      completedJobs: 0,
      verified: true,
      specializations: ["General Service"],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  );
  const today = getTechnicianTodaySummary(technician?.id ?? technicianId);
  const upcomingOrders = getTechnicianUpcomingServiceOrders(technician?.id ?? technicianId);
  const completedOrders = getTechnicianRecentCompletedOrders(technician?.id ?? technicianId);

  function getCustomerName(customerId: string) {
    return (
      getSharedCustomerById(customerId)?.displayName ?? customerId
    );
  }

  const jobsTodayCount = useMemo(() => {
    if (apiTech?.appointments && apiTech.appointments.length > 0) {
      const todayStr = new Date().toISOString().split("T")[0];
      const count = apiTech.appointments.filter((a) => a.date && a.date.startsWith(todayStr)).length;
      if (count > 0) return count;
    }
    return today.jobsToday;
  }, [apiTech, today.jobsToday]);

  const upcomingAssignmentsCount = useMemo(() => {
    if (apiTech) {
      const explicitCount = apiTech._count?.appointments ?? apiTech._count?.assignedRequests;
      if (typeof explicitCount === "number") return explicitCount;
      const totalArrays = (apiTech.appointments?.length ?? 0) + (apiTech.assignedRequests?.length ?? 0);
      if (totalArrays > 0) return totalArrays;
    }
    return getTechnicianUpcomingSchedules(technician?.id ?? technicianId).length;
  }, [apiTech, technician?.id, technicianId]);

  const currentAssignmentDisplay = useMemo(() => {
    if (today.currentAssignment) return today.currentAssignment;
    if (apiTech?.appointments && apiTech.appointments.length > 0) {
      const firstApt = apiTech.appointments[0];
      const addressLine = firstApt.serviceRequest?.serviceAddress?.addressLine1;
      const city = firstApt.serviceRequest?.serviceAddress?.city;
      return {
        serviceOrderId: firstApt.serviceOrderId || firstApt.serviceRequestId || firstApt.id,
        serviceName: firstApt.serviceRequest?.title || "Central Vacuum Service",
        status: firstApt.status || "SCHEDULED",
        timeWindowLabel: firstApt.date
          ? `${firstApt.date}${firstApt.startTime ? ` • ${firstApt.startTime}${firstApt.endTime ? ` - ${firstApt.endTime}` : ""}` : ""}`
          : (firstApt.notes || "Scheduled Appointment"),
        address: {
          line1: addressLine || "Property Address",
          city: city || "",
        },
      };
    }
    return null;
  }, [today.currentAssignment, apiTech]);

  const displayUpcomingOrders = useMemo(() => {
    if (apiTech) {
      const items: Array<{
        id: string;
        status: string;
        serviceName: string;
        customerName: string;
        scheduleLabel: string;
        address: string;
        linkUrl: string;
      }> = [];

      if (Array.isArray(apiTech.appointments) && apiTech.appointments.length > 0) {
        for (const apt of apiTech.appointments) {
          const displayId = apt.serviceRequest?.businessId || apt.serviceOrderId || apt.id;
          const addressLine = apt.serviceRequest?.serviceAddress?.addressLine1;
          const city = apt.serviceRequest?.serviceAddress?.city;
          items.push({
            id: displayId,
            status: apt.status || "SCHEDULED",
            serviceName: apt.serviceRequest?.title || "Central Vacuum Maintenance",
            customerName: apt.serviceRequest?.customer?.displayName || "Customer",
            scheduleLabel: apt.date
              ? `${apt.date}${apt.startTime ? ` • ${apt.startTime}${apt.endTime ? ` - ${apt.endTime}` : ""}` : ""}`
              : (apt.notes || "Scheduled"),
            address: addressLine ? `${addressLine}${city ? `, ${city}` : ""}` : "On-site",
            linkUrl: apt.serviceOrderId
              ? `/admin/orders/${apt.serviceOrderId}`
              : apt.serviceRequestId
                ? `/admin/service-requests/${apt.serviceRequestId}`
                : `/admin/schedule`,
          });
        }
      }

      if (Array.isArray(apiTech.assignedRequests) && apiTech.assignedRequests.length > 0) {
        for (const req of apiTech.assignedRequests) {
          const displayId = req.businessId || req.id;
          if (!items.some((it) => it.id === displayId)) {
            items.push({
              id: displayId,
              status: req.status || "ASSIGNED",
              serviceName: req.title || "Assigned Service Request",
              customerName: req.customer?.displayName || "Customer",
              scheduleLabel: req.preferredDate
                ? `${req.preferredDate}${req.preferredTime ? ` • ${req.preferredTime}` : ""}`
                : "Pending Schedule",
              address: "On-site",
              linkUrl: `/admin/service-requests/${req.id}`,
            });
          }
        }
      }

      if (items.length > 0) {
        return items;
      }
    }

    return upcomingOrders.map((order) => ({
      id: order.id,
      status: order.status,
      serviceName: order.serviceName,
      customerName: getCustomerName(order.customerId),
      scheduleLabel: order.currentSchedule.label ?? order.currentSchedule.date,
      address: `${order.serviceLocation.line1}, ${order.serviceLocation.city}`,
      linkUrl: `/admin/orders/${order.id}`,
    }));
  }, [apiTech, upcomingOrders]);

  const displayCompletedOrders = useMemo(() => {
    if (apiTech) {
      const items: Array<{
        id: string;
        serviceName: string;
        createdAt: string;
        linkUrl: string;
      }> = [];

      if (Array.isArray(apiTech.assignedJobs) && apiTech.assignedJobs.length > 0) {
        for (const job of apiTech.assignedJobs) {
          if (job.status === "COMPLETED") {
            items.push({
              id: job.businessId || job.id,
              serviceName: job.serviceName || "Completed Service",
              createdAt: new Date().toISOString(),
              linkUrl: `/admin/orders/${job.id}`,
            });
          }
        }
      }

      if (items.length > 0) {
        return items;
      }
    }

    return completedOrders.map((order) => ({
      id: order.id,
      serviceName: order.serviceName,
      createdAt: order.createdAt,
      linkUrl: `/admin/orders/${order.id}`,
    }));
  }, [apiTech, completedOrders]);

  if (!technician) {
    return (
      <AdminPageShell>
        <AdminPageHeader
          eyebrow="Team"
          title="Technician not found"
          description="This technician does not exist or the record is no longer available."
        />

        <AdminSurface>
          <div className="py-10 text-center">
            <p className="text-sm text-slate-600">
              The technician record could not be found.
            </p>

            <Button asChild className="mt-4">
              <Link href="/admin/technicians">Back to Technicians</Link>
            </Button>
          </div>
        </AdminSurface>
      </AdminPageShell>
    );
  }

  async function handleSave(values: TechnicianValues) {
    updateAdminTechnician(technicianId, {
      displayName: values.fullName,
      email: values.email,
      phone: values.phone,
      status: values.status,
      availability: values.availability,
      notes: values.notes || undefined,
    });

    try {
      const res = await updateTechnicianApi({
        id: technicianId,
        body: {
          displayName: values.fullName,
          email: values.email,
          phone: values.phone,
          status: values.status,
          availability: values.availability,
          adminNotes: values.notes || undefined,
          notes: values.notes || undefined,
        },
      }).unwrap();
      const successMsg =
        (res as { message?: string })?.message || "Technician details updated successfully.";
      toast.success(successMsg);
      refetch();
    } catch (err: unknown) {
      const apiErr = err as { data?: { message?: string | string[] } };
      const msg = Array.isArray(apiErr?.data?.message)
        ? apiErr.data.message.join(", ")
        : apiErr?.data?.message;
      toast.info(msg || "Technician updated locally.");
    }

    setVersion((current) => current + 1);
    setFormOpen(false);
  }

  return (
    <AdminPageShell key={version}>
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link
          className="inline-flex items-center gap-2 transition hover:text-primary"
          href="/admin/technicians"
        >
          <ArrowLeft size={16} />
          Back to technicians
        </Link>
      </div>

      <AdminPageHeader
        action={
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setFormOpen(true)} variant="outline">
              Edit Technician
            </Button>
            <Button asChild>
              <Link href="/admin/schedule">View Schedule</Link>
            </Button>
          </div>
        }
        description="Overview, workload, schedule linkage, and recent completed service history."
        eyebrow="Team"
        title={technician.displayName}
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.9fr)]">
        <AdminSurface className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge
              label={availabilityMeta.label}
              status={availabilityMeta.badgeStatus}
            />
            <StatusBadge
              label={technician.status === "ACTIVE" ? "Active" : "Inactive"}
              status={technician.status === "ACTIVE" ? "accepted" : "cancelled"}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                Email
              </p>
              <div className="mt-3 flex items-center gap-2 text-sm text-slate-700">
                <Mail size={16} className="text-teal-700" />
                {technician.email}
              </div>
            </div>
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                Phone
              </p>
              <div className="mt-3 flex items-center gap-2 text-sm text-slate-700">
                <Phone size={16} className="text-teal-700" />
                {technician.phone}
              </div>
            </div>
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                Jobs Today
              </p>
              <p className="mt-3 text-2xl font-semibold text-slate-950">
                {jobsTodayCount}
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                Upcoming Assignments
              </p>
              <p className="mt-3 text-2xl font-semibold text-slate-950">
                {upcomingAssignmentsCount}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-teal-100 bg-white p-4">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
              Specializations
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {technician.specializations.map((item) => (
                <span
                  key={item}
                  className="rounded-full bg-teal-50 px-3 py-1 text-sm font-medium text-teal-800"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        </AdminSurface>

        <AdminSurface className="space-y-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-400">
              Today
            </p>
            <h2 className="mt-2 text-xl font-semibold text-slate-950">
              Current / Next Assignment
            </h2>
          </div>

          {currentAssignmentDisplay ? (
            <div className="space-y-3 rounded-xl bg-slate-50 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge
                  label={currentAssignmentDisplay.status}
                  status={currentAssignmentDisplay.status}
                />
                <span className="text-sm text-slate-500">
                  {currentAssignmentDisplay.serviceName}
                </span>
              </div>
              <div className="flex items-start gap-2 text-sm text-slate-700">
                <Clock3 size={16} className="mt-0.5 text-teal-700" />
                <span>{currentAssignmentDisplay.timeWindowLabel}</span>
              </div>
              <div className="flex items-start gap-2 text-sm text-slate-700">
                <MapPin size={16} className="mt-0.5 text-teal-700" />
                <span>
                  {currentAssignmentDisplay.address.line1}
                  {currentAssignmentDisplay.address.city
                    ? `, ${currentAssignmentDisplay.address.city}`
                    : ""}
                </span>
              </div>
              <Button asChild size="sm" variant="outline">
                <Link
                  href={`/admin/orders/${currentAssignmentDisplay.serviceOrderId}`}
                >
                  View Order
                </Link>
              </Button>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-teal-200 bg-teal-50/40 p-4 text-sm text-slate-600">
              No active job assigned today.
            </div>
          )}

          {today.nextAssignment ? (
            <div className="rounded-xl border border-teal-100 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                Next
              </p>
              <p className="mt-2 font-semibold text-slate-950">
                {today.nextAssignment.serviceName}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                {today.nextAssignment.timeWindowLabel}
              </p>
            </div>
          ) : null}

          <div className="rounded-xl border border-teal-100 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
              Admin Notes
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {technician.notes ?? "No internal notes added yet."}
            </p>
          </div>
        </AdminSurface>
      </div>

      <AdminSurface className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-400">
              Upcoming Assignments
            </p>
            <h2 className="mt-2 text-xl font-semibold text-slate-950">
              Linked Service Orders
            </h2>
          </div>
        </div>

        {displayUpcomingOrders.length === 0 ? (
          <div className="rounded-xl border border-dashed border-teal-200 bg-teal-50/40 p-4 text-sm text-slate-600">
            No upcoming assignments linked to this technician.
          </div>
        ) : (
          <div className="grid gap-3">
            {displayUpcomingOrders.map((order) => (
              <div
                className="grid gap-3 rounded-xl border border-teal-100 p-4 lg:grid-cols-[minmax(0,1fr)_auto]"
                key={order.id}
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-slate-950">{order.id}</p>
                    <StatusBadge label={order.status} status={order.status} />
                  </div>
                  <p className="text-sm text-slate-700">{order.serviceName}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-500">
                    <span className="inline-flex items-center gap-2">
                      <UserRound size={15} className="text-teal-700" />
                      {order.customerName}
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <CalendarDays size={15} className="text-teal-700" />
                      {order.scheduleLabel}
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <MapPin size={15} className="text-teal-700" />
                      {order.address}
                    </span>
                  </div>
                </div>
                <div className="flex items-center">
                  <Button asChild size="sm" variant="outline">
                    <Link href={order.linkUrl}>View Details</Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </AdminSurface>

      <AdminSurface className="space-y-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-400">
            Recent Completed Services
          </p>
          <h2 className="mt-2 text-xl font-semibold text-slate-950">
            Completed Service History
          </h2>
        </div>

        {displayCompletedOrders.length === 0 ? (
          <div className="rounded-xl border border-dashed border-teal-200 bg-teal-50/40 p-4 text-sm text-slate-600">
            No completed service history is linked yet.
          </div>
        ) : (
          <div className="grid gap-3">
            {displayCompletedOrders.map((order) => (
              <div
                className="grid gap-3 rounded-xl border border-teal-100 p-4 lg:grid-cols-[minmax(0,1fr)_auto]"
                key={order.id}
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-slate-950">{order.id}</p>
                    <StatusBadge label="Completed" status="completed" />
                  </div>
                  <p className="mt-2 text-sm text-slate-700">
                    {order.serviceName}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Completed from request created{" "}
                    {formatLongDate(order.createdAt)}
                  </p>
                </div>
                <div className="flex items-center">
                  <Button asChild size="sm" variant="outline">
                    <Link href={order.linkUrl}>View Details</Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </AdminSurface>

      <TechnicianFormDialog
        onOpenChange={setFormOpen}
        onSubmit={handleSave}
        open={formOpen}
        technician={technician}
      />
    </AdminPageShell>
  );
}
