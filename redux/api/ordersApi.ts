import { baseApi } from "./baseApi";
import type { PaginatedResponse } from "./types";
import type { DeliveryAddressDto } from "./addressesApi";

/**
 * `/store/orders` is PRODUCT orders only. Service jobs live under
 * `/service-orders`, `/service-requests` and `/quotations` — never reuse these
 * endpoints for them. Invoices are shared across both domains.
 *
 * Pricing is server-authoritative: shipping is a flat $18.00 charged once per
 * order and tax is 8% of the taxable subtotal. Client-side totals are an
 * estimate for display only; the order response carries the real figures.
 */

export type StoreOrderStatus =
  | "PENDING"
  | "PAID"
  | "PROCESSING"
  | "SHIPPED"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED"
  | "REFUNDED";

export type StorePaymentStatus =
  | "PENDING"
  | "SUCCEEDED"
  | "FAILED"
  | "REFUNDED"
  | "PARTIALLY_REFUNDED";

export type StorePaymentMethod = "STRIPE" | "COD";

/** Statuses that are terminal for payment — polling can stop once reached. */
export const SETTLED_ORDER_STATUSES: StoreOrderStatus[] = [
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "COMPLETED",
  "FAILED",
  "CANCELLED",
  "REFUNDED",
];

/**
 * Maps the UI's lowercase-hyphenated status unions onto the API enum
 * (`out-for-delivery` -> `OUT_FOR_DELIVERY`).
 */
export function toStoreOrderStatus(value: string): StoreOrderStatus {
  return value.toUpperCase().replace(/-/g, "_") as StoreOrderStatus;
}

export interface StoreOrderItemDto {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  quantity: number;
  unitPriceUsd: string;
  totalUsd: string;
  /** Resolved from `productSnapshot.image` then `product.images[0].url`. */
  imageUrl?: string;
  /** Legacy aliases kept populated for existing portal/admin consumers. */
  name: string;
  sku: string;
  priceUsd: string;
  subtotalUsd: string;
}

export interface StoreOrderShippingAddress {
  recipientName?: string;
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  phone?: string;
  email?: string;
}

export interface StoreOrderCustomer {
  id: string;
  displayName?: string;
  email?: string;
  phone?: string;
}

export interface StoreOrderStatusHistoryEntry {
  id: string;
  status: StoreOrderStatus;
  note?: string;
  actorLabel?: string;
  changedAt: string;
}

export interface StoreOrderPaymentDto {
  id: string;
  status: StorePaymentStatus;
  amountUsd: string;
  methodLabel?: string;
  transactionReference?: string;
}

export interface StoreOrderRefundDto {
  id: string;
  invoiceId?: string;
  paymentId?: string;
  amountUsd: string;
  status: string;
  reason?: string;
  stripeRefundId?: string;
  transactionReference?: string;
  processedAt?: string;
}

export interface StoreOrderInvoiceLineItemDto {
  id?: string;
  description: string;
  quantity: number;
  unitPriceUsd: string;
  totalUsd: string;
  sortOrder?: number;
}

export interface StoreOrderInvoiceDto {
  id: string;
  businessId?: string;
  status: string;
  subtotalUsd: string;
  taxUsd: string;
  discountUsd: string;
  totalUsd: string;
  dueDate?: string;
  paidAt?: string;
  notes?: string;
  /** Ordered by `sortOrder` ascending. */
  lineItems: StoreOrderInvoiceLineItemDto[];
  payments?: StoreOrderPaymentDto[];
  refunds?: StoreOrderRefundDto[];
  /** Absolute `/api/v1/...` paths from the server — reference only. */
  downloadUrl?: string;
  viewUrl?: string;
}

export interface StoreOrderRefundSummary {
  isRefunded: boolean;
  refundCount: number;
  totalRefundedUsd: string;
  refunds: StoreOrderRefundDto[];
}

export interface StoreOrderDto {
  id: string;
  businessId: string;
  customerId: string;
  status: StoreOrderStatus;
  totalUsd: string;
  subtotalUsd: string;
  shippingFeeUsd: string;
  taxUsd: string;
  discountUsd: string;
  paymentMethod?: StorePaymentMethod;
  paymentStatus?: StorePaymentStatus;
  placedAt: string;
  shippingProvider?: string;
  trackingNumber?: string;
  customerNotes?: string;
  shippingAddress?: StoreOrderShippingAddress;
  /** Alias of `shippingAddress`, kept for the portal's address renderer. */
  deliveryAddress?: DeliveryAddressDto;
  customer?: StoreOrderCustomer;
  items: StoreOrderItemDto[];
  /** Normalized to ascending (oldest first) so it renders as a timeline. */
  statusHistory: StoreOrderStatusHistoryEntry[];
  /**
   * The order's primary invoice. The server guarantees one exists — it is
   * created on the fly by `GET /store/orders/:id` if the order predates
   * invoicing — so this is normally set. Falls back to `invoices[0]`.
   */
  invoice?: StoreOrderInvoiceDto;
  invoices: StoreOrderInvoiceDto[];
  refundSummary?: StoreOrderRefundSummary;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderDeliveryAddress {
  label?: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country?: string;
  isDefault?: boolean;
}

export interface CreateOrderRequest {
  paymentMethod: StorePaymentMethod;
  /** Send `deliveryAddressId` OR `deliveryAddress`; neither uses the default. */
  deliveryAddressId?: string;
  deliveryAddress?: CreateOrderDeliveryAddress;
  recipientName?: string;
  contactPhone?: string;
  contactEmail?: string;
  notes?: string;
}

export interface CreateOrderResponse {
  success: boolean;
  message?: string;
  paymentMethod?: StorePaymentMethod;
  paymentStatus?: StorePaymentStatus;
  /** `null` for COD — nothing to redirect to. */
  checkoutUrl: string | null;
  sessionId: string | null;
  order?: StoreOrderDto;
}

export interface StripeCheckoutSession {
  orderId: string;
  businessId?: string;
  checkoutUrl: string;
  sessionId: string;
}

export interface GetStoreOrdersParams {
  page?: number;
  limit?: number;
  status?: StoreOrderStatus | string;
  /** Matches businessId / trackingNumber (admin list also matches customer name). */
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  /** Admin list only. */
  customerId?: string;
}

export interface UpdateOrderStatusRequest {
  id: string;
  /** All fields optional — send only what changed. */
  status?: StoreOrderStatus;
  trackingNumber?: string;
  shippingProvider?: string;
  notes?: string;
}

/* --------------------------- Returns & refunds ---------------------------- */

/**
 * `reason` is free text server-side, not an enum — these are the suggested UI
 * options only.
 */
export const RETURN_REASONS = [
  { value: "DEFECTIVE_OR_DAMAGED", label: "Defective or damaged on arrival" },
  { value: "WRONG_ITEM", label: "Wrong item received" },
  { value: "NOT_AS_DESCRIBED", label: "Not as described" },
  { value: "OTHER", label: "Other" },
] as const;

/**
 * A customer may cancel only before dispatch. The API also lets an ADMIN
 * cancel SHIPPED / OUT_FOR_DELIVERY orders, and rejects everything already
 * closed (CANCELLED / REFUNDED / DELIVERED / COMPLETED).
 */
export const CUSTOMER_CANCELLABLE_STATUSES: StoreOrderStatus[] = [
  "PENDING",
  "PAID",
  "PROCESSING",
];

export const ADMIN_CANCELLABLE_STATUSES: StoreOrderStatus[] = [
  ...CUSTOMER_CANCELLABLE_STATUSES,
  "SHIPPED",
  "OUT_FOR_DELIVERY",
];

/** A return can only be filed once the goods actually arrived. */
export const RETURNABLE_ORDER_STATUSES: StoreOrderStatus[] = [
  "DELIVERED",
  "COMPLETED",
];

/**
 * Refundable only once money moved and stock left the warehouse. PENDING,
 * FAILED, CANCELLED and REFUNDED orders are rejected with a 400.
 */
export const REFUNDABLE_ORDER_STATUSES: StoreOrderStatus[] = [
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "COMPLETED",
];

export interface ReturnOrderRequest {
  reason: string;
  customerNote?: string;
}

/** `POST /store/returns/orders/:orderId` — files a request, changes nothing else. */
export interface ReturnRequestResult {
  success: boolean;
  message: string;
  orderId: string;
  orderBusinessId?: string;
  /** The order's status, unchanged by filing the request. */
  status: StoreOrderStatus;
  returnTimelineId: string;
  submittedAt: string;
}

export interface ReturnHistoryEntry {
  id: string;
  status: string;
  note?: string;
  actorLabel?: string;
  changedAt: string;
}

/** `GET /store/returns/orders/:orderId` */
export interface ReturnStatusDto {
  orderId: string;
  orderBusinessId?: string;
  currentStatus: StoreOrderStatus;
  items: StoreOrderItemDto[];
  /** Normalized to ascending so it renders as a timeline (API sends DESC). */
  returnHistory: ReturnHistoryEntry[];
  /** True once any return entry exists — used to block duplicate filings. */
  hasReturnRequest: boolean;
}

export type RefundStatus = "COMPLETED" | "MANUAL_REQUIRED" | "PENDING";

export interface RefundDto {
  id: string;
  invoiceId?: string;
  invoiceBusinessId?: string;
  paymentId?: string;
  amountUsd: string;
  status: RefundStatus;
  /** `null` when no Stripe refund was possible (COD / legacy orders). */
  stripeRefundId: string | null;
  /**
   * `true` means **no money moved** — the admin has to pay the customer by
   * hand. Always branch on this before telling anyone they were refunded.
   */
  requiresManualPayout: boolean;
  processedAt?: string;
}

/** `PATCH /store/returns/orders/:orderId/refund` */
export interface RefundResult {
  success: boolean;
  message: string;
  order?: StoreOrderDto;
  refund: RefundDto;
}

/* -------------------------------------------------------------------------- */
/* Normalization                                                              */
/* -------------------------------------------------------------------------- */

type Raw = Record<string, unknown>;

function asRecord(value: unknown): Raw {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Raw)
    : {};
}

function asArray(value: unknown): Raw[] {
  return Array.isArray(value) ? value.map(asRecord) : [];
}

function str(value: unknown, fallback = ""): string {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return fallback;
}

/** Money arrives as a decimal string ("450.00"); keep it a string, but coerce numbers. */
function money(value: unknown, fallback = "0.00"): string {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value.toFixed(2);
  }
  const text = str(value);
  return text === "" ? fallback : text;
}

function unwrap<T>(response: unknown): T {
  const record = asRecord(response);
  if ("data" in record && record.data !== null && record.data !== undefined) {
    return record.data as T;
  }
  return response as T;
}

/**
 * Item images live in one of two places depending on whether the product still
 * exists: the immutable order-time snapshot, or the live product record.
 */
function resolveItemImage(raw: Raw): string | undefined {
  const snapshot = asRecord(raw.productSnapshot);
  const snapshotImage = str(snapshot.image) || str(snapshot.imageUrl);
  if (snapshotImage) return snapshotImage;

  const product = asRecord(raw.product);
  const images = asArray(product.images);
  for (const image of images) {
    const url = str(image.url) || str(image.imageUrl);
    if (url) return url;
  }

  return str(raw.imageUrl) || undefined;
}

function normalizeItem(raw: Raw, index: number): StoreOrderItemDto {
  const product = asRecord(raw.product);
  const snapshot = asRecord(raw.productSnapshot);

  const name =
    str(raw.productName) ||
    str(raw.name) ||
    str(snapshot.name) ||
    str(product.name);
  const sku =
    str(raw.productSku) || str(raw.sku) || str(snapshot.sku) || str(product.sku);
  const quantity = Number(raw.quantity) || 1;
  const unitPriceUsd = money(raw.unitPriceUsd ?? raw.priceUsd);
  const totalUsd = money(
    raw.totalUsd ?? raw.subtotalUsd,
    (Number(unitPriceUsd) * quantity).toFixed(2),
  );

  return {
    id: str(raw.id) || `item-${index}`,
    productId: str(raw.productId) || str(product.id),
    productName: name,
    productSku: sku,
    quantity,
    unitPriceUsd,
    totalUsd,
    imageUrl: resolveItemImage(raw),
    name,
    sku,
    priceUsd: unitPriceUsd,
    subtotalUsd: totalUsd,
  };
}

function normalizeRefund(raw: Raw): StoreOrderRefundDto {
  return {
    id: str(raw.id),
    invoiceId: str(raw.invoiceId) || undefined,
    paymentId: str(raw.paymentId) || undefined,
    amountUsd: money(raw.amountUsd),
    status: str(raw.status, "PENDING"),
    reason: str(raw.reason) || undefined,
    stripeRefundId: str(raw.stripeRefundId) || undefined,
    transactionReference: str(raw.transactionReference) || undefined,
    processedAt: str(raw.processedAt) || undefined,
  };
}

function normalizeOrderInvoice(raw: Raw): StoreOrderInvoiceDto {
  const subtotalUsd = money(raw.subtotalUsd);

  return {
    id: str(raw.id),
    businessId: str(raw.businessId) || undefined,
    status: str(raw.status, "ISSUED").toUpperCase(),
    subtotalUsd,
    taxUsd: money(raw.taxUsd),
    discountUsd: money(raw.discountUsd),
    totalUsd: money(raw.totalUsd, subtotalUsd),
    dueDate: str(raw.dueDate) || undefined,
    paidAt: str(raw.paidAt) || undefined,
    notes: str(raw.notes) || undefined,
    lineItems: asArray(raw.lineItems)
      .map((item, index) => ({
        id: str(item.id) || undefined,
        description: str(item.description, "Item"),
        quantity: Number(item.quantity) || 1,
        unitPriceUsd: money(item.unitPriceUsd),
        totalUsd: money(item.totalUsd),
        sortOrder: Number(item.sortOrder ?? index),
      }))
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
    payments: asArray(raw.payments).map((payment) => ({
      id: str(payment.id),
      status: str(payment.status, "PENDING").toUpperCase() as StorePaymentStatus,
      amountUsd: money(payment.amountUsd),
      methodLabel: str(payment.methodLabel) || undefined,
      transactionReference: str(payment.transactionReference) || undefined,
    })),
    refunds: asArray(raw.refunds).map(normalizeRefund),
    downloadUrl: str(raw.downloadUrl) || undefined,
    viewUrl: str(raw.viewUrl) || undefined,
  };
}

function normalizeAddress(
  raw: Raw,
): StoreOrderShippingAddress | undefined {
  if (Object.keys(raw).length === 0) return undefined;
  return {
    recipientName: str(raw.recipientName) || undefined,
    line1: str(raw.line1) || undefined,
    line2: str(raw.line2) || undefined,
    city: str(raw.city) || undefined,
    state: str(raw.state) || undefined,
    postalCode: str(raw.postalCode) || undefined,
    country: str(raw.country) || undefined,
    phone: str(raw.phone) || undefined,
    email: str(raw.email) || undefined,
  };
}

export function normalizeStoreOrder(input: unknown): StoreOrderDto {
  const raw = asRecord(unwrap(input));

  const shippingAddress = normalizeAddress(
    Object.keys(asRecord(raw.shippingAddress)).length > 0
      ? asRecord(raw.shippingAddress)
      : asRecord(raw.deliveryAddress),
  );

  // `statusHistory` arrives newest-first; timelines read oldest-first.
  const statusHistory = asArray(raw.statusHistory)
    .map((entry) => ({
      id: str(entry.id),
      status: str(entry.status, "PENDING") as StoreOrderStatus,
      note: str(entry.note) || undefined,
      actorLabel: str(entry.actorLabel) || undefined,
      changedAt: str(entry.changedAt) || str(entry.createdAt),
    }))
    .sort((a, b) => Date.parse(a.changedAt) - Date.parse(b.changedAt));

  const placedAt = str(raw.placedAt) || str(raw.createdAt);

  const invoices = asArray(raw.invoices).map(normalizeOrderInvoice);
  // The server sends a convenience `invoice` alongside the array; prefer it,
  // and fall back to the first of the array for older payloads.
  const primaryInvoice = raw.invoice
    ? normalizeOrderInvoice(asRecord(raw.invoice))
    : invoices[0];

  const refundSummaryRaw = asRecord(raw.refundSummary);
  const refundSummary =
    Object.keys(refundSummaryRaw).length > 0
      ? {
          isRefunded: Boolean(refundSummaryRaw.isRefunded),
          refundCount: Number(refundSummaryRaw.refundCount) || 0,
          totalRefundedUsd: money(refundSummaryRaw.totalRefundedUsd),
          refunds: asArray(refundSummaryRaw.refunds).map(normalizeRefund),
        }
      : undefined;

  return {
    id: str(raw.id),
    businessId: str(raw.businessId),
    customerId: str(raw.customerId) || str(asRecord(raw.customer).id),
    status: str(raw.status, "PENDING").toUpperCase() as StoreOrderStatus,
    totalUsd: money(raw.totalUsd),
    subtotalUsd: money(raw.subtotalUsd),
    shippingFeeUsd: money(raw.shippingFeeUsd ?? raw.shippingUsd),
    taxUsd: money(raw.taxUsd),
    discountUsd: money(raw.discountUsd),
    paymentMethod: raw.paymentMethod
      ? (str(raw.paymentMethod).toUpperCase() as StorePaymentMethod)
      : undefined,
    paymentStatus: raw.paymentStatus
      ? (str(raw.paymentStatus).toUpperCase() as StorePaymentStatus)
      : undefined,
    placedAt,
    shippingProvider: str(raw.shippingProvider) || undefined,
    trackingNumber: str(raw.trackingNumber) || undefined,
    customerNotes: str(raw.customerNotes ?? raw.notes) || undefined,
    shippingAddress,
    deliveryAddress: shippingAddress as DeliveryAddressDto | undefined,
    customer:
      Object.keys(asRecord(raw.customer)).length > 0
        ? {
            id: str(asRecord(raw.customer).id),
            displayName: str(asRecord(raw.customer).displayName) || undefined,
            email: str(asRecord(raw.customer).email) || undefined,
            phone: str(asRecord(raw.customer).phone) || undefined,
          }
        : undefined,
    items: asArray(raw.items).map(normalizeItem),
    statusHistory,
    invoice: primaryInvoice,
    invoices,
    refundSummary,
    createdAt: placedAt,
    updatedAt: str(raw.updatedAt) || placedAt,
  };
}

function normalizeOrderList(response: unknown): PaginatedResponse<StoreOrderDto> {
  const payload = asRecord(response);
  const body = asRecord(unwrap(response));

  const rawItems = Array.isArray(body.items)
    ? body.items
    : Array.isArray(payload.items)
      ? payload.items
      : Array.isArray(body.data)
        ? body.data
        : [];

  const items = rawItems.map(normalizeStoreOrder);
  const meta = asRecord(body.meta ?? payload.meta);

  return {
    items,
    meta: {
      page: Number(meta.currentPage ?? meta.page ?? 1),
      limit: Number(meta.perPage ?? meta.limit ?? items.length ?? 10),
      total: Number(meta.totalItems ?? meta.total ?? items.length),
      totalPages: Number(meta.totalPages ?? 1),
      hasNextPage: Boolean(meta.hasNextPage),
      hasPreviousPage: Boolean(meta.hasPrevPage ?? meta.hasPreviousPage),
    },
  };
}

/** `{ success, message, order }` wrappers on cancel/status-update. */
function normalizeOrderMutation(response: unknown): StoreOrderDto {
  const record = asRecord(response);
  if (record.order) return normalizeStoreOrder(record.order);
  const inner = asRecord(unwrap(response));
  if (inner.order) return normalizeStoreOrder(inner.order);
  return normalizeStoreOrder(response);
}

function normalizeCreateOrder(response: unknown): CreateOrderResponse {
  const record = asRecord(response);
  // Some deployments nest the payload under `data`; read both.
  const inner = asRecord(unwrap(response));
  const pick = (key: string): unknown => record[key] ?? inner[key];

  const orderRaw = pick("order");

  return {
    success: pick("success") !== false,
    message: str(pick("message")) || undefined,
    paymentMethod: pick("paymentMethod")
      ? (str(pick("paymentMethod")).toUpperCase() as StorePaymentMethod)
      : undefined,
    paymentStatus: pick("paymentStatus")
      ? (str(pick("paymentStatus")).toUpperCase() as StorePaymentStatus)
      : undefined,
    checkoutUrl:
      str(pick("checkoutUrl")) || str(pick("url")) || str(pick("sessionUrl")) || null,
    sessionId: str(pick("sessionId")) || str(pick("stripeSessionId")) || null,
    order: orderRaw ? normalizeStoreOrder(orderRaw) : undefined,
  };
}

function buildOrderParams(
  params: GetStoreOrdersParams | void,
): Record<string, unknown> | undefined {
  if (!params) return undefined;
  const query: Record<string, unknown> = {};
  if (params.page !== undefined) query.page = params.page;
  if (params.limit !== undefined) query.limit = params.limit;
  if (params.status) query.status = params.status;
  if (params.search?.trim()) query.search = params.search.trim();
  if (params.dateFrom) query.dateFrom = params.dateFrom;
  if (params.dateTo) query.dateTo = params.dateTo;
  if (params.sortBy) query.sortBy = params.sortBy;
  if (params.sortOrder) query.sortOrder = params.sortOrder;
  if (params.customerId) query.customerId = params.customerId;
  return Object.keys(query).length > 0 ? query : undefined;
}

/* -------------------------------------------------------------------------- */
/* Endpoints                                                                  */
/* -------------------------------------------------------------------------- */

export const ordersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * POST /store/orders — reads the server-side cart, so no items are sent.
     * Creates the order as PENDING, decrements stock, issues an invoice and
     * clears the cart.
     */
    createStoreOrder: builder.mutation<CreateOrderResponse, CreateOrderRequest>({
      query: (body) => ({
        url: "/store/orders",
        method: "POST",
        body,
      }),
      transformResponse: normalizeCreateOrder,
      invalidatesTags: [
        { type: "Order", id: "CUSTOMER_LIST" },
        { type: "Order", id: "ADMIN_LIST" },
        { type: "Cart" },
      ],
    }),

    /** Regenerates a Stripe pay link. Valid only while the order is PENDING. */
    getStripeCheckoutSession: builder.query<StripeCheckoutSession, string>({
      query: (orderId) => `/store/orders/checkout/session/${orderId}`,
      transformResponse: (response: unknown): StripeCheckoutSession => {
        const raw = asRecord(unwrap(response));
        return {
          orderId: str(raw.orderId),
          businessId: str(raw.businessId) || undefined,
          checkoutUrl: str(raw.checkoutUrl),
          sessionId: str(raw.sessionId),
        };
      },
      // Pay links are single-use; never serve a cached one.
      keepUnusedDataFor: 0,
    }),

    getCustomerOrders: builder.query<
      PaginatedResponse<StoreOrderDto>,
      GetStoreOrdersParams | void
    >({
      query: (params) => ({
        url: "/store/orders",
        params: buildOrderParams(params),
      }),
      transformResponse: normalizeOrderList,
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ id }) => ({ type: "Order" as const, id })),
              { type: "Order", id: "CUSTOMER_LIST" },
            ]
          : [{ type: "Order", id: "CUSTOMER_LIST" }],
    }),

    getAdminOrdersList: builder.query<
      PaginatedResponse<StoreOrderDto>,
      GetStoreOrdersParams | void
    >({
      query: (params) => ({
        url: "/store/orders/admin/list",
        params: buildOrderParams(params),
      }),
      transformResponse: normalizeOrderList,
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ id }) => ({ type: "Order" as const, id })),
              { type: "Order", id: "ADMIN_LIST" },
            ]
          : [{ type: "Order", id: "ADMIN_LIST" }],
    }),

    /** Accepts a UUID or a businessId ("ORD-4F92A"). */
    getOrderById: builder.query<StoreOrderDto, string>({
      query: (id) => `/store/orders/${id}`,
      transformResponse: normalizeStoreOrder,
      providesTags: (_result, _error, id) => [{ type: "Order", id }],
    }),

    /**
     * Sets CANCELLED, restores stock and voids an unpaid invoice. Issues no
     * Stripe refund — paid orders must go through the refund endpoint.
     */
    cancelOrder: builder.mutation<StoreOrderDto, string>({
      query: (id) => ({
        url: `/store/orders/${id}/cancel`,
        method: "PATCH",
      }),
      transformResponse: normalizeOrderMutation,
      invalidatesTags: (_result, _error, id) => [
        { type: "Order", id },
        { type: "Order", id: "CUSTOMER_LIST" },
        { type: "Order", id: "ADMIN_LIST" },
        { type: "Invoice", id: "LIST" },
      ],
    }),

    updateOrderStatus: builder.mutation<StoreOrderDto, UpdateOrderStatusRequest>({
      query: ({ id, ...body }) => ({
        url: `/store/orders/${id}/status`,
        method: "PATCH",
        body,
      }),
      transformResponse: normalizeOrderMutation,
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Order", id },
        { type: "Order", id: "ADMIN_LIST" },
        { type: "Order", id: "CUSTOMER_LIST" },
      ],
    }),

    /**
     * Files a return request. It does NOT change the order status or move any
     * money — it only records a timeline entry for support to act on. The
     * server does not deduplicate, so the UI must disable the button after a
     * successful submission.
     *
     * The DTO also accepts `orderItemId`, but the server ignores it: partial
     * returns are unsupported, so never render a per-item picker.
     */
    submitOrderReturn: builder.mutation<
      ReturnRequestResult,
      { orderId: string; body: ReturnOrderRequest }
    >({
      query: ({ orderId, body }) => ({
        url: `/store/returns/orders/${orderId}`,
        method: "POST",
        body,
      }),
      transformResponse: (response: unknown): ReturnRequestResult => {
        const raw = asRecord(response);
        const inner = asRecord(unwrap(response));
        const pick = (key: string): unknown => raw[key] ?? inner[key];
        return {
          success: pick("success") !== false,
          message: str(pick("message"), "Return request submitted."),
          orderId: str(pick("orderId")),
          orderBusinessId: str(pick("orderBusinessId")) || undefined,
          status: str(pick("status"), "DELIVERED").toUpperCase() as StoreOrderStatus,
          returnTimelineId: str(pick("returnTimelineId")),
          submittedAt: str(pick("submittedAt")),
        };
      },
      invalidatesTags: (_result, _error, { orderId }) => [
        { type: "Order", id: orderId },
        { type: "Return", id: orderId },
      ],
    }),

    getReturnStatus: builder.query<ReturnStatusDto, string>({
      query: (orderId) => `/store/returns/orders/${orderId}`,
      transformResponse: (response: unknown): ReturnStatusDto => {
        const raw = asRecord(unwrap(response));
        // `returnHistory` arrives newest-first; timelines read oldest-first.
        const returnHistory = asArray(raw.returnHistory)
          .map((entry) => ({
            id: str(entry.id),
            status: str(entry.status),
            note: str(entry.note) || undefined,
            actorLabel: str(entry.actorLabel) || undefined,
            changedAt: str(entry.changedAt) || str(entry.createdAt),
          }))
          .sort((a, b) => Date.parse(a.changedAt) - Date.parse(b.changedAt));

        return {
          orderId: str(raw.orderId),
          orderBusinessId: str(raw.orderBusinessId) || undefined,
          currentStatus: str(
            raw.currentStatus,
            "PENDING",
          ).toUpperCase() as StoreOrderStatus,
          items: asArray(raw.items).map(normalizeItem),
          returnHistory,
          hasReturnRequest: returnHistory.length > 0,
        };
      },
      providesTags: (_result, _error, orderId) => [
        { type: "Return", id: orderId },
      ],
    }),

    /**
     * Approves the return: issues a full Stripe refund where possible, restores
     * inventory and sets the order REFUNDED. Full amount only — no partials.
     *
     * Callers MUST branch on `refund.requiresManualPayout`: when true, no money
     * moved and the customer has to be paid by hand.
     */
    approveReturnRefund: builder.mutation<
      RefundResult,
      { orderId: string; adminNote?: string }
    >({
      query: ({ orderId, adminNote }) => ({
        url: `/store/returns/orders/${orderId}/refund`,
        method: "PATCH",
        // The body is optional; only send a note when there is one.
        body: adminNote?.trim() ? { adminNote: adminNote.trim() } : {},
      }),
      transformResponse: (response: unknown): RefundResult => {
        const raw = asRecord(response);
        const inner = asRecord(unwrap(response));
        const pick = (key: string): unknown => raw[key] ?? inner[key];
        const refund = asRecord(pick("refund"));
        const stripeRefundId = str(refund.stripeRefundId);

        return {
          success: pick("success") !== false,
          message: str(pick("message"), "Refund processed."),
          order: pick("order") ? normalizeStoreOrder(pick("order")) : undefined,
          refund: {
            id: str(refund.id),
            invoiceId: str(refund.invoiceId) || undefined,
            invoiceBusinessId: str(refund.invoiceBusinessId) || undefined,
            paymentId: str(refund.paymentId) || undefined,
            amountUsd: money(refund.amountUsd),
            status: str(refund.status, "PENDING").toUpperCase() as RefundStatus,
            stripeRefundId: stripeRefundId || null,
            requiresManualPayout: Boolean(refund.requiresManualPayout),
            processedAt: str(refund.processedAt) || undefined,
          },
        };
      },
      invalidatesTags: (_result, _error, { orderId }) => [
        { type: "Order", id: orderId },
        { type: "Order", id: "ADMIN_LIST" },
        { type: "Order", id: "CUSTOMER_LIST" },
        { type: "Return", id: orderId },
        { type: "Invoice", id: orderId },
      ],
    }),

    getOrderInvoice: builder.query<Record<string, unknown>, string>({
      query: (orderId) => `/store/invoices/orders/${orderId}`,
      providesTags: (_result, _error, orderId) => [
        { type: "Invoice", id: orderId },
      ],
    }),

    generateOrderInvoice: builder.mutation<Record<string, unknown>, string>({
      query: (orderId) => ({
        url: `/store/invoices/orders/${orderId}/generate`,
        method: "POST",
      }),
      invalidatesTags: (_result, _error, orderId) => [
        { type: "Invoice", id: orderId },
      ],
    }),
  }),
});

export const {
  useCreateStoreOrderMutation,
  useGetStripeCheckoutSessionQuery,
  useLazyGetStripeCheckoutSessionQuery,
  useGetCustomerOrdersQuery,
  useGetAdminOrdersListQuery,
  useGetOrderByIdQuery,
  useCancelOrderMutation,
  useUpdateOrderStatusMutation,
  useSubmitOrderReturnMutation,
  useGetReturnStatusQuery,
  useApproveReturnRefundMutation,
  useGetOrderInvoiceQuery,
  useGenerateOrderInvoiceMutation,
} = ordersApi;
