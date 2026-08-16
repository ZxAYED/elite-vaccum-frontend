"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  BarChart3,
  CalendarRange,
  ClipboardCheck,
  DollarSign,
  Package,
  UserRound,
  Wrench,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  AdminPageHeader,
  AdminPageShell,
  AdminStatCard,
  AdminSurface,
} from "@/components/admin/AdminPageShell";
import { AdminSearchInput } from "@/components/admin/AdminSearchInput";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import {
  getAdminReportsSnapshot,
  type AdminReportsDateRange,
  type AdminCustomerReportRow,
  type AdminProductReportRow,
  type AdminTechnicianReportRow,
} from "@/data/mock/admin-reports";
import { useSharedBusinessStoreVersion } from "@/hooks/useSharedBusinessStoreVersion";
import { formatCurrencyUsd, formatShortDate } from "@/lib/formatters";
import type { AdminOrdersTypeFilter } from "@/data/mock/admin-orders";

type ReportsTab = "overview" | "sales" | "services" | "customers" | "technicians";

const dateRangeOptions: Array<{ label: string; value: AdminReportsDateRange }> = [
  { label: "Last 7 Days", value: "7d" },
  { label: "Last 30 Days", value: "30d" },
  { label: "Last 90 Days", value: "90d" },
  { label: "This Year", value: "year" },
  { label: "All Time", value: "all" },
];

function TabButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white"
          : "rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-teal-50 hover:text-primary"
      }
    >
      {label}
    </button>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof BarChart3;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex size-11 items-center justify-center rounded-lg bg-teal-50 text-teal-800">
        <Icon size={20} />
      </div>
      <div className="min-w-0">
        <h2 className="text-xl font-semibold tracking-[-0.03em] text-primary">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
    </div>
  );
}

function EmptySection({ title }: { title: string }) {
  return (
    <AdminSurface className="py-10 text-center">
      <BarChart3 className="mx-auto size-8 text-teal-700" />
      <h3 className="mt-3 text-xl font-semibold text-primary">No data available</h3>
      <p className="mt-2 text-sm text-slate-500">{title}</p>
    </AdminSurface>
  );
}

export function AdminReportsClient() {
  useSharedBusinessStoreVersion();

  const [tab, setTab] = useState<ReportsTab>("overview");
  const [dateRange, setDateRange] = useState<AdminReportsDateRange>("30d");
  const [typeFilter, setTypeFilter] = useState<AdminOrdersTypeFilter>("ALL");
  const [query, setQuery] = useState("");

  const snapshot = useMemo(
    () => getAdminReportsSnapshot(dateRange, typeFilter),
    [dateRange, typeFilter],
  );

  const filteredProducts = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return snapshot.products.topProducts;

    return snapshot.products.topProducts.filter((row) =>
      [row.name, row.sku].join(" ").toLowerCase().includes(normalized),
    );
  }, [query, snapshot.products.topProducts]);

  const filteredCustomers = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return snapshot.customers.topCustomers;

    return snapshot.customers.topCustomers.filter((row) =>
      [row.name, row.email].join(" ").toLowerCase().includes(normalized),
    );
  }, [query, snapshot.customers.topCustomers]);

  const filteredTechnicians = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return snapshot.technicians.rows;

    return snapshot.technicians.rows.filter((row) =>
      row.displayName.toLowerCase().includes(normalized),
    );
  }, [query, snapshot.technicians.rows]);

  return (
    <AdminPageShell>
      <AdminPageHeader
        eyebrow="Insights"
        title="Reports"
        description="Operational and revenue reporting derived from shared orders, billing, service requests, schedules, customers, and technicians."
      />

      <AdminSurface className="space-y-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap gap-2">
            <TabButton active={tab === "overview"} label="Overview" onClick={() => setTab("overview")} />
            <TabButton active={tab === "sales"} label="Sales" onClick={() => setTab("sales")} />
            <TabButton active={tab === "services"} label="Service Operations" onClick={() => setTab("services")} />
            <TabButton active={tab === "customers"} label="Customers" onClick={() => setTab("customers")} />
            <TabButton active={tab === "technicians"} label="Technicians" onClick={() => setTab("technicians")} />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Select
              value={typeFilter}
              onValueChange={(value) => setTypeFilter(value as AdminOrdersTypeFilter)}
            >
              <SelectTrigger className="h-12 w-full sm:w-40">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All</SelectItem>
                <SelectItem value="PRODUCT">Product</SelectItem>
                <SelectItem value="SERVICE">Service</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={dateRange}
              onValueChange={(value) => setDateRange(value as AdminReportsDateRange)}
            >
              <SelectTrigger className="h-12 w-full sm:w-44">
                <SelectValue placeholder="Date range" />
              </SelectTrigger>
              <SelectContent>
                {dateRangeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </AdminSurface>

      {tab === "overview" ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <AdminStatCard label="Total Revenue" value={formatCurrencyUsd(snapshot.overview.totalRevenue)} tone="success" />
            <AdminStatCard label="Product Revenue" value={formatCurrencyUsd(snapshot.overview.productRevenue)} />
            <AdminStatCard label="Service Revenue" value={formatCurrencyUsd(snapshot.overview.serviceRevenue)} tone="soft" />
            <AdminStatCard label="Total Orders" value={snapshot.overview.totalOrders} />
            <AdminStatCard label="Refund Amount" value={formatCurrencyUsd(snapshot.overview.refundAmount)} tone="warning" />
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <AdminStatCard label="Product Orders" value={snapshot.overview.productOrders} />
            <AdminStatCard label="Service Orders" value={snapshot.overview.serviceOrders} />
            <AdminStatCard label="Completed Services" value={snapshot.overview.completedServices} tone="soft" />
            <AdminStatCard label="Pending Requests" value={snapshot.overview.pendingServiceRequests} tone="warning" />
            <AdminStatCard label="Outstanding Invoices" value={snapshot.overview.outstandingInvoices} />
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.4fr_0.9fr]">
            <AdminSurface className="space-y-4">
              <SectionHeader
                icon={DollarSign}
                title="Revenue over time"
                description="Paid invoice totals only, filtered by the selected range and order type."
              />
              <div className="h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={snapshot.sales.revenueSeries}>
                    <CartesianGrid stroke="#dbeeee" strokeDasharray="3 3" />
                    <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#6b7280" }} tickLine={false} axisLine={false} />
                    <YAxis tickFormatter={(value) => `$${Number(value) / 1000}k`} tick={{ fontSize: 12, fill: "#6b7280" }} tickLine={false} axisLine={false} />
                    <Tooltip formatter={(value) => formatCurrencyUsd(Number(value ?? 0))} />
                    <Legend />
                    <Line type="monotone" dataKey="totalRevenue" stroke="#135b5d" strokeWidth={3} dot={{ r: 4 }} name="Total" />
                    <Line type="monotone" dataKey="productRevenue" stroke="#5ea6d6" strokeWidth={2} dot={{ r: 3 }} name="Product" />
                    <Line type="monotone" dataKey="serviceRevenue" stroke="#0f766e" strokeWidth={2} dot={{ r: 3 }} name="Service" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </AdminSurface>

            <AdminSurface className="space-y-4">
              <SectionHeader
                icon={ClipboardCheck}
                title="Service funnel"
                description="Request-to-completion counts based on the shared service workflow."
              />
              <div className="space-y-3">
                {snapshot.services.funnel.map((step) => (
                  <div key={step.label} className="flex items-center justify-between rounded-lg border border-teal-100 bg-slate-50 px-4 py-3">
                    <span className="text-sm font-medium text-slate-700">{step.label}</span>
                    <span className="text-lg font-semibold text-primary">{step.value}</span>
                  </div>
                ))}
              </div>
            </AdminSurface>
          </div>
        </>
      ) : null}

      {tab === "sales" ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <AdminStatCard label="Order Count" value={snapshot.sales.orderCount} />
            <AdminStatCard label="Average Order Value" value={formatCurrencyUsd(snapshot.sales.averageOrderValue)} tone="soft" />
            <AdminStatCard label="Refund Totals" value={formatCurrencyUsd(snapshot.sales.refundTotal)} tone="warning" />
            <AdminStatCard
              label="Invoice Status Mix"
              value={`${snapshot.sales.paidVsUnpaid[0]?.value ?? 0}/${snapshot.sales.paidVsUnpaid[1]?.value ?? 0}`}
              helper="Paid / unpaid invoices"
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <AdminSurface className="space-y-4">
              <SectionHeader
                icon={BarChart3}
                title="Revenue over time"
                description="Compact line chart using shared billing totals."
              />
              <div className="h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={snapshot.sales.revenueSeries}>
                    <CartesianGrid stroke="#dbeeee" strokeDasharray="3 3" />
                    <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#6b7280" }} tickLine={false} axisLine={false} />
                    <YAxis tickFormatter={(value) => `$${Number(value) / 1000}k`} tick={{ fontSize: 12, fill: "#6b7280" }} tickLine={false} axisLine={false} />
                    <Tooltip formatter={(value) => formatCurrencyUsd(Number(value ?? 0))} />
                    <Line type="monotone" dataKey="totalRevenue" stroke="#135b5d" strokeWidth={3} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </AdminSurface>

            <AdminSurface className="space-y-4">
              <SectionHeader
                icon={Package}
                title="Product vs service revenue"
                description="Bar comparison derived from the same paid invoice source."
              />
              <div className="h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={snapshot.sales.typeRevenue}>
                    <CartesianGrid stroke="#dbeeee" strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#6b7280" }} tickLine={false} axisLine={false} />
                    <YAxis tickFormatter={(value) => `$${Number(value) / 1000}k`} tick={{ fontSize: 12, fill: "#6b7280" }} tickLine={false} axisLine={false} />
                    <Tooltip formatter={(value) => formatCurrencyUsd(Number(value ?? 0))} />
                    <Bar dataKey="revenue" radius={[10, 10, 0, 0]} fill="#135b5d" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </AdminSurface>
          </div>

          <AdminSurface className="space-y-4">
            <SectionHeader
              icon={Package}
              title="Top selling products"
              description="Actual product order rows aggregated from shared product orders."
            />
            <AdminSearchInput
              value={query}
              onChange={setQuery}
              placeholder="Search product name or SKU..."
              ariaLabel="Search report products"
            />
            {filteredProducts.length ? (
              <ProductTable rows={filteredProducts} />
            ) : (
              <div className="rounded-lg border border-dashed border-teal-200 bg-slate-50 px-5 py-10 text-center text-sm text-slate-600">
                No products match the current filters.
              </div>
            )}
          </AdminSurface>
        </>
      ) : null}

      {tab === "services" ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <AdminStatCard label="Total Requests" value={snapshot.services.totalRequests} />
            <AdminStatCard label="Accepted" value={snapshot.services.acceptedRequests} tone="soft" />
            <AdminStatCard label="Rejected" value={snapshot.services.rejectedRequests} tone="warning" />
            <AdminStatCard label="Quotes Sent" value={snapshot.services.quotesSent} />
            <AdminStatCard label="Completed Services" value={snapshot.services.completedServices} tone="success" />
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <AdminStatCard label="Quotes Accepted" value={snapshot.services.quotesAccepted} />
            <AdminStatCard label="Quotes Rejected" value={snapshot.services.quotesRejected} tone="warning" />
            <AdminStatCard label="Service Revenue" value={formatCurrencyUsd(snapshot.services.serviceRevenue)} tone="soft" />
            <AdminStatCard
              label="Average Service Invoice"
              value={formatCurrencyUsd(snapshot.services.averageServiceInvoiceAmount)}
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
            <AdminSurface className="space-y-4">
              <SectionHeader
                icon={Wrench}
                title="Most requested services"
                description="Built directly from shared service request submissions."
              />
              {snapshot.services.requestLeaders.length ? (
                <div className="space-y-3">
                  {snapshot.services.requestLeaders.map((entry) => (
                    <div
                      key={entry.name}
                      className="flex items-center justify-between rounded-lg border border-teal-100 bg-white px-4 py-3"
                    >
                      <span className="font-medium text-slate-800">{entry.name}</span>
                      <span className="text-sm font-semibold text-primary">{entry.requests} requests</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-teal-200 bg-slate-50 px-5 py-10 text-center text-sm text-slate-600">
                  No service request data for the selected filters.
                </div>
              )}
            </AdminSurface>

            <AdminSurface className="space-y-4">
              <SectionHeader
                icon={CalendarRange}
                title="Service conversion steps"
                description="Simple request-to-completion counts using existing request, quote, and service-order state."
              />
              <div className="space-y-3">
                {snapshot.services.funnel.map((step, index, items) => {
                  const base = items[0]?.value ?? 0;
                  const percent = base > 0 ? Math.round((step.value / base) * 100) : 0;
                  return (
                    <div key={step.label} className="rounded-lg border border-teal-100 bg-slate-50 px-4 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-medium text-slate-800">{step.label}</span>
                        <span className="text-sm font-semibold text-primary">
                          {step.value}{index > 0 ? ` · ${percent}%` : ""}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </AdminSurface>
          </div>
        </>
      ) : null}

      {tab === "customers" ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <AdminStatCard label="Total Customers" value={snapshot.customers.totalCustomers} />
            <AdminStatCard label="New Customers" value={snapshot.customers.newCustomers} />
            <AdminStatCard label="With Product Orders" value={snapshot.customers.customersWithProductOrders} tone="soft" />
            <AdminStatCard label="With Service Orders" value={snapshot.customers.customersWithServiceOrders} tone="soft" />
            <AdminStatCard label="Repeat Customers" value={snapshot.customers.repeatCustomers} tone="success" />
          </div>

          <AdminSurface className="space-y-4">
            <SectionHeader
              icon={UserRound}
              title="Top customers by total spend"
              description="Customer totals derived from paid invoices and linked orders."
            />
            <AdminSearchInput
              value={query}
              onChange={setQuery}
              placeholder="Search customer name or email..."
              ariaLabel="Search report customers"
            />
            {filteredCustomers.length ? (
              <CustomerTable rows={filteredCustomers} />
            ) : (
              <div className="rounded-lg border border-dashed border-teal-200 bg-slate-50 px-5 py-10 text-center text-sm text-slate-600">
                No customers match the current filters.
              </div>
            )}
          </AdminSurface>
        </>
      ) : null}

      {tab === "technicians" ? (
        <>
          {typeFilter === "PRODUCT" ? (
            <EmptySection title="Technician reporting applies to service activity only. Switch the type filter to Service or All." />
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                <AdminStatCard label="Total Technicians" value={snapshot.technicians.totalTechnicians} />
                <AdminStatCard label="Active Technicians" value={snapshot.technicians.activeTechnicians} tone="soft" />
                <AdminStatCard label="Assigned Jobs" value={snapshot.technicians.assignedJobs} />
                <AdminStatCard label="Completed Jobs" value={snapshot.technicians.completedJobs} tone="success" />
                <AdminStatCard label="Upcoming Jobs" value={snapshot.technicians.upcomingJobs} tone="warning" />
              </div>

              <AdminSurface className="space-y-4">
                <SectionHeader
                  icon={Wrench}
                  title="Technician workload"
                  description="Assignments and completion rates derived from shared service orders and schedule records."
                />
                <AdminSearchInput
                  value={query}
                  onChange={setQuery}
                  placeholder="Search technician name..."
                  ariaLabel="Search report technicians"
                />
                {filteredTechnicians.length ? (
                  <TechnicianTable rows={filteredTechnicians} />
                ) : (
                  <div className="rounded-lg border border-dashed border-teal-200 bg-slate-50 px-5 py-10 text-center text-sm text-slate-600">
                    No technicians match the current filters.
                  </div>
                )}
              </AdminSurface>
            </>
          )}
        </>
      ) : null}
    </AdminPageShell>
  );
}

function ProductTable({ rows }: { rows: AdminProductReportRow[] }) {
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[760px] overflow-hidden rounded-lg border border-teal-100">
        <div className="grid grid-cols-[1.4fr_0.8fr_0.7fr_0.8fr_0.9fr_0.8fr] bg-teal-50/60 px-4 py-3 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
          <span>Product</span>
          <span>SKU</span>
          <span>Orders</span>
          <span>Units Sold</span>
          <span>Revenue</span>
          <span>Refunds</span>
        </div>
        <div className="divide-y divide-teal-100 bg-white">
          {rows.map((row) => (
            <div key={row.productId} className="grid grid-cols-[1.4fr_0.8fr_0.7fr_0.8fr_0.9fr_0.8fr] items-center gap-4 px-4 py-4 text-sm text-slate-700">
              <span className="font-medium text-slate-900">{row.name}</span>
              <span>{row.sku || "—"}</span>
              <span>{row.orders}</span>
              <span>{row.unitsSold}</span>
              <span className="font-semibold text-primary">{formatCurrencyUsd(row.revenue)}</span>
              <span>{formatCurrencyUsd(row.refunds)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CustomerTable({ rows }: { rows: AdminCustomerReportRow[] }) {
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[820px] overflow-hidden rounded-lg border border-teal-100">
        <div className="grid grid-cols-[1.3fr_0.8fr_0.8fr_0.9fr_1fr] bg-teal-50/60 px-4 py-3 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
          <span>Customer</span>
          <span>Product Orders</span>
          <span>Service Orders</span>
          <span>Total Spend</span>
          <span>Last Activity</span>
        </div>
        <div className="divide-y divide-teal-100 bg-white">
          {rows.map((row) => (
            <div key={row.customerId} className="grid grid-cols-[1.3fr_0.8fr_0.8fr_0.9fr_1fr] items-center gap-4 px-4 py-4 text-sm text-slate-700">
              <div>
                <Link href={`/admin/customers/${row.customerId}`} className="font-medium text-slate-900 hover:text-primary">
                  {row.name}
                </Link>
                <p className="mt-1 text-xs text-slate-500">{row.email}</p>
              </div>
              <span>{row.productOrders}</span>
              <span>{row.serviceOrders}</span>
              <span className="font-semibold text-primary">{formatCurrencyUsd(row.totalSpend)}</span>
              <span>{row.lastActivity ? formatShortDate(row.lastActivity) : "—"}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TechnicianTable({ rows }: { rows: AdminTechnicianReportRow[] }) {
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[820px] overflow-hidden rounded-lg border border-teal-100">
        <div className="grid grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr_0.9fr_0.8fr] bg-teal-50/60 px-4 py-3 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
          <span>Technician</span>
          <span>Assigned</span>
          <span>Completed</span>
          <span>Cancelled</span>
          <span>Upcoming</span>
          <span>Completion Rate</span>
        </div>
        <div className="divide-y divide-teal-100 bg-white">
          {rows.map((row) => (
            <div key={row.technicianId} className="grid grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr_0.9fr_0.8fr] items-center gap-4 px-4 py-4 text-sm text-slate-700">
              <Link href={`/admin/technicians/${row.technicianId}`} className="font-medium text-slate-900 hover:text-primary">
                {row.displayName}
              </Link>
              <span>{row.assignedJobs}</span>
              <span>{row.completedJobs}</span>
              <span>{row.cancelledJobs}</span>
              <span>{row.upcomingJobs}</span>
              <span className="font-semibold text-primary">{row.completionRate}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
