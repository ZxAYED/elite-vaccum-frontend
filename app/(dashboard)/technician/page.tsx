import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  History,
  MapPin,
  Phone,
  Sparkles,
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
  getTechnicianRecentActivity,
  getTechnicianRecentCompletedJobs,
  getTechnicianTodayOrders,
  getTechnicianUpcomingOrders,
} from "@/data/mock/technician-dashboard";
import { formatLongDate } from "@/lib/formatters";

export default function TechnicianOverviewPage() {
  const technician = getCurrentTechnicianProfile();
  const stats = getTechnicianOverviewStats();
  const todaysOrders = getTechnicianTodayOrders();
  const upcomingOrders = getTechnicianUpcomingOrders().slice(0, 4);
  const recentActivity = getTechnicianRecentActivity();
  const recentCompletedJobs = getTechnicianRecentCompletedJobs().slice(0, 3);
  const nextAppointment = todaysOrders[0] ?? upcomingOrders[0];

  return (
    <TechnicianRouteShell
      eyebrow="Field Dashboard"
      title={`Welcome back, ${technician.displayName.split(" ")[0]}`}
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
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <AdminStatCard label="Availability" value={stats.availability} tone="soft" />
        <AdminStatCard label="Today's Jobs" value={stats.todayJobs} />
        <AdminStatCard label="Active Jobs" value={stats.activeJobs} tone="warning" />
        <AdminStatCard label="Completed Today" value={stats.completedToday} tone="success" />
        <AdminStatCard label="Upcoming Jobs" value={stats.upcomingJobs} />
        <AdminStatCard label="Completed Total" value={technician.completedJobs} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.3fr_0.95fr]">
        <AdminSurface>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-slate-950">
                Today&apos;s Schedule
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Assigned work for Thursday, August 13, 2026.
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
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {order.problemSummary}
                      </p>
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <div className="inline-flex items-start gap-2 text-sm text-slate-600">
                          <MapPin size={16} className="mt-0.5 text-teal-700" />
                          <span>{buildTechnicianAddressLabel(order)}</span>
                        </div>
                        <div className="inline-flex items-start gap-2 text-sm text-slate-600">
                          <CalendarDays size={16} className="mt-0.5 text-teal-700" />
                          <span>{order.currentSchedule.label}</span>
                        </div>
                        <div className="inline-flex items-start gap-2 text-sm text-slate-600">
                          <Phone size={16} className="mt-0.5 text-teal-700" />
                          <a href={`tel:${getTechnicianOrderPhone(order)}`} className="hover:text-teal-700">
                            {getTechnicianOrderPhone(order)}
                          </a>
                        </div>
                        <div className="inline-flex items-start gap-2 text-sm text-slate-600">
                          <Clock3 size={16} className="mt-0.5 text-teal-700" />
                          <span>
                            ETA{" "}
                            {order.technicianEta
                              ? `${order.technicianEta.minutes} min`
                              : "not set"}
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
                    ? `${nextAppointment.serviceName} • ${getTechnicianCustomerLabel(nextAppointment)}`
                    : "No upcoming appointment"}
                </p>
              </div>
            </div>
            {nextAppointment ? (
              <>
                <div className="mt-5 space-y-2 text-sm text-white/80">
                  <p>{nextAppointment.currentSchedule.label}</p>
                  <p>
                    ETA{" "}
                    {nextAppointment.technicianEta
                      ? `${nextAppointment.technicianEta.minutes} min`
                      : "not set"}
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
                recentCompletedJobs.length > 0 ? (
                  recentCompletedJobs.map((order) => (
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
                          {getTechnicianCustomerLabel(order)}
                        </p>
                      </div>
                      <StatusBadge status={order.status} />
                    </div>
                    <p className="mt-3 text-sm text-slate-600">
                      {order.currentSchedule.label}
                    </p>
                  </Link>
                ))
              )}
            </div>
          </AdminSurface>

          <AdminSurface>
            <div className="flex items-center gap-3">
              <Sparkles size={20} className="text-teal-700" />
              <div>
                <h2 className="text-xl font-semibold text-slate-950">Quick Actions</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Fast access to the most-used field workflows.
                </p>
              </div>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Button asChild variant="outline" className="justify-between">
                <Link href="/technician/jobs?filter=today">
                  Open Today&apos;s Jobs
                  <ArrowRight size={16} />
                </Link>
              </Button>
              <Button asChild variant="outline" className="justify-between">
                <Link href="/technician/schedule">
                  View Schedule
                  <ArrowRight size={16} />
                </Link>
              </Button>
              <Button asChild variant="outline" className="justify-between">
                <Link href={nextAppointment ? `/technician/jobs/${nextAppointment.id}` : "/technician/jobs"}>
                  Open Next Job
                  <ArrowRight size={16} />
                </Link>
              </Button>
              <Button asChild variant="outline" className="justify-between">
                <Link href="/technician/settings">
                  Update Availability
                  <ArrowRight size={16} />
                </Link>
              </Button>
            </div>
          </AdminSurface>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.92fr_1.08fr]">
        <AdminSurface>
          <div className="flex items-center gap-3">
            <History size={20} className="text-teal-700" />
            <div>
              <h2 className="text-xl font-semibold text-slate-950">
                Recently Completed
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Latest finished service orders handled by this technician.
              </p>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            {recentCompletedJobs.length === 0 ? (
              <div className="rounded-xl bg-slate-50 px-4 py-6 text-sm text-slate-600">
                No completed jobs yet.
              </div>
            ) : (
              recentCompletedJobs.map((order) => (
                <Link
                  key={order.id}
                  href={`/technician/jobs/${order.id}`}
                  className="block rounded-xl bg-slate-50 px-4 py-4 transition hover:bg-teal-50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900">
                        {order.serviceName}
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        {getTechnicianCustomerLabel(order)}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">{order.id}</p>
                    </div>
                    <StatusBadge status="completed" />
                  </div>
                  <p className="mt-3 text-sm text-slate-600">
                    {order.currentSchedule.label}
                  </p>
                </Link>
              ))
            )}
          </div>
        </AdminSurface>

        <AdminSurface>
          <h2 className="text-xl font-semibold text-slate-950">Recent Activity</h2>
          <div className="mt-5 space-y-3">
            {recentActivity.length === 0 ? (
              <div className="rounded-xl bg-slate-50 px-4 py-6 text-sm text-slate-600">
                No recent activity to show.
              </div>
            ) : (
              recentActivity.map((item) => (
                <Link
                  key={item.id}
                  href={item.href ?? "/technician"}
                  className="block rounded-xl bg-slate-50 px-4 py-4 transition hover:bg-teal-50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900">{item.title}</p>
                      <p className="mt-1 text-sm text-slate-600">{item.detail}</p>
                    </div>
                    <span className="shrink-0 text-xs text-slate-500">
                      {formatLongDate(item.createdAt)}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </AdminSurface>
      </div>
    </TechnicianRouteShell>
  );
}
