import type {
  Address,
  FlexibleQuotationLineItem,
  OrderType,
  PaymentStatus,
} from "@/types/domain";

import { getSharedAdminServiceOrders } from "@/data/mock/admin-schedule-state";
import { mockCustomers } from "@/data/mock/customers";
import { mockProducts } from "@/data/mock/products";
import { sharedProductOrderSeed } from "@/data/mock/shared-product-order-seed";
import { mockCurrentCustomer, mockCurrentUser } from "@/data/mock/user";

type BillingRecordType = OrderType;

export type BillingInvoiceStatus =
  | "pending"
  | "paid"
  | "refunded"
  | "cancelled";

export type BillingRefundStatus =
  | "requested"
  | "approved"
  | "rejected"
  | "completed";

export interface BillingMoneyTotals {
  subtotalUsd: number;
  shippingUsd?: number;
  taxUsd: number;
  discountUsd?: number;
  totalUsd: number;
}

export interface BillingInvoiceLineItem {
  id: string;
  label: string;
  description?: string;
  quantity?: number;
  unitPriceUsd?: number;
  amountUsd: number;
  sku?: string;
  kind?: "product" | "service" | "parts" | "charge" | "shipping" | "tax";
}

export interface BillingInvoiceRecord {
  id: string;
  type: BillingRecordType;
  relatedOrderId: string;
  customerId: string;
  customerName: string;
  description: string;
  status: BillingInvoiceStatus;
  createdAt: string;
  dueDate?: string;
  billingAddress: Address;
  paymentId?: string;
  paymentStatus: PaymentStatus;
  paymentReference?: string;
  totals: BillingMoneyTotals;
  lineItems: BillingInvoiceLineItem[];
  quotedAmountUsd?: number;
  finalInvoiceAmountUsd?: number;
  quotationId?: string;
  serviceRequestId?: string;
  productItemCount?: number;
}

export interface BillingPaymentRecord {
  id: string;
  type: BillingRecordType;
  orderId: string;
  invoiceId: string;
  customerId: string;
  customerName: string;
  title: string;
  amountUsd: number;
  methodLabel: string;
  status: PaymentStatus;
  processedAt: string;
  relatedQuotationId?: string;
}

export interface BillingRefundRecord {
  id: string;
  type: BillingRecordType;
  orderId: string;
  invoiceId: string;
  paymentId?: string;
  customerId: string;
  customerName: string;
  amountUsd: number;
  reason: string;
  status: BillingRefundStatus;
  requestedAt: string;
  reviewedAt?: string;
  completedAt?: string;
  notes?: string;
}

type BillingProductOrderState = {
  id: string;
  type: "PRODUCT";
  customerId: string;
  customerName: string;
  createdAt: string;
  status: "processing" | "shipped" | "delivered" | "refunded";
  paymentStatus: PaymentStatus;
  invoiceId: string;
  paymentId: string;
  shippingAddress: Address;
  items: Array<{
    id: string;
    productId: string;
    name: string;
    summary: string;
    sku: string;
    quantity: number;
    unitPriceUsd: number;
    imageSrc: string;
  }>;
  total: BillingMoneyTotals;
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function toMoney(value: number) {
  return Number(value.toFixed(2));
}

function productOrderStatus(index: number) {
  if (index === 0) return "processing" as const;
  if (index === 1) return "delivered" as const;
  return "shipped" as const;
}

function createProductOrdersSeed(): BillingProductOrderState[] {
  const customers = mockCustomers;
  const customer = customers[0] ?? mockCurrentCustomer;
  const products = mockProducts;
  const primaryAddress = customer.addresses[0] ?? {
    line1: "123 Heritage Lane",
    city: "Greenwich",
    state: "CT",
    postalCode: "06830",
  };

  return sharedProductOrderSeed.map((order, index) => {
    const subtotalUsd = order.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPriceUsd,
      0,
    );
    const shippingUsd = index === 0 ? 0 : 18;
    const taxUsd = toMoney(subtotalUsd * 0.08);
    const items = order.items.map((item) => {
      const product = products.find((entry) => entry.id === item.productId);
      return {
        id: item.id,
        productId: item.productId,
        name: product?.name ?? "Central vacuum product",
        summary: product?.summary ?? "Elite central vacuum accessory",
        sku: product?.sku ?? product?.id.toUpperCase() ?? "ECV-SKU",
        quantity: item.quantity,
        unitPriceUsd: item.unitPriceUsd,
        imageSrc: "/product.png",
      };
    });

    return {
      id: index === 0 ? "ORD-88410" : "ORD-90422",
      type: "PRODUCT" as const,
      customerId: customer.id,
      customerName: customer.displayName,
      createdAt: order.createdAt,
      status: productOrderStatus(index),
      paymentStatus: order.paymentStatus,
      invoiceId: index === 0 ? "INV-1048" : "INV-1049",
      paymentId: index === 0 ? "PAY-1044" : "PAY-1045",
      shippingAddress: clone(primaryAddress),
      items,
      total: {
        subtotalUsd,
        shippingUsd,
        taxUsd,
        totalUsd: subtotalUsd + shippingUsd + taxUsd,
      },
    };
  });
}

let productOrdersState: BillingProductOrderState[] | null = null;

function ensureProductOrdersState() {
  if (!productOrdersState) {
    productOrdersState = createProductOrdersSeed();
  }

  return productOrdersState;
}

function getSharedProductOrders(): BillingProductOrderState[] {
  return ensureProductOrdersState();
}

export function getBillingProductOrdersSnapshot() {
  return getSharedProductOrders().map((order) => clone(order));
}

function buildProductInvoiceLineItems(
  order: ReturnType<typeof getSharedProductOrders>[number],
): BillingInvoiceLineItem[] {
  return order.items.map((item) => ({
    id: `inv-${item.id}`,
    label: item.name,
    description: item.summary,
    quantity: item.quantity,
    unitPriceUsd: item.unitPriceUsd,
    amountUsd: item.quantity * item.unitPriceUsd,
    sku: item.sku,
    kind: "product",
  }));
}

function buildServiceInvoiceLineItems(
  order: ReturnType<typeof getSharedAdminServiceOrders>[number],
): BillingInvoiceLineItem[] {
  const baseItems: BillingInvoiceLineItem[] = order.acceptedQuoteSnapshot.lineItems.map((item) => ({
    id: item.id,
    label: item.description,
    description: item.note,
    quantity: item.quantity,
    unitPriceUsd: item.unitPriceUsd,
    amountUsd: item.quantity * item.unitPriceUsd,
    kind: inferServiceLineItemKind(item),
  }));

  const quotedAmountUsd = order.acceptedQuoteSnapshot.quotationTotalUsd;
  const currentTotalUsd = order.total.totalUsd;
  const deltaUsd = quotedAmountUsd ? toMoney(currentTotalUsd - quotedAmountUsd) : 0;

  if (deltaUsd > 0) {
    baseItems.push({
      id: `${order.invoiceId}-final-adjustment`,
      label: "Additional approved charges",
      description: "Final approved service charges added after quotation acceptance.",
      amountUsd: deltaUsd,
      kind: "charge",
    });
  }

  return baseItems;
}

function inferServiceLineItemKind(item: FlexibleQuotationLineItem) {
  const label = item.description.toLowerCase();
  if (label.includes("part") || label.includes("seal") || label.includes("filter")) {
    return "parts" as const;
  }
  return "service" as const;
}

function deriveInvoiceStatus(paymentStatus: PaymentStatus, orderStatus?: string): BillingInvoiceStatus {
  if (paymentStatus === "refunded") return "refunded";
  if (paymentStatus === "paid") return "paid";
  if (orderStatus === "cancelled") return "cancelled";
  return "pending";
}

function buildInvoices() {
  const productOrders = getSharedProductOrders();
  const serviceOrders = getSharedAdminServiceOrders();

  const productInvoices: BillingInvoiceRecord[] = productOrders.map((order) => ({
    id: order.invoiceId,
    type: "PRODUCT",
    relatedOrderId: order.id,
    customerId: order.customerId,
    customerName: order.customerName,
    description: order.items[0]?.name ?? "Product order",
    status: deriveInvoiceStatus(order.paymentStatus, order.status),
    createdAt: order.createdAt,
    billingAddress: clone(order.shippingAddress),
    paymentId: order.paymentId,
    paymentStatus: order.paymentStatus,
    paymentReference: order.paymentId,
    totals: clone(order.total),
    lineItems: buildProductInvoiceLineItems(order),
    productItemCount: order.items.length,
  }));

  const serviceInvoices: BillingInvoiceRecord[] = serviceOrders.map((order) => {
    const customer = mockCustomers.find((entry) => entry.id === order.customerId);
    return {
      id: order.invoiceId ?? `INV-${order.id.replace("SO-", "")}`,
      type: "SERVICE",
      relatedOrderId: order.id,
      customerId: order.customerId,
      customerName: customer?.displayName ?? mockCurrentCustomer.displayName,
      description: order.serviceName,
      status: deriveInvoiceStatus(order.paymentStatus ?? "pending", order.status),
      createdAt: order.createdAt,
      dueDate: order.status === "completed" ? undefined : order.currentSchedule.date,
      billingAddress: clone(order.serviceLocation),
      paymentId: order.paymentId,
      paymentStatus: order.paymentStatus ?? "pending",
      paymentReference: order.paymentId,
      totals: clone(order.total),
      lineItems: buildServiceInvoiceLineItems(order),
      quotedAmountUsd: order.acceptedQuoteSnapshot.quotationTotalUsd,
      finalInvoiceAmountUsd: order.total.totalUsd,
      quotationId: order.quotationId,
      serviceRequestId: order.serviceRequestId,
    };
  });

  return [...productInvoices, ...serviceInvoices].sort(
    (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  );
}

function buildPayments(invoices: BillingInvoiceRecord[]): BillingPaymentRecord[] {
  return invoices.map((invoice) => ({
    id: invoice.paymentId ?? `PAY-${invoice.relatedOrderId.replace(/^[A-Z]+-/, "")}`,
    type: invoice.type,
    orderId: invoice.relatedOrderId,
    invoiceId: invoice.id,
    customerId: invoice.customerId,
    customerName: invoice.customerName,
    title: invoice.description,
    amountUsd: invoice.totals.totalUsd,
    methodLabel:
      invoice.type === "SERVICE" && invoice.paymentStatus === "authorized"
        ? "Visa ending in 4242 • Authorized hold"
        : "Visa ending in 4242",
    status: invoice.paymentStatus,
    processedAt: invoice.createdAt,
    relatedQuotationId: invoice.quotationId,
  }));
}

const seededRefunds: BillingRefundRecord[] = [
  {
    id: "REF-1001",
    type: "PRODUCT",
    orderId: "ORD-88410",
    invoiceId: "INV-1048",
    paymentId: "PAY-1044",
    customerId: mockCurrentUser.customerId ?? mockCurrentCustomer.id,
    customerName: mockCurrentCustomer.displayName,
    amountUsd: 48,
    reason: "Accessory return approved after compatibility issue.",
    status: "requested",
    requestedAt: "2026-08-10T09:30:00.000Z",
  },
  {
    id: "REF-2001",
    type: "SERVICE",
    orderId: "SO-1007",
    invoiceId: "INV-1007",
    paymentId: "PAY-1007",
    customerId: mockCurrentUser.customerId ?? mockCurrentCustomer.id,
    customerName: mockCurrentCustomer.displayName,
    amountUsd: 35,
    reason: "Partial courtesy refund for follow-up accessory fit adjustment.",
    status: "approved",
    requestedAt: "2026-08-09T12:15:00.000Z",
    reviewedAt: "2026-08-10T10:00:00.000Z",
  },
];

let refundsState = clone(seededRefunds);

function getInvoicesInternal() {
  const invoices = buildInvoices();
  const refundByInvoiceId = new Map(
    refundsState
      .filter((refund) => refund.status === "approved" || refund.status === "completed")
      .map((refund) => [refund.invoiceId, refund] as const),
  );

  return invoices.map((invoice) => {
    const refund = refundByInvoiceId.get(invoice.id);
    if (!refund) return invoice;
    return {
      ...invoice,
      status: refund.status === "completed" ? "refunded" : invoice.status,
      paymentStatus:
        refund.status === "completed" ? "refunded" : invoice.paymentStatus,
    };
  });
}

export function getBillingInvoices() {
  return getInvoicesInternal();
}

export function getBillingInvoiceById(invoiceId: string) {
  return getBillingInvoices().find((invoice) => invoice.id === invoiceId);
}

export function getBillingPayments() {
  return buildPayments(getBillingInvoices());
}

export function getBillingPaymentById(paymentId: string) {
  return getBillingPayments().find((payment) => payment.id === paymentId);
}

export function getBillingRefunds() {
  return refundsState
    .slice()
    .sort(
      (left, right) =>
        new Date(right.requestedAt).getTime() - new Date(left.requestedAt).getTime(),
    );
}

export function getBillingRefundById(refundId: string) {
  return getBillingRefunds().find((refund) => refund.id === refundId);
}

export function getBillingRecordsForCustomer(customerId: string) {
  return {
    invoices: getBillingInvoices().filter((invoice) => invoice.customerId === customerId),
    payments: getBillingPayments().filter((payment) => payment.customerId === customerId),
    refunds: getBillingRefunds().filter((refund) => refund.customerId === customerId),
  };
}

export function markBillingInvoicePaid(invoiceId: string) {
  const invoice = getBillingInvoiceById(invoiceId);
  if (!invoice) return null;

  if (invoice.type === "SERVICE") {
    const serviceOrder = getSharedAdminServiceOrders().find(
      (order) => order.id === invoice.relatedOrderId,
    );
    if (serviceOrder) {
      serviceOrder.paymentStatus = "paid";
    }
  } else {
    productOrdersState = getSharedProductOrders().map((order) =>
      order.invoiceId === invoiceId
        ? {
            ...order,
            paymentStatus: "paid",
          }
        : order,
    );
  }

  return {
    ...invoice,
    status: "paid" as const,
    paymentStatus: "paid" as const,
  };
}

export function updateBillingPaymentStatus(paymentId: string, status: PaymentStatus) {
  const payment = getBillingPaymentById(paymentId);
  if (!payment) return null;

  if (payment.type === "SERVICE") {
    const serviceOrder = getSharedAdminServiceOrders().find(
      (order) => order.id === payment.orderId,
    );
    if (serviceOrder) {
      serviceOrder.paymentStatus = status;
    }
  } else {
    productOrdersState = getSharedProductOrders().map((order) =>
      order.paymentId === paymentId
        ? {
            ...order,
            paymentStatus: status,
          }
        : order,
    );
  }

  return {
    ...payment,
    status,
  };
}

export function createBillingRefundRequest(input: {
  type: BillingRecordType;
  orderId: string;
  invoiceId: string;
  paymentId?: string;
  customerId: string;
  customerName: string;
  amountUsd: number;
  reason: string;
  notes?: string;
}) {
  const refund: BillingRefundRecord = {
    id: `REF-${Math.floor(Date.now() / 10).toString().slice(-4)}`,
    type: input.type,
    orderId: input.orderId,
    invoiceId: input.invoiceId,
    paymentId: input.paymentId,
    customerId: input.customerId,
    customerName: input.customerName,
    amountUsd: input.amountUsd,
    reason: input.reason,
    status: "requested",
    requestedAt: new Date().toISOString(),
    notes: input.notes,
  };

  refundsState = [refund, ...refundsState];
  return refund;
}

export function approveBillingRefund(refundId: string) {
  refundsState = refundsState.map((refund) =>
    refund.id === refundId
      ? {
          ...refund,
          status: "approved",
          reviewedAt: new Date().toISOString(),
        }
      : refund,
  );
  return getBillingRefundById(refundId);
}

export function rejectBillingRefund(refundId: string, notes?: string) {
  refundsState = refundsState.map((refund) =>
    refund.id === refundId
      ? {
          ...refund,
          status: "rejected",
          reviewedAt: new Date().toISOString(),
          notes: notes ?? refund.notes,
        }
      : refund,
  );
  return getBillingRefundById(refundId);
}

export function completeBillingRefund(refundId: string) {
  const refund = getBillingRefundById(refundId);
  if (!refund) return null;

  refundsState = refundsState.map((entry) =>
    entry.id === refundId
      ? {
          ...entry,
          status: "completed",
          completedAt: new Date().toISOString(),
        }
      : entry,
  );

  if (refund.type === "SERVICE") {
    const serviceOrder = getSharedAdminServiceOrders().find(
      (order) => order.id === refund.orderId,
    );
    if (serviceOrder) {
      serviceOrder.paymentStatus = "refunded";
    }
  } else {
    productOrdersState = getSharedProductOrders().map((order) =>
      order.id === refund.orderId
        ? {
            ...order,
            paymentStatus: "refunded",
            status: "refunded",
          }
        : order,
    );
  }

  return getBillingRefundById(refundId);
}
