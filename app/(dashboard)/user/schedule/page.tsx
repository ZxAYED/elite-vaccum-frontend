import Link from "next/link";
import { ArrowRight, CalendarDays, Clock3, UserRound } from "lucide-react";

import { PageHeader } from "@/components/customer-portal/PageHeader";
import { StatusBadge } from "@/components/customer-portal/StatusBadge";
import { Button } from "@/components/ui/Button";
import { getDashboardScheduleItems } from "@/data/mock/customer-dashboard";

interface SchedulePageProps {
  searchParams: Promise<{ tab?: string }>;
}

export default async function SchedulePage({ searchParams }: SchedulePageProps) {
  const params = await searchParams;
  const tab = params.tab === "completed" ? "completed" : "upcoming";
  const items = getDashboardScheduleItems(tab);

  return (
    <div className="min-h-screen">
      <PageHeader
        description="A convenience view for service appointments. Service order details remain the source of truth."
        eyebrow="Schedule"
        title="My Schedule"
      />

      <div className="mb-6 flex gap-2 rounded-3xl border border-teal-100 bg-white p-4 shadow-sm">
        <Button asChild variant={tab === "upcoming" ? "default" : "ghost"}>
          <Link href="/user/schedule?tab=upcoming">Upcoming</Link>
        </Button>
        <Button asChild variant={tab === "completed" ? "default" : "ghost"}>
          <Link href="/user/schedule?tab=completed">Completed</Link>
        </Button>
      </div>

      <div className="space-y-5">
        {items.map((order) => (
          <article
            className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm"
            key={order.id}
          >
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <StatusBadge status={order.status} />
                  <span className="inline-flex items-center gap-2 text-sm text-gray-500">
                    <Clock3 size={15} />
                    {order.currentSchedule}
                  </span>
                </div>
                <h2 className="mt-4 text-2xl font-semibold text-primary">
                  {order.serviceName}
                </h2>
                <p className="mt-2 max-w-3xl text-sm text-gray-600">
                  {order.problemSummary}
                </p>
                {order.technician ? (
                  <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-gray-50 px-4 py-2 text-sm font-semibold text-gray-700">
                    <UserRound size={16} />
                    {order.technician.name}
                  </div>
                ) : null}
              </div>

              <Button asChild>
                <Link href={`/user/schedule/${order.serviceRequestId}`}>
                  View Details
                  <ArrowRight size={16} />
                </Link>
              </Button>
            </div>
          </article>
        ))}
      </div>

      <section className="mt-6 rounded-3xl bg-primary p-8 text-center text-white">
        <CalendarDays className="mx-auto" size={28} />
        <h2 className="mt-4 text-2xl font-semibold">Need something else?</h2>
        <p className="mx-auto mt-2 max-w-xl text-white/70">
          Quickly book specialized repairs or routine checkups with Elite technicians.
        </p>
        <Button asChild className="mt-6 bg-white text-primary hover:bg-white/90">
          <Link href="/services">Request a Service</Link>
        </Button>
      </section>
    </div>
  );
}
