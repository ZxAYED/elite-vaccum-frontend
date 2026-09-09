"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  DollarSign,
  FileText,
  Loader2,
  TrendingDown,
  TrendingUp,
  Users,
  Wrench,
} from "lucide-react";
import {
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

import styles from "./adminDashboard.module.css";
import { StatusBadge } from "@/components/customer-portal/StatusBadge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { toStatusSlug } from "@/lib/customer-orders";
import { formatCurrencyUsd, formatShortDate } from "@/lib/formatters";
import {
  useGetAdminDashboardQuery,
  type AdminRequestRow,
} from "@/redux/api/dashboardApi";

/**
 * Admin overview, driven entirely by `GET /dashboard` — one cached request
 * backs every card, chart and list here.
 */

/** Donut colours, applied by index so the server owns the data and we own the palette. */
const SLICE_COLORS = [
  "#135b5d",
  "#0f766e",
  "#2E6162",
  "#5ea6d6",
  "#0d9488",
  "#94a3b8",
];

export default function AdminDashboardPage() {
  const [chartsReady, setChartsReady] = useState(false);
  const { data, isLoading, isError, refetch } = useGetAdminDashboardQuery();

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setChartsReady(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-teal-100 bg-white py-24 text-teal-700 shadow-xs">
        <Loader2 className="animate-spin text-teal-600" size={28} />
        <span className="mt-3 text-sm font-medium text-slate-700">
          Loading dashboard...
        </span>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <EmptyState
        action={{ label: "Try Again", onClick: () => void refetch() }}
        className="py-20"
        description="We couldn't load the dashboard just now. Please try again in a moment."
        icon={AlertTriangle}
        title="Dashboard unavailable"
        tone="card"
      />
    );
  }

  const { metrics, revenueTrend, serviceDistribution, recentRequests } = data;
  const growth = metrics.revenueGrowthPercent;

  const statCards = [
    {
      label: "Six-Month Revenue",
      value: formatCurrencyUsd(metrics.sixMonthRevenueUsd),
      // Compares the last 6 months against the 6 before them.
      trend: `${growth >= 0 ? "+" : ""}${growth.toFixed(1)}% vs prior 6 months`,
      icon: DollarSign,
      negative: growth < 0,
    },
    {
      label: "Tracked Orders",
      value: String(metrics.trackedOrders),
      trend: `${metrics.scheduledVisits} scheduled visit${metrics.scheduledVisits === 1 ? "" : "s"}`,
      icon: FileText,
    },
    {
      label: "Active Technicians",
      value: String(metrics.activeTechnicians),
      trend: `${metrics.offlineTechnicians} currently offline`,
      icon: Wrench,
    },
    {
      label: "Active Customers",
      value: String(metrics.activeCustomers),
      trend: "Customer accounts in portal",
      icon: Users,
    },
    {
      label: "Pending Review",
      value: String(metrics.pendingReview),
      trend: "Needs admin attention",
      icon: ClipboardList,
    },
    {
      label: "Confirmed Work",
      value: String(metrics.confirmedWork),
      trend: "Ready for service delivery",
      icon: CheckCircle2,
    },
  ];

  const hasRevenue = revenueTrend.some((point) => point.totalRevenue > 0);

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Dashboard Overview</h1>
        <p className={styles.pageSubtitle}>
          Revenue, service activity, and upcoming workload across the business.
        </p>
      </div>

      <div className={styles.statsGrid}>
        {statCards.map((card) => {
          const Icon = card.icon;
          const TrendIcon = card.negative ? TrendingDown : TrendingUp;

          return (
            <div className={styles.statCard} key={card.label}>
              <div className={styles.statCardHeader}>
                <span className={styles.statCardLabel}>{card.label}</span>
                <div className={styles.statCardIcon}>
                  <Icon size={18} />
                </div>
              </div>
              <div className={styles.statCardValue}>{card.value}</div>
              <div
                className={styles.statCardTrend}
                style={card.negative ? { color: "#b91c1c" } : undefined}
              >
                <TrendIcon size={14} />
                <span>{card.trend}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Awaiting quotation is the one metric with a queue behind it. */}
      {metrics.awaitingQuotation > 0 ? (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50/80 px-5 py-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 shrink-0 text-amber-600" size={20} />
            <div>
              <p className="text-sm font-bold text-amber-900">
                {metrics.awaitingQuotation} request
                {metrics.awaitingQuotation === 1 ? "" : "s"} awaiting quotation
              </p>
              <p className="mt-0.5 text-xs text-amber-800">
                Customers are waiting on pricing before work can be scheduled.
              </p>
            </div>
          </div>
          <Button asChild size="sm" variant="outline">
            <Link href="/admin/service-requests">Review Requests</Link>
          </Button>
        </div>
      ) : null}

      <div className={styles.chartsGrid}>
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Revenue Overview</h3>
          <div className={styles.chartContainer}>
            {/*
              `revenueTrend` is always exactly 6 pre-seeded buckets, so an
              empty month plots as 0 rather than collapsing the axis.
            */}
            {!hasRevenue ? (
              <EmptyState
                className="py-8"
                description="Paid invoices will chart here across the last six months."
                icon={DollarSign}
                title="No revenue recorded yet"
                tone="minimal"
              />
            ) : chartsReady ? (
              <ResponsiveContainer
                height="100%"
                minHeight={260}
                minWidth={0}
                width="100%"
              >
                <LineChart data={revenueTrend}>
                  <CartesianGrid stroke="#f0f0f0" strokeDasharray="3 3" />
                  <XAxis
                    axisLine={{ stroke: "#e5e7eb" }}
                    dataKey="label"
                    tick={{ fontSize: 12, fill: "#6b7280" }}
                    tickLine={false}
                  />
                  <YAxis
                    axisLine={{ stroke: "#e5e7eb" }}
                    tick={{ fontSize: 12, fill: "#6b7280" }}
                    tickFormatter={(value) => `$${Number(value) / 1000}k`}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 8,
                      border: "1px solid #e5e7eb",
                      fontSize: 13,
                    }}
                    formatter={(value: number | string | undefined) =>
                      formatCurrencyUsd(Number(value))
                    }
                  />
                  <Legend />
                  <Line
                    activeDot={{ r: 6 }}
                    dataKey="totalRevenue"
                    dot={{ r: 4, fill: "#135b5d", stroke: "#fff", strokeWidth: 2 }}
                    name="Total"
                    stroke="#135b5d"
                    strokeWidth={3}
                    type="monotone"
                  />
                  <Line
                    dataKey="productRevenue"
                    dot={{ r: 3 }}
                    name="Product"
                    stroke="#5ea6d6"
                    strokeWidth={2}
                    type="monotone"
                  />
                  <Line
                    dataKey="serviceRevenue"
                    dot={{ r: 3 }}
                    name="Service"
                    stroke="#0f766e"
                    strokeWidth={2}
                    type="monotone"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : null}
          </div>
        </div>

        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Service Distribution</h3>
          <div className={styles.chartContainer}>
            {serviceDistribution.length === 0 ? (
              <EmptyState
                className="py-8"
                description="Once service requests come in, their mix appears here."
                icon={Wrench}
                title="No services requested yet"
                tone="minimal"
              />
            ) : chartsReady ? (
              <ResponsiveContainer
                height="100%"
                minHeight={260}
                minWidth={0}
                width="100%"
              >
                <PieChart>
                  <Pie
                    cx="42%"
                    cy="50%"
                    data={serviceDistribution}
                    dataKey="count"
                    innerRadius={50}
                    nameKey="serviceName"
                    outerRadius={90}
                    paddingAngle={2}
                  >
                    {serviceDistribution.map((slice, index) => (
                      <Cell
                        fill={SLICE_COLORS[index % SLICE_COLORS.length]}
                        key={slice.serviceId || index}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: 8,
                      border: "1px solid #e5e7eb",
                      fontSize: 13,
                    }}
                    formatter={(value, name, item) => {
                      // `percentage` is server-computed; never derived here.
                      const slice = item?.payload as
                        | { percentage?: number }
                        | undefined;
                      return [
                        `${value} request${Number(value) === 1 ? "" : "s"} (${(slice?.percentage ?? 0).toFixed(1)}%)`,
                        name,
                      ];
                    }}
                  />
                  <Legend
                    align="right"
                    formatter={(value, entry) => {
                      const slice = (
                        entry as unknown as { payload?: { percentage?: number } }
                      )?.payload;
                      return `${value} ${(slice?.percentage ?? 0).toFixed(1)}%`;
                    }}
                    layout="vertical"
                    verticalAlign="middle"
                    wrapperStyle={{ fontSize: 12, paddingLeft: 8 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : null}
          </div>
        </div>
      </div>

      <div className={styles.tableCard}>
        <div className="mb-1 flex flex-wrap items-center justify-between gap-3">
          <h3 className={styles.tableTitle}>Recent Requests</h3>
          <Button asChild size="sm" variant="outline">
            <Link href="/admin/service-requests">View All</Link>
          </Button>
        </div>
        {recentRequests.length === 0 ? (
          <EmptyState
            className="py-10"
            description="Recent customer intake requests will appear here."
            icon={ClipboardList}
            title="No recent service requests"
            tone="minimal"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Request</th>
                  <th>Customer</th>
                  <th>Service</th>
                  <th>Preferred</th>
                  <th>Technician</th>
                  <th>Status</th>
                  <th>Estimate</th>
                </tr>
              </thead>
              <tbody>
                {recentRequests.map((request) => (
                  <RequestRow key={request.id} request={request} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function RequestRow({ request }: { request: AdminRequestRow }) {
  const estimate = Number(request.estimatedAmountUsd);

  return (
    <tr>
      <td>
        <Link
          className="font-semibold text-teal-800 hover:underline"
          href={`/admin/service-requests/${request.id}`}
        >
          {request.businessId || request.title}
        </Link>
        {request.urgency ? (
          <div className="mt-0.5 text-[11px] font-semibold uppercase tracking-wider text-amber-700">
            {request.urgency}
          </div>
        ) : null}
      </td>
      <td>
        <div className="font-medium text-slate-900">
          {request.customerName || "Customer"}
        </div>
        {request.customerEmail ? (
          <div className="text-xs text-slate-500">{request.customerEmail}</div>
        ) : null}
      </td>
      <td>
        <div className="text-slate-800">{request.serviceName || "—"}</div>
        {request.propertyLabel ? (
          <div className="text-xs text-slate-500">{request.propertyLabel}</div>
        ) : null}
      </td>
      <td>
        {request.preferredDate ? (
          <>
            <div className="text-slate-800">
              {formatShortDate(request.preferredDate)}
            </div>
            {request.preferredTime ? (
              <div className="text-xs text-slate-500">
                {request.preferredTime}
              </div>
            ) : null}
          </>
        ) : (
          <span className="italic text-slate-400">Not set</span>
        )}
      </td>
      <td>
        {request.assignedTechnician ? (
          <span className="text-slate-800">{request.assignedTechnician}</span>
        ) : (
          <span className="italic text-slate-400">Unassigned</span>
        )}
      </td>
      <td>
        <StatusBadge status={toStatusSlug(request.status)} />
      </td>
      <td>
        {estimate > 0 ? (
          <span className="font-semibold tabular-nums text-slate-900">
            {formatCurrencyUsd(estimate)}
          </span>
        ) : (
          <span className="italic text-slate-400">
            {request.isQuoted ? "—" : "Not quoted"}
          </span>
        )}
      </td>
    </tr>
  );
}
