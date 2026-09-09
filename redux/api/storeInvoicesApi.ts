import { baseApi } from "./baseApi";

/**
 * Store invoices — `/store/invoices/orders/:orderId`. These are the invoices
 * attached to a PRODUCT order. Service and custom invoices live under
 * `/billing/invoices` (see `billingApi`).
 *
 * The backend echoes `downloadUrl` / `viewUrl` on the order payload, but those
 * are absolute `/api/v1/...` paths. This client is configured against the
 * server root, so those strings are kept for reference only — always fetch
 * through these endpoints, which carry the bearer token.
 */

export interface StoreInvoiceLineItem {
  id?: string;
  description: string;
  quantity: number;
  unitPriceUsd: string;
  totalUsd: string;
  sortOrder?: number;
}

export interface StoreInvoicePayment {
  id: string;
  status: string;
  amountUsd: string;
  methodLabel?: string;
  transactionReference?: string;
  paidAt?: string;
}

export interface StoreInvoiceRefund {
  id: string;
  status: string;
  amountUsd: string;
  reason?: string;
  transactionReference?: string;
  processedAt?: string;
}

export interface StoreInvoiceDto {
  id: string;
  businessId: string;
  orderId?: string;
  status: string;
  subtotalUsd: string;
  taxUsd: string;
  discountUsd: string;
  totalUsd: string;
  dueDate?: string;
  paidAt?: string;
  notes?: string;
  lineItems: StoreInvoiceLineItem[];
  payments: StoreInvoicePayment[];
  refunds: StoreInvoiceRefund[];
  /** Server-rendered links; informational only — see the note above. */
  downloadUrl?: string;
  viewUrl?: string;
  createdAt?: string;
}

/** `POST /store/invoices/orders/:orderId/generate` writes the PDF to disk. */
export interface GeneratedInvoiceMeta {
  success: boolean;
  message?: string;
  invoiceId?: string;
  businessId?: string;
  fileName?: string;
  filePath?: string;
  sizeBytes?: number;
  generatedAt?: string;
}

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

function money(value: unknown, fallback = "0.00"): string {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value.toFixed(2);
  }
  const text = str(value);
  return text === "" ? fallback : text;
}

function unwrap(response: unknown): unknown {
  const record = asRecord(response);
  if ("data" in record && record.data !== null && record.data !== undefined) {
    return record.data;
  }
  return response;
}

export function normalizeStoreInvoice(input: unknown): StoreInvoiceDto {
  const envelope = asRecord(unwrap(input));
  // The endpoint answers { orderId, orderBusinessId, invoice } — unwrap the
  // invoice, tolerating a bare invoice body from older deployments.
  const raw = envelope.invoice ? asRecord(envelope.invoice) : envelope;
  const subtotalUsd = money(raw.subtotalUsd);

  return {
    id: str(raw.id),
    businessId: str(raw.businessId),
    orderId: str(raw.orderId) || undefined,
    status: str(raw.status, "ISSUED").toUpperCase(),
    subtotalUsd,
    taxUsd: money(raw.taxUsd),
    discountUsd: money(raw.discountUsd),
    totalUsd: money(raw.totalUsd, subtotalUsd),
    dueDate: str(raw.dueDate) || undefined,
    paidAt: str(raw.paidAt) || undefined,
    notes: str(raw.notes) || undefined,
    // Sorted by `sortOrder` server-side, but re-sort defensively so a
    // reordered payload still renders in the intended order.
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
      status: str(payment.status, "PENDING").toUpperCase(),
      amountUsd: money(payment.amountUsd),
      methodLabel: str(payment.methodLabel) || undefined,
      transactionReference: str(payment.transactionReference) || undefined,
      paidAt: str(payment.paidAt) || undefined,
    })),
    refunds: asArray(raw.refunds).map((refund) => ({
      id: str(refund.id),
      status: str(refund.status, "PENDING").toUpperCase(),
      amountUsd: money(refund.amountUsd),
      reason: str(refund.reason) || undefined,
      transactionReference:
        str(refund.transactionReference) || str(refund.stripeRefundId) || undefined,
      processedAt: str(refund.processedAt) || undefined,
    })),
    downloadUrl: str(raw.downloadUrl) || undefined,
    viewUrl: str(raw.viewUrl) || undefined,
    createdAt: str(raw.createdAt) || undefined,
  };
}

export const storeInvoicesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /** JSON invoice for an order, including line items and payments. */
    getStoreOrderInvoice: builder.query<StoreInvoiceDto, string>({
      query: (orderId) => `/store/invoices/orders/${orderId}`,
      transformResponse: normalizeStoreInvoice,
      providesTags: (_result, _error, orderId) => [
        { type: "Invoice", id: `ORDER_${orderId}` },
      ],
    }),

    /** Renders the PDF on the server and returns its metadata. */
    generateStoreOrderInvoice: builder.mutation<GeneratedInvoiceMeta, string>({
      query: (orderId) => ({
        url: `/store/invoices/orders/${orderId}/generate`,
        method: "POST",
      }),
      transformResponse: (response: unknown): GeneratedInvoiceMeta => {
        const raw = asRecord(response);
        const inner = asRecord(unwrap(response));
        const pick = (key: string): unknown => raw[key] ?? inner[key];
        return {
          success: pick("success") !== false,
          message: str(pick("message")) || undefined,
          invoiceId: str(pick("invoiceId")) || undefined,
          businessId: str(pick("businessId")) || undefined,
          fileName: str(pick("fileName")) || undefined,
          filePath: str(pick("filePath")) || undefined,
          sizeBytes: Number(pick("sizeBytes")) || undefined,
          generatedAt: str(pick("generatedAt")) || undefined,
        };
      },
      invalidatesTags: (_result, _error, orderId) => [
        { type: "Invoice", id: `ORDER_${orderId}` },
      ],
    }),

    /**
     * Streams the PDF binary. A mutation rather than a query so the blob is
     * never held in the RTK Query cache.
     */
    downloadStoreOrderInvoice: builder.mutation<Blob, string>({
      query: (orderId) => ({
        url: `/store/invoices/orders/${orderId}/download`,
        method: "GET",
        responseHandler: (response) => response.blob(),
        // A PDF body would otherwise be parsed as JSON and rejected.
        cache: "no-cache",
      }),
    }),
  }),
});

export const {
  useGetStoreOrderInvoiceQuery,
  useGenerateStoreOrderInvoiceMutation,
  useDownloadStoreOrderInvoiceMutation,
} = storeInvoicesApi;
