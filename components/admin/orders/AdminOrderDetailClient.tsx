"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  ClipboardList,
  CreditCard,
  FileImage,
  FileText,
  MapPin,
  Package,
  Settings2,
  ShieldCheck,
  Truck,
  UserRound,
  Video,
  Wrench,
  XCircle,
} from "lucide-react";
import { useState } from "react";

import {
  AdminPageHeader,
  AdminPageShell,
  AdminSurface,
} from "@/components/admin/AdminPageShell";
import { StatusBadge } from "@/components/customer-portal/StatusBadge";
import { TypeBadge } from "@/components/customer-portal/TypeBadge";
import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import {
  getAdminOrderById,
  getAdminOrderCustomer,
  getAdminOrderInvoice,
  getAdminOrderPayment,
  getTechnicianAvailabilityOptions,
} from "@/data/mock/admin-orders";
import { formatCurrencyUsd, formatLongDate, formatShortDate } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import type {
  AdminProductOrder,
  AdminServiceOrder,
  OrderTimelineStep,
  ProductOrderStatus,
  ServiceOrderStatus,
} from "@/types/domain";

const productStatuses: ProductOrderStatus[] = [
  "pending",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
];

const serviceStatuses: ServiceOrderStatus[] = [
  "scheduled",
  "rescheduled",
  "technician-assigned",
  "on-the-way",
  "arrived",
  "in-progress",
  "report-submitted",
  "completed",
  "cancelled",
];

function buildProductTimeline(status: ProductOrderStatus): OrderTimelineStep[] {
  const flow: ProductOrderStatus[] = [
    "pending",
    "paid",
    "processing",
    "shipped",
    "delivered",
  ];
  const activeIndex = flow.indexOf(status);

  return [
    {
      key: "pending",
      label: "Pending",
      detail: "Order placed",
      complete: activeIndex >= 0,
      active: status === "pending",
    },
    {
      key: "paid",
      label: "Paid",
      detail: "Payment captured",
      complete: activeIndex >= 1,
      active: status === "paid",
    },
    {
      key: "processing",
      label: "Processing",
      detail: "Warehouse handling",
      complete: activeIndex >= 2,
      active: status === "processing",
    },
    {
      key: "shipped",
      label: "Shipped",
      detail: "UPS in transit",
      complete: activeIndex >= 3,
      active: status === "shipped",
    },
    {
      key: "delivered",
      label: "Delivered",
      detail: "Customer received package",
      complete: activeIndex >= 4,
      active: status === "delivered",
    },
  ];
}

function buildServiceTimeline(
  status: ServiceOrderStatus,
  currentScheduleLabel: string,
  technicianLabel?: string,
): OrderTimelineStep[] {
  const flow: ServiceOrderStatus[] = [
    "scheduled",
    "technician-assigned",
    "on-the-way",
    "arrived",
    "in-progress",
    "report-submitted",
    "completed",
  ];
  const activeIndex = flow.indexOf(status);

  return [
    {
      key: "scheduled",
      label: "Scheduled",
      detail: currentScheduleLabel,
      complete: activeIndex >= 0,
      active: status === "scheduled" || status === "rescheduled",
      dateLabel: currentScheduleLabel,
    },
    {
      key: "technician-assigned",
      label: "Technician Assigned",
      detail: technicianLabel
        ? `${technicianLabel} assigned`
        : "Awaiting technician assignment",
      complete: activeIndex >= 1,
      active: status === "technician-assigned",
    },
    {
      key: "on-the-way",
      label: "On the Way",
      detail: "Technician traveling to the property",
      complete: activeIndex >= 2,
      active: status === "on-the-way",
    },
    {
      key: "arrived",
      label: "Arrived",
      detail: "Technician checked in onsite",
      complete: activeIndex >= 3,
      active: status === "arrived",
    },
    {
      key: "in-progress",
      label: "In Progress",
      detail: "Service work underway",
      complete: activeIndex >= 4,
      active: status === "in-progress",
    },
    {
      key: "report-submitted",
      label: "Report Submitted",
      detail: "Technician uploaded completion notes",
      complete: activeIndex >= 5,
      active: status === "report-submitted",
    },
    {
      key: "completed",
      label: "Completed",
      detail: "Order closed and ready for history",
      complete: activeIndex >= 6,
      active: status === "completed",
    },
  ];
}

function Timeline({ steps }: { steps: OrderTimelineStep[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-7">
      {steps.map((step) => (
        <div className="text-center" key={step.key}>
          <div
            className={cn(
              "mx-auto flex size-11 items-center justify-center rounded-full border-4",
              step.complete
                ? "border-teal-100 bg-primary text-white"
                : "border-slate-100 bg-slate-50 text-slate-400",
            )}
          >
            <Check size={16} />
          </div>
          <p className="mt-3 text-sm font-semibold text-slate-900">{step.label}</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">{step.detail}</p>
          {step.dateLabel ? (
            <p className="mt-1 text-[11px] text-slate-400">{step.dateLabel}</p>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function DetailList({
  rows,
}: {
  rows: Array<{ label: string; value: string }>;
}) {
  return (
    <dl className="grid gap-4 sm:grid-cols-2">
      {rows.map((row) => (
        <div key={row.label}>
          <dt className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
            {row.label}
          </dt>
          <dd className="mt-2 text-sm leading-6 text-slate-700">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

interface CancelState {
  reason: string;
  note: string;
  error: string;
}

export function AdminOrderDetailClient({ orderId }: { orderId: string }) {
  const sourceOrder = getAdminOrderById(orderId)!;

  const customer = getAdminOrderCustomer(sourceOrder);
  const invoice = getAdminOrderInvoice(sourceOrder);
  const payment = getAdminOrderPayment(sourceOrder);
  const technicianOptions = getTechnicianAvailabilityOptions();
  const [productOrder, setProductOrder] = useState<AdminProductOrder | null>(
    sourceOrder.type === "PRODUCT" ? sourceOrder : null,
  );
  const [serviceOrder, setServiceOrder] = useState<AdminServiceOrder | null>(
    sourceOrder.type === "SERVICE" ? sourceOrder : null,
  );
  const [trackingOpen, setTrackingOpen] = useState(false);
  const [technicianOpen, setTechnicianOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [selectedTechnicianId, setSelectedTechnicianId] = useState(
    sourceOrder.type === "SERVICE" ? sourceOrder.technicianId ?? "" : "",
  );
  const [cancelState, setCancelState] = useState<CancelState>({
    reason: "",
    note: "",
    error: "",
  });
  const [trackingDraft, setTrackingDraft] = useState(
    sourceOrder.type === "PRODUCT"
      ? {
          carrier: sourceOrder.tracking?.carrier ?? "",
          trackingNumber: sourceOrder.tracking?.trackingNumber ?? "",
          estimatedDelivery: sourceOrder.tracking?.estimatedDelivery ?? "",
        }
      : {
          carrier: "",
          trackingNumber: "",
          estimatedDelivery: "",
        },
  );

  const order = (productOrder ?? serviceOrder)!;
  const technicianLabel =
    order.type === "SERVICE"
      ? technicianOptions.find(
          (option) => option.technicianId === order.technicianId,
        )?.displayName
      : undefined;
  const timeline =
    order.type === "PRODUCT"
      ? buildProductTimeline(order.status)
      : buildServiceTimeline(
          order.status,
          order.currentSchedule.label ?? order.currentSchedule.date,
          technicianLabel,
        );

  function scrollToBilling() {
    document.getElementById("billing")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  function updateProductStatus(status: ProductOrderStatus) {
    setProductOrder((current) =>
      current
        ? {
            ...current,
            status,
            tracking: current.tracking
              ? {
                  ...current.tracking,
                  shippingStatus:
                    status === "refunded" || status === "cancelled"
                      ? current.tracking.shippingStatus
                      : status,
                }
              : current.tracking,
          }
        : current,
    );
  }

  function updateServiceStatus(status: ServiceOrderStatus) {
    setServiceOrder((current) =>
      current
        ? {
            ...current,
            status,
          }
        : current,
    );
  }

  function submitCancellation() {
    if (!cancelState.reason) {
      setCancelState((current) => ({
        ...current,
        error: "Select a cancellation reason.",
      }));
      return;
    }

    const cancellation = {
      cancelledAt: new Date().toISOString(),
      reason: cancelState.reason,
      note: cancelState.note || undefined,
    };

    if (productOrder) {
      setProductOrder({
        ...productOrder,
        status: "cancelled",
        cancellation,
      });
    }

    if (serviceOrder) {
      setServiceOrder({
        ...serviceOrder,
        status: "cancelled",
        cancellation,
      });
    }

    setCancelOpen(false);
  }

  return (
    <AdminPageShell>
      <AdminPageHeader
        eyebrow={order.type === "PRODUCT" ? "Product Order" : "Service Order"}
        title={order.id}
        description={
          order.type === "PRODUCT"
            ? `Placed ${formatLongDate(order.createdAt)}`
            : `Created from accepted quotation ${order.quotationId}`
        }
        action={
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="outline">
              <Link href="/admin/orders">
                <ArrowLeft size={16} />
                Back to Orders
              </Link>
            </Button>
            {order.type === "PRODUCT" ? (
              <>
                <Button onClick={() => setTrackingOpen(true)} variant="outline">
                  <Truck size={16} />
                  Edit Tracking
                </Button>
                <Button onClick={() => updateProductStatus("delivered")}>
                  Mark Delivered
                </Button>
              </>
            ) : (
              <>
                <Button onClick={() => setTechnicianOpen(true)} variant="outline">
                  <Wrench size={16} />
                  {serviceOrder?.technicianId
                    ? "Change Technician"
                    : "Assign Technician"}
                </Button>
                <Button onClick={() => setScheduleOpen(true)}>
                  <CalendarDays size={16} />
                  Manage Schedule
                </Button>
              </>
            )}
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <TypeBadge type={order.type} />
        <StatusBadge status={order.status} />
        {order.type === "PRODUCT" && order.paymentStatus ? (
          <StatusBadge status={order.paymentStatus} />
        ) : null}
        <span className="text-lg font-semibold text-slate-950">
          {formatCurrencyUsd(order.total.totalUsd)}
        </span>
      </div>

      <AdminSurface>
        <Timeline steps={timeline} />
      </AdminSurface>

      {order.type === "PRODUCT" ? (
        <ProductOrderDetail
          customerName={customer?.displayName ?? "Unknown customer"}
          onCancel={() => setCancelOpen(true)}
          onOpenBilling={scrollToBilling}
          onStatusChange={updateProductStatus}
          order={order}
        />
      ) : (
        <ServiceOrderDetail
          customerEmail={customer?.email ?? "No email provided"}
          customerName={customer?.displayName ?? "Unknown customer"}
          customerPhone={customer?.phone ?? "No phone provided"}
          onCancel={() => setCancelOpen(true)}
          onOpenBilling={scrollToBilling}
          onOpenSchedule={() => setScheduleOpen(true)}
          onOpenTechnician={() => setTechnicianOpen(true)}
          onStatusChange={updateServiceStatus}
          order={order}
        />
      )}

      <AdminSurface id="billing">
        <div className="flex items-center gap-3">
          <CreditCard className="text-teal-700" size={20} />
          <div>
            <h2 className="text-xl font-semibold text-slate-950">Billing Links</h2>
            <p className="text-sm text-slate-500">
              Invoice and payment references tied to this order.
            </p>
          </div>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
              Customer
            </p>
            <p className="mt-2 text-sm font-medium text-slate-900">
              {customer?.displayName ?? "Unknown customer"}
            </p>
            <Link
              className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-teal-800"
              href={`/admin/customers?customerId=${order.customerId}`}
            >
              View Customer
            </Link>
          </div>
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
              Invoice
            </p>
            <p className="mt-2 text-sm font-medium text-slate-900">
              {invoice?.id ?? order.invoiceId ?? "Pending invoice"}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {invoice
                ? formatCurrencyUsd(invoice.totals.totalUsd)
                : "No invoice issued yet"}
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
              Payment
            </p>
            <p className="mt-2 text-sm font-medium text-slate-900">
              {payment?.id ?? order.paymentId ?? "Pending payment"}
            </p>
            <p className="mt-1">
              <StatusBadge
                status={payment?.status ?? order.paymentStatus ?? "pending"}
              />
            </p>
          </div>
        </div>
      </AdminSurface>

      <Dialog open={trackingOpen} onOpenChange={setTrackingOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Shipping / Tracking</DialogTitle>
            <DialogDescription>
              Update carrier, UPS tracking, and estimated delivery for this product
              order.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-900">Carrier</label>
              <Input
                onChange={(event) =>
                  setTrackingDraft((current) => ({
                    ...current,
                    carrier: event.target.value,
                  }))
                }
                value={trackingDraft.carrier}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-900">
                Tracking Number
              </label>
              <Input
                onChange={(event) =>
                  setTrackingDraft((current) => ({
                    ...current,
                    trackingNumber: event.target.value,
                  }))
                }
                value={trackingDraft.trackingNumber}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-900">
                Estimated Delivery
              </label>
              <Input
                onChange={(event) =>
                  setTrackingDraft((current) => ({
                    ...current,
                    estimatedDelivery: event.target.value,
                  }))
                }
                type="date"
                value={trackingDraft.estimatedDelivery}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setTrackingOpen(false)} variant="outline">
              Close
            </Button>
            <Button
              onClick={() => {
                setProductOrder((current) =>
                  current
                    ? {
                        ...current,
                        tracking: {
                          ...current.tracking,
                          carrier: trackingDraft.carrier,
                          trackingNumber: trackingDraft.trackingNumber,
                          estimatedDelivery: trackingDraft.estimatedDelivery,
                          shippingStatus:
                            current.tracking?.shippingStatus ?? current.status,
                        },
                      }
                    : current,
                );
                setTrackingOpen(false);
              }}
            >
              Save Tracking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={technicianOpen} onOpenChange={setTechnicianOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Technician</DialogTitle>
            <DialogDescription>
              Choose from typed mock technician availability. Assignment updates the
              service order without changing the original requested schedule.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Select onValueChange={setSelectedTechnicianId} value={selectedTechnicianId}>
              <SelectTrigger>
                <SelectValue placeholder="Select technician" />
              </SelectTrigger>
              <SelectContent>
                {technicianOptions.map((option) => (
                  <SelectItem
                    disabled={!option.active && option.technicianId !== serviceOrder?.technicianId}
                    key={option.technicianId}
                    value={option.technicianId}
                  >
                    {option.displayName} • {option.availabilityLabel} • {option.jobsToday} jobs
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
              {selectedTechnicianId
                ? technicianOptions.find(
                    (option) => option.technicianId === selectedTechnicianId,
                  )?.availabilityLabel
                : "No technician selected."}
            </div>
          </div>
          <DialogFooter>
            {serviceOrder?.technicianId ? (
              <Button
                onClick={() => {
                  setServiceOrder((current) =>
                    current
                      ? {
                          ...current,
                          technicianId: undefined,
                          status: "scheduled",
                        }
                      : current,
                  );
                  setSelectedTechnicianId("");
                  setTechnicianOpen(false);
                }}
                variant="outline"
              >
                Remove Assignment
              </Button>
            ) : null}
            <Button onClick={() => setTechnicianOpen(false)} variant="outline">
              Close
            </Button>
            <Button
              disabled={!selectedTechnicianId}
              onClick={() => {
                setServiceOrder((current) =>
                  current
                    ? {
                        ...current,
                        technicianId: selectedTechnicianId,
                        status: "technician-assigned",
                      }
                    : current,
                );
                setTechnicianOpen(false);
              }}
            >
              Save Assignment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Schedule</DialogTitle>
            <DialogDescription>
              Full admin scheduling calendar is deferred to the next phase. This
              pass preserves and displays both the requested schedule and the
              current working schedule.
            </DialogDescription>
          </DialogHeader>
          {serviceOrder ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                  Requested Schedule
                </p>
                <p className="mt-2 text-sm font-medium text-slate-900">
                  {serviceOrder.requestedSchedule.label}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                  Current Schedule
                </p>
                <p className="mt-2 text-sm font-medium text-slate-900">
                  {serviceOrder.currentSchedule.label}
                </p>
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button onClick={() => setScheduleOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Order</DialogTitle>
            <DialogDescription>
              Cancelled orders remain in history with a reason and optional note.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-900">
                Reason <span className="text-rose-600">*</span>
              </label>
              <Select
                onValueChange={(value) =>
                  setCancelState((current) => ({
                    ...current,
                    reason: value,
                    error: "",
                  }))
                }
                value={cancelState.reason}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Customer requested cancellation">
                    Customer requested cancellation
                  </SelectItem>
                  <SelectItem value="Operational issue">Operational issue</SelectItem>
                  <SelectItem value="Payment issue">Payment issue</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
              {cancelState.error ? (
                <p className="text-sm text-rose-700">{cancelState.error}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-900">Note</label>
              <Textarea
                onChange={(event) =>
                  setCancelState((current) => ({
                    ...current,
                    note: event.target.value,
                  }))
                }
                value={cancelState.note}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setCancelOpen(false)} variant="outline">
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

function ProductOrderDetail({
  customerName,
  onCancel,
  onOpenBilling,
  onStatusChange,
  order,
}: {
  customerName: string;
  onCancel: () => void;
  onOpenBilling: () => void;
  onStatusChange: (status: ProductOrderStatus) => void;
  order: AdminProductOrder;
}) {
  return (
    <div className="grid gap-4 xl:grid-cols-[1.25fr_0.9fr]">
      <div className="space-y-4">
        <AdminSurface>
          <div className="flex items-center gap-3">
            <Package className="text-teal-700" size={20} />
            <div>
              <h2 className="text-xl font-semibold text-slate-950">Order Items</h2>
              <p className="text-sm text-slate-500">
                Customer {customerName} ordered {order.items.length} line item
                {order.items.length === 1 ? "" : "s"}.
              </p>
            </div>
          </div>
          <div className="mt-5 space-y-4">
            {order.items.map((item) => (
              <div
                className="flex flex-col gap-4 rounded-xl border border-teal-100 p-4 sm:flex-row sm:items-center sm:justify-between"
                key={item.id}
              >
                <div className="flex gap-4">
                  <div className="relative size-24 overflow-hidden rounded-xl bg-teal-50">
                    <Image
                      alt={item.name}
                      className="object-contain p-3"
                      fill
                      src={item.imageSrc}
                    />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-slate-950">{item.name}</p>
                    <p className="mt-1 text-sm text-slate-500">{item.summary}</p>
                    <p className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                      SKU {item.sku}
                    </p>
                    <p className="mt-2 text-sm text-slate-600">
                      Qty {item.quantity} • Unit {formatCurrencyUsd(item.unitPriceUsd)}
                    </p>
                  </div>
                </div>
                <p className="text-xl font-semibold text-slate-950">
                  {formatCurrencyUsd(item.quantity * item.unitPriceUsd)}
                </p>
              </div>
            ))}
          </div>
        </AdminSurface>

        <AdminSurface id="shipping">
          <div className="flex items-center gap-3">
            <Truck className="text-teal-700" size={20} />
            <div>
              <h2 className="text-xl font-semibold text-slate-950">Shipping</h2>
              <p className="text-sm text-slate-500">
                Carrier, UPS tracking, shipping status, and ETA.
              </p>
            </div>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                Address
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                {order.shippingAddress.line1}
                <br />
                {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
                {order.shippingAddress.postalCode}
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                Tracking
              </p>
              <p className="mt-2 text-sm font-medium text-slate-900">
                {order.tracking?.carrier ?? "UPS"}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                {order.tracking?.trackingNumber ?? "Pending"}
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                Estimated Delivery
              </p>
              <p className="mt-2 text-sm font-medium text-slate-900">
                {order.tracking?.estimatedDelivery
                  ? formatLongDate(order.tracking.estimatedDelivery)
                  : "Pending"}
              </p>
            </div>
          </div>
        </AdminSurface>
      </div>

      <div className="space-y-4">
        <AdminSurface id="status">
          <div className="flex items-center gap-3">
            <Settings2 className="text-teal-700" size={20} />
            <div>
              <h2 className="text-xl font-semibold text-slate-950">Order Status</h2>
              <p className="text-sm text-slate-500">
                Update product processing, shipment, delivery, and refund states.
              </p>
            </div>
          </div>
          <div className="mt-5 space-y-4">
            <Select onValueChange={onStatusChange} value={order.status}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {productStatuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status.replaceAll("-", " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="rounded-xl bg-slate-50 p-4">
              <StatusBadge status={order.status} />
              {order.cancellation ? (
                <p className="mt-3 text-sm text-slate-600">
                  Cancelled {formatShortDate(order.cancellation.cancelledAt)} •{" "}
                  {order.cancellation.reason}
                </p>
              ) : null}
            </div>
          </div>
        </AdminSurface>

        <AdminSurface>
          <h2 className="text-xl font-semibold text-slate-950">Order Summary</h2>
          <div className="mt-5 space-y-3 text-sm text-slate-600">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatCurrencyUsd(order.total.subtotalUsd)}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping</span>
              <span>
                {order.total.shippingUsd
                  ? formatCurrencyUsd(order.total.shippingUsd)
                  : "FREE"}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Tax</span>
              <span>{formatCurrencyUsd(order.total.taxUsd)}</span>
            </div>
            {order.total.discountUsd ? (
              <div className="flex justify-between">
                <span>Discount</span>
                <span>-{formatCurrencyUsd(order.total.discountUsd)}</span>
              </div>
            ) : null}
            <div className="flex justify-between border-t border-teal-100 pt-3 text-lg font-semibold text-slate-950">
              <span>Total</span>
              <span>{formatCurrencyUsd(order.total.totalUsd)}</span>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <Button onClick={onOpenBilling} variant="outline">
              <FileText size={16} />
              View Invoice / Payment
            </Button>
            <Button onClick={() => onStatusChange("shipped")} variant="outline">
              Mark Shipped
            </Button>
            <Button onClick={onCancel} variant="destructive">
              <XCircle size={16} />
              Cancel Order
            </Button>
          </div>
        </AdminSurface>
      </div>
    </div>
  );
}

function ServiceOrderDetail({
  customerEmail,
  customerName,
  customerPhone,
  onCancel,
  onOpenBilling,
  onOpenSchedule,
  onOpenTechnician,
  onStatusChange,
  order,
}: {
  customerEmail: string;
  customerName: string;
  customerPhone: string;
  onCancel: () => void;
  onOpenBilling: () => void;
  onOpenSchedule: () => void;
  onOpenTechnician: () => void;
  onStatusChange: (status: ServiceOrderStatus) => void;
  order: AdminServiceOrder;
}) {
  return (
    <div className="grid gap-4 xl:grid-cols-[1.2fr_0.9fr]">
      <div className="space-y-4">
        <AdminSurface>
          <div className="flex items-center gap-3">
            <UserRound className="text-teal-700" size={20} />
            <div>
              <h2 className="text-xl font-semibold text-slate-950">Customer</h2>
              <p className="text-sm text-slate-500">
                Contact details for the accepted service order.
              </p>
            </div>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                Name
              </p>
              <p className="mt-2 text-sm font-medium text-slate-900">{customerName}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                Phone
              </p>
              <p className="mt-2 text-sm text-slate-700">{customerPhone}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                Email
              </p>
              <p className="mt-2 text-sm text-slate-700">{customerEmail}</p>
            </div>
          </div>
        </AdminSurface>

        <AdminSurface>
          <div className="flex items-center gap-3">
            <ClipboardList className="text-teal-700" size={20} />
            <div>
              <h2 className="text-xl font-semibold text-slate-950">Service</h2>
              <p className="text-sm text-slate-500">
                Accepted service work created after quotation approval.
              </p>
            </div>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                Service Name
              </p>
              <p className="mt-2 text-sm font-medium text-slate-900">
                {order.serviceName}
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                Problem Summary
              </p>
              <p className="mt-2 text-sm text-slate-700">{order.problemSummary}</p>
            </div>
          </div>
        </AdminSurface>

        <AdminSurface>
          <div className="flex items-center gap-3">
            <MapPin className="text-teal-700" size={20} />
            <div>
              <h2 className="text-xl font-semibold text-slate-950">Location</h2>
              <p className="text-sm text-slate-500">
                Full service address and the unit/problem location.
              </p>
            </div>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                Service Address
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                {order.serviceLocation.line1}
                <br />
                {order.serviceLocation.city}, {order.serviceLocation.state}{" "}
                {order.serviceLocation.postalCode}
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                Problem / Unit Location
              </p>
              <p className="mt-2 text-sm text-slate-700">
                {order.problemLocation ?? "Not provided"}
              </p>
            </div>
          </div>
        </AdminSurface>

        <AdminSurface id="schedule">
          <div className="flex items-center gap-3">
            <CalendarDays className="text-teal-700" size={20} />
            <div>
              <h2 className="text-xl font-semibold text-slate-950">Schedule</h2>
              <p className="text-sm text-slate-500">
                Requested schedule is preserved separately from the current working
                schedule.
              </p>
            </div>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                Requested Schedule
              </p>
              <p className="mt-2 text-sm font-medium text-slate-900">
                {order.requestedSchedule.label}
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                Current Schedule
              </p>
              <p className="mt-2 text-sm font-medium text-slate-900">
                {order.currentSchedule.label}
              </p>
            </div>
          </div>
          <div className="mt-4">
            <Button onClick={onOpenSchedule} variant="outline">
              Manage Schedule
            </Button>
          </div>
        </AdminSurface>

        <AdminSurface>
          <div className="flex items-center gap-3">
            <ShieldCheck className="text-teal-700" size={20} />
            <div>
              <h2 className="text-xl font-semibold text-slate-950">Equipment</h2>
              <p className="text-sm text-slate-500">
                Manufacturer, model, serial, and unit placement.
              </p>
            </div>
          </div>
          <div className="mt-5">
            <DetailList
              rows={[
                {
                  label: "Manufacturer",
                  value: order.equipment?.manufacturer ?? "Not provided",
                },
                {
                  label: "Model",
                  value: order.equipment?.modelNumber ?? "Not provided",
                },
                {
                  label: "Serial Number",
                  value: order.equipment?.serialNumber ?? "Not provided",
                },
                {
                  label: "Unit Location",
                  value: order.equipment?.unitLocation ?? "Not provided",
                },
              ]}
            />
          </div>
        </AdminSurface>

        <AdminSurface>
          <div className="flex items-center gap-3">
            <FileImage className="text-teal-700" size={20} />
            <div>
              <h2 className="text-xl font-semibold text-slate-950">
                Customer Media
              </h2>
              <p className="text-sm text-slate-500">
                Submitted images and videos from the original request.
              </p>
            </div>
          </div>
          {order.attachments.length === 0 ? (
            <div className="mt-5 rounded-xl border border-dashed border-teal-200 bg-teal-50/50 px-4 py-8 text-center text-sm text-slate-600">
              No customer media attached.
            </div>
          ) : (
            <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {order.attachments.map((attachment) => (
                <div
                  className="rounded-xl border border-teal-100 bg-slate-50 p-4"
                  key={attachment.id}
                >
                  <div className="flex h-28 items-center justify-center rounded-xl bg-white text-teal-800">
                    {attachment.kind === "video" ? (
                      <Video size={28} />
                    ) : (
                      <FileImage size={28} />
                    )}
                  </div>
                  <p className="mt-3 truncate font-medium text-slate-900">
                    {attachment.fileName}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">{attachment.fileType}</p>
                </div>
              ))}
            </div>
          )}
        </AdminSurface>
      </div>

      <div className="space-y-4">
        <AdminSurface id="technician">
          <div className="flex items-center gap-3">
            <Settings2 className="text-teal-700" size={20} />
            <div>
              <h2 className="text-xl font-semibold text-slate-950">Service Status</h2>
              <p className="text-sm text-slate-500">
                Progress the accepted service order through operational stages.
              </p>
            </div>
          </div>
          <div className="mt-5 space-y-4">
            <Select onValueChange={onStatusChange} value={order.status}>
              <SelectTrigger>
                <SelectValue placeholder="Current status" />
              </SelectTrigger>
              <SelectContent>
                {serviceStatuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status.replaceAll("-", " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="rounded-xl bg-slate-50 p-4">
              <StatusBadge status={order.status} />
              {order.cancellation ? (
                <p className="mt-3 text-sm text-slate-600">
                  Cancelled {formatShortDate(order.cancellation.cancelledAt)} •{" "}
                  {order.cancellation.reason}
                </p>
              ) : null}
            </div>
          </div>
        </AdminSurface>

        <AdminSurface>
          <div className="flex items-center gap-3">
            <Wrench className="text-teal-700" size={20} />
            <div>
              <h2 className="text-xl font-semibold text-slate-950">Technician</h2>
              <p className="text-sm text-slate-500">
                Assign, change, or remove technician assignment.
              </p>
            </div>
          </div>
          <div className="mt-5 rounded-xl bg-slate-50 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
              Current Assignment
            </p>
            <p className="mt-2 text-sm font-medium text-slate-900">
              {order.technicianId
                ? getTechnicianAvailabilityOptions().find(
                    (option) => option.technicianId === order.technicianId,
                  )?.displayName ?? order.technicianId
                : "Unassigned"}
            </p>
          </div>
          <div className="mt-4">
            <Button onClick={onOpenTechnician}>
              {order.technicianId ? "Change Technician" : "Assign Technician"}
            </Button>
          </div>
        </AdminSurface>

        <AdminSurface>
          <div className="flex items-center gap-3">
            <FileText className="text-teal-700" size={20} />
            <div>
              <h2 className="text-xl font-semibold text-slate-950">Quotation</h2>
              <p className="text-sm text-slate-500">
                Accepted pricing snapshot retained with the service order.
              </p>
            </div>
          </div>
          <div className="mt-5 rounded-xl bg-slate-50 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
              Accepted Amount
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">
              {formatCurrencyUsd(order.acceptedQuoteSnapshot.quotationTotalUsd)}
            </p>
          </div>
          <div className="mt-4 space-y-3">
            {order.acceptedQuoteSnapshot.lineItems.map((lineItem) => (
              <div
                className="flex items-center justify-between gap-4 rounded-xl border border-teal-100 px-4 py-3"
                key={lineItem.id}
              >
                <div>
                  <p className="font-medium text-slate-900">{lineItem.description}</p>
                  <p className="text-sm text-slate-500">
                    Qty {lineItem.quantity} • Unit {formatCurrencyUsd(lineItem.unitPriceUsd)}
                  </p>
                </div>
                <p className="font-semibold text-slate-950">
                  {formatCurrencyUsd(lineItem.quantity * lineItem.unitPriceUsd)}
                </p>
              </div>
            ))}
          </div>
        </AdminSurface>

        <AdminSurface>
          <h2 className="text-xl font-semibold text-slate-950">Related Resources</h2>
          <div className="mt-5 grid gap-3">
            <Link
              className="inline-flex items-center justify-between rounded-xl border border-teal-100 px-4 py-3 text-sm font-medium text-slate-900 transition hover:bg-teal-50"
              href={`/admin/service-requests/${order.serviceRequestId}`}
            >
              <span>Request {order.serviceRequestId}</span>
              <span className="text-teal-800">View Request</span>
            </Link>
            <Link
              className="inline-flex items-center justify-between rounded-xl border border-teal-100 px-4 py-3 text-sm font-medium text-slate-900 transition hover:bg-teal-50"
              href={`/admin/quotations/${order.quotationId}`}
            >
              <span>Quotation {order.quotationId}</span>
              <span className="text-teal-800">View Quotation</span>
            </Link>
            <button
              className="inline-flex items-center justify-between rounded-xl border border-teal-100 px-4 py-3 text-sm font-medium text-slate-900 transition hover:bg-teal-50"
              onClick={onOpenBilling}
              type="button"
            >
              <span>Billing Reference</span>
              <span className="text-teal-800">View Invoice</span>
            </button>
          </div>
        </AdminSurface>

        <AdminSurface>
          <h2 className="text-xl font-semibold text-slate-950">Order Actions</h2>
          <div className="mt-5 grid gap-3">
            <Button onClick={onOpenTechnician} variant="outline">
              <Wrench size={16} />
              {order.technicianId ? "Change Technician" : "Assign Technician"}
            </Button>
            <Button onClick={onOpenSchedule} variant="outline">
              <CalendarDays size={16} />
              Manage Schedule
            </Button>
            <Button onClick={onOpenBilling} variant="outline">
              <CreditCard size={16} />
              View Billing
            </Button>
            <Button onClick={onCancel} variant="destructive">
              <XCircle size={16} />
              Cancel Order
            </Button>
          </div>
        </AdminSurface>
      </div>
    </div>
  );
}
