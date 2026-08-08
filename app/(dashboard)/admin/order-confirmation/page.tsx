"use client";

import { useMemo, useState } from "react";
import {
  Calendar,
  CheckCircle,
  CircleCheck,
  CircleX,
  Clock,
  Search,
  User,
  XCircle,
} from "lucide-react";

import { Modal } from "@/components/ui/Modal";
import { mockCustomers } from "@/data/mock/customers";
import { mockServiceRequests } from "@/data/mock/service-requests";
import { formatCurrencyUsd, formatShortDate } from "@/lib/formatters";
import { formatStatusLabel } from "@/lib/status-labels";

import styles from "../adminDashboard.module.css";

const urgencyClassMap: Record<string, string> = {
  urgent: styles.urgencyUrgent,
  priority: styles.urgencyUrgent,
  normal: styles.urgencyNormal,
};

const statusClassMap: Record<string, string> = {
  submitted: styles.orderStatusRequested,
  "under-review": styles.orderStatusReview,
  quoted: styles.orderStatusReview,
};

export default function OrderConfirmationPage() {
  const [activeModal, setActiveModal] = useState<"confirm" | "reject" | null>(
    null,
  );
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const selectedRequest = useMemo(
    () =>
      mockServiceRequests.find((request) => request.id === selectedRequestId) ??
      null,
    [selectedRequestId],
  );

  const pendingRequests = mockServiceRequests.filter((request) =>
    ["submitted", "under-review"].includes(request.status),
  ).length;

  const openModal = (modal: "confirm" | "reject", requestId: string) => {
    setSelectedRequestId(requestId);
    setRejectReason("");
    setActiveModal(modal);
  };

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Order Confirmation</h1>
        <p className={styles.pageSubtitle}>
          Review and prepare service-request outcomes before backend actions are
          wired
        </p>
      </div>

      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <div className={styles.summaryCardHeader}>
            <span className={styles.summaryCardLabel}>Pending Requests</span>
            <Clock className={styles.summaryCardIconYellow} size={20} />
          </div>
          <div className={styles.summaryCardValue}>{pendingRequests}</div>
        </div>

        <div className={styles.summaryCard}>
          <div className={styles.summaryCardHeader}>
            <span className={styles.summaryCardLabel}>Draft Confirmations</span>
            <CheckCircle className={styles.summaryCardIconGreen} size={20} />
          </div>
          <div className={styles.summaryCardValue}>03</div>
        </div>

        <div className={styles.summaryCard}>
          <div className={styles.summaryCardHeader}>
            <span className={styles.summaryCardLabel}>Draft Rejections</span>
            <XCircle className={styles.summaryCardIconRed} size={20} />
          </div>
          <div className={styles.summaryCardValue}>01</div>
        </div>
      </div>

      <div className={styles.filtersRow}>
        <div className={styles.searchInputWrapper}>
          <Search className={styles.searchIcon} size={16} />
          <input
            className={styles.searchInput}
            placeholder="Search by request ID, customer, or service…"
            type="text"
          />
        </div>
        <select className={styles.filterSelect} defaultValue="pending">
          <option value="pending">Pending ({pendingRequests})</option>
          <option value="all">All</option>
          <option value="quoted">Quoted</option>
          <option value="scheduled">Scheduled</option>
        </select>
      </div>

      <div className={styles.tableCard}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Request ID</th>
              <th>Customer</th>
              <th>Service</th>
              <th>Preferred Date</th>
              <th>Urgency</th>
              <th>Status</th>
              <th>Amount</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {mockServiceRequests.map((request) => {
              const customer = mockCustomers.find(
                (item) => item.id === request.customerId,
              );

              return (
                <tr key={request.id}>
                  <td>{request.id}</td>
                  <td>
                    <div className={styles.customerCell}>
                      <User className={styles.customerIcon} size={14} />
                      <div className={styles.customerInfo}>
                        <span className={styles.customerName}>
                          {customer?.displayName ?? "Pending customer"}
                        </span>
                        <span className={styles.customerEmail}>
                          {customer?.email ?? "Not supplied"}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td>{request.title}</td>
                  <td>
                    <div className={styles.dateCell}>
                      <Calendar className={styles.dateIcon} size={14} />
                      <div className={styles.dateInfo}>
                        <span className={styles.dateValue}>
                          {formatShortDate(request.preferredDate)}
                        </span>
                        <span className={styles.dateTime}>
                          {request.preferredTime}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span
                      className={`${styles.urgencyBadge} ${
                        urgencyClassMap[request.urgency] ?? styles.urgencyNormal
                      }`}
                    >
                      {formatStatusLabel(request.urgency)}
                    </span>
                  </td>
                  <td>
                    <span
                      className={
                        statusClassMap[request.status] ?? styles.orderStatusRequested
                      }
                    >
                      {formatStatusLabel(request.status)}
                    </span>
                  </td>
                  <td>{formatCurrencyUsd(request.estimatedAmountUsd ?? 0)}</td>
                  <td>
                    <div className={styles.actionBtns}>
                      <button
                        className={styles.confirmBtn}
                        onClick={() => openModal("confirm", request.id)}
                        type="button"
                      >
                        Confirm
                      </button>
                      <button
                        className={styles.rejectBtn}
                        onClick={() => openModal("reject", request.id)}
                        type="button"
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {selectedRequest && activeModal === "confirm" ? (
        <Modal
          className={styles.modalContent}
          description={`Confirmation preview for ${selectedRequest.id}`}
          onClose={() => setActiveModal(null)}
          title={`Confirmation preview for ${selectedRequest.id}`}
        >
          <div className={styles.modalHeader}>
            <div className={styles.modalHeaderIconGreen}>
              <CircleCheck size={32} />
            </div>
            <div className={styles.modalHeaderText}>
              <h3>Preview Confirmation</h3>
              <p>Request ID: {selectedRequest.id}</p>
            </div>
          </div>

          <div className={styles.modalInfoRow}>
            <span className={styles.modalInfoLabel}>Customer:</span>
            <span className={styles.modalInfoValue}>
              {
                mockCustomers.find(
                  (customer) => customer.id === selectedRequest.customerId,
                )?.displayName
              }
            </span>
          </div>
          <div className={styles.modalInfoRow}>
            <span className={styles.modalInfoLabel}>Service:</span>
            <span className={styles.modalInfoValue}>{selectedRequest.title}</span>
          </div>
          <div className={styles.modalInfoRow}>
            <span className={styles.modalInfoLabel}>Amount:</span>
            <span className={styles.modalInfoValue}>
              {formatCurrencyUsd(selectedRequest.estimatedAmountUsd ?? 0)}
            </span>
          </div>
          <div className={styles.modalInfoRow}>
            <span className={styles.modalInfoLabel}>Preferred Date:</span>
            <span className={styles.modalInfoValue}>
              {formatShortDate(selectedRequest.preferredDate)} at{" "}
              {selectedRequest.preferredTime}
            </span>
          </div>

          <p className={styles.modalNote} style={{ marginTop: 16 }}>
            This modal previews the admin confirmation flow only. No customer
            notification or backend state change is triggered yet.
          </p>

          <div className={styles.modalActions}>
            <button className={styles.modalConfirmBtn} type="button">
              Save Confirmation Draft
            </button>
            <button
              className={styles.modalCancelBtn}
              onClick={() => setActiveModal(null)}
              type="button"
            >
              Cancel
            </button>
          </div>
        </Modal>
      ) : null}

      {selectedRequest && activeModal === "reject" ? (
        <Modal
          className={styles.modalContent}
          description={`Rejection preview for ${selectedRequest.id}`}
          onClose={() => setActiveModal(null)}
          title={`Rejection preview for ${selectedRequest.id}`}
        >
          <div className={styles.modalHeader}>
            <div className={styles.modalHeaderIcon}>
              <CircleX size={32} />
            </div>
            <div className={styles.modalHeaderText}>
              <h3>Preview Rejection</h3>
              <p>Request ID: {selectedRequest.id}</p>
            </div>
          </div>

          <div className={styles.modalInfoRow}>
            <span className={styles.modalInfoLabel}>Customer:</span>
            <span className={styles.modalInfoValue}>
              {
                mockCustomers.find(
                  (customer) => customer.id === selectedRequest.customerId,
                )?.displayName
              }
            </span>
          </div>
          <div className={styles.modalInfoRow}>
            <span className={styles.modalInfoLabel}>Service:</span>
            <span className={styles.modalInfoValue}>{selectedRequest.title}</span>
          </div>

          <label className={styles.modalReasonLabel} htmlFor="rejectReason">
            Reason for Rejection <span>*</span>
          </label>
          <textarea
            className={styles.modalTextarea}
            id="rejectReason"
            onChange={(event) => setRejectReason(event.target.value)}
            placeholder="Explain what needs to be revised before approval…"
            value={rejectReason}
          />

          <p className={styles.modalNote}>
            This note is stored in the UI preview only until the backend review
            workflow is connected.
          </p>

          <div className={styles.modalActions}>
            <button className={styles.modalRejectBtn} type="button">
              Save Rejection Draft
            </button>
            <button
              className={styles.modalCancelBtn}
              onClick={() => setActiveModal(null)}
              type="button"
            >
              Cancel
            </button>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
