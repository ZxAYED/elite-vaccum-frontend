"use client";

import {
  ArrowUpDown,
  CheckCircle2,
  Eye,
  Mail,
  Phone,
  Search,
  UserRound,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import {
  AdminPageHeader,
  AdminPageShell,
  AdminStatCard,
  AdminSurface,
} from "@/components/admin/AdminPageShell";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { getAdminOrders } from "@/data/mock/admin-orders";
import {
  getSharedCustomerPrimaryAddress,
  getSharedCustomers,
  toggleSharedCustomerStatus,
} from "@/data/mock/shared-business-store";
import { useSharedBusinessStoreVersion } from "@/hooks/useSharedBusinessStoreVersion";
import { formatLongDate } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import type { Customer } from "@/types/domain";

type CustomerStatusFilter = "all" | "active" | "inactive" | "lead";
type CustomerSort =
  | "name-asc"
  | "name-desc"
  | "newest"
  | "oldest"
  | "lifetime-high"
  | "activity-recent";

const statusOptions: Array<{ label: string; value: CustomerStatusFilter }> = [
  { label: "All", value: "all" },
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
  { label: "Lead", value: "lead" },
];

const sortOptions: Array<{ label: string; value: CustomerSort }> = [
  { label: "Name A-Z", value: "name-asc" },
  { label: "Name Z-A", value: "name-desc" },
  { label: "Newest", value: "newest" },
  { label: "Oldest", value: "oldest" },
  { label: "Highest Lifetime Value", value: "lifetime-high" },
  { label: "Recent Activity", value: "activity-recent" },
];

function getCustomerStatusTone(status: Customer["status"]) {
  if (status === "active") return "bg-teal-50 text-teal-800";
  if (status === "inactive") return "bg-slate-100 text-slate-600";
  return "bg-amber-50 text-amber-700";
}

function getOrderCounts(customerId: string) {
  const orders = getAdminOrders().filter((order) => order.customerId === customerId);
  return {
    product: orders.filter((order) => order.type === "PRODUCT").length,
    service: orders.filter((order) => order.type === "SERVICE").length,
    total: orders.length,
  };
}

function getLastActivity(customerId: string, joinedAt: string) {
  const dates = getAdminOrders()
    .filter((order) => order.customerId === customerId)
    .map((order) => order.createdAt);

  if (dates.length === 0) return joinedAt;
  return dates.sort((left, right) => new Date(right).getTime() - new Date(left).getTime())[0];
}

function StatusPill({ status }: { status: Customer["status"] }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
        getCustomerStatusTone(status),
      )}
    >
      {status === "active" ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

export function AdminCustomersClient() {
  useSharedBusinessStoreVersion();
  const customers = getSharedCustomers();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<CustomerStatusFilter>("all");
  const [sort, setSort] = useState<CustomerSort>("activity-recent");

  const stats = useMemo(() => {
    return customers.reduce(
      (accumulator, customer) => {
        const counts = getOrderCounts(customer.id);
        accumulator.total += 1;
        accumulator.product += counts.product;
        accumulator.service += counts.service;
        if (customer.status === "active") accumulator.active += 1;
        if (customer.status === "inactive") accumulator.inactive += 1;
        if (customer.status === "lead") accumulator.lead += 1;
        return accumulator;
      },
      { active: 0, inactive: 0, lead: 0, product: 0, service: 0, total: 0 },
    );
  }, [customers]);

  const filteredCustomers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return customers
      .filter((customer) => {
        const primaryAddress = getSharedCustomerPrimaryAddress(customer.id);
        const haystack = [
          customer.displayName,
          customer.email,
          customer.phone,
          customer.cellphone,
          customer.company,
          primaryAddress?.line1,
          primaryAddress?.city,
          primaryAddress?.state,
          primaryAddress?.postalCode,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        const matchesQuery =
          normalizedQuery.length === 0 || haystack.includes(normalizedQuery);
        const matchesStatus =
          statusFilter === "all" || customer.status === statusFilter;

        return matchesQuery && matchesStatus;
      })
      .sort((left, right) => {
        if (sort === "name-asc") return left.displayName.localeCompare(right.displayName);
        if (sort === "name-desc") return right.displayName.localeCompare(left.displayName);
        if (sort === "newest") {
          return new Date(right.joinedAt).getTime() - new Date(left.joinedAt).getTime();
        }
        if (sort === "oldest") {
          return new Date(left.joinedAt).getTime() - new Date(right.joinedAt).getTime();
        }
        if (sort === "lifetime-high") {
          return right.lifetimeValueUsd - left.lifetimeValueUsd;
        }

        return (
          new Date(getLastActivity(right.id, right.joinedAt)).getTime() -
          new Date(getLastActivity(left.id, left.joinedAt)).getTime()
        );
      });
  }, [customers, query, sort, statusFilter]);

  return (
    <AdminPageShell>
      <AdminPageHeader
        eyebrow="Customers"
        title="Customers"
        description="Manage customer accounts, linked properties, service history, product orders, and internal operating context."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <AdminStatCard label="Total Customers" value={stats.total} />
        <AdminStatCard label="Active" tone="soft" value={stats.active} />
        <AdminStatCard label="Inactive" value={stats.inactive} />
        <AdminStatCard label="Lead" tone="warning" value={stats.lead} />
        <AdminStatCard label="Service Orders" value={stats.service} />
        <AdminStatCard label="Product Orders" value={stats.product} />
      </div>

      <AdminSurface className="space-y-4">
        <div className="grid gap-3 xl:grid-cols-[1fr_24rem_18rem]">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <Input
              className="pl-11"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by name, email, phone, or address..."
              value={query}
            />
          </div>

          <div className="grid grid-cols-4 gap-2 rounded-xl bg-slate-50 p-1">
            {statusOptions.map((option) => (
              <button
                className={cn(
                  "h-10 rounded-xl text-sm font-semibold transition",
                  statusFilter === option.value
                    ? "bg-primary text-white"
                    : "text-slate-600 hover:bg-white hover:text-primary",
                )}
                key={option.value}
                onClick={() => setStatusFilter(option.value)}
                type="button"
              >
                {option.label}
              </button>
            ))}
          </div>

          <Select onValueChange={(value) => setSort(value as CustomerSort)} value={sort}>
            <SelectTrigger>
              <span className="flex items-center gap-2 text-slate-500">
                <ArrowUpDown size={16} />
                <SelectValue />
              </span>
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {filteredCustomers.length === 0 ? (
          <div className="rounded-xl border border-dashed border-teal-200 bg-teal-50/40 px-6 py-10 text-center text-sm text-slate-600">
            No customers match the current search and filter.
          </div>
        ) : (
          <>
            <div className="hidden overflow-hidden rounded-xl border border-teal-100 xl:block">
              <table className="w-full border-collapse text-left">
                <thead className="bg-[#f7fbfa] text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                  <tr>
                    <th className="px-5 py-4">Customer</th>
                    <th className="px-5 py-4">Contact</th>
                    <th className="px-5 py-4">Primary Address</th>
                    <th className="px-5 py-4">Service Orders</th>
                    <th className="px-5 py-4">Product Orders</th>
                    <th className="px-5 py-4">Last Activity</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-teal-100">
                  {filteredCustomers.map((customer) => {
                    const primaryAddress = getSharedCustomerPrimaryAddress(customer.id);
                    const orderCounts = getOrderCounts(customer.id);
                    const lastActivity = getLastActivity(customer.id, customer.joinedAt);

                    return (
                      <tr key={customer.id}>
                        <td className="px-5 py-5">
                          <div className="flex items-center gap-3">
                            <span className="flex size-11 items-center justify-center rounded-full bg-teal-50 text-teal-800">
                              <UserRound size={18} />
                            </span>
                            <div>
                              <p className="font-semibold text-teal-950">{customer.displayName}</p>
                              <p className="text-sm text-slate-500">{customer.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-5">
                          <div className="space-y-2 text-sm text-slate-600">
                            <p className="flex items-center gap-2">
                              <Mail size={14} className="text-teal-700" />
                              {customer.email}
                            </p>
                            <p className="flex items-center gap-2">
                              <Phone size={14} className="text-teal-700" />
                              {customer.phone}
                            </p>
                          </div>
                        </td>
                        <td className="px-5 py-5 text-sm text-slate-600">
                          {primaryAddress ? (
                            <div className="space-y-1">
                              <p className="font-medium text-slate-900">{primaryAddress.label}</p>
                              <p>{primaryAddress.line1}</p>
                              <p>
                                {primaryAddress.city}, {primaryAddress.state} {primaryAddress.postalCode}
                              </p>
                            </div>
                          ) : (
                            "No primary address"
                          )}
                        </td>
                        <td className="px-5 py-5 text-sm font-semibold text-teal-950">
                          {orderCounts.service}
                        </td>
                        <td className="px-5 py-5 text-sm font-semibold text-teal-950">
                          {orderCounts.product}
                        </td>
                        <td className="px-5 py-5 text-sm text-slate-600">
                          {formatLongDate(lastActivity)}
                        </td>
                        <td className="px-5 py-5">
                          <StatusPill status={customer.status} />
                        </td>
                        <td className="px-5 py-5">
                          <div className="flex justify-end gap-2">
                            <Button asChild size="sm" variant="outline">
                              <Link href={`/admin/customers/${customer.id}`}>
                                <Eye size={15} />
                                View
                              </Link>
                            </Button>
                            <Button
                              onClick={() => toggleSharedCustomerStatus(customer.id)}
                              size="sm"
                              variant={customer.status === "active" ? "outline" : "default"}
                            >
                              {customer.status === "active" ? "Deactivate" : "Activate"}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="grid gap-4 xl:hidden">
              {filteredCustomers.map((customer) => {
                const primaryAddress = getSharedCustomerPrimaryAddress(customer.id);
                const orderCounts = getOrderCounts(customer.id);
                const lastActivity = getLastActivity(customer.id, customer.joinedAt);

                return (
                  <article
                    className="rounded-xl border border-teal-100 bg-white p-4 shadow-[0_14px_44px_-36px_rgba(28,79,80,0.34)]"
                    key={customer.id}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <StatusPill status={customer.status} />
                        <h2 className="mt-3 text-xl font-semibold text-teal-950">
                          {customer.displayName}
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">{customer.email}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button asChild size="icon-sm" variant="outline">
                          <Link href={`/admin/customers/${customer.id}`}>
                            <Eye size={15} />
                          </Link>
                        </Button>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                          Contact
                        </p>
                        <p className="mt-1 font-semibold text-teal-950">{customer.phone}</p>
                      </div>
                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                          Last Activity
                        </p>
                        <p className="mt-1 font-semibold text-teal-950">
                          {formatLongDate(lastActivity)}
                        </p>
                      </div>
                      <div className="rounded-xl bg-slate-50 p-3 sm:col-span-2">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                          Primary Address
                        </p>
                        <p className="mt-1 font-semibold text-teal-950">
                          {primaryAddress
                            ? `${primaryAddress.line1}, ${primaryAddress.city}, ${primaryAddress.state}`
                            : "No primary address"}
                        </p>
                      </div>
                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                          Service Orders
                        </p>
                        <p className="mt-1 font-semibold text-teal-950">{orderCounts.service}</p>
                      </div>
                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                          Product Orders
                        </p>
                        <p className="mt-1 font-semibold text-teal-950">{orderCounts.product}</p>
                      </div>
                    </div>

                    <div className="mt-5 flex gap-2">
                      <Button asChild className="flex-1" size="sm" variant="outline">
                        <Link href={`/admin/customers/${customer.id}`}>View Customer</Link>
                      </Button>
                      <Button
                        className="flex-1"
                        onClick={() => toggleSharedCustomerStatus(customer.id)}
                        size="sm"
                        variant={customer.status === "active" ? "outline" : "default"}
                      >
                        {customer.status === "active" ? "Deactivate" : "Activate"}
                      </Button>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}
      </AdminSurface>
    </AdminPageShell>
  );
}
