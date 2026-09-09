"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  ClipboardCheck,
  DollarSign,
  Info,
  Loader2,
  Package,
  Star,
  UserRound,
  Wrench,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
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
import { ExportReportMenu } from "@/components/admin/reports/ExportReportMenu";
import { StatusBadge } from "@/components/customer-portal/StatusBadge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { toStatusSlug } from "@/lib/customer-orders";
import { formatCurrencyUsd, formatShortDate } from "@/lib/formatters";
import {
  useGetCustomersReportQuery,
  useGetOverviewReportQuery,
  useGetSalesReportQuery,
  useGetServiceOperationsReportQuery,
  useGetTechniciansReportQuery,
  type OverviewReportDto,
  type ReportOrderType,
  type ReportPeriod,
  type SalesReportDto,
  type ServiceOperationsReportDto,
  type TechnicianReportRow,
} from "@/redux/api/reportsApi";
import type { AdminRequestRow } from "@/redux/api/dashboardApi";

/**
 * Admin reporting. Each tab maps to exactly one `/reports/*` endpoint, and the
 * filters shown are only the ones that endpoint actually accepts — the
 * technicians and customers reports take no parameters, so the range selector
 * is hidden there rather than silently doing nothing.
 */

type ReportsTab =
  | "overview"
  | "sales"
  | "services"
  | "customers"
  | "technicians";

/** Only the periods the API accepts. */
const PERIOD_OPTIONS: Array<{ label: string; value: ReportPeriod }> = [
  { label: "Last 7 Days", value: "7d" },
  { label: "Last 30 Days", value: "30d" },
  { label: "Last 90 Days", value: "90d" },
  { label: "Last 12 Months", value: "1y" },
];

const TABS: Array<{ label: string; value: ReportsTab }> = [
  { label: "Overview", value: "overview" },
  { label: "Sales", value: "sales" },
  { label: "Service Operations", value: "services" },
  { label: "Customers", value: "customers" },
  { label: "Technicians", value: "technicians" },
];

/** Tabs whose endpoint accepts a date range. */
const RANGED_TABS: ReportsTab[] = ["overview", "sales", "services"];

const SLICE_COLORS = [
  "#135b5d",
  "#0f766e",
  "#2E6162",
  "#5ea6d6",
  "#0d9488",
  "#94a3b8",
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
    <Button
      aria-pressed={active}
      className={
        active
          ? "h-9 rounded-md bg-teal-700 px-4 text-xs font-medium text-white shadow-xs hover:bg-teal-800 sm:text-sm"
          : "h-9 rounded-md border-slate-200/80 px-4 text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 sm:text-sm"
      }
      onClick={onClick}
      size="sm"
      variant={active ? "default" : "outline"}
    >
      {label}
    </Button>
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
      <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-800">
        <Icon size={20} />
      </div>
      <div className="min-w-0">
        <h2 className="text-xl font-semibold tracking-[-0.03em] text-primary">
          {title}
        </h2>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
    </div>
  );
}

/** Explains a data caveat inline rather than letting a chart mislead. */
function Caveat({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-start gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs leading-relaxed text-slate-600">
      <Info className="mt-0.5 shrink-0 text-slate-400" size={13} />
      <span>{children}</span>
    </p>
  );
}

function ChartFrame({
  ready,
  isEmpty,
  emptyTitle,
  emptyDescription,
  emptyIcon,
  children,
}: {
  ready: boolean;
  isEmpty: boolean;
  emptyTitle: string;
  emptyDescription: string;
  emptyIcon: typeof BarChart3;
  children: React.ReactNode;
}) {
  if (isEmpty) {
    return (
      <div className="flex h-[320px] items-center justify-center">
        <EmptyState
          className="py-6"
          description={emptyDescription}
          icon={emptyIcon}
          title={emptyTitle}
          tone="minimal"
        />
      </div>
    );
  }

  return (
    <div className="h-[320px] w-full">
      {ready ? (
        <ResponsiveContainer height="100%" width="100%">
          {children as React.ReactElement}
        </ResponsiveContainer>
      ) : (
        <div className="h-full w-full animate-pulse rounded-lg bg-slate-100" />
      )}
    </div>
  );
}

function LoadingPanel({ label }: { label: string }) {
  return (
    <AdminSurface className="flex flex-col items-center justify-center py-20 text-teal-700">
      <Loader2 className="animate-spin text-teal-600" size={26} />
      <span className="mt-3 text-sm font-medium text-slate-700">{label}</span>
    </AdminSurface>
  );
}

function ErrorPanel({ onRetry }: { onRetry: () => void }) {
  return (
    <EmptyState
      action={{ label: "Try Again", onClick: onRetry }}
      className="py-16"
      description="We couldn't load this report just now. Please try again in a moment."
      icon={AlertTriangle}
      title="Report unavailable"
      tone="card"
    />
  );
}

export function AdminReportsClient() {
  const [tab, setTab] = useState<ReportsTab>("overview");
  const [period, setPeriod] = useState<ReportPeriod>("30d");
  const [orderType, setOrderType] = useState<ReportOrderType>("ALL");
  const [query, setQuery] = useState("");
  const [chartsReady, setChartsReady] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setChartsReady(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  // Each report is only fetched while its tab is open.
  const overview = useGetOverviewReportQuery(
    { period, orderType },
    { skip: tab !== "overview" },
  );
  const sales = useGetSalesReportQuery({ period }, { skip: tab !== "sales" });
  const services = useGetServiceOperationsReportQuery(
    { period },
    { skip: tab !== "services" },
  );
  // These two accept no parameters at all.
  const technicians = useGetTechniciansReportQuery(undefined, {
    skip: tab !== "technicians",
  });
  const customers = useGetCustomersReportQuery(undefined, {
    skip: tab !== "customers",
  });

  const filteredTechnicians = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const rows = technicians.data ?? [];
    if (!normalized) return rows;
    return rows.filter((row) =>
      row.displayName.toLowerCase().includes(normalized),
    );
  }, [query, technicians.data]);

  const showRange = RANGED_TABS.includes(tab);
  const activeRange =
    overview.data?.dateRange ?? sales.data?.dateRange ?? services.data?.dateRange;

  return (
    <AdminPageShell>
      <AdminPageHeader
        action={<ExportReportMenu period={period} />}
        description="Revenue, sales, service operations, technician performance, and customer reporting."
        eyebrow="Insights"
        title="Reports"
      />

      <AdminSurface className="space-y-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap gap-2">
            {TABS.map((entry) => (
              <TabButton
                active={tab === entry.value}
                key={entry.value}
                label={entry.label}
                onClick={() => {
                  setTab(entry.value);
                  setQuery("");
                }}
              />
            ))}
          </div>

          {showRange ? (
            <div className="flex flex-col gap-3 sm:flex-row">
              {/* `orderType` is accepted by the overview report only. */}
              {tab === "overview" ? (
                <Select
                  onValueChange={(value) =>
                    setOrderType(value as ReportOrderType)
                  }
                  value={orderType}
                >
                  <SelectTrigger className="h-10 w-full sm:w-40">
                    <SelectValue placeholder="Order type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Types</SelectItem>
                    <SelectItem value="PRODUCT">Product</SelectItem>
                    <SelectItem value="SERVICE">Service</SelectItem>
                  </SelectContent>
                </Select>
              ) : null}

              <Select
                onValueChange={(value) => setPeriod(value as ReportPeriod)}
                value={period}
              >
                <SelectTrigger className="h-10 w-full sm:w-44">
                  <SelectValue placeholder="Date range" />
                </SelectTrigger>
                <SelectContent>
                  {PERIOD_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <p className="text-xs font-medium text-slate-500">
              This report covers all time and has no date filter.
            </p>
          )}
        </div>

        {showRange && activeRange?.from ? (
          <p className="text-xs text-slate-500">
            Showing{" "}
            <span className="font-semibold text-slate-700">
              {formatShortDate(activeRange.from)} – {formatShortDate(activeRange.to)}
            </span>
            {activeRange.orderType && activeRange.orderType !== "ALL"
              ? ` · ${activeRange.orderType.toLowerCase()} orders only`
              : ""}
          </p>
        ) : null}
      </AdminSurface>

      {tab === "overview" ? (
        overview.isLoading ? (
          <LoadingPanel label="Loading overview..." />
        ) : overview.isError || !overview.data ? (
          <ErrorPanel onRetry={() => void overview.refetch()} />
        ) : (
          <OverviewTab
            chartsReady={chartsReady}
            data={overview.data}
            period={period}
          />
        )
      ) : null}

      {tab === "sales" ? (
        sales.isLoading ? (
          <LoadingPanel label="Loading sales report..." />
        ) : sales.isError || !sales.data ? (
          <ErrorPanel onRetry={() => void sales.refetch()} />
        ) : (
          <SalesTab chartsReady={chartsReady} data={sales.data} />
        )
      ) : null}

      {tab === "services" ? (
        services.isLoading ? (
          <LoadingPanel label="Loading service operations..." />
        ) : services.isError || !services.data ? (
          <ErrorPanel onRetry={() => void services.refetch()} />
        ) : (
          <ServicesTab chartsReady={chartsReady} data={services.data} />
        )
      ) : null}

      {tab === "customers" ? (
        customers.isLoading ? (
          <LoadingPanel label="Loading customer report..." />
        ) : customers.isError || !customers.data ? (
          <ErrorPanel onRetry={() => void customers.refetch()} />
        ) : (
          <div className="grid gap-3 sm:grid-cols-3">
            <AdminStatCard
              label="Total Customers"
              value={customers.data.totalCustomers}
            />
            <AdminStatCard
              label="Active Customers"
              tone="success"
              value={customers.data.activeCustomers}
            />
            <AdminStatCard
              helper="Customers who ordered more than once"
              label="Repeat Rate"
              tone="soft"
              value={`${customers.data.repeatRatePercentage.toFixed(1)}%`}
            />
          </div>
        )
      ) : null}

      {tab === "technicians" ? (
        technicians.isLoading ? (
          <LoadingPanel label="Loading technician report..." />
        ) : technicians.isError || !technicians.data ? (
          <ErrorPanel onRetry={() => void technicians.refetch()} />
        ) : (
          <TechniciansTab
            allCount={technicians.data.length}
            onQueryChange={setQuery}
            query={query}
            rows={filteredTechnicians}
          />
        )
      ) : null}
    </AdminPageShell>
  );
}

/* -------------------------------------------------------------------------- */
/* Overview                                                                   */
/* -------------------------------------------------------------------------- */

function OverviewTab({
  data,
  chartsReady,
  period,
}: {
  data: OverviewReportDto;
  chartsReady: boolean;
  period: ReportPeriod;
}) {
  const { metrics, revenueOverTime, serviceFunnel, awaitingQuotation } = data;

  const funnelSteps = [
    { label: "Requested", value: serviceFunnel.requested },
    { label: "Accepted", value: serviceFunnel.accepted },
    { label: "Quoted", value: serviceFunnel.quoted },
    { label: "Quote Accepted", value: serviceFunnel.quoteAccepted },
    { label: "Service Order", value: serviceFunnel.serviceOrder },
    { label: "Completed", value: serviceFunnel.completed },
  ];
  const funnelTop = Math.max(1, serviceFunnel.requested);
  const hasRevenue = revenueOverTime.some((point) => point.totalRevenue > 0);
  const periodLabel =
    PERIOD_OPTIONS.find((option) => option.value === period)?.label ?? "range";

  return (
    <>
      <AdminSurface className="space-y-4">
        <SectionHeader
          description={`Revenue figures below follow the selected range (${periodLabel.toLowerCase()}).`}
          icon={DollarSign}
          title="Revenue"
        />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <AdminStatCard
            label="Total Revenue"
            tone="success"
            value={formatCurrencyUsd(metrics.totalRevenue)}
          />
          <AdminStatCard
            label="Product Revenue"
            value={formatCurrencyUsd(metrics.productRevenue)}
          />
          <AdminStatCard
            label="Service Revenue"
            tone="soft"
            value={formatCurrencyUsd(metrics.serviceRevenue)}
          />
          <AdminStatCard
            label="Refunds"
            tone="warning"
            value={formatCurrencyUsd(metrics.refundAmount)}
          />
        </div>
      </AdminSurface>

      <AdminSurface className="space-y-4">
        <SectionHeader
          description="Lifetime totals across the whole business — these are not limited to the selected range."
          icon={ClipboardCheck}
          title="Volume (all time)"
        />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <AdminStatCard label="Total Orders" value={metrics.totalOrders} />
          <AdminStatCard
            label="Product Orders"
            value={metrics.productOrdersCount}
          />
          <AdminStatCard
            label="Service Orders"
            value={metrics.serviceOrdersCount}
          />
          <AdminStatCard
            label="Completed Services"
            tone="success"
            value={metrics.completedServicesCount}
          />
          <AdminStatCard
            label="Pending Requests"
            tone="warning"
            value={metrics.pendingRequestsCount}
          />
          <AdminStatCard
            label="Outstanding Invoices"
            value={metrics.outstandingInvoicesCount}
          />
        </div>
      </AdminSurface>

      <div className="grid gap-4 xl:grid-cols-[1.4fr_0.9fr]">
        <AdminSurface className="space-y-4">
          <SectionHeader
            description="Daily paid revenue, split by product and service."
            icon={DollarSign}
            title="Revenue over time"
          />
          {/*
            This series is a fixed 14 daily points regardless of the selected
            range, so saying "last 14 days" is the only honest label. Monthly
            trend lives on the dashboard's own 6-month series.
          */}
          <Caveat>
            This chart always shows the <strong>last 14 days</strong> and does
            not follow the range selector. For a monthly view, see the{" "}
            <Link className="font-semibold text-teal-700 hover:underline" href="/admin">
              dashboard revenue trend
            </Link>
            .
          </Caveat>
          <ChartFrame
            emptyDescription="Paid invoices from the last 14 days will chart here."
            emptyIcon={DollarSign}
            emptyTitle="No revenue in the last 14 days"
            isEmpty={!hasRevenue}
            ready={chartsReady}
          >
            <LineChart data={revenueOverTime}>
              <CartesianGrid stroke="#dbeeee" strokeDasharray="3 3" />
              <XAxis
                axisLine={false}
                dataKey="date"
                tick={{ fontSize: 11, fill: "#6b7280" }}
                tickFormatter={(value) => formatShortDate(String(value))}
                tickLine={false}
              />
              <YAxis
                axisLine={false}
                tick={{ fontSize: 12, fill: "#6b7280" }}
                tickFormatter={(value) => `$${Number(value) / 1000}k`}
                tickLine={false}
              />
              <Tooltip
                formatter={(value) => formatCurrencyUsd(Number(value ?? 0))}
                labelFormatter={(label) => formatShortDate(String(label))}
              />
              <Legend />
              <Line
                dataKey="totalRevenue"
                dot={{ r: 3 }}
                name="Total"
                stroke="#135b5d"
                strokeWidth={3}
                type="monotone"
              />
              <Line
                dataKey="productRevenue"
                dot={false}
                name="Product"
                stroke="#5ea6d6"
                strokeWidth={2}
                type="monotone"
              />
              <Line
                dataKey="serviceRevenue"
                dot={false}
                name="Service"
                stroke="#0f766e"
                strokeWidth={2}
                type="monotone"
              />
            </LineChart>
          </ChartFrame>
        </AdminSurface>

        <AdminSurface className="space-y-4">
          <SectionHeader
            description="Request through completion, at each stage of the service workflow."
            icon={ClipboardCheck}
            title="Service funnel"
          />
          <div className="space-y-2.5">
            {funnelSteps.map((step) => (
              <div key={step.label}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-700">
                    {step.label}
                  </span>
                  <span className="font-semibold tabular-nums text-primary">
                    {step.value}
                  </span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-teal-600"
                    style={{
                      width: `${Math.min(100, (step.value / funnelTop) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </AdminSurface>
      </div>

      <AdminSurface className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <SectionHeader
            description="Requests with no quotation yet — customers are waiting on pricing."
            icon={AlertTriangle}
            title={`Awaiting quotation (${awaitingQuotation.totalCount})`}
          />
          <Button asChild size="sm" variant="outline">
            <Link href="/admin/service-requests">Open Requests</Link>
          </Button>
        </div>
        {awaitingQuotation.items.length === 0 ? (
          <EmptyState
            className="py-10"
            description="Every service request has been quoted."
            icon={ClipboardCheck}
            title="Nothing awaiting a quote"
            tone="minimal"
          />
        ) : (
          <RequestList items={awaitingQuotation.items} />
        )}
      </AdminSurface>
    </>
  );
}

function RequestList({ items }: { items: AdminRequestRow[] }) {
  return (
    <div className="space-y-2.5">
      {items.map((request) => (
        <div
          className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-teal-100 bg-white px-4 py-3"
          key={request.id}
        >
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                className="font-semibold text-teal-800 hover:underline"
                href={`/admin/service-requests/${request.id}`}
              >
                {request.businessId || request.title}
              </Link>
              <StatusBadge status={toStatusSlug(request.status)} />
              {request.urgency ? (
                <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-700">
                  {request.urgency}
                </span>
              ) : null}
            </div>
            <p className="mt-0.5 truncate text-xs text-slate-500">
              {[request.customerName, request.serviceName]
                .filter(Boolean)
                .join(" · ") || "No customer recorded"}
            </p>
          </div>
          <div className="text-right text-xs">
            <p className="font-medium text-slate-600">
              {request.submittedAt
                ? formatShortDate(request.submittedAt)
                : "No date"}
            </p>
            {Number(request.estimatedAmountUsd) > 0 ? (
              <p className="font-semibold tabular-nums text-slate-900">
                Est. {formatCurrencyUsd(Number(request.estimatedAmountUsd))}
              </p>
            ) : (
              <p className="italic text-slate-400">No estimate</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Sales                                                                      */
/* -------------------------------------------------------------------------- */

function SalesTab({
  data,
  chartsReady,
}: {
  data: SalesReportDto;
  chartsReady: boolean;
}) {
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-3">
        <AdminStatCard
          label="Total Sales"
          tone="success"
          value={formatCurrencyUsd(data.totalSalesUsd)}
        />
        <AdminStatCard
          label="Average Order Value"
          tone="soft"
          value={formatCurrencyUsd(data.averageOrderValueUsd)}
        />
        <AdminStatCard
          label="Product Orders"
          value={data.totalProductOrders}
        />
      </div>

      <AdminSurface className="space-y-4">
        <SectionHeader
          description="The five products earning the most revenue in the selected range."
          icon={Package}
          title="Top products by revenue"
        />
        <ChartFrame
          emptyDescription="Product sales in this range will chart here."
          emptyIcon={Package}
          emptyTitle="No product sales in this range"
          isEmpty={data.topProducts.length === 0}
          ready={chartsReady}
        >
          <BarChart data={data.topProducts} layout="vertical">
            <CartesianGrid stroke="#dbeeee" strokeDasharray="3 3" />
            <XAxis
              axisLine={false}
              tick={{ fontSize: 12, fill: "#6b7280" }}
              tickFormatter={(value) => `$${Number(value) / 1000}k`}
              tickLine={false}
              type="number"
            />
            <YAxis
              axisLine={false}
              dataKey="name"
              tick={{ fontSize: 11, fill: "#6b7280" }}
              tickLine={false}
              type="category"
              width={150}
            />
            <Tooltip
              formatter={(value) => [
                formatCurrencyUsd(Number(value ?? 0)),
                "Revenue",
              ]}
            />
            <Bar dataKey="revenue" fill="#135b5d" radius={[0, 8, 8, 0]} />
          </BarChart>
        </ChartFrame>

        {data.topProducts.length > 0 ? (
          <div className="overflow-x-auto rounded-lg border border-teal-100">
            <table className="w-full text-left text-sm">
              <thead className="bg-teal-50/60 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3 text-right">Units Sold</th>
                  <th className="px-4 py-3 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-teal-100">
                {data.topProducts.map((row) => (
                  <tr key={row.productId || row.name}>
                    <td className="px-4 py-3">
                      {row.productId ? (
                        <Link
                          className="font-medium text-teal-800 hover:underline"
                          href={`/admin/products/${row.productId}/edit`}
                        >
                          {row.name}
                        </Link>
                      ) : (
                        <span className="font-medium text-slate-900">
                          {row.name}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-700">
                      {row.quantity}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums text-slate-900">
                      {formatCurrencyUsd(row.revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </AdminSurface>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Service operations                                                         */
/* -------------------------------------------------------------------------- */

function ServicesTab({
  data,
  chartsReady,
}: {
  data: ServiceOperationsReportDto;
  chartsReady: boolean;
}) {
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        <AdminStatCard label="Total Requests" value={data.totalRequests} />
        <AdminStatCard
          helper="Distinct services requested in this range"
          label="Services Requested"
          tone="soft"
          value={data.topServices.length}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <AdminSurface className="space-y-4">
          <SectionHeader
            description="Share of requests by service, as computed by the server."
            icon={Wrench}
            title="Request mix"
          />
          <ChartFrame
            emptyDescription="Service requests in this range will chart here."
            emptyIcon={Wrench}
            emptyTitle="No service requests in this range"
            isEmpty={data.topServices.length === 0}
            ready={chartsReady}
          >
            <PieChart>
              <Pie
                data={data.topServices}
                dataKey="count"
                innerRadius={55}
                nameKey="serviceName"
                outerRadius={95}
                paddingAngle={2}
              >
                {data.topServices.map((slice, index) => (
                  <Cell
                    fill={SLICE_COLORS[index % SLICE_COLORS.length]}
                    key={slice.serviceId || index}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, name, item) => {
                  const slice = item?.payload as
                    | { percentage?: number }
                    | undefined;
                  return [
                    `${value} (${(slice?.percentage ?? 0).toFixed(1)}%)`,
                    name,
                  ];
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ChartFrame>
        </AdminSurface>

        <AdminSurface className="space-y-4">
          <SectionHeader
            description="Most requested services, with their server-computed share."
            icon={BarChart3}
            title="Most requested services"
          />
          {data.topServices.length === 0 ? (
            <EmptyState
              className="py-10"
              description="Service requests will be ranked here once they come in."
              icon={Wrench}
              title="No services requested yet"
              tone="minimal"
            />
          ) : (
            <div className="space-y-3">
              {data.topServices.map((service) => (
                <div key={service.serviceId || service.serviceName}>
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="min-w-0 truncate font-medium text-slate-800">
                      {service.serviceName}
                      {service.category ? (
                        <span className="ml-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                          {service.category}
                        </span>
                      ) : null}
                    </span>
                    <span className="shrink-0 font-semibold tabular-nums text-primary">
                      {service.count} · {service.percentage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-teal-600"
                      style={{
                        width: `${Math.min(100, service.percentage)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </AdminSurface>
      </div>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Technicians                                                                */
/* -------------------------------------------------------------------------- */

function TechniciansTab({
  rows,
  allCount,
  query,
  onQueryChange,
}: {
  rows: TechnicianReportRow[];
  allCount: number;
  query: string;
  onQueryChange: (value: string) => void;
}) {
  const totals = useMemo(
    () =>
      rows.reduce(
        (acc, row) => ({
          completed: acc.completed + row.completedJobs,
          assigned: acc.assigned + row.assignedJobsCount,
          reports: acc.reports + row.serviceReportsCount,
        }),
        { completed: 0, assigned: 0, reports: 0 },
      ),
    [rows],
  );

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard label="Technicians" value={allCount} />
        <AdminStatCard
          label="Completed Jobs"
          tone="success"
          value={totals.completed}
        />
        <AdminStatCard label="Currently Assigned" value={totals.assigned} />
        <AdminStatCard
          label="Service Reports Filed"
          tone="soft"
          value={totals.reports}
        />
      </div>

      <AdminSurface className="space-y-4">
        <SectionHeader
          description="Job completion and reporting volume per technician."
          icon={UserRound}
          title="Technician performance"
        />
        <AdminSearchInput
          ariaLabel="Search technicians"
          onChange={onQueryChange}
          placeholder="Search technician name..."
          value={query}
        />
        {rows.length === 0 ? (
          <EmptyState
            action={
              query
                ? { label: "Clear Search", onClick: () => onQueryChange("") }
                : undefined
            }
            className="py-10"
            description={
              query
                ? `No technician matched "${query}".`
                : "Technician performance appears here once jobs are assigned."
            }
            icon={UserRound}
            title={query ? "No matching technicians" : "No technicians yet"}
            tone="minimal"
          />
        ) : (
          <div className="overflow-x-auto rounded-lg border border-teal-100">
            <table className="w-full text-left text-sm">
              <thead className="bg-teal-50/60 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3">Technician</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Rating</th>
                  <th className="px-4 py-3 text-right">Completed</th>
                  <th className="px-4 py-3 text-right">Assigned</th>
                  <th className="px-4 py-3 text-right">Reports</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-teal-100">
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td className="px-4 py-3">
                      <Link
                        className="font-medium text-teal-800 hover:underline"
                        href={`/admin/technicians/${row.id}`}
                      >
                        {row.displayName}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={toStatusSlug(row.status)} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      {row.rating > 0 ? (
                        <span className="inline-flex items-center gap-1 font-semibold tabular-nums text-slate-900">
                          <Star
                            className="fill-amber-400 text-amber-500"
                            size={13}
                          />
                          {row.rating.toFixed(1)}
                        </span>
                      ) : (
                        <span className="italic text-slate-400">Unrated</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-700">
                      {row.completedJobs}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-700">
                      {row.assignedJobsCount}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-700">
                      {row.serviceReportsCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminSurface>
    </>
  );
}
