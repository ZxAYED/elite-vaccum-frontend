import { baseApi } from "./baseApi";

/**
 * `GET /dashboard` — admin only, cached 60s server-side. One request backs
 * every card, chart and list on the admin overview screen, so the page makes
 * no other calls.
 */

/** The request row shape shared by `recentRequests` and `awaitingQuotation`. */
export interface AdminRequestRow {
  id: string;
  businessId: string;
  title: string;
  status: string;
  urgency: string;
  serviceId: string;
  serviceName: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  propertyLabel: string;
  preferredDate: string;
  preferredTime: string;
  /** Decimal string from the API — coerce before arithmetic. */
  estimatedAmountUsd: string;
  assignedTechnicianId: string | null;
  assignedTechnician: string | null;
  isQuoted: boolean;
  submittedAt: string;
}

export interface DashboardMetrics {
  sixMonthRevenueUsd: number;
  /** Last 6 months vs the 6 before them. Can be negative. */
  revenueGrowthPercent: number;
  trackedOrders: number;
  scheduledVisits: number;
  activeTechnicians: number;
  offlineTechnicians: number;
  activeCustomers: number;
  pendingReview: number;
  confirmedWork: number;
  awaitingQuotation: number;
}

/** Always exactly 6 buckets, pre-seeded, so empty months plot as 0. */
export interface RevenueTrendPoint {
  month: string;
  label: string;
  productRevenue: number;
  serviceRevenue: number;
  totalRevenue: number;
}

export interface ServiceDistributionSlice {
  serviceId: string;
  serviceName: string;
  category: string;
  count: number;
  /** Server-computed — never recompute this client-side. */
  percentage: number;
}

export interface DashboardDto {
  metrics: DashboardMetrics;
  revenueTrend: RevenueTrendPoint[];
  serviceDistribution: ServiceDistributionSlice[];
  recentRequests: AdminRequestRow[];
  awaitingQuotation: {
    totalCount: number;
    items: AdminRequestRow[];
  };
}

/* -------------------------------------------------------------------------- */
/* Normalization                                                              */
/* -------------------------------------------------------------------------- */

type Raw = Record<string, unknown>;

export function asRecord(value: unknown): Raw {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Raw)
    : {};
}

export function asArray(value: unknown): Raw[] {
  return Array.isArray(value) ? value.map(asRecord) : [];
}

export function str(value: unknown, fallback = ""): string {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return fallback;
}

export function num(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function unwrapData(response: unknown): unknown {
  const record = asRecord(response);
  if ("data" in record && record.data !== null && record.data !== undefined) {
    return record.data;
  }
  return response;
}

export function normalizeRequestRow(raw: Raw): AdminRequestRow {
  return {
    id: str(raw.id),
    businessId: str(raw.businessId),
    title: str(raw.title, "Service request"),
    status: str(raw.status, "SUBMITTED").toUpperCase(),
    urgency: str(raw.urgency).toUpperCase(),
    serviceId: str(raw.serviceId),
    serviceName: str(raw.serviceName),
    customerId: str(raw.customerId),
    customerName: str(raw.customerName),
    customerEmail: str(raw.customerEmail),
    customerPhone: str(raw.customerPhone),
    propertyLabel: str(raw.propertyLabel),
    preferredDate: str(raw.preferredDate),
    preferredTime: str(raw.preferredTime),
    estimatedAmountUsd: str(raw.estimatedAmountUsd),
    assignedTechnicianId: str(raw.assignedTechnicianId) || null,
    assignedTechnician: str(raw.assignedTechnician) || null,
    isQuoted: Boolean(raw.isQuoted),
    submittedAt: str(raw.submittedAt) || str(raw.createdAt),
  };
}

function normalizeDashboard(response: unknown): DashboardDto {
  const data = asRecord(unwrapData(response));
  const metrics = asRecord(data.metrics);
  const awaiting = asRecord(data.awaitingQuotation);

  return {
    metrics: {
      sixMonthRevenueUsd: num(metrics.sixMonthRevenueUsd),
      revenueGrowthPercent: num(metrics.revenueGrowthPercent),
      trackedOrders: num(metrics.trackedOrders),
      scheduledVisits: num(metrics.scheduledVisits),
      activeTechnicians: num(metrics.activeTechnicians),
      offlineTechnicians: num(metrics.offlineTechnicians),
      activeCustomers: num(metrics.activeCustomers),
      pendingReview: num(metrics.pendingReview),
      confirmedWork: num(metrics.confirmedWork),
      awaitingQuotation: num(metrics.awaitingQuotation),
    },
    revenueTrend: asArray(data.revenueTrend).map((point) => ({
      month: str(point.month),
      label: str(point.label) || str(point.month),
      productRevenue: num(point.productRevenue),
      serviceRevenue: num(point.serviceRevenue),
      totalRevenue: num(point.totalRevenue),
    })),
    serviceDistribution: asArray(data.serviceDistribution).map((slice) => ({
      serviceId: str(slice.serviceId),
      serviceName: str(slice.serviceName, "Unnamed service"),
      category: str(slice.category),
      count: num(slice.count),
      percentage: num(slice.percentage),
    })),
    recentRequests: asArray(data.recentRequests).map(normalizeRequestRow),
    awaitingQuotation: {
      totalCount: num(awaiting.totalCount),
      items: asArray(awaiting.items).map(normalizeRequestRow),
    },
  };
}

export const dashboardApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAdminDashboard: builder.query<DashboardDto, void>({
      query: () => "/dashboard",
      transformResponse: normalizeDashboard,
      providesTags: [{ type: "Dashboard", id: "ADMIN" }],
      // Mirrors the server's own 60s cache.
      keepUnusedDataFor: 60,
    }),
  }),
});

export const { useGetAdminDashboardQuery } = dashboardApi;
