"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, Clock3, UserRound } from "lucide-react";

import { PageHeader } from "@/components/customer-portal/PageHeader";
import {
  PortalCard,
  PortalCardFooter,
  PortalCardTitle,
  PortalCardTop,
  PortalDetailAction,
  PortalFact,
  PortalFilterBar,
  PortalList,
  PortalLoading,
  PortalRef,
  type PortalFilterOption,
} from "@/components/customer-portal/PortalUI";
import { StatusBadge } from "@/components/customer-portal/StatusBadge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { useGetMyServiceOrdersQuery } from "@/redux/api/serviceOrdersApi";
import { formatLongDate } from "@/lib/formatters";

type ScheduleTab = "upcoming" | "completed";

const SCHEDULE_TABS: ReadonlyArray<PortalFilterOption<ScheduleTab>> = [
  { label: "Upcoming Visits", value: "upcoming" },
  { label: "Past & Completed", value: "completed" },
];

export function UserScheduleClient() {
  const [activeTab, setActiveTab] = useState<ScheduleTab>("upcoming");
  const { data: apiOrders, isLoading } = useGetMyServiceOrdersQuery();

  // Phase 10.1 GET /service-orders/me, split into the two tabs locally.
  const displayOrders = useMemo(
    () =>
      (apiOrders?.items ?? []).filter((order) => {
        const status = String(order.status ?? "").toLowerCase().replace(/_/g, "-");
        const isClosed = ["completed", "cancelled"].includes(status);
        return activeTab === "completed" ? isClosed : !isClosed;
      }),
    [apiOrders?.items, activeTab],
  );

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        description="A live timeline for all scheduled technician visits, arrivals, and service orders."
        eyebrow="Schedule & Orders"
        title="My Service Schedule"
      />

      <PortalFilterBar
        filterLabel="Showing:"
        filters={SCHEDULE_TABS}
        onChange={setActiveTab}
        value={activeTab}
      />

      {isLoading && <PortalLoading label="Loading schedule..." />}

      {!isLoading && (
        <PortalList>
          {displayOrders.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title={activeTab === "upcoming" ? "No upcoming appointments scheduled" : "No completed visits yet"}
              description={
                activeTab === "upcoming"
                  ? "When an admin approves and schedules your request, dispatch details and arrival window will appear here."
                  : "Completed service orders and technician service reports will appear here."
              }
              action={{
                label: "Book a Service Visit",
                href: "/services",
              }}
              tone="card"
              className="py-12"
            />
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
                <PortalCard key={String(order.id)}>
                  <PortalCardTop
                    badges={
                      <>
                        <StatusBadge status={String(order.status || "scheduled")} />
                        <PortalRef>{String(order.id)}</PortalRef>
                      </>
                    }
                    meta={
                      <>
                        Scheduled:{" "}
                        <span className="font-medium text-slate-700">
                          {scheduleDate}
                        </span>
                      </>
                    }
                  />

                  <PortalCardTitle href={targetLink} subtitle={problemSummary || undefined}>
                    {serviceTitle}
                  </PortalCardTitle>

                  <PortalCardFooter
                    actions={<PortalDetailAction href={targetLink} />}
                    facts={
                      <>
                        <PortalFact
                          icon={Clock3}
                          label="Appointment"
                          placeholder="Awaiting schedule"
                          tone="brand"
                          value={scheduleDate}
                        />
                        <PortalFact
                          icon={UserRound}
                          label="Technician"
                          placeholder="Not assigned yet"
                          truncate
                          value={techName ?? undefined}
                        />
                      </>
                    }
                  />
                </PortalCard>
              );
            })
          )}
        </PortalList>
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
