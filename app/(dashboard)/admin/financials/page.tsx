"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Calendar,
  DollarSign,
  Plus,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import { mockCustomers } from "@/data/mock/customers";
import {
  adminRevenueByMonth,
  adminRevenueVsExpenses,
} from "@/data/mock/dashboard";
import { mockOrders } from "@/data/mock/orders";
import { mockPayments } from "@/data/mock/payments";
import { formatCurrencyUsd, formatShortDate } from "@/lib/formatters";

import styles from "../adminDashboard.module.css";

export default function FinancialManagementPage() {
  const [chartsReady, setChartsReady] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setChartsReady(true);
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  const totalRevenue = adminRevenueVsExpenses.reduce(
    (sum, entry) => sum + entry.revenue,
    0,
  );
  const totalExpenses = adminRevenueVsExpenses.reduce(
    (sum, entry) => sum + entry.expenses,
    0,
  );
  const netProfit = totalRevenue - totalExpenses;

  return (
    <div>
      <div className={styles.pageHeaderWithAction}>
        <div>
          <h1 className={styles.pageTitle}>Financial Management</h1>
          <p className={styles.pageSubtitle}>
            Track payments, payouts, and revenue analytics
          </p>
        </div>
        <button className={styles.exportBtn} type="button">
          <Plus size={16} />
          Export Report
        </button>
      </div>

      <div className={styles.summaryGrid}>
        <div className={styles.statCard}>
          <div className={styles.statCardHeader}>
            <span className={styles.statCardLabel}>
              Total Revenue (6 months)
            </span>
            <div
              className={`${styles.statCardIcon} ${styles.statCardIconGreen}`}
            >
              <DollarSign size={18} />
            </div>
          </div>
          <div className={styles.statCardValue}>
            {formatCurrencyUsd(totalRevenue)}
          </div>
          <div className={`${styles.statCardTrend} ${styles.statCardTrendUp}`}>
            <TrendingUp size={14} />
            <span>+12.0%</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statCardHeader}>
            <span className={styles.statCardLabel}>
              Total Expenses (6 months)
            </span>
            <div
              className={`${styles.statCardIcon} ${styles.statCardIconOrange}`}
            >
              <DollarSign size={18} />
            </div>
          </div>
          <div className={styles.statCardValue}>
            {formatCurrencyUsd(totalExpenses)}
          </div>
          <div
            className={`${styles.statCardTrend} ${styles.statCardTrendDown}`}
          >
            <TrendingDown size={14} />
            <span>+8.4%</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statCardHeader}>
            <span className={styles.statCardLabel}>Net Profit (6 months)</span>
            <div
              className={`${styles.statCardIcon} ${styles.statCardIconBlue}`}
            >
              <DollarSign size={18} />
            </div>
          </div>
          <div className={styles.statCardValue}>
            {formatCurrencyUsd(netProfit)}
          </div>
          <div className={`${styles.statCardTrend} ${styles.statCardTrendUp}`}>
            <TrendingUp size={14} />
            <span>+14.6%</span>
          </div>
        </div>
      </div>

      <div className={styles.chartsGrid}>
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Revenue vs Expenses</h3>
          <div className={styles.chartContainer}>
            {chartsReady ? (
              <ResponsiveContainer
                height="100%"
                minHeight={260}
                minWidth={0}
                width="100%"
              >
                <BarChart data={adminRevenueVsExpenses}>
                  <CartesianGrid stroke="#f0f0f0" strokeDasharray="3 3" />
                  <XAxis
                    axisLine={false}
                    dataKey="month"
                    tick={{ fontSize: 12, fill: "#6b7280" }}
                    tickLine={false}
                  />
                  <YAxis
                    axisLine={false}
                    tick={{ fontSize: 12, fill: "#6b7280" }}
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
                      "",
                    ]}
                  />
                  <Bar
                    barSize={20}
                    dataKey="revenue"
                    fill="#2E6162"
                    name="Revenue"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    barSize={20}
                    dataKey="expenses"
                    fill="#ef4444"
                    name="Expenses"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : null}
          </div>
        </div>

        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Revenue Trend</h3>
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
                    axisLine={false}
                    dataKey="month"
                    tick={{ fontSize: 12, fill: "#6b7280" }}
                    tickLine={false}
                  />
                  <YAxis
                    axisLine={false}
                    tick={{ fontSize: 12, fill: "#6b7280" }}
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
                      "",
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
      </div>

      <div className={styles.tableCard}>
        <h3 className={styles.tableTitle}>Recent Transactions</h3>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Transaction ID</th>
              <th>Date</th>
              <th>Customer</th>
              <th>Service</th>
              <th>Amount</th>
              <th>Tech Payout</th>
              <th>Platform Fee</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {mockPayments.map((payment) => {
              const order = mockOrders.find((item) => item.id === payment.orderId);
              const customer = mockCustomers.find(
                (item) => item.id === payment.customerId,
              );

              return (
                <tr key={payment.id}>
                  <td>{payment.id}</td>
                  <td>
                    <div className={styles.joinedCell}>
                      <Calendar className={styles.joinedIcon} size={14} />
                      <span>{formatShortDate(payment.processedAt)}</span>
                    </div>
                  </td>
                  <td>{customer?.displayName ?? "Pending customer"}</td>
                  <td>{order?.summary ?? "Pending service"}</td>
                  <td>{formatCurrencyUsd(payment.amountUsd)}</td>
                  <td>
                    {formatCurrencyUsd(payment.technicianPayoutUsd ?? 0)}
                  </td>
                  <td>{formatCurrencyUsd(payment.platformFeeUsd ?? 0)}</td>
                  <td>
                    <span className={styles.statusCompletedText}>
                      {payment.status === "paid"
                        ? "Paid"
                        : payment.status === "pending"
                          ? "Pending"
                          : "Refunded"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
