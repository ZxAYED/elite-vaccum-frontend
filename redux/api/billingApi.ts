import { baseApi } from "./baseApi";
import type { PaginatedResponse } from "./types";

interface ApiResponse<T> {
  success?: boolean;
  message?: string;
  data?: T;
}

function unwrapData<T>(response: ApiResponse<T> | T): T {
  if (response && typeof response === "object") {
    const resObj = response as unknown as Record<string, unknown>;
    if ("data" in resObj && resObj.data !== undefined && resObj.data !== null) {
      return resObj.data as T;
    }
  }
  return response as T;
}

/**
 * KPI counts arrive as a flat map of numeric buckets (e.g.
 * `{ paid: 12, overdue: 3, outstandingUsd: 4210.5 }`). Coerce defensively so a
 * string amount can't poison arithmetic downstream.
 */
function readKpi(value: unknown): Record<string, number> | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }
  const out: Record<string, number> = {};
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    const numeric = Number(raw);
    if (Number.isFinite(numeric)) out[key] = numeric;
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

function str(value: unknown, fallback = ""): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return fallback;
}

/** Reads a key off the envelope or its `data` wrapper, whichever carries it. */
function picker(response: unknown) {
  const outer = (response ?? {}) as Record<string, unknown>;
  const inner = (unwrapData(response) ?? {}) as Record<string, unknown>;
  return (key: string): unknown => outer[key] ?? inner[key];
}

/** Most write endpoints answer `{ success, message, invoice }`. */
function readInvoice(response: unknown): InvoiceDto {
  const pick = picker(response);
  return (pick("invoice") ?? unwrapData(response)) as InvoiceDto;
}

function unwrapPaginated<T>(
  response: ApiResponse<PaginatedResponse<T> | T[]> | PaginatedResponse<T> | T[]
): PaginatedResponse<T> {
  const unwrapped = unwrapData(response);
  if (Array.isArray(unwrapped)) {
    return {
      items: unwrapped,
      meta: {
        total: unwrapped.length,
        page: 1,
        limit: unwrapped.length || 10,
        totalPages: 1,
      },
    };
  }
  if (unwrapped && typeof unwrapped === "object") {
    const obj = unwrapped as unknown as Record<string, unknown>;
    const metaObj =
      obj.meta && typeof obj.meta === "object"
        ? (obj.meta as Record<string, unknown>)
        : {};

    if (Array.isArray(obj.items)) {
      const items = obj.items as T[];
      return {
        items,
        meta: {
          // The API names these `totalItems` / `currentPage` / `perPage` /
          // `hasPrevPage`; the older aliases are kept as fallbacks.
          total:
            (metaObj.totalItems as number) ??
            (metaObj.total as number) ??
            (obj.total as number) ??
            items.length,
          page:
            (metaObj.currentPage as number) ??
            (metaObj.page as number) ??
            (obj.page as number) ??
            1,
          limit:
            (metaObj.perPage as number) ??
            (metaObj.limit as number) ??
            (obj.limit as number) ??
            items.length,
          totalPages:
            (metaObj.totalPages as number) ?? (obj.totalPages as number) ?? 1,
          hasNextPage: metaObj.hasNextPage as boolean | undefined,
          hasPreviousPage: (metaObj.hasPrevPage ??
            metaObj.hasPreviousPage) as boolean | undefined,
          // `GET /billing/invoices` returns KPI counts alongside the page.
          kpi: readKpi(metaObj.kpi ?? obj.kpi ?? metaObj.counts),
        },
      };
    }
    if (Array.isArray(obj.data)) {
      return {
        items: obj.data as T[],
        meta: {
          total: (metaObj.total as number) ?? (obj.total as number) ?? (obj.data as T[]).length,
          page: (metaObj.page as number) ?? (obj.page as number) ?? 1,
          limit: (metaObj.limit as number) ?? (obj.limit as number) ?? (obj.data as T[]).length,
          totalPages: (metaObj.totalPages as number) ?? (obj.totalPages as number) ?? 1,
        },
      };
    }
  }
  return {
    items: [],
    meta: {
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0,
    },
  };
}

/**
 * An invoice exists only once a payment has **resolved**. A card order that is
 * still being paid has no invoice and no payment row at all:
 *
 *   STRIPE order → PENDING  → invoices: []      (nothing to show yet)
 *                  paid     → Invoice PAID
 *                  failed   → Invoice VOID (audit record), order FAILED
 *   COD order    → placed   → Invoice ISSUED   (courier collects)
 *                  delivered→ Invoice PAID, payment SUCCEEDED
 *
 * So payment state for a store order is read from `order.status`, never from
 * `invoices[0]`. See `lib/invoice-state.ts` for the derived helpers.
 */
export type InvoiceStatus =
  | "DRAFT"
  | "ISSUED"
  | "PARTIALLY_PAID"
  | "PAID"
  | "VOID"
  | "OVERDUE";

export type InvoicePaymentStatus =
  | "PENDING"
  | "SUCCEEDED"
  | "FAILED"
  | "REFUNDED"
  | "PARTIALLY_REFUNDED";

/** Plain string server-side, not an enum. */
export type RefundOutcome = "COMPLETED" | "MANUAL_REQUIRED";

export interface InvoiceLineItemDto {
  description: string;
  quantity: number;
  unitPriceUsd: string | number;
  totalUsd?: string | number;
  sortOrder?: number;
}

/**
 * Money always arrives as a decimal string — coerce before arithmetic.
 */
export interface InvoicePaymentDto {
  id: string;
  status: InvoicePaymentStatus | string;
  amountUsd: string | number;
  methodLabel?: string;
  transactionReference?: string;
  processedAt?: string;
  paidAt?: string;
  createdAt?: string;
}

export interface InvoiceRefundDto {
  id: string;
  paymentId?: string;
  status: RefundOutcome | string;
  amountUsd: string | number;
  reason?: string;
  transactionReference?: string;
  processedAt?: string;
  createdAt?: string;
}

export interface InvoiceDto {
  id: string;
  businessId: string;
  customerId: string;
  /** Set when this invoice belongs to a store order — see the boundary rule. */
  productOrderId?: string | null;
  serviceOrderId?: string | null;
  status: InvoiceStatus | string;
  issueDate?: string;
  dueDate?: string;
  paidAt?: string;
  subtotalUsd: string | number;
  taxUsd: string | number;
  discountUsd?: string | number;
  totalUsd: string | number;
  notes?: string;
  customer?: {
    id: string;
    displayName?: string;
    email?: string;
    phone?: string;
  };
  /** Includes the freight line, so Σ(lineItems) + tax − discount === totalUsd. */
  lineItems: InvoiceLineItemDto[];
  payments?: InvoicePaymentDto[];
  refunds?: InvoiceRefundDto[];
}

/** Platform-wide status counts. NOT affected by the current list filters. */
export interface InvoiceKpi {
  issued: number;
  paid: number;
  partiallyPaid: number;
  overdue: number;
  void: number;
  total: number;
}

export interface GetInvoicesParams {
  page?: number;
  /** Max 100. */
  limit?: number;
  status?: InvoiceStatus | string;
  /** Admin list only: businessId / customer name / email. */
  search?: string;
  /** Admin list only. */
  customerId?: string;
}

/**
 * Service and custom invoices only — store orders self-invoice, so never
 * create one for a product order.
 */
export interface CreateInvoiceRequest {
  customerId: string;
  lineItems: Array<{
    description: string;
    quantity?: number;
    unitPriceUsd: number;
  }>;
  serviceOrderId?: string;
  discountUsd?: number;
  taxUsd?: number;
  /** `YYYY-MM-DD`. Defaults to +14 days server-side. */
  dueDate?: string;
  notes?: string;
  status?: InvoiceStatus;
}

/** Sending `lineItems` REPLACES every existing line. */
export interface UpdateInvoiceRequest {
  lineItems?: Array<{
    description: string;
    quantity?: number;
    unitPriceUsd: number;
  }>;
  discountUsd?: number;
  taxUsd?: number;
  dueDate?: string;
  notes?: string;
  status?: InvoiceStatus;
}

export interface RecordOfflinePaymentRequest {
  amountUsd: number;
  /** Required. Cash / Check / Wire. A card label is rejected for store orders. */
  methodLabel: string;
  transactionReference?: string;
  status?: InvoicePaymentStatus;
}

export interface RecordPaymentResult {
  success: boolean;
  message: string;
  payment?: InvoicePaymentDto;
  invoice?: InvoiceDto;
}

/** Refunds ONE specific payment. Partial amounts allowed. */
export interface RecordRefundRequest {
  paymentId: string;
  amountUsd: number;
  reason?: string;
}

export interface RecordRefundResult {
  success: boolean;
  message: string;
  refund: InvoiceRefundDto;
  stripeRefundId: string | null;
  /**
   * `true` means **no money moved** (cash/check settlement) — somebody has to
   * repay the customer by hand. Always branch on this.
   */
  requiresManualPayout: boolean;
  invoice?: InvoiceDto;
}

export interface StripeInvoiceIntent {
  success: boolean;
  clientSecret: string;
  paymentIntentId: string;
  amountUsd: number;
  currency: string;
  invoiceBusinessId?: string;
}

export interface ConfirmStripePaymentResult {
  success: boolean;
  message: string;
  payment?: InvoicePaymentDto;
  invoice?: InvoiceDto;
}

export const billingApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAdminInvoices: builder.query<PaginatedResponse<InvoiceDto>, GetInvoicesParams | void>({
      query: (params) => ({
        url: "/billing/invoices",
        params: params || undefined,
      }),
      transformResponse: (
        response: ApiResponse<PaginatedResponse<InvoiceDto> | InvoiceDto[]> | PaginatedResponse<InvoiceDto> | InvoiceDto[]
      ) => unwrapPaginated(response),
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ id }) => ({ type: "Invoice" as const, id })),
              { type: "Invoice", id: "ADMIN_LIST" },
            ]
          : [{ type: "Invoice", id: "ADMIN_LIST" }],
    }),
    /** DRAFT invoices are always excluded, even if `status=DRAFT` is passed. */
    getMyInvoices: builder.query<PaginatedResponse<InvoiceDto>, GetInvoicesParams | void>({
      query: (params) => ({
        url: "/billing/invoices/me",
        params: params
          ? {
              ...params,
              ...(params.limit ? { limit: Math.min(params.limit, 100) } : {}),
            }
          : undefined,
      }),
      transformResponse: (
        response: ApiResponse<PaginatedResponse<InvoiceDto> | InvoiceDto[]> | PaginatedResponse<InvoiceDto> | InvoiceDto[]
      ) => unwrapPaginated(response),
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ id }) => ({ type: "Invoice" as const, id })),
              { type: "Invoice", id: "MY_LIST" },
            ]
          : [{ type: "Invoice", id: "MY_LIST" }],
    }),
    getInvoiceById: builder.query<InvoiceDto, string>({
      query: (id) => `/billing/invoices/${id}`,
      transformResponse: (response: ApiResponse<InvoiceDto> | InvoiceDto) => unwrapData(response),
      providesTags: (_result, _error, id) => [{ type: "Invoice", id }],
    }),
    getInvoiceHtml: builder.query<string, string>({
      query: (id) => ({
        url: `/billing/invoices/${id}/html`,
        responseHandler: (response) => response.text(),
      }),
    }),
    createInvoice: builder.mutation<InvoiceDto, CreateInvoiceRequest>({
      query: (body) => ({
        url: "/billing/invoices",
        method: "POST",
        body,
      }),
      transformResponse: (response: unknown) => readInvoice(response),
      invalidatesTags: [
        { type: "Invoice", id: "ADMIN_LIST" },
        { type: "Invoice", id: "MY_LIST" },
      ],
    }),

    /** Sending `lineItems` replaces every existing line. 400 once paid. */
    updateInvoice: builder.mutation<
      InvoiceDto,
      { id: string; body: UpdateInvoiceRequest }
    >({
      query: ({ id, body }) => ({
        url: `/billing/invoices/${id}`,
        method: "PATCH",
        body,
      }),
      transformResponse: (response: unknown) => readInvoice(response),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Invoice", id },
        { type: "Invoice", id: "ADMIN_LIST" },
        { type: "Invoice", id: "MY_LIST" },
      ],
    }),

    /**
     * Records an offline settlement — cash, check or wire. A card `methodLabel`
     * is rejected on a store-order invoice (409 on a duplicate reference).
     */
    recordOfflinePayment: builder.mutation<
      RecordPaymentResult,
      { id: string; body: RecordOfflinePaymentRequest }
    >({
      query: ({ id, body }) => ({
        url: `/billing/invoices/${id}/payments`,
        method: "POST",
        body: {
          amountUsd: body.amountUsd,
          methodLabel: body.methodLabel,
          ...(body.transactionReference?.trim()
            ? { transactionReference: body.transactionReference.trim() }
            : {}),
          ...(body.status ? { status: body.status } : {}),
        },
      }),
      transformResponse: (response: unknown): RecordPaymentResult => {
        const pick = picker(response);
        return {
          success: pick("success") !== false,
          message: str(pick("message"), "Payment recorded."),
          payment: pick("payment") as InvoicePaymentDto | undefined,
          invoice: pick("invoice") as InvoiceDto | undefined,
        };
      },
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Invoice", id },
        { type: "Invoice", id: "ADMIN_LIST" },
        { type: "Invoice", id: "MY_LIST" },
        { type: "Payment", id: "LIST" },
      ],
    }),

    /**
     * Refunds ONE specific payment on the invoice. Partial amounts allowed.
     * Callers MUST branch on `requiresManualPayout` — true means no money
     * moved and someone has to repay the customer by hand.
     */
    recordInvoiceRefund: builder.mutation<
      RecordRefundResult,
      { id: string; body: RecordRefundRequest }
    >({
      query: ({ id, body }) => ({
        url: `/billing/invoices/${id}/refunds`,
        method: "POST",
        body,
      }),
      transformResponse: (response: unknown): RecordRefundResult => {
        const pick = picker(response);
        const refund = (pick("refund") ?? {}) as InvoiceRefundDto;
        const stripeRefundId = str(pick("stripeRefundId"));
        return {
          success: pick("success") !== false,
          message: str(pick("message"), "Refund processed."),
          refund,
          stripeRefundId: stripeRefundId || null,
          requiresManualPayout:
            Boolean(pick("requiresManualPayout")) ||
            String(refund?.status ?? "").toUpperCase() === "MANUAL_REQUIRED",
          invoice: pick("invoice") as InvoiceDto | undefined,
        };
      },
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Invoice", id },
        { type: "Invoice", id: "ADMIN_LIST" },
        { type: "Invoice", id: "MY_LIST" },
        { type: "Payment", id: "LIST" },
      ],
    }),

    /**
     * Service and custom invoices only. 400 for a store-order invoice, or one
     * already PAID / VOID / DRAFT / with nothing outstanding.
     */
    createStripePaymentIntent: builder.mutation<StripeInvoiceIntent, string>({
      query: (invoiceId) => ({
        url: `/billing/invoices/${invoiceId}/stripe/payment-intent`,
        method: "POST",
      }),
      transformResponse: (response: unknown): StripeInvoiceIntent => {
        const pick = picker(response);
        return {
          success: pick("success") !== false,
          clientSecret: str(pick("clientSecret")),
          // Returned directly now — never parse it out of the client secret.
          paymentIntentId: str(pick("paymentIntentId")),
          amountUsd: Number(pick("amountUsd")) || 0,
          currency: str(pick("currency"), "usd"),
          invoiceBusinessId: str(pick("invoiceBusinessId")) || undefined,
        };
      },
    }),

    /**
     * Server re-verifies with Stripe and checks the intent belongs to this
     * invoice. Idempotent: a repeat call reports the payment already recorded.
     */
    confirmStripePayment: builder.mutation<
      ConfirmStripePaymentResult,
      { invoiceId: string; paymentIntentId: string }
    >({
      query: ({ invoiceId, paymentIntentId }) => ({
        url: `/billing/invoices/${invoiceId}/stripe/confirm`,
        method: "POST",
        body: { paymentIntentId },
      }),
      transformResponse: (response: unknown): ConfirmStripePaymentResult => {
        const pick = picker(response);
        return {
          success: pick("success") !== false,
          message: str(pick("message"), "Payment confirmed."),
          payment: pick("payment") as InvoicePaymentDto | undefined,
          invoice: pick("invoice") as InvoiceDto | undefined,
        };
      },
      invalidatesTags: (_result, _error, { invoiceId }) => [
        { type: "Invoice", id: invoiceId },
        { type: "Invoice", id: "MY_LIST" },
        { type: "Invoice", id: "ADMIN_LIST" },
        { type: "Payment", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetAdminInvoicesQuery,
  useGetMyInvoicesQuery,
  useGetInvoiceByIdQuery,
  useGetInvoiceHtmlQuery,
  useLazyGetInvoiceHtmlQuery,
  useCreateInvoiceMutation,
  useUpdateInvoiceMutation,
  useRecordOfflinePaymentMutation,
  useRecordInvoiceRefundMutation,
  useCreateStripePaymentIntentMutation,
  useConfirmStripePaymentMutation,
} = billingApi;
