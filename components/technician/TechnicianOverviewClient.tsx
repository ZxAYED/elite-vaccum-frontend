"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  MapPin,
  Phone,
  Wrench,
} from "lucide-react";

import { StatusBadge } from "@/components/customer-portal/StatusBadge";
import {
  AdminStatCard,
  AdminSurface,
  TechnicianRouteShell,
} from "@/components/technician/TechnicianRouteShell";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  useGetTechnicianOverviewQuery,
  useGetTechnicianProfileQuery,
  type TechnicianJobItemDto,
} from "@/redux/api/technicianApi";

/** Availability enums arrive as `ON_BREAK`; render them as "On break". */
function humanizeEnum(value?: string) {
  if (!value) return "—";
  const spaced = value.replace(/_/g, " ").toLowerCase();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

interface OverviewJobRow {
  id: string;
  reference: string;
  serviceName: string;
  status: string;
  customerLabel: string;
  phone?: string;
  addressLabel: string;
  scheduleLabel: string;
  etaMinutes?: number;
}

function toJobRow(item: TechnicianJobItemDto): OverviewJobRow {
  return {
    id: item.serviceOrderId || item.appointmentId || item.businessId,
    reference: item.businessId,
    serviceName: item.serviceName,
    status: item.status?.toLowerCase() ?? "scheduled",
    customerLabel: item.customerName,
    phone: item.customerPhone,
    addressLabel: item.propertyAddress,
    scheduleLabel: item.timeWindow,
    etaMinutes: item.etaMinutes,
  };
}

export function TechnicianOverviewClient() {
  // Phase 17.1 `GET /technicians/me/overview` + 17.4 `GET /technicians/me/profile`.
  const {
    data: overview,
    isLoading: isLoadingOverview,
    isError: isOverviewError,
  } = useGetTechnicianOverviewQuery();
  const { data: profile } = useGetTechnicianProfileQuery();

  const firstName = (profile?.displayName ?? "").split(" ")[0] || "Technician";

  const stats = useMemo(() => {
    const summary = overview?.summary;
    return {
      availability: humanizeEnum(summary?.availability),
      todayJobs: summary?.todayJobsCount ?? 0,
      activeJobs: summary?.activeJobsCount ?? 0,
      completedToday: summary?.completedTodayCount ?? 0,
      upcomingJobs: summary?.upcomingJobsCount ?? 0,
      completedTotal: summary?.completedTotalCount ?? 0,
    };
  }, [overview?.summary]);

  const todaysOrders = useMemo(
    () => (overview?.todaySchedule ?? []).map(toJobRow),
    [overview?.todaySchedule],
  );

  const nextAppointment = overview?.nextAppointment
    ? toJobRow(overview.nextAppointment)
    : undefined;

  const upcomingOrders = useMemo(
    () => (overview?.upcomingJobs ?? []).map(toJobRow),
    [overview?.upcomingJobs],
  );

  const recentlyCompleted = useMemo(
    () => (overview?.recentlyCompleted ?? []).slice(0, 3).map(toJobRow),
    [overview?.recentlyCompleted],
  );

  return (
    <TechnicianRouteShell
      eyebrow="Field Dashboard"
      title={`Welcome back, ${firstName}`}
      description="Assigned jobs, today’s schedule, and field updates from one technician workspace."
      action={
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/technician/schedule">View Schedule</Link>
          </Button>
          <Button asChild>
            <Link href="/technician/jobs">Open My Jobs</Link>
          </Button>
        </div>
      }
    >
      {isOverviewError ? (
        <AdminSurface className="border border-rose-200 bg-rose-50/70">
          <p className="font-semibold text-rose-900">
            We couldn&apos;t load your dashboard
          </p>
          <p className="mt-1 text-sm text-rose-700">
            Your assignments are temporarily unavailable. Please refresh in a
            moment or contact dispatch.
          </p>
        </AdminSurface>
      ) : null}

      {/* 17.1 KPI Summary Bar */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        {isLoadingOverview ? (
          Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-24 animate-pulse rounded-xl bg-slate-100"
            />
          ))
        ) : (
          <>
            <AdminStatCard label="Availability" value={stats.availability} tone="soft" />
            <AdminStatCard label="Today's Jobs" value={stats.todayJobs} />
            <AdminStatCard label="Active Jobs" value={stats.activeJobs} tone="warning" />
            <AdminStatCard
              label="Completed Today"
              value={stats.completedToday}
              tone="success"
            />
            <AdminStatCard label="Upcoming Jobs" value={stats.upcomingJobs} />
            <AdminStatCard label="Completed Total" value={stats.completedTotal} />
          </>
        )}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.3fr_0.95fr]">
        <AdminSurface>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-primary">
                Today&apos;s Schedule
              </h2>
              <p className="mt-1 text-sm text-slate-500">Assigned work for today.</p>
            </div>
            <Button asChild size="sm" variant="outline">
              <Link href="/technician/schedule">View full schedule</Link>
            </Button>
          </div>

          <div className="mt-5 space-y-4">
            {isLoadingOverview ? (
              Array.from({ length: 2 }).map((_, index) => (
                <div
                  key={index}
                  className="h-44 animate-pulse rounded-xl bg-slate-100"
                />
              ))
            ) : todaysOrders.length === 0 ? (
              <EmptyState
                icon={CalendarDays}
                title="No jobs scheduled for today"
                description="You have no assigned jobs for today. Check upcoming appointments or view your calendar schedule."
                action={{
                  label: "View Full Schedule",
                  href: "/technician/schedule",
                }}
                tone="dashed"
                className="py-10"
              />
            ) : (
              todaysOrders.map((order) => (
                <article
                  key={order.id}
                  className="rounded-xl border border-teal-100 bg-slate-50 p-4"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge status={order.status} />
                        <span className="text-sm font-medium text-slate-500">
                          {order.reference}
                        </span>
                      </div>
                      <h3 className="mt-3 text-xl font-semibold text-primary">
                        {order.serviceName}
                      </h3>
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <div className="inline-flex items-start gap-2 text-sm text-slate-600">
                          <MapPin size={16} className="mt-0.5 text-teal-700" />
                          <span>{order.addressLabel}</span>
                        </div>
                        <div className="inline-flex items-start gap-2 text-sm text-slate-600">
                          <CalendarDays size={16} className="mt-0.5 text-teal-700" />
                          <span>{order.scheduleLabel}</span>
                        </div>
                        {order.phone && (
                          <div className="inline-flex items-start gap-2 text-sm text-slate-600">
                            <Phone size={16} className="mt-0.5 text-teal-700" />
                            <a
                              href={`tel:${order.phone}`}
                              className="hover:text-teal-700"
                            >
                              {order.phone}
                            </a>
                          </div>
                        )}
                        <div className="inline-flex items-start gap-2 text-sm text-slate-600">
                          <Clock3 size={16} className="mt-0.5 text-teal-700" />
                          <span>
                            ETA{" "}
                            {order.etaMinutes ? `${order.etaMinutes} min` : "not set"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="w-full lg:w-52">
                      <Button asChild className="w-full">
                        <Link href={`/technician/jobs/${order.id}`}>View Job</Link>
                      </Button>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </AdminSurface>

        <div className="space-y-4">
          <AdminSurface className="bg-primary text-white">
            <div className="flex items-center gap-3">
              <Wrench size={20} />
              <div>
                <h2 className="text-xl font-semibold">Next Appointment</h2>
                <p className="mt-1 text-sm text-white/75">
                  {nextAppointment
                    ? `${nextAppointment.serviceName} • ${nextAppointment.customerLabel}`
                    : "No upcoming appointment"}
                </p>
              </div>
            </div>
            {nextAppointment ? (
              <>
                <div className="mt-5 space-y-2 text-sm text-white/80">
                  <p>{nextAppointment.scheduleLabel}</p>
                  <p>
                    ETA{" "}
                    {nextAppointment.etaMinutes
                      ? `${nextAppointment.etaMinutes} min`
                      : "not set"}
                  </p>
                </div>
                <div className="mt-5">
                  <Button asChild variant="secondary">
                    <Link href={`/technician/jobs/${nextAppointment.id}`}>
                      Open Job
                    </Link>
                  </Button>
                </div>
              </>
            ) : (
              <p className="mt-5 text-sm leading-6 text-white/75">
                No upcoming appointment is assigned right now.
              </p>
            )}
          </AdminSurface>

          <AdminSurface>
            <div className="flex items-center gap-3">
              <CheckCircle2 size={20} className="text-teal-700" />
              <div>
                <h2 className="text-xl font-semibold text-primary">
                  {upcomingOrders.length === 0 && recentlyCompleted.length > 0
                    ? "Recently Completed"
                    : "Upcoming Jobs"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {upcomingOrders.length === 0 && recentlyCompleted.length > 0
                    ? "Your latest finished work."
                    : "Assigned queue after today."}
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {isLoadingOverview ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-24 animate-pulse rounded-xl bg-slate-100"
                  />
                ))
              ) : upcomingOrders.length > 0 ? (
                upcomingOrders.map((order) => (
                  <Link
                    key={order.id}
                    href={`/technician/jobs/${order.id}`}
                    className="block rounded-xl bg-slate-50 px-4 py-4 transition hover:bg-teal-50"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900">
                          {order.serviceName}
                        </p>
                        <p className="mt-1 truncate text-sm text-slate-500">
                          For {order.customerLabel}
                        </p>
                      </div>
                      <StatusBadge status={order.status} />
                    </div>
                    <p className="mt-3 text-sm text-slate-600">
                      {order.scheduleLabel}
                    </p>
                  </Link>
                ))
              ) : recentlyCompleted.length > 0 ? (
                recentlyCompleted.map((order) => (
                  <Link
                    key={order.id}
                    href={`/technician/jobs/${order.id}`}
                    className="block rounded-xl bg-slate-50 px-4 py-4 transition hover:bg-teal-50"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900">
                          {order.serviceName}
                        </p>
                        <p className="mt-1 truncate text-sm text-slate-500">
                          Completed for {order.customerLabel}
                        </p>
                      </div>
                      <StatusBadge status="completed" />
                    </div>
                  </Link>
                ))
              ) : (
                <EmptyState
                  icon={CalendarDays}
                  title="No upcoming assignments"
                  description="New dispatch assignments will appear here once assigned by dispatchers."
                  tone="dashed"
                  className="py-8"
                />
              )}
            </div>
          </AdminSurface>
        </div>
      </div>
    </TechnicianRouteShell>
  );
}
