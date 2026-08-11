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
import { useState } from "react";

import {
  AdminPageHeader,
  AdminPageShell,
  AdminSurface,
} from "@/components/admin/AdminPageShell";
import { StatusBadge } from "@/components/customer-portal/StatusBadge";
import { Button } from "@/components/ui/Button";
import { mockCustomers } from "@/data/mock/customers";
import {
  getAdminTechnicianById,
  getTechnicianUpcomingSchedules,
  updateAdminTechnician,
} from "@/data/mock/technicians";
import { formatLongDate } from "@/lib/formatters";
import type { TechnicianValues } from "@/lib/validation";

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

export function AdminTechnicianDetailClient({
  technicianId,
}: AdminTechnicianDetailClientProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [version, setVersion] = useState(0);

  const technician = getAdminTechnicianById(technicianId);

  if (!technician) {
    return (
      <AdminPageShell>
        <AdminPageHeader
          eyebrow="Team"
          title="Technician not found"
          description="This technician does not exist or the temporary mock record is no longer available."
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

  const availabilityMeta = getTechnicianAvailabilityMeta(technician);
  const today = getTechnicianTodaySummary(technician.id);
  const upcomingOrders = getTechnicianUpcomingServiceOrders(technician.id);
  const completedOrders = getTechnicianRecentCompletedOrders(technician.id);

  function getCustomerName(customerId: string) {
    return (
      mockCustomers.find((customer) => customer.id === customerId)
        ?.displayName ?? customerId
    );
  }

  function handleSave(values: TechnicianValues) {
    updateAdminTechnician(technicianId, {
      displayName: values.fullName,
      email: values.email,
      phone: values.phone,
      status: values.status,
      availability: values.availability,
      notes: values.notes || undefined,
    });
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
                {today.jobsToday}
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                Upcoming Assignments
              </p>
              <p className="mt-3 text-2xl font-semibold text-slate-950">
                {getTechnicianUpcomingSchedules(technician.id).length}
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

          {today.currentAssignment ? (
            <div className="space-y-3 rounded-xl bg-slate-50 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge
                  label={today.currentAssignment.status}
                  status={today.currentAssignment.status}
                />
                <span className="text-sm text-slate-500">
                  {today.currentAssignment.serviceName}
                </span>
              </div>
              <div className="flex items-start gap-2 text-sm text-slate-700">
                <Clock3 size={16} className="mt-0.5 text-teal-700" />
                <span>{today.currentAssignment.timeWindowLabel}</span>
              </div>
              <div className="flex items-start gap-2 text-sm text-slate-700">
                <MapPin size={16} className="mt-0.5 text-teal-700" />
                <span>
                  {today.currentAssignment.address.line1},{" "}
                  {today.currentAssignment.address.city}
                </span>
              </div>
              <Button asChild size="sm" variant="outline">
                <Link
                  href={`/admin/orders/${today.currentAssignment.serviceOrderId}`}
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

        {upcomingOrders.length === 0 ? (
          <div className="rounded-xl border border-dashed border-teal-200 bg-teal-50/40 p-4 text-sm text-slate-600">
            No upcoming assignments linked to this technician.
          </div>
        ) : (
          <div className="grid gap-3">
            {upcomingOrders.map((order) => (
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
                      {getCustomerName(order.customerId)}
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <CalendarDays size={15} className="text-teal-700" />
                      {order.currentSchedule.label ??
                        order.currentSchedule.date}
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <MapPin size={15} className="text-teal-700" />
                      {order.serviceLocation.line1},{" "}
                      {order.serviceLocation.city}
                    </span>
                  </div>
                </div>
                <div className="flex items-center">
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/admin/orders/${order.id}`}>View Order</Link>
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

        {completedOrders.length === 0 ? (
          <div className="rounded-xl border border-dashed border-teal-200 bg-teal-50/40 p-4 text-sm text-slate-600">
            No completed service history is linked yet.
          </div>
        ) : (
          <div className="grid gap-3">
            {completedOrders.map((order) => (
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
                    <Link href={`/admin/orders/${order.id}`}>View Order</Link>
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
