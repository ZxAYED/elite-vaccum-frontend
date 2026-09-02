"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, CalendarDays, Clock3, Loader2, UserRound } from "lucide-react";

import { PageHeader } from "@/components/customer-portal/PageHeader";
import { StatusBadge } from "@/components/customer-portal/StatusBadge";
import { Button } from "@/components/ui/Button";
import { useGetMyServiceOrdersQuery } from "@/redux/api/serviceOrdersApi";
import { getDashboardScheduleItems } from "@/data/mock/customer-dashboard";
import { formatLongDate } from "@/lib/formatters";

export function UserScheduleClient() {
  const [activeTab, setActiveTab] = useState<"upcoming" | "completed">("upcoming");
  const { data: apiOrders, isLoading } = useGetMyServiceOrdersQuery();

  const mockItems = useMemo(() => getDashboardScheduleItems(activeTab), [activeTab]);

  const displayOrders = useMemo(() => {
    const items = apiOrders?.items || [];
    if (items.length > 0) {
      return items.filter((order) => {
        const status = (order.status || "").toLowerCase();
        if (activeTab === "completed") {
          return ["completed", "cancelled"].includes(status);
        }
        return !["completed", "cancelled"].includes(status);
      });
    }
    return mockItems;
  }, [apiOrders, mockItems, activeTab]);

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        description="A live timeline for all scheduled technician visits, arrivals, and service orders."
        eyebrow="Schedule & Orders"
        title="My Service Schedule"
      />

      <div className="flex gap-2 rounded-lg border border-slate-200 bg-white p-3 shadow-xs">
        <Button
          variant={activeTab === "upcoming" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveTab("upcoming")}
          className="rounded-md text-xs font-medium"
        >
          Upcoming Visits
        </Button>
        <Button
          variant={activeTab === "completed" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveTab("completed")}
          className="rounded-md text-xs font-medium"
        >
          Past & Completed
        </Button>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center rounded-lg border border-slate-200 bg-white py-16 text-teal-700 shadow-xs">
          <Loader2 size={24} className="animate-spin" />
          <span className="ml-3 text-xs sm:text-sm font-medium text-slate-600">Loading schedule...</span>
        </div>
      )}

      {!isLoading && (
        <div className="space-y-4">
          {displayOrders.length === 0 ? (
            <div className="rounded-lg border border-dashed border-teal-200 bg-teal-50/30 p-10 text-center">
              <div className="mx-auto flex size-12 items-center justify-center rounded-lg bg-teal-100 text-teal-800 shadow-xs">
                <CalendarDays size={22} />
              </div>
              <h2 className="mt-3 text-base font-semibold text-slate-900">
                {activeTab === "upcoming" ? "No upcoming appointments scheduled" : "No completed visits yet"}
              </h2>
              <p className="mx-auto mt-1 max-w-sm text-xs text-slate-600">
                {activeTab === "upcoming"
                  ? "When an admin approves and schedules your request, dispatch details will appear here."
                  : "Completed service orders and technician service reports will appear here."}
              </p>
              <Button asChild size="sm" className="mt-5 rounded-md font-medium">
                <Link href="/services">Book a Service Visit</Link>
              </Button>
            </div>
          ) : (
            displayOrders.map((orderItem) => {
              const order = orderItem as unknown as Record<string, unknown>;
              const scheduleRaw = order.scheduledAt || order.currentSchedule;
              const scheduleDate =
                typeof scheduleRaw === "string"
                  ? scheduleRaw.includes("T")
                    ? formatLongDate(scheduleRaw)
                    : scheduleRaw
                  : typeof scheduleRaw === "object" && scheduleRaw && "label" in scheduleRaw
                    ? String((scheduleRaw as { label?: string }).label)
                    : "Scheduled";

              const serviceTitle =
                typeof order.serviceName === "string"
                  ? order.serviceName
                  : typeof order.summary === "string"
                    ? order.summary
                    : "Central Vacuum Service";

              const problemSummary =
                typeof order.problemSummary === "string"
                  ? order.problemSummary
                  : typeof order.customerNotes === "string"
                    ? order.customerNotes
                    : "";

              const techObj = order.technician as Record<string, unknown> | undefined;
              const techName =
                techObj && typeof techObj.name === "string"
                  ? techObj.name
                  : techObj && typeof techObj.displayName === "string"
                    ? techObj.displayName
                    : null;

              const targetLink =
                typeof order.serviceRequestId === "string"
                  ? `/user/services/${order.serviceRequestId}`
                  : `/user/services/${order.id}`;

              return (
                <article
                  className="rounded-lg border border-slate-200 bg-white p-5 sm:p-6 shadow-xs transition hover:border-teal-400 hover:shadow-sm"
                  key={String(order.id)}
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-teal-900 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                          {String(order.id)}
                        </span>
                        <StatusBadge status={String(order.status || "scheduled")} />
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                          <Clock3 size={13} className="text-teal-600" />
                          {scheduleDate}
                        </span>
                      </div>
                      <h2 className="text-base sm:text-lg font-bold text-slate-900">
                        {serviceTitle}
                      </h2>
                      {problemSummary && (
                        <p className="line-clamp-2 text-xs sm:text-sm leading-relaxed text-slate-600 font-normal">
                          {problemSummary}
                        </p>
                      )}
                      {techName ? (
                        <div className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-teal-200 bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-800">
                          <UserRound size={13} />
                          Tech: {techName}
                        </div>
                      ) : null}
                    </div>

                    <Button asChild size="sm" variant="outline" className="rounded-md font-medium shrink-0">
                      <Link href={targetLink}>
                        View Details
                        <ArrowRight size={14} className="ml-1.5" />
                      </Link>
                    </Button>
                  </div>
                </article>
              );
            })
          )}
        </div>
      )}

      <section className="rounded-lg border border-teal-900/60 bg-gradient-to-br from-teal-950 via-teal-900 to-slate-900 p-6 text-center text-white shadow-xs">
        <CalendarDays className="mx-auto text-teal-300" size={28} />
        <h2 className="mt-3 text-lg font-bold">Need additional system maintenance?</h2>
        <p className="mx-auto mt-1.5 max-w-lg text-xs sm:text-sm text-teal-100/80 font-normal">
          Easily book specialized pipe diagnostics, motor checkups, or inlet replacement with Elite certified technicians.
        </p>
        <Button asChild size="sm" className="mt-4 rounded-md bg-white text-teal-950 hover:bg-teal-50 font-semibold">
          <Link href="/services">Request a Service</Link>
        </Button>
      </section>
    </div>
  );
}
