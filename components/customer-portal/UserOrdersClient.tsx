"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Package,
  Receipt,
  ShoppingBag,
  Truck,
} from "lucide-react";

import { PageHeader } from "@/components/customer-portal/PageHeader";
import {
  columnClass,
  PortalCell,
  PortalRecordCell,
  PortalRow,
  PortalRowActions,
  PortalTable,
  PortalTableSkeleton,
  PortalValue,
  type PortalColumn,
} from "@/components/customer-portal/PortalTable";
import {
  PortalDetailAction,
  PortalFilterBar,
  PortalPager,
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

/**
 * Ordered to match the cells below; the indices are referenced directly so a
 * column and its cells can never drift out of alignment. Secondary detail
 * (dispatch, invoice number) drops away on narrow viewports — all of it is
 * still on the order's own screen.
 */
const ORDER_COLUMNS: ReadonlyArray<PortalColumn> = [
  { key: "order", label: "Order" },
  { key: "status", label: "Status" },
  { key: "placed", label: "Placed", hideBelow: "lg" },
  { key: "total", label: "Total", align: "right" },
  { key: "tracking", label: "Tracking", hideBelow: "lg" },
  { key: "invoice", label: "Invoice", hideBelow: "lg" },
  { key: "actions", label: "Actions", align: "actions" },
];

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
        <PortalTableSkeleton columns={ORDER_COLUMNS} />
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
        <PortalTable
          caption="Your product orders, with payment and delivery status"
          columns={ORDER_COLUMNS}
          footer={
            totalPages > 1 ? (
              <PortalPager
                isBusy={isFetching}
                onPageChange={setPage}
                page={currentPage}
                total={meta?.total}
                totalLabel="orders"
                totalPages={totalPages}
              />
            ) : null
          }
          isRefreshing={isFetching}
        >
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
              <PortalRow key={order.id}>
                <PortalCell className={columnClass(ORDER_COLUMNS[0])}>
                  <PortalRecordCell
                    href={`/user/orders/${order.id}`}
                    media={
                      <div className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md border border-slate-200 bg-slate-50">
                        {firstItem?.imageUrl ? (
                          <Image
                            alt={firstItem.productName}
                            className="object-cover"
                            fill
                            sizes="40px"
                            src={firstItem.imageUrl}
                          />
                        ) : (
                          <Package
                            aria-hidden="true"
                            className="text-slate-400"
                            size={18}
                          />
                        )}
                      </div>
                    }
                    subtitle={
                      <>
                        <span className="font-mono tabular-nums">
                          {orderRef}
                        </span>
                        {` · ${unitCount} item${unitCount === 1 ? "" : "s"}`}
                      </>
                    }
                    title={title}
                  />
                </PortalCell>

                <PortalCell className={columnClass(ORDER_COLUMNS[1])}>
                  <StatusBadge status={toStatusSlug(order.status)} />
                  <span className="mt-1 block text-sm font-medium text-slate-500">
                    {order.paymentMethod === "COD"
                      ? "Cash on delivery"
                      : "Paid online"}
                  </span>
                </PortalCell>

                <PortalCell className={columnClass(ORDER_COLUMNS[2])}>
                  <PortalValue value={formatShortDateTime(order.placedAt)} />
                </PortalCell>

                <PortalCell className={columnClass(ORDER_COLUMNS[3])}>
                  <PortalValue
                    emphasis
                    tone="brand"
                    value={formatCurrencyUsd(Number(order.totalUsd))}
                  />
                </PortalCell>

                <PortalCell className={columnClass(ORDER_COLUMNS[4])}>
                  <PortalValue
                    icon={Truck}
                    placeholder="Not dispatched"
                    truncate
                    value={
                      order.trackingNumber
                        ? `${order.shippingProvider ? `${order.shippingProvider} · ` : ""}${order.trackingNumber}`
                        : undefined
                    }
                  />
                </PortalCell>

                <PortalCell className={columnClass(ORDER_COLUMNS[5])}>
                  <PortalValue
                    icon={Receipt}
                    placeholder="Not issued"
                    tone={invoice ? "success" : "neutral"}
                    truncate
                    value={invoice?.businessId || invoice?.id}
                  />
                </PortalCell>

                <PortalCell className={columnClass(ORDER_COLUMNS[6])}>
                  <PortalRowActions>
                    <PortalDetailAction
                      href={`/user/orders/${order.id}`}
                      label="View"
                    />
                  </PortalRowActions>
                </PortalCell>
              </PortalRow>
            );
          })}
        </PortalTable>
      )}
    </div>
  );
}
