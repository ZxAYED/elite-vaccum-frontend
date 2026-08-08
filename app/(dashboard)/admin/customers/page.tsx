"use client";

import { useMemo, useState } from "react";
import { Calendar, Mail, MapPin, Phone, Search, X } from "lucide-react";

import { Modal } from "@/components/ui/Modal";
import { mockCustomerSummary, mockCustomers } from "@/data/mock/customers";
import { formatCurrencyUsd, formatShortDate } from "@/lib/formatters";
import { formatStatusLabel } from "@/lib/status-labels";

import styles from "../adminDashboard.module.css";

export default function CustomerManagementPage() {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(
    null,
  );

  const selectedCustomer = useMemo(
    () =>
      mockCustomers.find((customer) => customer.id === selectedCustomerId) ??
      null,
    [selectedCustomerId],
  );

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Customer Management</h1>
        <p className={styles.pageSubtitle}>
          View and manage customer accounts tied to active service requests
        </p>
      </div>

      <div className={styles.searchInputFull}>
        <Search className={styles.searchIcon} size={16} />
        <input
          className={styles.searchInput}
          placeholder="Search customers by name, email, or phone…"
          style={{ width: "100%" }}
          type="text"
        />
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.summaryCard}>
          <span className={styles.summaryCardLabel}>Total Customers</span>
          <div className={styles.summaryCardValue}>
            {String(mockCustomerSummary.totalCustomers).padStart(2, "0")}
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryCardLabel}>Active Customers</span>
          <div className={styles.summaryCardValue}>
            {String(mockCustomerSummary.activeCustomers).padStart(2, "0")}
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryCardLabel}>Total Orders</span>
          <div className={styles.summaryCardValue}>
            {String(mockCustomerSummary.totalOrders).padStart(2, "0")}
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryCardLabel}>Total Revenue</span>
          <div className={styles.summaryCardValue}>
            {formatCurrencyUsd(mockCustomerSummary.lifetimeRevenueUsd)}
          </div>
        </div>
      </div>

      <div className={styles.tableCard}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Customer</th>
              <th>Contact</th>
              <th>Joined</th>
              <th>Orders</th>
              <th>Total Spent</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {mockCustomers.map((customer) => (
              <tr key={customer.id}>
                <td>
                  <div className={styles.customerNameCell}>
                    <div className={styles.avatarCircle}>
                      {customer.firstName.charAt(0)}
                    </div>
                    <div className={styles.customerNameInfo}>
                      <span className={styles.customerNameText}>
                        {customer.displayName}
                      </span>
                      <span className={styles.customerIdText}>{customer.id}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <div className={styles.contactCell}>
                    <span className={styles.contactRow}>
                      <Mail className={styles.contactRowIcon} size={12} />
                      {customer.email}
                    </span>
                    <span className={styles.contactRow}>
                      <Phone className={styles.contactRowIcon} size={12} />
                      {customer.phone}
                    </span>
                  </div>
                </td>
                <td>
                  <div className={styles.joinedCell}>
                    <Calendar className={styles.joinedIcon} size={14} />
                    <span>{formatShortDate(customer.joinedAt)}</span>
                  </div>
                </td>
                <td>{String(customer.totalOrders).padStart(2, "0")}</td>
                <td>{formatCurrencyUsd(customer.lifetimeValueUsd)}</td>
                <td>
                  <span className={styles.activeStatusBadge}>
                    {formatStatusLabel(customer.status)}
                  </span>
                </td>
                <td>
                  <button
                    className={styles.viewDetailsBtn}
                    onClick={() => setSelectedCustomerId(customer.id)}
                    type="button"
                  >
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedCustomer ? (
        <Modal
          className={styles.profileModalContent}
          description={`Customer profile for ${selectedCustomer.displayName}`}
          onClose={() => setSelectedCustomerId(null)}
          title={`Customer profile for ${selectedCustomer.displayName}`}
        >
          <div className={styles.profileModalHeader}>
            <h3 className={styles.profileModalTitle}>Customer Profile</h3>
            <button
              aria-label="Close customer profile"
              className={styles.profileModalClose}
              onClick={() => setSelectedCustomerId(null)}
              type="button"
            >
              <X size={18} />
            </button>
          </div>

          <div className={styles.profileAvatarSection}>
            <div className={styles.profileAvatarLg}>
              {selectedCustomer.firstName.charAt(0)}
            </div>
            <div className={styles.profileAvatarInfo}>
              <span className={styles.profileAvatarName}>
                {selectedCustomer.displayName}
              </span>
              <span className={styles.profileAvatarSub}>
                {selectedCustomer.id}
              </span>
            </div>
          </div>

          <div className={styles.profileInfoGrid}>
            <div className={styles.profileInfoItem}>
              <span className={styles.profileInfoLabel}>Email</span>
              <span className={styles.profileInfoValue}>
                {selectedCustomer.email}
              </span>
            </div>
            <div className={styles.profileInfoItem}>
              <span className={styles.profileInfoLabel}>Phone</span>
              <span className={styles.profileInfoValue}>
                {selectedCustomer.phone}
              </span>
            </div>
            <div className={styles.profileInfoItem}>
              <span className={styles.profileInfoLabel}>Joined Date</span>
              <span className={styles.profileInfoValue}>
                {formatShortDate(selectedCustomer.joinedAt)}
              </span>
            </div>
            <div className={styles.profileInfoItem}>
              <span className={styles.profileInfoLabel}>Status</span>
              <span className={styles.activeStatusBadge}>
                {formatStatusLabel(selectedCustomer.status)}
              </span>
            </div>
            <div className={styles.profileInfoItem}>
              <span className={styles.profileInfoLabel}>Total Orders</span>
              <span className={styles.profileInfoValue}>
                {selectedCustomer.totalOrders}
              </span>
            </div>
            <div className={styles.profileInfoItem}>
              <span className={styles.profileInfoLabel}>Total Spent</span>
              <span className={styles.profileInfoValue}>
                {formatCurrencyUsd(selectedCustomer.lifetimeValueUsd)}
              </span>
            </div>
          </div>

          <div className={styles.savedAddressSection}>
            <span className={styles.savedAddressLabel}>Saved Addresses</span>
            {selectedCustomer.addresses.map((address) => (
              <div className={styles.savedAddressCard} key={address.id}>
                <MapPin className={styles.savedAddressIcon} size={16} />
                <span>
                  {address.line1}, {address.city}, {address.state}{" "}
                  {address.postalCode}
                </span>
              </div>
            ))}
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
