import { baseApi } from "./baseApi";

export interface GetReportsParams {
  period?: "7d" | "30d" | "90d" | "1y";
  from?: string;
  to?: string;
}

export interface OverviewReportDto {
  totalRevenueUsd: number;
  totalOrders: number;
  totalServiceRequests: number;
  activeCustomers: number;
  conversionRate: number;
}

export interface SalesReportDto {
  totalSalesUsd: number;
  averageOrderValueUsd: number;
  salesByDay: Array<{ date: string; amountUsd: number }>;
  topProducts: Array<{ id: string; name: string; unitsSold: number; revenueUsd: number }>;
}

export interface ServiceOperationsReportDto {
  totalRequests: number;
  completionRate: number;
  averageResolutionHours: number;
  topServices: Array<{ slug: string; name: string; count: number }>;
}

export interface TechniciansReportDto {
  totalTechnicians: number;
  activeJobsCount: number;
  completedJobsCount: number;
  leaderboard: Array<{
    id: string;
    displayName: string;
    completedJobs: number;
    rating: number;
  }>;
}

export interface CustomersReportDto {
  totalCustomers: number;
  newCustomersThisPeriod: number;
  repeatPurchaseRate: number;
  growth: Array<{ month: string; count: number }>;
}

export const reportsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getOverviewReport: builder.query<OverviewReportDto, GetReportsParams | void>({
      query: (params) => ({
        url: "/reports/overview",
        params: params || undefined,
      }),
      providesTags: [{ type: "Report", id: "OVERVIEW" }],
    }),
    getSalesReport: builder.query<SalesReportDto, GetReportsParams | void>({
      query: (params) => ({
        url: "/reports/sales",
        params: params || undefined,
      }),
      providesTags: [{ type: "Report", id: "SALES" }],
    }),
    getServiceOperationsReport: builder.query<ServiceOperationsReportDto, GetReportsParams | void>({
      query: (params) => ({
        url: "/reports/service-operations",
        params: params || undefined,
      }),
      providesTags: [{ type: "Report", id: "SERVICES" }],
    }),
    getTechniciansReport: builder.query<TechniciansReportDto, GetReportsParams | void>({
      query: (params) => ({
        url: "/reports/technicians",
        params: params || undefined,
      }),
      providesTags: [{ type: "Report", id: "TECHNICIANS" }],
    }),
    getCustomersReport: builder.query<CustomersReportDto, GetReportsParams | void>({
      query: (params) => ({
        url: "/reports/customers",
        params: params || undefined,
      }),
      providesTags: [{ type: "Report", id: "CUSTOMERS" }],
    }),
  }),
});

export const {
  useGetOverviewReportQuery,
  useGetSalesReportQuery,
  useGetServiceOperationsReportQuery,
  useGetTechniciansReportQuery,
  useGetCustomersReportQuery,
} = reportsApi;
