"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarDays, Package, Search, UserRound, X } from "lucide-react";

import { PageHeader } from "@/components/customer-portal/PageHeader";
import { StatusBadge } from "@/components/customer-portal/StatusBadge";
import { TypeBadge } from "@/components/customer-portal/TypeBadge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { useGetCustomerOrdersQuery } from "@/redux/api/ordersApi";
import {
  getDashboardOrders,
  type DashboardOrder,
  type DashboardProductOrder,
  type UnifiedOrderStatus,
} from "@/data/mock/customer-dashboard";
import { useSharedBusinessStoreVersion } from "@/hooks/useSharedBusinessStoreVersion";
import { formatCurrencyUsd, formatLongDate } from "@/lib/formatters";
import type { PaymentStatus } from "@/types/domain";
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
  const s = status.toLowerCase();
  if (filter === "all") return true;
  if (filter === "completed") return ["completed", "delivered"].includes(s);
  if (filter === "cancelled") return s === "cancelled";
  return !["completed", "delivered", "cancelled", "refunded"].includes(s);
}

export function UserOrdersClient() {
  useSharedBusinessStoreVersion();
  const [selectedType, setSelectedType] = useState<"ALL" | "PRODUCT" | "SERVICE">("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const queryParams = useMemo(() => {
    const p: { status?: string; search?: string } = {};
    if (selectedStatus !== "all") {
      p.status = selectedStatus.toUpperCase();
    }
    if (searchQuery.trim()) {
      p.search = searchQuery.trim();
    }
    return p;
  }, [selectedStatus, searchQuery]);

  const { data: apiOrdersData } = useGetCustomerOrdersQuery(queryParams);

  const sharedOrders = getDashboardOrders();

  const allOrders: DashboardOrder[] = useMemo(() => {
    if (apiOrdersData?.items && apiOrdersData.items.length > 0) {
      const liveOrders: DashboardProductOrder[] = apiOrdersData.items.map((so) => ({
        id: so.businessId || so.id,
        type: "PRODUCT" as const,
        status: (so.status.toLowerCase() as UnifiedOrderStatus) || "pending",
        placedAt: so.createdAt,
        total: {
          subtotalUsd: Number(so.subtotalUsd) || 0,
          shippingUsd: Number(so.shippingFeeUsd) || 0,
          taxUsd: Number(so.taxUsd) || 0,
          totalUsd: Number(so.totalUsd) || 0,
        },
        paymentStatus: (so.status === "PENDING" ? "authorized" : "paid") as PaymentStatus,
        items: so.items.map((item, idx) => ({
          id: `item-${idx}`,
          productId: item.productId,
          name: item.name,
          summary: item.name,
          sku: item.sku || "SKU-LIVE",
          quantity: item.quantity,
          unitPriceUsd: Number(item.priceUsd) || 0,
          imageSrc: item.imageUrl || "/product.png",
        })),
        delivery: {
          address: {
            id: so.deliveryAddress?.id || "addr-live",
            label: so.deliveryAddress?.label || "Home",
            line1: so.deliveryAddress?.line1 || "742 Evergreen Terrace",
            city: so.deliveryAddress?.city || "Springfield",
            state: so.deliveryAddress?.state || "OR",
            postalCode: so.deliveryAddress?.postalCode || "97477",
            country: so.deliveryAddress?.country || "USA",
          },
          trackingNumber: "TRK-" + (so.businessId || so.id),
          carrier: "UPS",
          estimatedDelivery: so.createdAt,
          timeline: [],
        },
        invoiceId: `INV-${so.businessId || so.id}`,
        paymentId: `PAY-${so.businessId || so.id}`,
      }));

      const liveIds = new Set(liveOrders.map((o) => o.id));
      return [...liveOrders, ...sharedOrders.filter((o) => !liveIds.has(o.id))];
    }
    return sharedOrders;
  }, [apiOrdersData, sharedOrders]);

  const filteredOrders = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return allOrders.filter((order) => {
      const typeMatch = selectedType === "ALL" || order.type === selectedType;
      const statusMatch = matchesStatus(order.status, selectedStatus);
      const searchMatch =
        !query ||
        order.id.toLowerCase().includes(query) ||
        (order.type === "PRODUCT"
          ? order.items?.some(
              (item) =>
                item.name.toLowerCase().includes(query) ||
                item.sku?.toLowerCase().includes(query),
            )
          : false);

      return typeMatch && statusMatch && searchMatch;
    });
  }, [allOrders, selectedType, selectedStatus, searchQuery]);

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        actions={
          <Button asChild size="sm" className="rounded-md font-medium">
            <Link href="/store">Continue shopping</Link>
          </Button>
        }
        description="Product purchases and accepted service orders live in one place, synchronized with real-time backend updates."
        eyebrow="Customer Orders"
        title="My Orders"
      />

      <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-1.5">
            {typeFilters.map((filter) => (
              <Button
                key={filter.value}
                size="sm"
                variant={selectedType === filter.value ? "default" : "outline"}
                className="rounded-md text-xs font-medium"
                onClick={() => setSelectedType(filter.value)}
              >
                {filter.label}
              </Button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <Input
              className="h-8.5 rounded-md pl-9 pr-8 text-xs placeholder:text-slate-400"
              placeholder="Search by order ID, SKU, product..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search query"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 pt-3 border-t border-slate-100">
          <span className="mr-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Status:
          </span>
          {statusFilters.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => setSelectedStatus(filter.value)}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium transition",
                selectedStatus === filter.value
                  ? "bg-teal-50 border border-teal-200 text-teal-800 font-semibold"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200/80",
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <EmptyState
          action={{ label: "Browse Store Catalog", href: "/store" }}
          description={
            searchQuery || selectedStatus !== "all" || selectedType !== "ALL"
              ? "No orders matched your current filters. Try resetting the filters."
              : "You have not placed any orders yet. Central vacuum products and service dispatch orders will show up here."
          }
          icon={Package}
          title="No Orders Found"
        />
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const isProduct = order.type === "PRODUCT";
            const firstItem = isProduct && order.items?.length ? order.items[0] : null;
            const itemCount = isProduct && order.items ? order.items.reduce((sum, item) => sum + item.quantity, 0) : 0;
            const extraItemCount = isProduct && order.items ? order.items.length - 1 : 0;
            const orderLink = `/user/orders/${order.id}`;

            return (
              <article
                className="group rounded-lg border border-slate-200 bg-white p-5 shadow-xs transition hover:border-teal-300 hover:shadow-sm"
                key={order.id}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <TypeBadge type={order.type} />
                    <span className="font-mono text-xs font-bold text-slate-900">
                      {order.id}
                    </span>
                    <span className="text-slate-300">·</span>
                    <span className="flex items-center gap-1 text-xs text-slate-500 font-medium">
                      <CalendarDays size={13} className="text-slate-400" />
                      {formatLongDate(order.type === "PRODUCT" ? order.placedAt : order.createdAt)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={order.status} />
                    <span className="text-sm font-bold text-slate-900">
                      {formatCurrencyUsd(order.total.totalUsd)}
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3.5">
                    {isProduct && firstItem ? (
                      <div className="relative size-14 shrink-0 overflow-hidden rounded-md border border-slate-200 bg-slate-50 flex items-center justify-center">
                        {firstItem.imageSrc ? (
                          <Image
                            alt={firstItem.name}
                            className="object-cover"
                            fill
                            src={firstItem.imageSrc}
                          />
                        ) : (
                          <Package size={22} className="text-slate-400" />
                        )}
                      </div>
                    ) : (
                      <div className="flex size-14 shrink-0 items-center justify-center rounded-md border border-teal-200 bg-teal-50 text-teal-800">
                        <Package size={22} />
                      </div>
                    )}

                    <div className="space-y-0.5">
                      <p className="text-sm font-bold text-slate-900">
                        {isProduct && firstItem
                          ? firstItem.name
                          : (order as unknown as { serviceName?: string }).serviceName || "Central Vacuum Service"}
                      </p>
                      <p className="text-xs text-slate-600 line-clamp-1">
                        {isProduct
                          ? `${itemCount} item${itemCount === 1 ? "" : "s"}${extraItemCount > 0 ? ` (+${extraItemCount} more)` : ""}`
                          : (order as unknown as { problemSummary?: string }).problemSummary || "Inspection & service"}
                      </p>
                      {"technician" in order && order.technician?.name ? (
                        <p className="flex items-center gap-1 text-xs text-teal-800 font-medium">
                          <UserRound size={12} />
                          Specialist: {order.technician.name}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <Button
                      asChild
                      size="sm"
                      variant="outline"
                      className="rounded-md font-medium text-xs group-hover:border-teal-300 group-hover:text-teal-900"
                    >
                      <Link href={orderLink}>
                        View Details
                        <ArrowRight size={13} className="ml-1 transition group-hover:translate-x-0.5" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

