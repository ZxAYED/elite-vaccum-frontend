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

import { buildTechnicianAddressLabel } from "@/components/technician/technician-utils";
import { StatusBadge } from "@/components/customer-portal/StatusBadge";
import {
  AdminStatCard,
  AdminSurface,
  TechnicianRouteShell,
} from "@/components/technician/TechnicianRouteShell";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  getCurrentTechnicianProfile,
  getTechnicianCustomerLabel,
  getTechnicianOrderPhone,
  getTechnicianOverviewStats,
  getTechnicianRecentCompletedJobs,
  getTechnicianTodayOrders,
  getTechnicianUpcomingOrders,
} from "@/data/mock/technician-dashboard";
import {
  useGetTechnicianOverviewQuery,
  useGetTechnicianProfileQuery,
} from "@/redux/api/technicianApi";

export function TechnicianOverviewClient() {
  const { data: apiOverview } = useGetTechnicianOverviewQuery();
  const { data: apiProfile } = useGetTechnicianProfileQuery();

  const mockTechnician = getCurrentTechnicianProfile();
  const mockStats = getTechnicianOverviewStats();
  const mockTodaysOrders = getTechnicianTodayOrders();
  const mockUpcomingOrders = getTechnicianUpcomingOrders().slice(0, 4);
  const mockRecentCompletedJobs = getTechnicianRecentCompletedJobs().slice(0, 3);

  const technicianName =
    apiProfile?.displayName || mockTechnician.displayName;
  const firstName = technicianName.split(" ")[0] || "Technician";

  const stats = useMemo(() => {
    if (apiOverview?.summary) {
      return {
        availability: apiOverview.summary.availability,
        todayJobs: apiOverview.summary.todayJobsCount,
        activeJobs: apiOverview.summary.activeJobsCount,
        completedToday: apiOverview.summary.completedTodayCount,
        upcomingJobs: apiOverview.summary.upcomingJobsCount,
        completedTotal: apiOverview.summary.completedTotalCount,
      };
    }
    return {
      availability: mockStats.availability,
      todayJobs: mockStats.todayJobs,
      activeJobs: mockStats.activeJobs,
      completedToday: mockStats.completedToday,
      upcomingJobs: mockStats.upcomingJobs,
      completedTotal: mockTechnician.completedJobs,
    };
  }, [apiOverview, mockStats, mockTechnician.completedJobs]);

  const todaysOrders = useMemo(() => {
    if (apiOverview?.todaySchedule && apiOverview.todaySchedule.length > 0) {
      return apiOverview.todaySchedule.map((item) => ({
        id: item.serviceOrderId || item.businessId,
        serviceName: item.serviceName,
        status: item.status.toLowerCase(),
        customerLabel: item.customerName,
        phone: item.customerPhone,
        addressLabel: item.propertyAddress,
        scheduleLabel: item.timeWindow,
        etaMinutes: undefined as number | undefined,
      }));
    }
    return mockTodaysOrders.map((order) => ({
      id: order.id,
      serviceName: order.serviceName,
      status: order.status,
      customerLabel: getTechnicianCustomerLabel(order),
      phone: getTechnicianOrderPhone(order),
      addressLabel: buildTechnicianAddressLabel(order),
      scheduleLabel: order.currentSchedule.label,
      etaMinutes: order.technicianEta?.minutes,
    }));
  }, [apiOverview, mockTodaysOrders]);

  const nextAppointment = useMemo(() => {
    if (apiOverview?.nextAppointment) {
      return {
        id: apiOverview.nextAppointment.serviceOrderId || apiOverview.nextAppointment.businessId,
        serviceName: apiOverview.nextAppointment.serviceName,
        customerLabel: apiOverview.nextAppointment.customerName,
        scheduleLabel: apiOverview.nextAppointment.timeWindow,
        etaMinutes: undefined as number | undefined,
      };
    }
    const mockNext = mockTodaysOrders[0] ?? mockUpcomingOrders[0];
    if (mockNext) {
      return {
        id: mockNext.id,
        serviceName: mockNext.serviceName,
        customerLabel: getTechnicianCustomerLabel(mockNext),
        scheduleLabel: mockNext.currentSchedule.label,
        etaMinutes: mockNext.technicianEta?.minutes,
      };
    }
    return undefined;
  }, [apiOverview, mockTodaysOrders, mockUpcomingOrders]);

  const upcomingOrders = useMemo(() => {
    if (apiOverview?.upcomingJobs && apiOverview.upcomingJobs.length > 0) {
      return apiOverview.upcomingJobs.map((item) => ({
        id: item.serviceOrderId || item.businessId,
        serviceName: item.serviceName,
        customerLabel: item.customerName,
        scheduleLabel: item.timeWindow,
        status: item.status.toLowerCase(),
      }));
    }
    return mockUpcomingOrders.map((order) => ({
      id: order.id,
      serviceName: order.serviceName,
      customerLabel: getTechnicianCustomerLabel(order),
      scheduleLabel: order.currentSchedule.label,
      status: order.status,
    }));
  }, [apiOverview, mockUpcomingOrders]);

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
      {/* 17.1 KPI Summary Bar */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <AdminStatCard label="Availability" value={stats.availability} tone="soft" />
        <AdminStatCard label="Today's Jobs" value={stats.todayJobs} />
        <AdminStatCard label="Active Jobs" value={stats.activeJobs} tone="warning" />
        <AdminStatCard label="Completed Today" value={stats.completedToday} tone="success" />
        <AdminStatCard label="Upcoming Jobs" value={stats.upcomingJobs} />
        <AdminStatCard label="Completed Total" value={stats.completedTotal} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.3fr_0.95fr]">
        <AdminSurface>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-slate-950">
                Today&apos;s Schedule
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Assigned work for today.
              </p>
            </div>
            <Button asChild size="sm" variant="outline">
              <Link href="/technician/schedule">View full schedule</Link>
            </Button>
          </div>

          <div className="mt-5 space-y-4">
            {todaysOrders.length === 0 ? (
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
                          {order.id}
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
                            <a href={`tel:${order.phone}`} className="hover:text-teal-700">
                              {order.phone}
                            </a>
                          </div>
                        )}
                        <div className="inline-flex items-start gap-2 text-sm text-slate-600">
                          <Clock3 size={16} className="mt-0.5 text-teal-700" />
                          <span>
                            ETA {order.etaMinutes ? `${order.etaMinutes} min` : "not set"}
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
                    ETA {nextAppointment.etaMinutes ? `${nextAppointment.etaMinutes} min` : "not set"}
                  </p>
                </div>
                <div className="mt-5">
                  <Button asChild variant="secondary">
                    <Link href={`/technician/jobs/${nextAppointment.id}`}>Open Job</Link>
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
                <h2 className="text-xl font-semibold text-slate-950">
                  Upcoming Jobs
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Assigned queue after today.
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {upcomingOrders.length === 0 ? (
                mockRecentCompletedJobs.length > 0 ? (
                  mockRecentCompletedJobs.map((order) => (
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
                            Recently completed for {getTechnicianCustomerLabel(order)}
                          </p>
                        </div>
                        <StatusBadge status="completed" />
                      </div>
                      <p className="mt-3 text-sm text-slate-600">
                        {order.currentSchedule.label}
                      </p>
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
                )
              ) : (
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
              )}
            </div>
          </AdminSurface>
        </div>
      </div>
    </TechnicianRouteShell>
  );
}
