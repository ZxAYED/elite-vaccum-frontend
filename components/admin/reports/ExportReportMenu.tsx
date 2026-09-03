"use client";

import { useState } from "react";
import { Download, FileSpreadsheet, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/Select";
import { downloadReportCsv, type ExportReportType } from "@/lib/exportCsv";
import { getAdminOrders } from "@/data/mock/admin-orders";
import {
  getSharedServiceRequests,
  getSharedCustomers,
} from "@/data/mock/shared-business-store";
import type { AdminUnifiedOrder, Customer, ServiceRequest } from "@/types/domain";

export function ExportReportMenu() {
  const [exporting, setExporting] = useState(false);

  async function handleExport(type: ExportReportType) {
    setExporting(true);
    try {
      if (type === "orders") {
        const orders: AdminUnifiedOrder[] = getAdminOrders();
        await downloadReportCsv<AdminUnifiedOrder>(
          "orders",
          orders,
          [
            { header: "Order ID", accessor: (r) => r.id },
            { header: "Type", accessor: (r) => r.type },
            { header: "Customer ID", accessor: (r) => r.customerId },
            { header: "Status", accessor: (r) => r.status },
            { header: "Total ($)", accessor: (r) => r.total.totalUsd },
            { header: "Created At", accessor: (r) => r.createdAt },
          ],
        );
      } else if (type === "service-requests") {
        const reqs: ServiceRequest[] = getSharedServiceRequests();
        await downloadReportCsv<ServiceRequest>(
          "service-requests",
          reqs,
          [
            { header: "Request ID", accessor: (r) => r.id },
            { header: "Title", accessor: (r) => r.title },
            { header: "Customer ID", accessor: (r) => r.customerId },
            { header: "Status", accessor: (r) => r.status },
            { header: "Urgency", accessor: (r) => r.urgency },
            { header: "Preferred Date", accessor: (r) => r.preferredDate },
            { header: "Preferred Time", accessor: (r) => r.preferredTime },
          ],
        );
      } else if (type === "customers") {
        const customers: Customer[] = getSharedCustomers();
        await downloadReportCsv<Customer>(
          "customers",
          customers,
          [
            { header: "Customer ID", accessor: (r) => r.id },
            { header: "Name", accessor: (r) => r.displayName || `${r.firstName} ${r.lastName}` },
            { header: "Email", accessor: (r) => r.email },
            { header: "Phone", accessor: (r) => r.phone },
            { header: "Status", accessor: (r) => r.status },
            { header: "Total Orders", accessor: (r) => r.totalOrders },
            { header: "Lifetime Value ($)", accessor: (r) => r.lifetimeValueUsd },
          ],
        );
      } else if (type === "invoices") {
        const orders: AdminUnifiedOrder[] = getAdminOrders();
        await downloadReportCsv<AdminUnifiedOrder>(
          "invoices",
          orders,
          [
            { header: "Invoice ID", accessor: (r) => `INV-${r.id.slice(0, 8)}` },
            { header: "Related Order", accessor: (r) => r.id },
            { header: "Customer ID", accessor: (r) => r.customerId },
            { header: "Amount ($)", accessor: (r) => r.total.totalUsd },
            { header: "Status", accessor: (r) => r.status },
            { header: "Date", accessor: (r) => r.createdAt },
          ],
        );
      }
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Select
        onValueChange={(val) => {
          if (val) handleExport(val as ExportReportType);
        }}
      >
        <SelectTrigger className="h-10 min-w-[180px] rounded-lg border-teal-200 bg-white font-medium text-teal-900 shadow-sm hover:border-teal-300">
          <div className="flex items-center gap-2">
            {exporting ? (
              <Loader2 className="size-4 animate-spin text-teal-700" />
            ) : (
              <Download className="size-4 text-teal-700" />
            )}
            <span className="text-xs font-semibold">
              {exporting ? "Exporting..." : "Export CSV Report"}
            </span>
          </div>
        </SelectTrigger>
        <SelectContent align="end" className="w-56">
          <SelectItem value="orders">
            <div className="flex items-center gap-2 py-0.5">
              <FileSpreadsheet className="size-4 text-teal-700" />
              <span>Orders Report</span>
            </div>
          </SelectItem>
          <SelectItem value="service-requests">
            <div className="flex items-center gap-2 py-0.5">
              <FileSpreadsheet className="size-4 text-teal-700" />
              <span>Service Requests</span>
            </div>
          </SelectItem>
          <SelectItem value="customers">
            <div className="flex items-center gap-2 py-0.5">
              <FileSpreadsheet className="size-4 text-teal-700" />
              <span>Customers CRM</span>
            </div>
          </SelectItem>
          <SelectItem value="invoices">
            <div className="flex items-center gap-2 py-0.5">
              <FileSpreadsheet className="size-4 text-teal-700" />
              <span>Invoices & Billing</span>
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
