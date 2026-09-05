"use client";

import {
  CalendarDays,
  ChevronRight,
  ClipboardList,
  Eye,
  FileText,
  MoreHorizontal,
  Package,
  Settings2,
  Truck,
  Wrench,
  XCircle,
  Download,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { downloadReportCsv } from "@/lib/exportCsv";

import {
  AdminPageHeader,
  AdminPageShell,
  AdminStatCard,
  AdminSurface,
} from "@/components/admin/AdminPageShell";
import { AdminSearchInput } from "@/components/admin/AdminSearchInput";
import { StatusBadge } from "@/components/customer-portal/StatusBadge";
import { TypeBadge } from "@/components/customer-portal/TypeBadge";
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
import { Textarea } from "@/components/ui/Textarea";
import {
  getAdminOrderCounts,
  getAdminOrderCustomer,
  getAdminOrders,
  type AdminOrdersStatusFilter,
  type AdminOrdersTypeFilter,
  isActiveOrderStatus,
  isCancelledOrderStatus,
} from "@/data/mock/admin-orders";
import { useSharedBusinessStoreVersion } from "@/hooks/useSharedBusinessStoreVersion";
import { formatCurrencyUsd, formatShortDate } from "@/lib/formatters";
import {
  useGetAdminOrdersListQuery,
  useCancelOrderMutation,
} from "@/redux/api/ordersApi";
import type {
  AdminProductOrder,
  AdminUnifiedOrder,
  ProductOrderStatus,
} from "@/types/domain";

type OrderSortValue =
  | "newest"
  | "oldest"
  | "amount-high-low"
  | "amount-low-high";

interface CancellationDraft {
  orderId: string;
  reason: string;
  note: string;
  error: string;
}

const cancelReasons = [
  "Customer requested cancellation",
  "Payment issue",
  "Inventory unavailable",
  "Scheduling conflict",
  "Duplicate order",
  "Other",
];

function getOrderTotal(order: AdminUnifiedOrder) {
  return order.total.totalUsd;
}

function getOrderSummary(order: AdminUnifiedOrder) {
  if (order.type === "PRODUCT") {
    const firstItem = order.items[0];
    return {
      title: firstItem?.name ?? "Product order",
      meta: `${order.items.length} item${order.items.length === 1 ? "" : "s"}`,
      detail: order.items
        .slice(0, 2)
        .map((item) => item.name)
        .join(" • "),
    };
  }

  return {
    title: order.serviceName,
    meta: order.currentSchedule.label,
    detail: order.problemSummary,
  };
}

function getCustomerSummary(order: AdminUnifiedOrder) {
  const customer = getAdminOrderCustomer(order);
  return {
    name: customer?.displayName ?? "Unknown customer",
    email: customer?.email ?? "No email",
    phone: customer?.phone ?? "No phone",
  };
}

function getStatusFilterMatch(
  order: AdminUnifiedOrder,
  statusFilter: AdminOrdersStatusFilter,
) {
  if (statusFilter === "all") return true;
  if (statusFilter === "active") return isActiveOrderStatus(order.status);
  if (statusFilter === "cancelled") return isCancelledOrderStatus(order.status);
  return !isActiveOrderStatus(order.status) && !isCancelledOrderStatus(order.status);
}

function toSortValue(order: AdminUnifiedOrder) {
  return new Date(order.createdAt).getTime();
}

function summaryMatches(order: AdminUnifiedOrder, search: string) {
  const customer = getCustomerSummary(order);
  const summary = getOrderSummary(order);
  const haystack = [
    order.id,
    customer.name,
    customer.email,
    customer.phone,
    summary.title,
    summary.detail,
    order.type === "SERVICE" ? order.serviceRequestId : "",
    order.type === "SERVICE" ? order.quotationId : "",
    order.type === "PRODUCT"
      ? order.items.map((item) => item.sku).join(" ")
      : order.equipment?.modelNumber ?? "",
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(search);
}

function getOrderActionLabel(order: AdminUnifiedOrder) {
  if (order.type === "PRODUCT") return "View Invoice";
  if (order.status === "scheduled" || order.status === "technician-assigned") {
    return "Manage Schedule";
  }
  return order.quotationId ? "View Quotation" : "View Order";
}

function OrdersRowActions({
  order,
  onCancel,
}: {
  order: AdminUnifiedOrder;
  onCancel: (orderId: string) => void;
}) {
  const router = useRouter();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label={`Open actions for ${order.id}`}
          className="inline-flex size-10 items-center justify-center rounded-xl border border-teal-100 bg-white text-slate-600 transition hover:border-teal-200 hover:bg-teal-50 hover:text-primary"
          type="button"
        >
          <MoreHorizontal size={18} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Order Actions</DropdownMenuLabel>
        <DropdownMenuItem onSelect={() => router.push(`/admin/orders/${order.id}`)}>
          <Eye size={16} />
          View
        </DropdownMenuItem>
        {order.type === "PRODUCT" ? (
          <>
            <DropdownMenuItem
              onSelect={() => router.push(`/admin/orders/${order.id}#status`)}
            >
              <Settings2 size={16} />
              Update Status
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => router.push(`/admin/orders/${order.id}#shipping`)}
            >
              <Truck size={16} />
              Shipping / Tracking
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => router.push(`/admin/orders/${order.id}#billing`)}
            >
              <FileText size={16} />
              View Invoice
            </DropdownMenuItem>
          </>
        ) : (
          <>
            <DropdownMenuItem
              onSelect={() => router.push(`/admin/orders/${order.id}#technician`)}
            >
              <Wrench size={16} />
              {order.technicianId ? "Change Technician" : "Assign Technician"}
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => router.push(`/admin/orders/${order.id}#schedule`)}
            >
              <CalendarDays size={16} />
              Manage Schedule
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() =>
                router.push(`/admin/service-requests/${order.serviceRequestId}`)
              }
            >
              <ClipboardList size={16} />
              View Request
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() =>
                router.push(`/admin/quotations/${order.quotationId}`)
              }
            >
              <FileText size={16} />
              View Quotation
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => router.push(`/admin/orders/${order.id}#billing`)}
            >
              <Package size={16} />
              View Invoice
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-rose-700 focus:bg-rose-50 focus:text-rose-800"
          onSelect={() => onCancel(order.id)}
        >
          <XCircle size={16} />
          Cancel
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AdminOrdersClient() {
  useSharedBusinessStoreVersion();
  const [typeFilter, setTypeFilter] = useState<AdminOrdersTypeFilter>("ALL");
  const [statusFilter, setStatusFilter] =
    useState<AdminOrdersStatusFilter>("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<OrderSortValue>("newest");
  const [cancellationDraft, setCancellationDraft] =
    useState<CancellationDraft | null>(null);
  const [cancelledOrderIds, setCancelledOrderIds] = useState<string[]>([]);

  const queryParams = useMemo(() => {
    const p: { status?: string; search?: string } = {};
    if (statusFilter !== "all") {
      p.status = statusFilter.toUpperCase();
    }
    if (search.trim()) {
      p.search = search.trim();
    }
    return p;
  }, [statusFilter, search]);

  const { data: apiOrdersData } = useGetAdminOrdersListQuery(queryParams);
  const [cancelOrderApi] = useCancelOrderMutation();

  const orders = useMemo(() => {
    const synced = getAdminOrders();
    const liveItems = apiOrdersData?.items;

    let combined = [...synced];
    if (liveItems && liveItems.length > 0) {
      const liveOrders: AdminProductOrder[] = liveItems.map((so) => ({
        id: so.businessId || so.id,
        type: "PRODUCT" as const,
        customerId: so.customerId || "cust-live",
        status: (so.status.toLowerCase() as ProductOrderStatus) || "pending",
        total: {
          subtotalUsd: Number(so.subtotalUsd) || 0,
          shippingUsd: Number(so.shippingFeeUsd) || 0,
          taxUsd: Number(so.taxUsd) || 0,
          totalUsd: Number(so.totalUsd) || 0,
        },
        createdAt: so.createdAt,
        invoiceId: `INV-${so.businessId || so.id}`,
        paymentStatus: so.status === "PENDING" ? "authorized" : "paid",
        items: so.items.map((item, idx) => ({
          id: `item-${idx}`,
          productId: item.productId,
          name: item.name,
          sku: item.sku || "SKU-LIVE",
          summary: item.name,
          quantity: item.quantity,
          unitPriceUsd: Number(item.priceUsd) || 0,
          imageSrc: item.imageUrl || "/product.png",
        })),
        shippingAddress: {
          id: so.deliveryAddress?.id || "addr-live",
          label: so.deliveryAddress?.label || "Shipping Address",
          line1: so.deliveryAddress?.line1 || "742 Evergreen Terrace",
          city: so.deliveryAddress?.city || "Springfield",
          state: so.deliveryAddress?.state || "OR",
          postalCode: so.deliveryAddress?.postalCode || "97477",
          country: so.deliveryAddress?.country || "USA",
        },
        shippingTimeline: [],
      }));

      const liveIds = new Set(liveOrders.map((o) => o.id));
      combined = [...liveOrders, ...synced.filter((o) => !liveIds.has(o.id))];
    }

    return combined.map((order) => {
      if (!cancelledOrderIds.includes(order.id)) return order;
      return {
        ...order,
        status: "cancelled",
        cancellation: order.cancellation ?? {
          cancelledAt: new Date().toISOString(),
          reason: "Cancelled in admin preview",
        },
      } as AdminUnifiedOrder;
    });
  }, [apiOrdersData, cancelledOrderIds]);

  const filteredOrders = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return [...orders]
      .filter((order) => typeFilter === "ALL" || order.type === typeFilter)
      .filter((order) => getStatusFilterMatch(order, statusFilter))
      .filter((order) =>
        normalizedSearch ? summaryMatches(order, normalizedSearch) : true,
      )
      .sort((left, right) => {
        if (sort === "newest") return toSortValue(right) - toSortValue(left);
        if (sort === "oldest") return toSortValue(left) - toSortValue(right);
        if (sort === "amount-high-low") {
          return getOrderTotal(right) - getOrderTotal(left);
        }
        return getOrderTotal(left) - getOrderTotal(right);
      });
  }, [orders, search, sort, statusFilter, typeFilter]);

  const compactCounts = useMemo(() => {
    const orderCounts = getAdminOrderCounts();
    return [
      { label: "All", value: orderCounts.all },
      { label: "Product", value: orderCounts.product },
      { label: "Service", value: orderCounts.service },
      {
        label: "Active",
        value: orders.filter((order) => isActiveOrderStatus(order.status)).length,
      },
      {
        label: "Completed",
        value: orders.filter(
          (order) =>
            !isActiveOrderStatus(order.status) &&
            !isCancelledOrderStatus(order.status),
        ).length,
      },
    ];
  }, [orders]);

  function openCancellation(orderId: string) {
    setCancellationDraft({
      orderId,
      reason: "",
      note: "",
      error: "",
    });
  }

  async function submitCancellation() {
    if (!cancellationDraft) return;
    if (!cancellationDraft.reason) {
      setCancellationDraft((current) =>
        current
          ? { ...current, error: "Select a cancellation reason." }
          : current,
      );
      return;
    }
    const targetId = cancellationDraft.orderId;
    setCancelledOrderIds((current) =>
      current.includes(targetId) ? current : [...current, targetId],
    );
    try {
      await cancelOrderApi(targetId).unwrap();
    } catch {
      // Fallback gracefully for local mock orders
    }
    setCancellationDraft(null);
  }

  return (
    <AdminPageShell>
      <AdminPageHeader
        eyebrow="Commerce"
        title="Orders"
        description="Manage product purchases and accepted service work from one unified order system."
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              downloadReportCsv(
                "orders",
                orders,
                [
                  { header: "Order ID", accessor: (r: AdminUnifiedOrder) => r.id },
                  { header: "Type", accessor: (r: AdminUnifiedOrder) => r.type },
                  { header: "Customer ID", accessor: (r: AdminUnifiedOrder) => r.customerId },
                  { header: "Status", accessor: (r: AdminUnifiedOrder) => r.status },
                  { header: "Total ($)", accessor: (r: AdminUnifiedOrder) => r.total.totalUsd },
                  { header: "Created At", accessor: (r: AdminUnifiedOrder) => r.createdAt },
                ],
              )
            }
            className="flex items-center gap-2 border-teal-200 font-semibold text-teal-900 shadow-sm hover:border-teal-300"
          >
            <Download size={14} className="text-teal-700" />
            Export Orders CSV
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {compactCounts.map((item) => (
          <AdminStatCard key={item.label} label={item.label} value={item.value} />
        ))}
      </div>

      <AdminSurface className="space-y-4">
        <div className="grid gap-3 xl:grid-cols-[minmax(0,1.2fr)_220px_220px_220px]">
          <AdminSearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by order ID, customer, email, phone, service, or product..."
            ariaLabel="Search orders"
          />

          <Select
            onValueChange={(value) =>
              setTypeFilter(value as AdminOrdersTypeFilter)
            }
            value={typeFilter}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Types</SelectItem>
              <SelectItem value="PRODUCT">Products</SelectItem>
              <SelectItem value="SERVICE">Services</SelectItem>
            </SelectContent>
          </Select>

          <Select
            onValueChange={(value) =>
              setStatusFilter(value as AdminOrdersStatusFilter)
            }
            value={statusFilter}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          <Select
            onValueChange={(value) => setSort(value as OrderSortValue)}
            value={sort}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sort Orders" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
              <SelectItem value="amount-high-low">Amount High-Low</SelectItem>
              <SelectItem value="amount-low-high">Amount Low-High</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {filteredOrders.length === 0 ? (
          <EmptyState
            icon={Package}
            title={search ? "No matching orders" : "No orders found"}
            description={
              search
                ? `No orders matched "${search}". Try adjusting your search query or reset filters.`
                : "Customer merchandise purchases and approved service orders will appear in this unified commerce feed."
            }
            action={
              search
                ? {
                    label: "Clear Search",
                    onClick: () => setSearch(""),
                  }
                : undefined
            }
            tone="dashed"
            className="py-16"
          />
        ) : (
          <>
            <div className="hidden overflow-hidden rounded-lg border border-teal-100 xl:block">
              <div className="grid grid-cols-[160px_120px_1.1fr_1.4fr_140px_140px_120px_96px] bg-teal-50/60 px-5 py-3 text-xs font-bold uppercase tracking-[0.24em] text-slate-500">
                <span>Order</span>
                <span>Type</span>
                <span>Customer</span>
                <span>Summary</span>
                <span>Total</span>
                <span>Status</span>
                <span>Date</span>
                <span className="text-right">Actions</span>
              </div>
              <div className="divide-y divide-teal-100 bg-white">
                {filteredOrders.map((order) => {
                  const customer = getCustomerSummary(order);
                  const summary = getOrderSummary(order);

                  return (
                    <div
                      className="grid grid-cols-[160px_120px_1.1fr_1.4fr_140px_140px_120px_96px] items-center gap-4 px-5 py-4"
                      key={order.id}
                    >
                      <div>
                        <p className="font-semibold text-slate-950">{order.id}</p>
                        {order.type === "SERVICE" ? (
                          <p className="mt-1 text-xs text-slate-500">
                            Request {order.serviceRequestId}
                          </p>
                        ) : (
                          <p className="mt-1 text-xs text-slate-500">
                            {order.items.length} item{order.items.length === 1 ? "" : "s"}
                          </p>
                        )}
                      </div>
                      <TypeBadge type={order.type} />
                      <div className="min-w-0">
                        <p className="truncate font-medium text-slate-900">
                          {customer.name}
                        </p>
                        <p className="truncate text-sm text-slate-500">
                          {customer.email}
                        </p>
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-slate-900">
                          {summary.title}
                        </p>
                        <p className="truncate text-sm text-slate-500">
                          {summary.meta}
                        </p>
                      </div>
                      <p className="font-semibold text-slate-950">
                        {formatCurrencyUsd(getOrderTotal(order))}
                      </p>
                      <StatusBadge status={order.status} />
                      <p className="text-sm text-slate-600">
                        {formatShortDate(order.createdAt)}
                      </p>
                      <div className="flex justify-end">
                        <OrdersRowActions order={order} onCancel={openCancellation} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-4 xl:hidden">
              {filteredOrders.map((order) => {
                const customer = getCustomerSummary(order);
                const summary = getOrderSummary(order);

                return (
                  <div
                    className="rounded-lg border border-teal-100 bg-white p-4 shadow-[0_16px_42px_-34px_rgba(28,79,80,0.22)]"
                    key={order.id}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <TypeBadge type={order.type} />
                          <StatusBadge status={order.status} />
                        </div>
                        <p className="text-lg font-semibold text-slate-950">{order.id}</p>
                        <p className="text-sm text-slate-500">
                          {formatShortDate(order.createdAt)}
                        </p>
                      </div>
                      <OrdersRowActions order={order} onCancel={openCancellation} />
                    </div>

                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                          Customer
                        </p>
                        <p className="mt-2 font-medium text-slate-900">{customer.name}</p>
                        <p className="mt-1 text-sm text-slate-500">{customer.email}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                          Summary
                        </p>
                        <p className="mt-2 font-medium text-slate-900">{summary.title}</p>
                        <p className="mt-1 text-sm text-slate-500">{summary.meta}</p>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-4 py-3">
                      <span className="text-sm text-slate-500">
                        {getOrderActionLabel(order)}
                      </span>
                      <div className="flex items-center gap-4">
                        <span className="font-semibold text-slate-950">
                          {formatCurrencyUsd(getOrderTotal(order))}
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
                  </div>
                );
              })}
            </div>
          </>
        )}
      </AdminSurface>

      <Dialog
        open={Boolean(cancellationDraft)}
        onOpenChange={(open) => {
          if (!open) setCancellationDraft(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Order</DialogTitle>
            <DialogDescription>
              Cancellation remains in order history. Orders are not deleted.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-900">
                Reason <span className="text-rose-600">*</span>
              </label>
              <Select
                onValueChange={(value) =>
                  setCancellationDraft((current) =>
                    current ? { ...current, reason: value, error: "" } : current,
                  )
                }
                value={cancellationDraft?.reason ?? ""}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a cancellation reason" />
                </SelectTrigger>
                <SelectContent>
                  {cancelReasons.map((reason) => (
                    <SelectItem key={reason} value={reason}>
                      {reason}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {cancellationDraft?.error ? (
                <p className="text-sm text-rose-700">{cancellationDraft.error}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-900">
                Note
              </label>
              <Textarea
                onChange={(event) =>
                  setCancellationDraft((current) =>
                    current ? { ...current, note: event.target.value } : current,
                  )
                }
                placeholder="Optional cancellation note"
                value={cancellationDraft?.note ?? ""}
              />
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => setCancellationDraft(null)} variant="outline">
              Keep Order
            </Button>
            <Button onClick={submitCancellation} variant="destructive">
              Confirm Cancellation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminPageShell>
  );
}
