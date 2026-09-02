import Link from "next/link";
import { CalendarDays, Clock3, MapPin, Phone, Search, X } from "lucide-react";

import { StatusBadge } from "@/components/customer-portal/StatusBadge";
import {
  AdminSurface,
  TechnicianRouteShell,
} from "@/components/technician/TechnicianRouteShell";
import { buildTechnicianAddressLabel } from "@/components/technician/technician-utils";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  getTechnicianCustomerLabel,
  getTechnicianJobCounts,
  getTechnicianJobsByFilter,
  getTechnicianOrderPhone,
} from "@/data/mock/technician-dashboard";

const filters = [
  { label: "Today", value: "today" },
  { label: "Upcoming", value: "upcoming" },
  { label: "In Progress", value: "in-progress" },
  { label: "Completed", value: "completed" },
] as const;

const emptyStateByFilter = {
  today: "No jobs scheduled for today.",
  upcoming: "No upcoming assignments.",
  "in-progress": "No jobs currently in progress.",
  completed: "No completed jobs to show.",
} as const;

interface TechnicianJobsPageProps {
  searchParams?: Promise<{ filter?: string; q?: string }>;
}

export default async function TechnicianJobsPage({
  searchParams,
}: TechnicianJobsPageProps) {
  const resolved = searchParams ? await searchParams : undefined;
  const activeFilter = filters.some((item) => item.value === resolved?.filter)
    ? (resolved?.filter as (typeof filters)[number]["value"])
    : "today";
  const query = (resolved?.q ?? "").trim().toLowerCase();

  const allJobs = getTechnicianJobsByFilter(activeFilter);
  const jobs = allJobs.filter((order) => {
    if (!query) return true;
    const customerLabel = getTechnicianCustomerLabel(order).toLowerCase();
    const addressLabel = buildTechnicianAddressLabel(order).toLowerCase();
    return (
      order.id.toLowerCase().includes(query) ||
      order.serviceName.toLowerCase().includes(query) ||
      customerLabel.includes(query) ||
      addressLabel.includes(query)
    );
  });
  const counts = getTechnicianJobCounts();

  return (
    <TechnicianRouteShell
      eyebrow="Assigned Work"
      title="My Jobs"
      description="Assigned service orders for this technician only."
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <CompactCount label="Today" value={counts.today} />
        <CompactCount label="Upcoming" value={counts.upcoming} />
        <CompactCount label="Active" value={counts.active} />
        <CompactCount label="Completed" value={counts.completed} />
      </div>

      <div className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => (
            <Button
              asChild
              key={filter.value}
              size="sm"
              className="rounded-md"
              variant={filter.value === activeFilter ? "default" : "outline"}
            >
              <Link href={`/technician/jobs?filter=${filter.value}${query ? `&q=${encodeURIComponent(query)}` : ""}`}>
                {filter.label}
              </Link>
            </Button>
          ))}
        </div>

        <form method="GET" action="/technician/jobs" className="relative flex items-center">
          <input type="hidden" name="filter" value={activeFilter} />
          <Search size={16} className="pointer-events-none absolute left-3.5 text-slate-400" />
          <Input
            name="q"
            defaultValue={resolved?.q ?? ""}
            placeholder="Search jobs by ID, customer name, service, or address..."
            className="h-10 rounded-md border-slate-200 bg-slate-50/50 pl-10 pr-10 text-xs sm:text-sm focus-visible:bg-white"
          />
          {query ? (
            <Link
              href={`/technician/jobs?filter=${activeFilter}`}
              aria-label="Clear search"
              className="absolute right-3 flex size-5 items-center justify-center rounded-md text-slate-400 hover:bg-slate-200 hover:text-slate-600"
            >
              <X size={13} />
            </Link>
          ) : null}
        </form>
      </div>

      <div className="space-y-4">
        {jobs.length === 0 ? (
          <AdminSurface className="text-center text-sm text-slate-600">
            {emptyStateByFilter[activeFilter]}
          </AdminSurface>
        ) : (
          jobs.map((order) => (
            <AdminSurface key={order.id}>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={order.status} />
                    <span className="text-sm font-medium text-slate-500">{order.id}</span>
                  </div>

                  <h2 className="mt-3 text-2xl font-semibold text-primary">
                    {order.serviceName}
                  </h2>
                  <p className="mt-2 text-sm text-slate-600">
                    {getTechnicianCustomerLabel(order)}
                  </p>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <DetailRow icon={CalendarDays} value={order.currentSchedule.label ?? ""} />
                    <DetailRow icon={MapPin} value={buildTechnicianAddressLabel(order)} />
                    <DetailRow
                      icon={Phone}
                      value={getTechnicianOrderPhone(order)}
                      href={`tel:${getTechnicianOrderPhone(order)}`}
                    />
                    <DetailRow
                      icon={Clock3}
                      value={`ETA ${
                        order.technicianEta
                          ? `${order.technicianEta.minutes} min`
                          : "not set"
                      }`}
                    />
                  </div>
                </div>

                <div className="w-full lg:w-44">
                  <Button asChild className="w-full">
                    <Link href={`/technician/jobs/${order.id}`}>View Details</Link>
                  </Button>
                </div>
              </div>
            </AdminSurface>
          ))
        )}
      </div>
    </TechnicianRouteShell>
  );
}

function CompactCount({ label, value }: { label: string; value: number }) {
  return (
    <AdminSurface className="bg-slate-50">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-primary">
        {value}
      </p>
    </AdminSurface>
  );
}

function DetailRow({
  icon: Icon,
  value,
  href,
}: {
  icon: typeof CalendarDays;
  value: string;
  href?: string;
}) {
  const content = href ? (
    <a href={href} className="hover:text-teal-700">
      {value}
    </a>
  ) : (
    <span>{value}</span>
  );

  return (
    <div className="inline-flex gap-2 text-sm text-slate-600">
      <Icon size={16} className="mt-0.5 text-teal-700" />
      {content}
    </div>
  );
}
