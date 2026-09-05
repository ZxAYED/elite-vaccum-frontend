"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle2,
  ClipboardList,
  DollarSign,
  FileText,
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
import {
  adminRevenueByMonth,
  adminServiceDistribution,
} from "@/data/mock/dashboard";
import { mockTechnicians } from "@/data/mock/technicians";
import { formatCurrencyUsd } from "@/lib/formatters";
import { formatStatusLabel } from "@/lib/status-labels";
import { EmptyState } from "@/components/ui/EmptyState";

const statusClassMap: Record<string, string> = {
  completed: styles.statusCompleted,
  "in-progress": styles.statusInProgress,
  confirmed: styles.statusAssigned,
  scheduled: styles.statusPending,
  pending: styles.statusPending,
};

function renderCustomLegend({
  payload,
}: {
  payload?: readonly {
    color?: string;
    value?: string | number;
    payload?: { value?: number };
  }[];
}) {
  if (!payload) return null;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 6,
        fontSize: 12,
        paddingLeft: 8,
      }}
    >
      {payload.map((entry, index) => (
        <div
          key={`legend-${index}`}
          style={{ display: "flex", alignItems: "center", gap: 6 }}
        >
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: entry.color ?? "#1c4f50",
            }}
          />
          <span style={{ color: entry.color ?? "#1c4f50" }}>
            {entry.value} {entry.payload?.value}%
          </span>
        </div>
      ))}
    </div>
  );
}

export default function AdminDashboardPage() {
  const [chartsReady, setChartsReady] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setChartsReady(true);
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  const totalRevenue = adminRevenueByMonth.reduce(
    (sum, month) => sum + month.revenue,
    0,
  );
  const revenueDelta =
    ((adminRevenueByMonth.at(-1)?.revenue ?? 0) -
      adminRevenueByMonth[0].revenue) /
    adminRevenueByMonth[0].revenue;
  const activeTechnicians = mockTechnicians.filter(
    (technician) => technician.status !== "offline",
  ).length;
  const confirmedOrders = 0;
  const pendingOrders = 0;
  const statCards = [
    {
      label: "Six-Month Revenue",
      value: formatCurrencyUsd(totalRevenue),
      trend: `+${(revenueDelta * 100).toFixed(1)}% revenue growth`,
      icon: DollarSign,
    },
    {
      label: "Tracked Orders",
      value: "0",
      trend: "0 scheduled visits",
      icon: FileText,
    },
    {
      label: "Active Technicians",
      value: String(activeTechnicians),
      trend: `${mockTechnicians.length - activeTechnicians} currently offline`,
      icon: Wrench,
    },
    {
      label: "Active Customers",
      value: "0",
      trend: "Customer accounts in portal",
      icon: Users,
    },
    {
      label: "Pending Review",
      value: String(pendingOrders),
      trend: "Needs admin attention",
      icon: ClipboardList,
    },
    {
      label: "Confirmed Work",
      value: String(confirmedOrders),
      trend: "Ready for service delivery",
      icon: CheckCircle2,
    },
  ];

  const recentRequests: Array<{
    amount: string;
    customer: string;
    id: string;
    service: string;
    status: string;
    technician: string;
  }> = [];

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Dashboard Overview</h1>
        <p className={styles.pageSubtitle}>
          Snapshot of revenue, service activity, and upcoming workload as of
          August 7, 2026
        </p>
      </div>

      <div className={styles.statsGrid}>
        {statCards.map((card) => {
          const Icon = card.icon;

          return (
            <div className={styles.statCard} key={card.label}>
              <div className={styles.statCardHeader}>
                <span className={styles.statCardLabel}>{card.label}</span>
                <div className={styles.statCardIcon}>
                  <Icon size={18} />
                </div>
              </div>
              <div className={styles.statCardValue}>{card.value}</div>
              <div className={styles.statCardTrend}>
                <TrendingUp size={14} />
                <span>{card.trend}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className={styles.chartsGrid}>
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Revenue Overview</h3>
          <div className={styles.chartContainer}>
            {chartsReady ? (
              <ResponsiveContainer
                height="100%"
                minHeight={260}
                minWidth={0}
                width="100%"
              >
                <LineChart data={adminRevenueByMonth}>
                  <CartesianGrid stroke="#f0f0f0" strokeDasharray="3 3" />
                  <XAxis
                    axisLine={{ stroke: "#e5e7eb" }}
                    dataKey="month"
                    tick={{ fontSize: 12, fill: "#6b7280" }}
                    tickLine={false}
                  />
                  <YAxis
                    axisLine={{ stroke: "#e5e7eb" }}
                    tick={{ fontSize: 12, fill: "#6b7280" }}
                    tickFormatter={(value) => `${value / 1000}k`}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 8,
                      border: "1px solid #e5e7eb",
                      fontSize: 13,
                    }}
                    formatter={(value: number | string | undefined) => [
                      formatCurrencyUsd(Number(value)),
                      "Revenue",
                    ]}
                  />
                  <Line
                    activeDot={{ r: 6 }}
                    dataKey="revenue"
                    dot={{
                      r: 4,
                      fill: "#2E6162",
                      stroke: "#fff",
                      strokeWidth: 2,
                    }}
                    stroke="#2E6162"
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
            {chartsReady ? (
              <ResponsiveContainer
                height="100%"
                minHeight={260}
                minWidth={0}
                width="100%"
              >
                <PieChart>
                  <Pie
                    cx="45%"
                    cy="50%"
                    data={adminServiceDistribution}
                    dataKey="value"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={2}
                  >
                    {adminServiceDistribution.map((entry, index) => (
                      <Cell fill={entry.color} key={`cell-${index}`} />
                    ))}
                  </Pie>
                  <Legend
                    align="right"
                    content={renderCustomLegend}
                    layout="vertical"
                    verticalAlign="middle"
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : null}
          </div>
        </div>
      </div>

      <div className={styles.tableCard}>
        <h3 className={styles.tableTitle}>Recent Requests</h3>
        {recentRequests.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No recent service requests"
            description="Recent customer intake requests and orders will appear here."
            tone="minimal"
            className="py-10"
          />
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Service</th>
                <th>Technician</th>
                <th>Status</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {recentRequests.map((request) => (
                <tr key={request.id}>
                  <td>{request.id}</td>
                  <td>{request.customer}</td>
                  <td>{request.service}</td>
                  <td>{request.technician}</td>
                  <td>
                    <span
                      className={`${styles.statusBadge} ${
                        statusClassMap[request.status] ?? ""
                      }`}
                    >
                      {formatStatusLabel(request.status)}
                    </span>
                  </td>
                  <td>{request.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
