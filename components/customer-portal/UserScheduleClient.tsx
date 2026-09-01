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
    <div className="min-h-screen">
      <PageHeader
        description="A live timeline for all scheduled technician visits, arrivals, and service orders."
        eyebrow="Schedule & Orders"
        title="My Service Schedule"
      />

      <div className="mb-6 flex gap-2 rounded-3xl border border-teal-100 bg-white p-4 shadow-sm">
        <Button
          variant={activeTab === "upcoming" ? "default" : "ghost"}
          onClick={() => setActiveTab("upcoming")}
          className="rounded-full"
        >
          Upcoming Visits
        </Button>
        <Button
          variant={activeTab === "completed" ? "default" : "ghost"}
          onClick={() => setActiveTab("completed")}
          className="rounded-full"
        >
          Past & Completed
        </Button>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-16 text-teal-700">
          <Loader2 size={32} className="animate-spin" />
          <span className="ml-3 text-sm font-medium text-slate-600">Loading schedule...</span>
        </div>
      )}

      {!isLoading && (
        <div className="space-y-5">
          {displayOrders.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-teal-200 bg-teal-50/30 p-12 text-center">
              <CalendarDays size={36} className="mx-auto text-teal-700 opacity-60" />
              <h2 className="mt-4 text-lg font-semibold text-slate-900">
                {activeTab === "upcoming" ? "No upcoming appointments scheduled" : "No completed visits yet"}
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                {activeTab === "upcoming"
                  ? "When an admin approves and schedules your request, dispatch details will appear here."
                  : "Completed service orders and technician service reports will appear here."}
              </p>
              <Button asChild size="pill" className="mt-6">
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
                  className="rounded-3xl border border-teal-100/80 bg-white p-6 shadow-[0_12px_36px_-24px_rgba(28,79,80,0.15)] transition hover:border-teal-300"
                  key={String(order.id)}
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="font-mono text-sm font-bold text-teal-800">
                          {String(order.id)}
                        </span>
                        <StatusBadge status={String(order.status || "scheduled")} />
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                          <Clock3 size={14} className="text-teal-600" />
                          {scheduleDate}
                        </span>
                      </div>
                      <h2 className="mt-4 text-xl font-bold text-slate-900">
                        {serviceTitle}
                      </h2>
                      {problemSummary && (
                        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600">
                          {problemSummary}
                        </p>
                      )}
                      {techName ? (
                        <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-teal-50 px-3.5 py-1.5 text-xs font-semibold text-teal-800">
                          <UserRound size={14} />
                          Tech: {techName}
                        </div>
                      ) : null}
                    </div>

                    <Button asChild size="pill" variant="outline">
                      <Link href={targetLink}>
                        View Details
                        <ArrowRight size={16} />
                      </Link>
                    </Button>
                  </div>
                </article>
              );
            })
          )}
        </div>
      )}

      <section className="mt-8 rounded-3xl bg-[linear-gradient(135deg,#134E48_0%,#0D9488_100%)] p-8 text-center text-white shadow-lg">
        <CalendarDays className="mx-auto text-teal-200" size={32} />
        <h2 className="mt-4 text-2xl font-bold">Need additional system maintenance?</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-teal-50/80">
          Easily book specialized pipe diagnostics, motor checkups, or inlet replacement with Elite certified technicians.
        </p>
        <Button asChild size="pill" className="mt-6 bg-white text-teal-950 hover:bg-white/90">
          <Link href="/services">Request a Service</Link>
        </Button>
      </section>
    </div>
  );
}
