import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarDays, Package, Search, UserRound, X } from "lucide-react";

import { PageHeader } from "@/components/customer-portal/PageHeader";
import { StatusBadge } from "@/components/customer-portal/StatusBadge";
import { TypeBadge } from "@/components/customer-portal/TypeBadge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
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
    <div className="space-y-6 pb-8">
      <PageHeader
        actions={
          <Button asChild size="sm" className="rounded-md font-medium">
            <Link href="/store">Continue shopping</Link>
          </Button>
        }
        description="Product purchases and accepted service jobs live in one place, separated by clear type badges."
        eyebrow="Customer Orders"
        title="My Orders"
      />

      <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-1.5">
            {typeFilters.map((filter) => (
              <Button
                asChild
                key={filter.value}
                size="sm"
                variant={selectedType === filter.value ? "default" : "outline"}
                className="rounded-md text-xs font-medium"
              >
                <Link href={`/user/orders?type=${filter.value}&status=${selectedStatus}${query ? `&q=${encodeURIComponent(query)}` : ""}`}>
                  {filter.label}
                </Link>
              </Button>
            ))}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {statusFilters.map((filter) => (
              <Button
                asChild
                key={filter.value}
                size="sm"
                variant={selectedStatus === filter.value ? "soft" : "outline"}
                className="rounded-md text-xs font-medium"
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
          <Search size={15} className="pointer-events-none absolute left-3.5 text-slate-400" />
          <Input
            name="q"
            defaultValue={params.q ?? ""}
            placeholder="Search by order ID, product name, or service..."
            className="h-10 rounded-md border-slate-200 bg-slate-50/50 pl-10 pr-10 text-xs sm:text-sm focus-visible:bg-white"
          />
          {query ? (
            <Link
              href={`/user/orders?type=${selectedType}&status=${selectedStatus}`}
              aria-label="Clear search"
              className="absolute right-3 flex size-5 items-center justify-center rounded-md text-slate-400 hover:bg-slate-200 hover:text-slate-600"
            >
              <X size={13} />
            </Link>
          ) : null}
        </form>
      </div>

      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          allOrders.length === 0 ? (
            <EmptyState
              icon={Package}
              title="No orders found"
              description="You haven't placed any product or service orders yet. Explore our store offerings or request a specialized central vacuum service visit."
              action={{ label: "Browse Store", href: "/store" }}
              secondaryAction={{ label: "Request Service", href: "/services" }}
              tone="card"
              className="py-12"
            />
          ) : (
            <EmptyState
              icon={Search}
              title="No matching orders"
              description="No orders match your search query or selected filters. Try clearing your filters."
              action={{ label: "Clear all filters", href: "/user/orders", variant: "outline" }}
              tone="dashed"
              className="py-10"
            />
          )
        ) : null}
        {filteredOrders.map((order) => (
          <article
            className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xs transition hover:border-teal-400 hover:shadow-sm"
            key={order.id}
          >
            <div className="flex flex-col gap-4 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0 flex-1 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <TypeBadge type={order.type as CustomerRecordType} />
                  <span className="font-mono text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                    Order #{order.id}
                  </span>
                  <StatusBadge status={order.status} />
                </div>

                {order.type === "PRODUCT" ? (
                  <div className="flex flex-col gap-3.5 sm:flex-row sm:items-center">
                    <div className="relative size-16 shrink-0 overflow-hidden rounded-md border border-slate-200 bg-slate-50">
                      <Image
                        src={order.items[0]?.imageSrc ?? "/product.png"}
                        alt={order.items[0]?.name ?? "Product order"}
                        fill
                        className="object-contain p-2"
                      />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-slate-900">
                        {order.items[0]?.name ?? "Product order"}
                      </h2>
                      <p className="mt-0.5 text-xs text-slate-600 font-medium">
                        {formatLongDate(order.placedAt)} · Qty{" "}
                        {order.items.reduce((sum, item) => sum + item.quantity, 0)}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {order.delivery.carrier}: {order.delivery.trackingNumber}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      {order.serviceName}
                    </h2>
                    <p className="mt-1 max-w-3xl text-xs sm:text-sm leading-relaxed text-slate-600 font-normal">
                      {order.problemSummary}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-600">
                      <span className="inline-flex items-center gap-1.5 font-medium text-slate-800">
                        <CalendarDays size={14} className="text-teal-600" />
                        {order.currentSchedule}
                      </span>
                      {order.technician ? (
                        <span className="inline-flex items-center gap-1.5">
                          <UserRound size={14} className="text-slate-400" />
                          Technician: <strong className="text-slate-800 font-medium">{order.technician.name}</strong>
                        </span>
                      ) : null}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex w-full flex-col justify-between gap-2.5 rounded-md border border-slate-200 bg-slate-50/70 p-3.5 sm:w-52 lg:w-56">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Amount</p>
                  <p className="mt-0.5 text-lg font-bold text-slate-900">
                    {formatCurrencyUsd(order.total.totalUsd)}
                  </p>
                </div>
                <Button asChild size="sm" className="rounded-md w-full font-medium">
                  <Link href={`/user/orders/${order.id}`}>
                    View Details
                    <ArrowRight size={14} className="ml-1.5" />
                  </Link>
                </Button>
              </div>
            </div>

            <div
              className={cn(
                "border-t border-slate-100 px-5 py-3 text-xs",
                order.type === "SERVICE" ? "bg-teal-50/40 text-teal-900" : "bg-slate-50/50 text-slate-600",
              )}
            >
              {order.type === "PRODUCT" ? (
                <div className="flex items-center gap-1.5 font-medium">
                  <Package size={14} className="text-teal-600" />
                  Estimated delivery: {formatShortDate(order.delivery.estimatedDelivery)}
                </div>
              ) : (
                <div className="font-medium">
                  Request Ref: {order.serviceRequestId} · Invoice {order.invoiceId} · Payment{" "}
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
