import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarDays, Package, Search, UserRound, X } from "lucide-react";

import { PageHeader } from "@/components/customer-portal/PageHeader";
import { StatusBadge } from "@/components/customer-portal/StatusBadge";
import { TypeBadge } from "@/components/customer-portal/TypeBadge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { getDashboardOrders, type CustomerRecordType } from "@/data/mock/customer-dashboard";
import { formatCurrencyUsd, formatLongDate, formatShortDate } from "@/lib/formatters";
import { cn } from "@/lib/utils";

const typeFilters = [
  { label: "All", value: "ALL" },
  { label: "Products", value: "PRODUCT" },
  { label: "Services", value: "SERVICE" },
] as const;

const statusFilters = [
  { label: "All Statuses", value: "all" },
  { label: "Active", value: "active" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
] as const;

function matchesStatus(status: string, filter: string) {
  if (filter === "all") return true;
  if (filter === "completed") return ["completed", "delivered"].includes(status);
  if (filter === "cancelled") return status === "cancelled";
  return !["completed", "delivered", "cancelled", "refunded"].includes(status);
}

interface UserOrdersPageProps {
  searchParams: Promise<{
    type?: string;
    status?: string;
    q?: string;
  }>;
}

export default async function UserOrdersPage({ searchParams }: UserOrdersPageProps) {
  const params = await searchParams;
  const selectedType = params.type === "PRODUCT" || params.type === "SERVICE" ? params.type : "ALL";
  const selectedStatus = statusFilters.some((filter) => filter.value === params.status)
    ? params.status ?? "all"
    : "all";
  const query = (params.q ?? "").trim().toLowerCase();

  const allOrders = getDashboardOrders();
  const filteredOrders = allOrders.filter((order) => {
    const typeMatch = selectedType === "ALL" || order.type === selectedType;
    const statusMatch = matchesStatus(order.status, selectedStatus);
    const searchMatch =
      !query ||
      order.id.toLowerCase().includes(query) ||
      (order.type === "PRODUCT"
        ? order.items.some(
            (item) =>
              item.name.toLowerCase().includes(query) ||
              item.sku.toLowerCase().includes(query),
          )
        : order.serviceName.toLowerCase().includes(query) ||
          order.problemSummary.toLowerCase().includes(query));

    return typeMatch && statusMatch && searchMatch;
  });

  return (
    <div className="min-h-screen">
      <PageHeader
        actions={
          <Button asChild>
            <Link href="/store">Continue shopping</Link>
          </Button>
        }
        description="Product purchases and accepted service jobs live in one place, separated by clear type badges."
        eyebrow="Customer Orders"
        title="My Orders"
      />

      <div className="mb-6 flex flex-col gap-4 rounded-3xl border border-teal-100 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {typeFilters.map((filter) => (
              <Button
                asChild
                key={filter.value}
                size="sm"
                variant={selectedType === filter.value ? "default" : "ghost"}
              >
                <Link href={`/user/orders?type=${filter.value}&status=${selectedStatus}${query ? `&q=${encodeURIComponent(query)}` : ""}`}>
                  {filter.label}
                </Link>
              </Button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            {statusFilters.map((filter) => (
              <Button
                asChild
                key={filter.value}
                size="sm"
                variant={selectedStatus === filter.value ? "soft" : "outline"}
              >
                <Link href={`/user/orders?type=${selectedType}&status=${filter.value}${query ? `&q=${encodeURIComponent(query)}` : ""}`}>
                  {filter.label}
                </Link>
              </Button>
            ))}
          </div>
        </div>

        <form method="GET" action="/user/orders" className="relative flex items-center">
          <input type="hidden" name="type" value={selectedType} />
          <input type="hidden" name="status" value={selectedStatus} />
          <Search size={16} className="pointer-events-none absolute left-4 text-slate-400" />
          <Input
            name="q"
            defaultValue={params.q ?? ""}
            placeholder="Search by order ID, product name, or service..."
            className="h-11 rounded-2xl border-teal-100 bg-slate-50/50 pl-11 pr-10 text-sm focus-visible:bg-white"
          />
          {query ? (
            <Link
              href={`/user/orders?type=${selectedType}&status=${selectedStatus}`}
              aria-label="Clear search"
              className="absolute right-3 flex size-6 items-center justify-center rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-600"
            >
              <X size={14} />
            </Link>
          ) : null}
        </form>
      </div>

      <div className="space-y-5">
        {filteredOrders.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-teal-200 bg-teal-50/30 p-10 text-center">
            <Package size={32} className="mx-auto text-teal-700 opacity-60" />
            <p className="mt-3 text-lg font-semibold text-slate-900">No matching orders</p>
            <p className="mt-1 text-sm text-slate-500">
              Try adjusting your search query or filters.
            </p>
            {(query || selectedType !== "ALL" || selectedStatus !== "all") ? (
              <Button asChild size="sm" variant="outline" className="mt-4">
                <Link href="/user/orders">Clear all filters</Link>
              </Button>
            ) : null}
          </div>
        ) : null}
        {filteredOrders.map((order) => (
          <article
            className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm"
            key={order.id}
          >
            <div className="flex flex-col gap-5 p-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <TypeBadge type={order.type as CustomerRecordType} />
                  <p className="text-sm font-semibold text-gray-500">Order #{order.id}</p>
                  <StatusBadge status={order.status} />
                </div>

                {order.type === "PRODUCT" ? (
                  <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="relative size-24 overflow-hidden rounded-2xl bg-teal-50">
                      <Image
                        src={order.items[0]?.imageSrc ?? "/product.png"}
                        alt={order.items[0]?.name ?? "Product order"}
                        fill
                        className="object-contain p-3"
                      />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-primary">
                        {order.items[0]?.name ?? "Product order"}
                      </h2>
                      <p className="mt-1 text-sm text-gray-600">
                        {formatLongDate(order.placedAt)} · Qty{" "}
                        {order.items.reduce((sum, item) => sum + item.quantity, 0)}
                      </p>
                      <p className="mt-2 text-sm text-gray-500">
                        {order.delivery.carrier}: {order.delivery.trackingNumber}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="mt-5">
                    <h2 className="text-xl font-semibold text-primary">
                      {order.serviceName}
                    </h2>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">
                      {order.problemSummary}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-600">
                      <span className="inline-flex items-center gap-2">
                        <CalendarDays size={16} />
                        {order.currentSchedule}
                      </span>
                      {order.technician ? (
                        <span className="inline-flex items-center gap-2">
                          <UserRound size={16} />
                          Technician: {order.technician.name}
                        </span>
                      ) : null}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex w-full flex-col gap-3 rounded-2xl bg-gray-50 p-4 lg:w-56">
                <p className="text-sm text-gray-500">Total</p>
                <p className="text-2xl font-semibold text-primary">
                  {formatCurrencyUsd(order.total.totalUsd)}
                </p>
                <Button asChild>
                  <Link href={`/user/orders/${order.id}`}>
                    View Details
                    <ArrowRight size={16} />
                  </Link>
                </Button>
              </div>
            </div>

            <div
              className={cn(
                "border-t border-gray-100 px-5 py-4 text-sm",
                order.type === "SERVICE" ? "bg-teal-50/50" : "bg-white",
              )}
            >
              {order.type === "PRODUCT" ? (
                <div className="flex items-center gap-2 text-gray-600">
                  <Package size={16} />
                  Estimated delivery: {formatShortDate(order.delivery.estimatedDelivery)}
                </div>
              ) : (
                <div className="text-gray-600">
                  Request {order.serviceRequestId} · Invoice {order.invoiceId} · Payment{" "}
                  {order.paymentId}
                </div>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
