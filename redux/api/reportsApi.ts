import { baseApi } from "./baseApi";
import {
  asArray,
  asRecord,
  normalizeRequestRow,
  num,
  str,
  unwrapData,
  type AdminRequestRow,
} from "./dashboardApi";

/**
 * `/reports/*` — admin only, all cached 60s server-side, all wrapped as
 * `{ success, data }`.
 *
 * Range handling is not uniform, and the UI must not pretend otherwise:
 * - `overview` / `sales` / `service-operations` accept `period` (or
 *   `from`/`to`), and `overview` additionally accepts `orderType`.
 * - `technicians` and `customers` take **no parameters at all** — passing a
 *   period would be silently ignored, so we never send one.
 * - Inside `overview`, only the **revenue** figures honour the range; the
 *   count metrics are lifetime totals, and `revenueOverTime` is a fixed
 *   14-day daily series regardless of the range asked for. Use `/dashboard`'s
 *   `revenueTrend` for anything monthly.
 */

export type ReportPeriod = "7d" | "30d" | "90d" | "1y";
export type ReportOrderType = "ALL" | "PRODUCT" | "SERVICE";

export interface GetReportsParams {
  period?: ReportPeriod;
  /** `YYYY-MM-DD`. Overrides `period` when both are sent. */
  from?: string;
  to?: string;
}

export interface GetOverviewParams extends GetReportsParams {
  /** Overview only — the other reports ignore it. */
  orderType?: ReportOrderType;
}

export interface ReportDateRange {
  from: string;
  to: string;
  orderType?: ReportOrderType;
}

export interface OverviewMetrics {
  /** Revenue figures honour the selected range. */
  totalRevenue: number;
  productRevenue: number;
  serviceRevenue: number;
  refundAmount: number;
  /** Counts below are lifetime totals, not range-scoped. */
  totalOrders: number;
  productOrdersCount: number;
  serviceOrdersCount: number;
  completedServicesCount: number;
  pendingRequestsCount: number;
  outstandingInvoicesCount: number;
}

export interface RevenuePoint {
  date: string;
  productRevenue: number;
  serviceRevenue: number;
  totalRevenue: number;
}

/** The service pipeline, request through completion. */
export interface ServiceFunnel {
  requested: number;
  accepted: number;
  quoted: number;
  quoteAccepted: number;
  serviceOrder: number;
  completed: number;
}

export interface OverviewReportDto {
  metrics: OverviewMetrics;
  /** Fixed 14 daily points — see the note above. */
  revenueOverTime: RevenuePoint[];
  serviceFunnel: ServiceFunnel;
  awaitingQuotation: {
    totalCount: number;
    items: AdminRequestRow[];
  };
  dateRange: ReportDateRange;
}

export interface TopProductRow {
  productId: string;
  name: string;
  quantity: number;
  revenue: number;
}

export interface SalesReportDto {
  totalSalesUsd: number;
  averageOrderValueUsd: number;
  totalProductOrders: number;
  /** Top 5 by revenue. */
  topProducts: TopProductRow[];
  dateRange: ReportDateRange;
}

export interface TopServiceRow {
  serviceId: string;
  serviceName: string;
  category: string;
  count: number;
  /** Server-computed — never recompute. */
  percentage: number;
}

export interface ServiceOperationsReportDto {
  totalRequests: number;
  topServices: TopServiceRow[];
  dateRange: ReportDateRange;
}

export interface TechnicianReportRow {
  id: string;
  displayName: string;
  rating: number;
  status: string;
  completedJobs: number;
  assignedJobsCount: number;
  serviceReportsCount: number;
}

export interface CustomersReportDto {
  totalCustomers: number;
  activeCustomers: number;
  repeatRatePercentage: number;
}

/* -------------------------------------------------------------------------- */
/* Normalization                                                              */
/* -------------------------------------------------------------------------- */

function normalizeDateRange(raw: unknown): ReportDateRange {
  const record = asRecord(raw);
  return {
    from: str(record.from),
    to: str(record.to),
    orderType: record.orderType
      ? (str(record.orderType).toUpperCase() as ReportOrderType)
      : undefined,
  };
}

function normalizeOverview(response: unknown): OverviewReportDto {
  const data = asRecord(unwrapData(response));
  const metrics = asRecord(data.metrics);
  const funnel = asRecord(data.serviceFunnel);
  const awaiting = asRecord(data.awaitingQuotation);

  return {
    metrics: {
      totalRevenue: num(metrics.totalRevenue),
      productRevenue: num(metrics.productRevenue),
      serviceRevenue: num(metrics.serviceRevenue),
      refundAmount: num(metrics.refundAmount),
      totalOrders: num(metrics.totalOrders),
      productOrdersCount: num(metrics.productOrdersCount),
      serviceOrdersCount: num(metrics.serviceOrdersCount),
      completedServicesCount: num(metrics.completedServicesCount),
      pendingRequestsCount: num(metrics.pendingRequestsCount),
      outstandingInvoicesCount: num(metrics.outstandingInvoicesCount),
    },
    revenueOverTime: asArray(data.revenueOverTime).map((point) => ({
      date: str(point.date),
      productRevenue: num(point.productRevenue),
      serviceRevenue: num(point.serviceRevenue),
      totalRevenue: num(point.totalRevenue),
    })),
    serviceFunnel: {
      requested: num(funnel.requested),
      accepted: num(funnel.accepted),
      quoted: num(funnel.quoted),
      quoteAccepted: num(funnel.quoteAccepted),
      serviceOrder: num(funnel.serviceOrder),
      completed: num(funnel.completed),
    },
    awaitingQuotation: {
      totalCount: num(awaiting.totalCount),
      items: asArray(awaiting.items).map(normalizeRequestRow),
    },
    dateRange: normalizeDateRange(data.dateRange),
  };
}

function normalizeSales(response: unknown): SalesReportDto {
  const data = asRecord(unwrapData(response));
  return {
    totalSalesUsd: num(data.totalSalesUsd),
    averageOrderValueUsd: num(data.averageOrderValueUsd),
    totalProductOrders: num(data.totalProductOrders),
    topProducts: asArray(data.topProducts).map((row) => ({
      productId: str(row.productId),
      name: str(row.name, "Unnamed product"),
      quantity: num(row.quantity),
      revenue: num(row.revenue),
    })),
    dateRange: normalizeDateRange(data.dateRange),
  };
}

function normalizeServiceOperations(
  response: unknown,
): ServiceOperationsReportDto {
  const data = asRecord(unwrapData(response));
  return {
    totalRequests: num(data.totalRequests),
    topServices: asArray(data.topServices).map((row) => ({
      serviceId: str(row.serviceId),
      serviceName: str(row.serviceName, "Unnamed service"),
      category: str(row.category),
      count: num(row.count),
      percentage: num(row.percentage),
    })),
    dateRange: normalizeDateRange(data.dateRange),
  };
}

/** This endpoint returns a bare array, not an object. */
function normalizeTechnicians(response: unknown): TechnicianReportRow[] {
  const data = unwrapData(response);
  return asArray(data).map((row) => ({
    id: str(row.id),
    displayName: str(row.displayName, "Technician"),
    rating: num(row.rating),
    status: str(row.status, "ACTIVE").toUpperCase(),
    completedJobs: num(row.completedJobs),
    assignedJobsCount: num(row.assignedJobsCount),
    serviceReportsCount: num(row.serviceReportsCount),
  }));
}

function normalizeCustomers(response: unknown): CustomersReportDto {
  const data = asRecord(unwrapData(response));
  return {
    totalCustomers: num(data.totalCustomers),
    activeCustomers: num(data.activeCustomers),
    repeatRatePercentage: num(data.repeatRatePercentage),
  };
}

/** `from`/`to` override `period`, so only one of the two is ever sent. */
function buildRangeParams(
  params: GetOverviewParams | void,
): Record<string, string> | undefined {
  if (!params) return undefined;
  const query: Record<string, string> = {};

  if (params.from && params.to) {
    query.from = params.from;
    query.to = params.to;
  } else if (params.period) {
    query.period = params.period;
  }

  if (params.orderType && params.orderType !== "ALL") {
    query.orderType = params.orderType;
  }

  return Object.keys(query).length > 0 ? query : undefined;
}

export const reportsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getOverviewReport: builder.query<OverviewReportDto, GetOverviewParams | void>({
      query: (params) => ({
        url: "/reports/overview",
        params: buildRangeParams(params),
      }),
      transformResponse: normalizeOverview,
      providesTags: [{ type: "Report", id: "OVERVIEW" }],
      keepUnusedDataFor: 60,
    }),

    getSalesReport: builder.query<SalesReportDto, GetReportsParams | void>({
      query: (params) => ({
        url: "/reports/sales",
        params: buildRangeParams(params),
      }),
      transformResponse: normalizeSales,
      providesTags: [{ type: "Report", id: "SALES" }],
      keepUnusedDataFor: 60,
    }),

    getServiceOperationsReport: builder.query<
      ServiceOperationsReportDto,
      GetReportsParams | void
    >({
      query: (params) => ({
        url: "/reports/service-operations",
        params: buildRangeParams(params),
      }),
      transformResponse: normalizeServiceOperations,
      providesTags: [{ type: "Report", id: "SERVICES" }],
      keepUnusedDataFor: 60,
    }),

    /** Takes no parameters — the range selector does not apply. */
    getTechniciansReport: builder.query<TechnicianReportRow[], void>({
      query: () => "/reports/technicians",
      transformResponse: normalizeTechnicians,
      providesTags: [{ type: "Report", id: "TECHNICIANS" }],
      keepUnusedDataFor: 60,
    }),

    /** Takes no parameters — the range selector does not apply. */
    getCustomersReport: builder.query<CustomersReportDto, void>({
      query: () => "/reports/customers",
      transformResponse: normalizeCustomers,
      providesTags: [{ type: "Report", id: "CUSTOMERS" }],
      keepUnusedDataFor: 60,
    }),

    /*
     * CSV exports return a `text/csv` attachment, not JSON. They are
     * mutations so the blob is never cached, and they must be fetched (not
     * linked) because the bearer token would not travel with a new tab.
     */
    exportOrdersCsv: builder.mutation<Blob, GetReportsParams | void>({
      query: (params) => ({
        url: "/reports/export/orders/csv",
        params: buildRangeParams(params),
        responseHandler: (response) => response.blob(),
        cache: "no-cache",
      }),
    }),

    exportServiceRequestsCsv: builder.mutation<Blob, GetReportsParams | void>({
      query: (params) => ({
        url: "/reports/export/service-requests/csv",
        params: buildRangeParams(params),
        responseHandler: (response) => response.blob(),
        cache: "no-cache",
      }),
    }),

    exportInvoicesCsv: builder.mutation<Blob, GetReportsParams | void>({
      query: (params) => ({
        url: "/reports/export/invoices/csv",
        params: buildRangeParams(params),
        responseHandler: (response) => response.blob(),
        cache: "no-cache",
      }),
    }),

    /** Takes no date parameters. */
    exportCustomersCsv: builder.mutation<Blob, void>({
      query: () => ({
        url: "/reports/export/customers/csv",
        responseHandler: (response) => response.blob(),
        cache: "no-cache",
      }),
    }),
  }),
});

export const {
  useGetOverviewReportQuery,
  useGetSalesReportQuery,
  useGetServiceOperationsReportQuery,
  useGetTechniciansReportQuery,
  useGetCustomersReportQuery,
  useExportOrdersCsvMutation,
  useExportServiceRequestsCsvMutation,
  useExportInvoicesCsvMutation,
  useExportCustomersCsvMutation,
} = reportsApi;
