"use client";

import { useMemo, useState } from "react";
import { Calendar, Search, User, Wrench, X } from "lucide-react";

import { Modal } from "@/components/ui/Modal";
import { mockCustomers } from "@/data/mock/customers";
import { mockOrderDetailsById, mockOrders } from "@/data/mock/orders";
import { mockTechnicians } from "@/data/mock/technicians";
import {
  formatCurrencyUsd,
  formatShortDate,
  formatShortDateTime,
  formatTime,
} from "@/lib/formatters";
import { formatStatusLabel } from "@/lib/status-labels";

import styles from "../adminDashboard.module.css";

const orderStatusClassMap: Record<string, string> = {
  completed: styles.statusCompleted,
  confirmed: styles.statusAssigned,
  scheduled: styles.statusPending,
  pending: styles.statusPending,
};

export default function OrderManagementPage() {
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const selectedOrder = useMemo(
    () => mockOrders.find((order) => order.id === selectedOrderId) ?? null,
    [selectedOrderId],
  );

  const selectedOrderDetails = selectedOrder
    ? mockOrderDetailsById[selectedOrder.id] ?? mockOrderDetailsById["ORD-1284"]
    : null;

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Order Management</h1>
        <p className={styles.pageSubtitle}>
          Track and manage service orders scheduled before and after August 7,
          2026
        </p>
      </div>

      <div className={styles.filtersRow}>
        <div className={styles.searchInputWrapper}>
          <Search className={styles.searchIcon} size={16} />
          <input
            className={styles.searchInput}
            placeholder="Search orders by ID, customer, or service…"
            type="text"
          />
        </div>
        <select className={styles.filterSelect} defaultValue="all">
          <option value="all">All Orders ({mockOrders.length})</option>
          <option value="completed">Completed</option>
          <option value="confirmed">Confirmed</option>
          <option value="scheduled">Scheduled</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      <div className={styles.tableCard}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Service</th>
              <th>Technician</th>
              <th>Scheduled</th>
              <th>Status</th>
              <th>Amount</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {mockOrders.map((order) => {
              const customer = mockCustomers.find(
                (item) => item.id === order.customerId,
              );
              const technician = mockTechnicians.find(
                (item) => item.id === order.technicianId,
              );

              return (
                <tr key={order.id}>
                  <td>{order.id}</td>
                  <td>
                    <div className={styles.customerCell}>
                      <User className={styles.customerIcon} size={14} />
                      <span className={styles.customerName}>
                        {customer?.displayName ?? "Pending customer"}
                      </span>
                    </div>
                  </td>
                  <td>{order.summary}</td>
                  <td>
                    <div className={styles.technicianCell}>
                      <Wrench className={styles.technicianIcon} size={14} />
                      <span>{technician?.displayName ?? "Unassigned"}</span>
                    </div>
                  </td>
                  <td>
                    <div className={styles.scheduledCell}>
                      <Calendar className={styles.scheduledIcon} size={14} />
                      <span>
                        {formatShortDate(order.scheduledAt)}{" "}
                        {formatTime(order.scheduledAt)}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span
                      className={`${styles.statusBadge} ${
                        orderStatusClassMap[order.status] ?? ""
                      }`}
                    >
                      {formatStatusLabel(order.status)}
                    </span>
                  </td>
                  <td>{formatCurrencyUsd(order.totalUsd)}</td>
                  <td>
                    <button
                      className={styles.viewDetailsBtn}
                      onClick={() => setSelectedOrderId(order.id)}
                      type="button"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {selectedOrder && selectedOrderDetails ? (
        <Modal
          className={styles.detailModalContent}
          description={`Detailed view for order ${selectedOrder.id}`}
          onClose={() => setSelectedOrderId(null)}
          title={`Order details for ${selectedOrder.id}`}
        >
          <div className={styles.detailModalHeader}>
            <h3 className={styles.detailModalTitle}>
              Order Details - {selectedOrder.id}
            </h3>
            <button
              aria-label="Close order details"
              className={styles.detailModalClose}
              onClick={() => setSelectedOrderId(null)}
              type="button"
            >
              <X size={18} />
            </button>
          </div>

          <div className={styles.detailModalBody}>
            <div className={styles.detailInfoGrid}>
              <div className={styles.detailInfoItem}>
                <span className={styles.detailInfoLabel}>Customer</span>
                <span className={styles.detailInfoValue}>
                  {
                    mockCustomers.find(
                      (item) => item.id === selectedOrder.customerId,
                    )?.displayName
                  }
                </span>
              </div>
              <div className={styles.detailInfoItem}>
                <span className={styles.detailInfoLabel}>Service</span>
                <span className={styles.detailInfoValue}>
                  {selectedOrder.summary}
                </span>
              </div>
              <div className={styles.detailInfoItem}>
                <span className={styles.detailInfoLabel}>Technician</span>
                <span className={styles.detailInfoValue}>
                  {
                    mockTechnicians.find(
                      (item) => item.id === selectedOrder.technicianId,
                    )?.displayName
                  }
                </span>
              </div>
              <div className={styles.detailInfoItem}>
                <span className={styles.detailInfoLabel}>Amount</span>
                <span className={styles.detailInfoValue}>
                  {formatCurrencyUsd(selectedOrder.totalUsd)}
                </span>
              </div>
            </div>

            <div className={styles.detailInfoItemFull}>
              <span className={styles.detailInfoLabel}>Scheduled Date & Time</span>
              <span className={styles.detailInfoValue}>
                {formatShortDateTime(selectedOrder.scheduledAt)}
              </span>
            </div>

            <div className={styles.detailInfoItemFull} style={{ marginTop: 16 }}>
              <span className={styles.detailInfoLabelTeal}>Service Address</span>
              <span className={styles.detailInfoValue}>
                {selectedOrderDetails.serviceAddress}
              </span>
            </div>

            <div className={styles.detailInfoItemFull} style={{ marginTop: 16 }}>
              <span className={styles.detailInfoLabel}>Manufacturer Name</span>
              <span className={styles.detailInfoValue}>
                {selectedOrderDetails.manufacturerName}
              </span>
            </div>

            <div className={styles.detailInfoItemFull} style={{ marginTop: 16 }}>
              <span className={styles.detailInfoLabel}>Model Number</span>
              <span className={styles.detailInfoValue}>
                {selectedOrderDetails.modelNumber}
              </span>
            </div>

            <div className={styles.detailInfoItemFull} style={{ marginTop: 16 }}>
              <span className={styles.detailInfoLabel}>Serial Number</span>
              <span className={styles.detailInfoValue}>
                {selectedOrderDetails.serialNumber}
              </span>
            </div>

            <div className={styles.detailInfoItemFull} style={{ marginTop: 16 }}>
              <span className={styles.detailInfoLabel}>System Type</span>
              <span className={styles.detailInfoValue}>
                {selectedOrderDetails.systemType}
              </span>
            </div>

            <div className={styles.detailInfoItemFull} style={{ marginTop: 16 }}>
              <span className={styles.detailInfoLabel}>Inlet Count</span>
              <span className={styles.detailInfoValue}>
                {selectedOrderDetails.inletCount}
              </span>
            </div>

            <div className={styles.detailInfoItemFull} style={{ marginTop: 16 }}>
              <span className={styles.detailInfoLabelTeal}>Photos & Documents</span>
              <div className={styles.detailPhotosGrid}>
                {selectedOrderDetails.attachments.map((attachment) => (
                  <div className={styles.detailPhotoThumb} key={attachment.id}>
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        background:
                          "linear-gradient(135deg, #94a3b8 0%, #64748b 100%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#fff",
                        fontSize: 11,
                        padding: 8,
                        textAlign: "center",
                      }}
                    >
                      {attachment.kind === "document" ? "Doc" : "Photo"}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.detailInfoItemFull} style={{ marginTop: 16 }}>
              <span className={styles.detailInfoLabelTeal}>Additional Notes</span>
              <p className={styles.detailNotesText}>
                {selectedOrderDetails.additionalNotes}
              </p>
            </div>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
