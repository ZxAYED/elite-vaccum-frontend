"use client";

import {
  ChevronRight,
  Download,
  Eye,
  FileText,
  Loader2,
  MoreHorizontal,
  Package,
  Settings2,
  Truck,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  AdminPageHeader,
  AdminPageShell,
  AdminStatCard,
  AdminSurface,
} from "@/components/admin/AdminPageShell";
import { AdminSearchInput } from "@/components/admin/AdminSearchInput";
import { StatusBadge } from "@/components/customer-portal/StatusBadge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { readApiMessage } from "@/lib/api-error";
import { toStatusSlug } from "@/lib/customer-orders";
import { downloadReportCsv } from "@/lib/exportCsv";
import { formatCurrencyUsd, formatShortDate } from "@/lib/formatters";
import {
  ADMIN_CANCELLABLE_STATUSES,
  useCancelOrderMutation,
  useGetAdminOrdersListQuery,
  type GetStoreOrdersParams,
  type StoreOrderDto,
  type StoreOrderStatus,
} from "@/redux/api/ordersApi";

/**
 * Store orders are PRODUCT orders only. Service work is managed from
 * `/admin/service-requests` (and the service orders it spawns) — it never
 * appears in this list, so there is no order "type" to filter on.
 */

const PAGE_SIZE = 15;

const STATUS_OPTIONS: Array<{ label: string; value: StoreOrderStatus | "all" }> = [
  { label: "All Statuses", value: "all" },
  { label: "Pending payment", value: "PENDING" },
  { label: "Paid", value: "PAID" },
  { label: "Processing", value: "PROCESSING" },
  { label: "Shipped", value: "SHIPPED" },
  { label: "Out for delivery", value: "OUT_FOR_DELIVERY" },
  { label: "Delivered", value: "DELIVERED" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Failed", value: "FAILED" },
  { label: "Cancelled", value: "CANCELLED" },
  { label: "Refunded", value: "REFUNDED" },
];

/** The API sorts server-side; these are the fields it accepts. */
const SORT_OPTIONS = [
  { label: "Newest first", value: "placedAt:desc" },
  { label: "Oldest first", value: "placedAt:asc" },
  { label: "Amount high-low", value: "totalUsd:desc" },
  { label: "Amount low-high", value: "totalUsd:asc" },
] as const;

function OrdersRowActions({
  order,
  onCancel,
}: {
  order: StoreOrderDto;
  onCancel: (order: StoreOrderDto) => void;
}) {
  const router = useRouter();
  const href = `/admin/orders/${order.id}`;
  const canCancel = ADMIN_CANCELLABLE_STATUSES.includes(order.status);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label={`Open actions for ${order.businessId || order.id}`}
          className="inline-flex size-10 items-center justify-center rounded-xl border border-teal-100 bg-white text-slate-600 transition hover:border-teal-200 hover:bg-teal-50 hover:text-primary"
          type="button"
        >
          <MoreHorizontal size={18} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Order Actions</DropdownMenuLabel>
        <DropdownMenuItem onSelect={() => router.push(href)}>
          <Eye size={16} />
          View
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => router.push(`${href}#status`)}>
          <Settings2 size={16} />
          Update Status
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => router.push(`${href}#shipping`)}>
          <Truck size={16} />
          Shipping / Tracking
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => router.push(`${href}#billing`)}>
          <FileText size={16} />
          Invoices &amp; Refunds
        </DropdownMenuItem>
        {canCancel ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-rose-700 focus:bg-rose-50 focus:text-rose-800"
              onSelect={() => onCancel(order)}
            >
              <XCircle size={16} />
              Cancel
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AdminOrdersClient() {
  const [status, setStatus] = useState<StoreOrderStatus | "all">("all");
  const [searchInput, setSearchInput] = useState("");
  const [sort, setSort] = useState<(typeof SORT_OPTIONS)[number]["value"]>(
    "placedAt:desc",
  );
  const [page, setPage] = useState(1);
  const [cancelTarget, setCancelTarget] = useState<StoreOrderDto | null>(null);

  const search = useDebouncedValue(searchInput.trim());

  const queryParams = useMemo<GetStoreOrdersParams>(() => {
    const [sortBy, sortOrder] = sort.split(":") as [string, "asc" | "desc"];
    return {
      page,
      limit: PAGE_SIZE,
      sortBy,
      sortOrder,
      ...(status !== "all" ? { status } : {}),
      ...(search ? { search } : {}),
    };
  }, [page, status, search, sort]);

  const { data, isLoading, isFetching, isError, refetch } =
    useGetAdminOrdersListQuery(queryParams);
  const [cancelOrder, { isLoading: isCancelling }] = useCancelOrderMutation();

  const orders = useMemo(() => data?.items ?? [], [data?.items]);
  const meta = data?.meta;
  const totalPages = Math.max(1, meta?.totalPages ?? 1);
  const hasFilters = status !== "all" || Boolean(search);

  /**
   * The list endpoint returns one page at a time, so these describe the page
   * on screen. Total order count is the only figure the API reports globally.
   */
  const pageStats = useMemo(() => {
    const revenue = orders.reduce(
      (sum, order) => sum + (Number(order.totalUsd) || 0),
      0,
    );
    const awaitingFulfilment = orders.filter((order) =>
      ["PAID", "PROCESSING"].includes(order.status),
    ).length;
    const inTransit = orders.filter((order) =>
      ["SHIPPED", "OUT_FOR_DELIVERY"].includes(order.status),
    ).length;
    const refunded = orders.filter(
      (order) => order.status === "REFUNDED",
    ).length;

    return [
      { label: "Total Orders", value: meta?.total ?? orders.length },
      { label: "Awaiting Fulfilment", value: awaitingFulfilment },
      { label: "In Transit", value: inTransit },
      { label: "Refunded", value: refunded },
      { label: "Page Revenue", value: formatCurrencyUsd(revenue) },
    ];
  }, [orders, meta?.total]);

  function changeFilter(next: Partial<{ status: StoreOrderStatus | "all"; search: string }>) {
    if (next.status !== undefined) setStatus(next.status);
    if (next.search !== undefined) setSearchInput(next.search);
    setPage(1);
  }

  /**
   * `PATCH /store/orders/:id/cancel` takes no body — there is nowhere to store
   * a reason, so this is a plain confirmation rather than a reason form.
   */
  async function confirmCancellation() {
    if (!cancelTarget) return;
    try {
      await cancelOrder(cancelTarget.id).unwrap();
      toast.success(
        `Order ${cancelTarget.businessId || cancelTarget.id} cancelled. Inventory restored.`,
      );
      setCancelTarget(null);
    } catch (err) {
      toast.error("Could not cancel this order", {
        description: readApiMessage(
          err,
          "This order can no longer be cancelled.",
        ),
      });
    }
  }

  return (
    <AdminPageShell>
      <AdminPageHeader
        eyebrow="Commerce"
        title="Product Orders"
        description="Store purchases of physical goods. Service jobs are managed under Service Requests."
        action={
          <Button
            variant="outline"
            size="sm"
            disabled={orders.length === 0}
            onClick={() =>
              downloadReportCsv("orders", orders, [
                {
                  header: "Order",
                  accessor: (r: StoreOrderDto) => r.businessId || r.id,
                },
                {
                  header: "Customer",
                  accessor: (r: StoreOrderDto) =>
                    r.customer?.displayName ?? r.customerId,
                },
                {
                  header: "Email",
                  accessor: (r: StoreOrderDto) => r.customer?.email ?? "",
                },
                { header: "Status", accessor: (r: StoreOrderDto) => r.status },
                {
                  header: "Payment",
                  accessor: (r: StoreOrderDto) => r.paymentMethod ?? "",
                },
                {
                  header: "Total ($)",
                  accessor: (r: StoreOrderDto) => r.totalUsd,
                },
                {
                  header: "Tracking",
                  accessor: (r: StoreOrderDto) => r.trackingNumber ?? "",
                },
                {
                  header: "Placed At",
                  accessor: (r: StoreOrderDto) => r.placedAt,
                },
              ])
            }
            className="flex items-center gap-2 border-teal-200 font-semibold text-teal-900 shadow-sm hover:border-teal-300"
          >
            <Download size={14} className="text-teal-700" />
            Export Page CSV
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {pageStats.map((item) => (
          <AdminStatCard key={item.label} label={item.label} value={item.value} />
        ))}
      </div>

      <AdminSurface className="space-y-4">
        <div className="grid gap-3 xl:grid-cols-[minmax(0,1.4fr)_220px_220px]">
          <AdminSearchInput
            value={searchInput}
            onChange={(value) => changeFilter({ search: value })}
            placeholder="Search by order number, tracking number, or customer name..."
            ariaLabel="Search orders"
          />

          <Select
            onValueChange={(value) =>
              changeFilter({ status: value as StoreOrderStatus | "all" })
            }
            value={status}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            onValueChange={(value) => {
              setSort(value as (typeof SORT_OPTIONS)[number]["value"]);
              setPage(1);
            }}
            value={sort}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sort Orders" />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-slate-500">
            <Loader2 className="mr-2 size-5 animate-spin text-teal-700" />
            Loading orders...
          </div>
        ) : isError ? (
          <EmptyState
            icon={Package}
            title="Orders unavailable"
            description="We couldn't reach the orders service. Please try again."
            action={{ label: "Retry", onClick: () => void refetch() }}
            tone="dashed"
            className="py-16"
          />
        ) : orders.length === 0 ? (
          <EmptyState
            icon={Package}
            title={hasFilters ? "No matching orders" : "No orders yet"}
            description={
              hasFilters
                ? "No orders matched the current filters."
                : "Customer purchases of store products will appear here."
            }
            action={
              hasFilters
                ? {
                    label: "Clear Filters",
                    onClick: () => changeFilter({ status: "all", search: "" }),
                  }
                : undefined
            }
            tone="dashed"
            className="py-16"
          />
        ) : (
          <div className={isFetching ? "opacity-60 transition-opacity" : undefined}>
            <div className="hidden overflow-hidden rounded-lg border border-teal-100 xl:block">
              <div className="grid grid-cols-[170px_1.1fr_1.3fr_130px_150px_120px_96px] bg-teal-50/60 px-5 py-3 text-xs font-bold uppercase tracking-[0.24em] text-slate-500">
                <span>Order</span>
                <span>Customer</span>
                <span>Items</span>
                <span>Total</span>
                <span>Status</span>
                <span>Placed</span>
                <span className="text-right">Actions</span>
              </div>
              <div className="divide-y divide-teal-100 bg-white">
                {orders.map((order) => (
                  <div
                    className="grid grid-cols-[170px_1.1fr_1.3fr_130px_150px_120px_96px] items-center gap-4 px-5 py-4"
                    key={order.id}
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-950">
                        {order.businessId || order.id}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {order.paymentMethod === "COD"
                          ? "Cash on delivery"
                          : "Paid online"}
                      </p>
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-900">
                        {order.customer?.displayName || "Customer"}
                      </p>
                      <p className="truncate text-sm text-slate-500">
                        {order.customer?.email || order.customerId}
                      </p>
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-900">
                        {order.items[0]?.productName || "No items"}
                      </p>
                      <p className="truncate text-sm text-slate-500">
                        {order.items.length} line
                        {order.items.length === 1 ? "" : "s"}
                        {order.trackingNumber
                          ? ` · ${order.trackingNumber}`
                          : ""}
                      </p>
                    </div>
                    <p className="font-semibold text-slate-950">
                      {formatCurrencyUsd(Number(order.totalUsd))}
                    </p>
                    <StatusBadge status={toStatusSlug(order.status)} />
                    <p className="text-sm text-slate-600">
                      {formatShortDate(order.placedAt)}
                    </p>
                    <div className="flex justify-end">
                      <OrdersRowActions order={order} onCancel={setCancelTarget} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 xl:hidden">
              {orders.map((order) => (
                <div
                  className="rounded-lg border border-teal-100 bg-white p-4 shadow-[0_16px_42px_-34px_rgba(28,79,80,0.22)]"
                  key={order.id}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-2">
                      <StatusBadge status={toStatusSlug(order.status)} />
                      <p className="text-lg font-semibold text-slate-950">
                        {order.businessId || order.id}
                      </p>
                      <p className="text-sm text-slate-500">
                        {formatShortDate(order.placedAt)}
                      </p>
                    </div>
                    <OrdersRowActions order={order} onCancel={setCancelTarget} />
                  </div>

                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                        Customer
                      </p>
                      <p className="mt-2 font-medium text-slate-900">
                        {order.customer?.displayName || "Customer"}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {order.customer?.email || order.customerId}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                        Items
                      </p>
                      <p className="mt-2 font-medium text-slate-900">
                        {order.items[0]?.productName || "No items"}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {order.items.length} line
                        {order.items.length === 1 ? "" : "s"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-4 py-3">
                    <span className="font-semibold text-slate-950">
                      {formatCurrencyUsd(Number(order.totalUsd))}
                    </span>
                    <Link
                      className="inline-flex items-center gap-2 text-sm font-semibold text-teal-800"
                      href={`/admin/orders/${order.id}`}
                    >
                      View
                      <ChevronRight size={16} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 ? (
              <div className="mt-4 flex items-center justify-between rounded-lg border border-teal-100 bg-white px-4 py-3 text-xs">
                <span className="text-slate-500">
                  Page {meta?.page ?? page} of {totalPages}
                  {meta?.total ? ` · ${meta.total} orders` : ""}
                </span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={(meta?.page ?? page) <= 1 || isFetching}
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                  >
                    Previous
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={(meta?.page ?? page) >= totalPages || isFetching}
                    onClick={() => setPage((current) => current + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </AdminSurface>

      <Dialog
        open={Boolean(cancelTarget)}
        onOpenChange={(open) => {
          if (!open) setCancelTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Order</DialogTitle>
            <DialogDescription>
              Cancel {cancelTarget?.businessId || cancelTarget?.id}? Stock is
              restored and any unpaid invoice is voided. This does{" "}
              <strong>not</strong> refund a paid order — use Invoices &amp;
              Refunds on the order for that. The order stays in history.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button onClick={() => setCancelTarget(null)} variant="outline">
              Keep Order
            </Button>
            <Button
              disabled={isCancelling}
              onClick={confirmCancellation}
              variant="destructive"
            >
              {isCancelling ? "Cancelling..." : "Confirm Cancellation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminPageShell>
  );
}
