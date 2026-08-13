import {
  getAdminOrders,
  getAdminServiceOrders,
  type AdminOrdersTypeFilter,
} from "@/data/mock/admin-orders";
import { getSharedAdminScheduleRecords } from "@/data/mock/admin-schedule-state";
import { getSharedCustomers, getSharedProducts, getSharedQuotations, getSharedServiceRequests } from "@/data/mock/shared-business-store";
import {
  getBillingInvoices,
  getBillingRefunds,
  type BillingInvoiceRecord,
  type BillingRefundRecord,
} from "@/data/mock/shared-billing";
import { getAdminTechnicians } from "@/data/mock/technicians";
import { getMockTodayIso } from "@/data/mock/mock-clock";

type ReportDateRange = "7d" | "30d" | "90d" | "year" | "all";

export type AdminReportsDateRange = ReportDateRange;

export interface AdminReportStat {
  label: string;
  value: number;
}

export interface AdminReportRevenuePoint {
  label: string;
  productRevenue: number;
  serviceRevenue: number;
  totalRevenue: number;
}

export interface AdminProductReportRow {
  productId: string;
  name: string;
  sku: string;
  orders: number;
  unitsSold: number;
  revenue: number;
  refunds: number;
}

export interface AdminCustomerReportRow {
  customerId: string;
  name: string;
  email: string;
  productOrders: number;
  serviceOrders: number;
  totalSpend: number;
  lastActivity: string | null;
}

export interface AdminTechnicianReportRow {
  technicianId: string;
  displayName: string;
  assignedJobs: number;
  completedJobs: number;
  cancelledJobs: number;
  upcomingJobs: number;
  completionRate: number;
}

export interface AdminReportsSnapshot {
  overview: {
    totalRevenue: number;
    productRevenue: number;
    serviceRevenue: number;
    totalOrders: number;
    productOrders: number;
    serviceOrders: number;
    completedServices: number;
    pendingServiceRequests: number;
    outstandingInvoices: number;
    refundAmount: number;
  };
  sales: {
    revenueSeries: AdminReportRevenuePoint[];
    typeRevenue: Array<{ name: "PRODUCT" | "SERVICE"; revenue: number }>;
    paidVsUnpaid: Array<{ name: string; value: number }>;
    orderCount: number;
    averageOrderValue: number;
    refundTotal: number;
  };
  products: {
    productRevenue: number;
    orderCount: number;
    unitsSold: number;
    averageOrderValue: number;
    refundedOrders: number;
    topProducts: AdminProductReportRow[];
  };
  services: {
    totalRequests: number;
    acceptedRequests: number;
    rejectedRequests: number;
    quotesSent: number;
    quotesAccepted: number;
    quotesRejected: number;
    serviceOrders: number;
    completedServices: number;
    cancelledServices: number;
    serviceRevenue: number;
    averageServiceInvoiceAmount: number;
    funnel: AdminReportStat[];
    requestLeaders: Array<{ name: string; requests: number }>;
  };
  customers: {
    totalCustomers: number;
    newCustomers: number;
    customersWithProductOrders: number;
    customersWithServiceOrders: number;
    repeatCustomers: number;
    topCustomers: AdminCustomerReportRow[];
  };
  technicians: {
    totalTechnicians: number;
    activeTechnicians: number;
    assignedJobs: number;
    completedJobs: number;
    upcomingJobs: number;
    rows: AdminTechnicianReportRow[];
  };
}

function startOfYearIso(referenceIso: string) {
  return `${referenceIso.slice(0, 4)}-01-01`;
}

function subtractDays(isoDate: string, days: number) {
  const date = new Date(`${isoDate}T12:00:00`);
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}

function inRange(dateLike: string | undefined, range: ReportDateRange) {
  if (!dateLike) return false;
  if (range === "all") return true;

  const iso = dateLike.slice(0, 10);
  const today = getMockTodayIso();
  const rangeStart =
    range === "7d"
      ? subtractDays(today, 6)
      : range === "30d"
        ? subtractDays(today, 29)
        : range === "90d"
          ? subtractDays(today, 89)
          : startOfYearIso(today);

  return iso >= rangeStart && iso <= today;
}

function matchesType(type: AdminOrdersTypeFilter, recordType: "PRODUCT" | "SERVICE") {
  return type === "ALL" || type === recordType;
}

function toPeriodLabel(dateLike: string, range: ReportDateRange) {
  const date = new Date(dateLike);
  if (range === "7d" || range === "30d") {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  if (range === "90d") {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  return date.toLocaleDateString("en-US", { month: "short" });
}

function createRevenueSeries(
  invoices: BillingInvoiceRecord[],
  range: ReportDateRange,
  type: AdminOrdersTypeFilter,
) {
  const points = new Map<string, AdminReportRevenuePoint>();

  invoices
    .filter((invoice) => invoice.status === "paid")
    .filter((invoice) => inRange(invoice.createdAt, range))
    .filter((invoice) => matchesType(type, invoice.type))
    .forEach((invoice) => {
      const label = toPeriodLabel(invoice.createdAt, range);
      const current = points.get(label) ?? {
        label,
        productRevenue: 0,
        serviceRevenue: 0,
        totalRevenue: 0,
      };

      if (invoice.type === "PRODUCT") {
        current.productRevenue += invoice.totals.totalUsd;
      } else {
        current.serviceRevenue += invoice.totals.totalUsd;
      }
      current.totalRevenue += invoice.totals.totalUsd;
      points.set(label, current);
    });

  return [...points.values()];
}

function sumRefundAmount(refunds: BillingRefundRecord[], type: AdminOrdersTypeFilter, range: ReportDateRange) {
  return refunds
    .filter((refund) => refund.status === "completed")
    .filter((refund) => inRange(refund.completedAt ?? refund.requestedAt, range))
    .filter((refund) => matchesType(type, refund.type))
    .reduce((sum, refund) => sum + refund.amountUsd, 0);
}

export function getAdminReportsSnapshot(
  range: ReportDateRange,
  type: AdminOrdersTypeFilter,
): AdminReportsSnapshot {
  const orders = getAdminOrders()
    .filter((order) => matchesType(type, order.type))
    .filter((order) => inRange(order.createdAt, range));
  const serviceOrders = getAdminServiceOrders().filter((order) => inRange(order.createdAt, range));
  const serviceOrdersByType = type === "PRODUCT" ? [] : serviceOrders;

  const invoices = getBillingInvoices();
  const refunds = getBillingRefunds();
  const quotations = getSharedQuotations().filter((quotation) => inRange(quotation.createdAt, range));
  const serviceRequests = getSharedServiceRequests().filter((request) => inRange(request.submittedAt, range));
  const serviceRequestsByType = type === "PRODUCT" ? [] : serviceRequests;
  const customers = getSharedCustomers();
  const schedules = getSharedAdminScheduleRecords().filter((schedule) => inRange(schedule.createdAt, range));
  const technicians = getAdminTechnicians();

  const paidInvoices = invoices
    .filter((invoice) => invoice.status === "paid")
    .filter((invoice) => inRange(invoice.createdAt, range))
    .filter((invoice) => matchesType(type, invoice.type));

  const productPaidInvoices = paidInvoices.filter((invoice) => invoice.type === "PRODUCT");
  const servicePaidInvoices = paidInvoices.filter((invoice) => invoice.type === "SERVICE");

  const filteredInvoices = invoices
    .filter((invoice) => inRange(invoice.createdAt, range))
    .filter((invoice) => matchesType(type, invoice.type));

  const productOrders = orders.filter((order) => order.type === "PRODUCT");
  const filteredServiceOrders = orders.filter((order) => order.type === "SERVICE");

  const productRevenue = productPaidInvoices.reduce((sum, invoice) => sum + invoice.totals.totalUsd, 0);
  const serviceRevenue = servicePaidInvoices.reduce((sum, invoice) => sum + invoice.totals.totalUsd, 0);
  const totalRevenue = productRevenue + serviceRevenue;
  const refundAmount = sumRefundAmount(refunds, type, range);

  const outstandingInvoices = filteredInvoices.filter(
    (invoice) => invoice.status !== "paid" && invoice.status !== "refunded" && invoice.status !== "cancelled",
  ).length;

  const completedServices = filteredServiceOrders.filter((order) => order.status === "completed").length;
  const pendingServiceRequests = serviceRequestsByType.filter((request) =>
    request.status === "submitted" ||
    request.status === "under-review" ||
    request.status === "quoted",
  ).length;

  const productAggregates = new Map<string, AdminProductReportRow>();
  productOrders.forEach((order) => {
    order.items.forEach((item) => {
      const current = productAggregates.get(item.productId) ?? {
        productId: item.productId,
        name: item.name,
        sku: item.sku,
        orders: 0,
        unitsSold: 0,
        revenue: 0,
        refunds: 0,
      };
      current.orders += 1;
      current.unitsSold += item.quantity;
      current.revenue += item.quantity * item.unitPriceUsd;
      productAggregates.set(item.productId, current);
    });
  });

  refunds
    .filter((refund) => refund.type === "PRODUCT")
    .filter((refund) => inRange(refund.requestedAt, range))
    .forEach((refund) => {
      const relatedOrder = productOrders.find((order) => order.id === refund.orderId);
      relatedOrder?.items.forEach((item) => {
        const current = productAggregates.get(item.productId);
        if (current) current.refunds += refund.amountUsd;
      });
    });

  const topProducts = [...productAggregates.values()]
    .sort((left, right) => right.revenue - left.revenue)
    .slice(0, 8);

  const productUnitsSold = [...productAggregates.values()].reduce((sum, item) => sum + item.unitsSold, 0);
  const refundedProductOrders = refunds
    .filter((refund) => refund.type === "PRODUCT")
    .filter((refund) => inRange(refund.requestedAt, range)).length;

  const requestLeadersMap = new Map<string, number>();
  serviceRequestsByType.forEach((request) => {
    requestLeadersMap.set(request.title, (requestLeadersMap.get(request.title) ?? 0) + 1);
  });
  const requestLeaders = [...requestLeadersMap.entries()]
    .map(([name, requests]) => ({ name, requests }))
    .sort((left, right) => right.requests - left.requests)
    .slice(0, 6);

  const quotesSent = quotations.filter((quotation) =>
    quotation.status === "sent" ||
    quotation.status === "viewed" ||
    quotation.status === "accepted" ||
    quotation.status === "rejected" ||
    quotation.status === "expired",
  ).length;
  const quotesAccepted = quotations.filter((quotation) => quotation.status === "accepted").length;
  const quotesRejected = quotations.filter(
    (quotation) => quotation.status === "rejected",
  ).length;
  const acceptedRequests = serviceRequestsByType.filter(
    (request) =>
      request.status === "accepted" ||
      request.status === "quoted" ||
      request.status === "scheduled" ||
      request.status === "in-progress" ||
      request.status === "completed",
  ).length;
  const rejectedRequests = serviceRequestsByType.filter((request) => request.status === "rejected").length;
  const cancelledServices = filteredServiceOrders.filter((order) => order.status === "cancelled").length;

  const customerRows = customers.map((customer) => {
    const customerOrders = orders.filter((order) => order.customerId === customer.id);
    const productOrdersCount = customerOrders.filter((order) => order.type === "PRODUCT").length;
    const serviceOrdersCount = customerOrders.filter((order) => order.type === "SERVICE").length;
    const customerSpend = paidInvoices
      .filter((invoice) => invoice.customerId === customer.id)
      .reduce((sum, invoice) => sum + invoice.totals.totalUsd, 0);
    const activityDates = [
      ...customerOrders.map((order) => order.createdAt),
      ...serviceRequestsByType.filter((request) => request.customerId === customer.id).map((request) => request.submittedAt),
    ].sort((left, right) => new Date(right).getTime() - new Date(left).getTime());

    return {
      customerId: customer.id,
      name: customer.displayName,
      email: customer.email,
      productOrders: productOrdersCount,
      serviceOrders: serviceOrdersCount,
      totalSpend: customerSpend,
      lastActivity: activityDates[0] ?? null,
    };
  });

  const customerRowsWithActivity = customerRows.filter(
    (customer) => customer.productOrders > 0 || customer.serviceOrders > 0,
  );

  const repeatCustomers = customerRowsWithActivity.filter(
    (customer) => customer.productOrders + customer.serviceOrders > 1,
  ).length;

  const today = getMockTodayIso();
  const scheduleRows = type === "PRODUCT"
    ? []
    : technicians.map((technician) => {
        const assignedJobs = serviceOrdersByType.filter((order) => order.technicianId === technician.id).length;
        const completedJobs = serviceOrdersByType.filter(
          (order) => order.technicianId === technician.id && order.status === "completed",
        ).length;
        const cancelledJobs = serviceOrdersByType.filter(
          (order) => order.technicianId === technician.id && order.status === "cancelled",
        ).length;
        const upcomingJobs = schedules.filter(
          (schedule) =>
            schedule.technicianId === technician.id &&
            schedule.currentSchedule.date >= today &&
            schedule.status !== "cancelled" &&
            schedule.status !== "completed",
        ).length;

        return {
          technicianId: technician.id,
          displayName: technician.displayName,
          assignedJobs,
          completedJobs,
          cancelledJobs,
          upcomingJobs,
          completionRate: assignedJobs > 0 ? Math.round((completedJobs / assignedJobs) * 100) : 0,
        };
      });

  return {
    overview: {
      totalRevenue,
      productRevenue,
      serviceRevenue,
      totalOrders: orders.length,
      productOrders: productOrders.length,
      serviceOrders: filteredServiceOrders.length,
      completedServices,
      pendingServiceRequests,
      outstandingInvoices,
      refundAmount,
    },
    sales: {
      revenueSeries: createRevenueSeries(invoices, range, type),
      typeRevenue: ([
        { name: "PRODUCT", revenue: productRevenue },
        { name: "SERVICE", revenue: serviceRevenue },
      ] as Array<{ name: "PRODUCT" | "SERVICE"; revenue: number }>).filter((entry) =>
        matchesType(type, entry.name),
      ),
      paidVsUnpaid: [
        {
          name: "Paid",
          value: filteredInvoices.filter((invoice) => invoice.status === "paid").length,
        },
        {
          name: "Unpaid",
          value: filteredInvoices.filter((invoice) => invoice.status !== "paid").length,
        },
      ],
      orderCount: orders.length,
      averageOrderValue: orders.length
        ? orders.reduce((sum, order) => sum + order.total.totalUsd, 0) / orders.length
        : 0,
      refundTotal: refundAmount,
    },
    products: {
      productRevenue,
      orderCount: productOrders.length,
      unitsSold: productUnitsSold,
      averageOrderValue: productOrders.length
        ? productOrders.reduce((sum, order) => sum + order.total.totalUsd, 0) / productOrders.length
        : 0,
      refundedOrders: refundedProductOrders,
      topProducts,
    },
    services: {
      totalRequests: serviceRequestsByType.length,
      acceptedRequests,
      rejectedRequests,
      quotesSent,
      quotesAccepted,
      quotesRejected,
      serviceOrders: filteredServiceOrders.length,
      completedServices,
      cancelledServices,
      serviceRevenue,
      averageServiceInvoiceAmount: servicePaidInvoices.length
        ? serviceRevenue / servicePaidInvoices.length
        : 0,
      funnel: [
        { label: "Requested", value: serviceRequestsByType.length },
        { label: "Accepted", value: acceptedRequests },
        { label: "Quoted", value: quotesSent },
        { label: "Quote Accepted", value: quotesAccepted },
        { label: "Service Order", value: filteredServiceOrders.length },
        { label: "Completed", value: completedServices },
      ],
      requestLeaders,
    },
    customers: {
      totalCustomers: type === "ALL" ? customers.length : customerRowsWithActivity.length,
      newCustomers: customers.filter((customer) => inRange(customer.joinedAt, range)).length,
      customersWithProductOrders: customerRows.filter((customer) => customer.productOrders > 0).length,
      customersWithServiceOrders: customerRows.filter((customer) => customer.serviceOrders > 0).length,
      repeatCustomers,
      topCustomers: customerRowsWithActivity
        .sort((left, right) => right.totalSpend - left.totalSpend)
        .slice(0, 8),
    },
    technicians: {
      totalTechnicians: type === "PRODUCT" ? 0 : technicians.length,
      activeTechnicians: type === "PRODUCT" ? 0 : technicians.filter((technician) => technician.status === "ACTIVE").length,
      assignedJobs: scheduleRows.reduce((sum, row) => sum + row.assignedJobs, 0),
      completedJobs: scheduleRows.reduce((sum, row) => sum + row.completedJobs, 0),
      upcomingJobs: scheduleRows.reduce((sum, row) => sum + row.upcomingJobs, 0),
      rows: scheduleRows.sort((left, right) => right.assignedJobs - left.assignedJobs),
    },
  };
}

export function getReportProductName(productId: string) {
  return getSharedProducts().find((product) => product.id === productId)?.name ?? "Product";
}

export function getReportProductSku(productId: string) {
  return getSharedProducts().find((product) => product.id === productId)?.sku ?? "—";
}
