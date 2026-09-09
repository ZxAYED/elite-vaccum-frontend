"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Package,
  Receipt,
  ShoppingBag,
  Truck,
  Wallet,
} from "lucide-react";

import { PageHeader } from "@/components/customer-portal/PageHeader";
import {
  PortalCard,
  PortalCardFooter,
  PortalCardTitle,
  PortalCardTop,
  PortalDetailAction,
  PortalFact,
  PortalFilterBar,
  PortalList,
  PortalLoading,
  PortalPager,
  PortalRef,
  type PortalFilterOption,
} from "@/components/customer-portal/PortalUI";
import { StatusBadge } from "@/components/customer-portal/StatusBadge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { toStatusSlug } from "@/lib/customer-orders";
import { formatCurrencyUsd, formatShortDateTime } from "@/lib/formatters";
import {
  useGetCustomerOrdersQuery,
  type GetStoreOrdersParams,
  type StoreOrderStatus,
} from "@/redux/api/ordersApi";

/**
 * `/store/orders` is product orders only — service work lives under
 * `/user/services` and `/user/schedule`, driven by service requests. This
 * screen never mixes the two.
 */

const PAGE_SIZE = 10;

type OrderFilter = StoreOrderStatus | "all";

/** Only statuses the API actually returns, so a filter is never dead by design. */
const STATUS_FILTERS: ReadonlyArray<PortalFilterOption<OrderFilter>> = [
  { label: "All", value: "all" },
  { label: "Awaiting payment", value: "PENDING" },
  { label: "Paid", value: "PAID" },
  { label: "Processing", value: "PROCESSING" },
  { label: "Shipped", value: "SHIPPED" },
  { label: "Out for delivery", value: "OUT_FOR_DELIVERY" },
  { label: "Delivered", value: "DELIVERED" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Cancelled", value: "CANCELLED" },
  { label: "Refunded", value: "REFUNDED" },
];

export function UserOrdersClient() {
  const [status, setStatus] = useState<OrderFilter>("all");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);

  // The API searches by order number and tracking number, so the server does
  // the filtering — not a client-side pass over one page of results.
  const search = useDebouncedValue(searchInput.trim());

  const queryParams = useMemo<GetStoreOrdersParams>(
    () => ({
      page,
      limit: PAGE_SIZE,
      sortBy: "placedAt",
      sortOrder: "desc",
      ...(status !== "all" ? { status } : {}),
      ...(search ? { search } : {}),
    }),
    [page, status, search],
  );

  const { data, isLoading, isFetching, isError, refetch } =
    useGetCustomerOrdersQuery(queryParams);

  const orders = data?.items ?? [];
  const meta = data?.meta;
  const totalPages = Math.max(1, meta?.totalPages ?? 1);
  const currentPage = meta?.page ?? page;
  const hasFilters = status !== "all" || Boolean(search);

  function changeStatus(next: OrderFilter) {
    setStatus(next);
    setPage(1);
  }

  function changeSearch(next: string) {
    setSearchInput(next);
    setPage(1);
  }

  function resetFilters() {
    setStatus("all");
    setSearchInput("");
    setPage(1);
  }

  return (
    <div className="space-y-6 pb-12 sm:space-y-7">
      <PageHeader
        actions={
          <Button
            asChild
            className="rounded-md bg-teal-600 font-medium text-white shadow-xs hover:bg-teal-500"
          >
            <Link href="/store">
              <ShoppingBag className="mr-1.5" size={15} />
              Continue Shopping
            </Link>
          </Button>
        }
        description="Every product order you've placed, with live payment and delivery status."
        eyebrow="Customer Orders"
        title="My Orders"
      />

      <PortalFilterBar
        filters={STATUS_FILTERS}
        onChange={changeStatus}
        onSearchChange={changeSearch}
        search={searchInput}
        searchPlaceholder="Search by order number or tracking number..."
        value={status}
      />

      {isLoading ? (
        <PortalLoading label="Loading your orders..." />
      ) : isError ? (
        <EmptyState
          action={{ label: "Try Again", onClick: () => void refetch() }}
          description="We couldn't load your orders just now. Please try again in a moment."
          icon={Package}
          title="Orders unavailable"
          tone="card"
          className="py-12"
        />
      ) : orders.length === 0 ? (
        <EmptyState
          action={
            hasFilters
              ? { label: "Clear Filters", onClick: resetFilters }
              : { label: "Browse Store Catalog", href: "/store" }
          }
          description={
            hasFilters
              ? "No orders matched your current filters. Try a different status or keyword."
              : "You haven't placed any product orders yet. Anything you buy from the store will appear here."
          }
          icon={hasFilters ? Package : ShoppingBag}
          title={hasFilters ? "No matching orders" : "No orders yet"}
          tone="card"
          className="py-12"
        />
      ) : (
        <PortalList isRefreshing={isFetching}>
          {orders.map((order) => {
            const firstItem = order.items[0];
            const unitCount = order.items.reduce(
              (sum, item) => sum + item.quantity,
              0,
            );
            const extraLines = order.items.length - 1;
            const orderRef = order.businessId || order.id;
            const invoice = order.invoice ?? order.invoices[0];

            const title = firstItem?.productName
              ? extraLines > 0
                ? `${firstItem.productName} +${extraLines} more`
                : firstItem.productName
              : "Product order";

            return (
              <PortalCard key={order.id}>
                <PortalCardTop
                  badges={
                    <>
                      <StatusBadge status={toStatusSlug(order.status)} />
                      <PortalRef>{orderRef}</PortalRef>
                      <span className="inline-flex items-center gap-1 rounded-md bg-teal-50 px-2.5 py-0.5 text-xs font-medium text-teal-800">
                        {order.paymentMethod === "COD"
                          ? "Cash on delivery"
                          : "Paid online"}
                      </span>
                    </>
                  }
                  meta={
                    <>
                      Placed:{" "}
                      <span className="font-medium text-slate-700">
                        {formatShortDateTime(order.placedAt)}
                      </span>
                    </>
                  }
                />

                <div className="flex items-start gap-4 pt-1">
                  <div className="relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-md border border-slate-200 bg-slate-50">
                    {firstItem?.imageUrl ? (
                      <Image
                        alt={firstItem.productName}
                        className="object-cover"
                        fill
                        src={firstItem.imageUrl}
                      />
                    ) : (
                      <Package className="text-slate-400" size={22} />
                    )}
                  </div>
                  <PortalCardTitle
                    className="pb-0 pt-0"
                    href={`/user/orders/${order.id}`}
                    subtitle={`${unitCount} item${unitCount === 1 ? "" : "s"} across ${order.items.length} line${order.items.length === 1 ? "" : "s"}`}
                  >
                    {title}
                  </PortalCardTitle>
                </div>

                <div className="pt-4">
                  <PortalCardFooter
                    actions={
                      <PortalDetailAction href={`/user/orders/${order.id}`} />
                    }
                    facts={
                      <>
                        <PortalFact
                          emphasis
                          icon={Wallet}
                          label="Order Total"
                          tone="brand"
                          value={formatCurrencyUsd(Number(order.totalUsd))}
                        />
                        <PortalFact
                          icon={Truck}
                          label="Tracking"
                          placeholder="Not dispatched yet"
                          truncate
                          value={
                            order.trackingNumber
                              ? `${order.shippingProvider ? `${order.shippingProvider} · ` : ""}${order.trackingNumber}`
                              : undefined
                          }
                        />
                        <PortalFact
                          icon={Receipt}
                          label="Invoice"
                          placeholder="Not issued"
                          tone={invoice ? "success" : "neutral"}
                          value={invoice?.businessId || invoice?.id}
                        />
                      </>
                    }
                  />
                </div>
              </PortalCard>
            );
          })}

          {totalPages > 1 ? (
            <PortalPager
              isBusy={isFetching}
              onPageChange={setPage}
              page={currentPage}
              total={meta?.total}
              totalLabel="orders"
              totalPages={totalPages}
            />
          ) : null}
        </PortalList>
      )}
    </div>
  );
}
