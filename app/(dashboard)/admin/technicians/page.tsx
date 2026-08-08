"use client";

import { useMemo, useState } from "react";
import {
  Check,
  CheckCircle,
  Mail,
  Phone,
  Search,
  Star,
  X,
} from "lucide-react";

import { Modal } from "@/components/ui/Modal";
import { mockTechnicians } from "@/data/mock/technicians";
import { formatStatusLabel } from "@/lib/status-labels";

import styles from "../adminDashboard.module.css";

const technicianStatusClassMap: Record<string, string> = {
  available: styles.availableBadge,
  "on-job": styles.onJobBadge,
  offline: styles.statusPending,
};

export default function TechnicianManagementPage() {
  const [selectedTechId, setSelectedTechId] = useState<string | null>(null);

  const selectedTech = useMemo(
    () => mockTechnicians.find((tech) => tech.id === selectedTechId) ?? null,
    [selectedTechId],
  );

  const availableCount = mockTechnicians.filter(
    (tech) => tech.status === "available",
  ).length;
  const onJobCount = mockTechnicians.filter(
    (tech) => tech.status === "on-job",
  ).length;
  const verifiedCount = mockTechnicians.filter((tech) => tech.verified).length;

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Technician Management</h1>
        <p className={styles.pageSubtitle}>
          Manage service providers, verification, and availability
        </p>
      </div>

      <div className={styles.filtersRow}>
        <div className={styles.searchInputWrapper}>
          <Search className={styles.searchIcon} size={16} />
          <input
            className={styles.searchInput}
            placeholder="Search technicians…"
            type="text"
          />
        </div>
        <select className={styles.filterSelect} defaultValue="all">
          <option value="all">All Status</option>
          <option value="available">Available</option>
          <option value="on-job">On Job</option>
          <option value="verified">Verified</option>
        </select>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.summaryCard}>
          <span className={styles.summaryCardLabel}>Total Technicians</span>
          <div className={styles.summaryCardValue}>
            {String(mockTechnicians.length).padStart(2, "0")}
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryCardLabel}>Available</span>
          <div className={styles.summaryCardValue}>
            {String(availableCount).padStart(2, "0")}
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryCardLabel}>On Job</span>
          <div className={styles.summaryCardValue}>
            {String(onJobCount).padStart(2, "0")}
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryCardLabel}>Verified</span>
          <div className={styles.summaryCardValue}>
            {String(verifiedCount).padStart(2, "0")}
          </div>
        </div>
      </div>

      <div className={styles.tableCard}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Technician</th>
              <th>Contact</th>
              <th>Specializations</th>
              <th>Rating</th>
              <th>Status</th>
              <th>Verified</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {mockTechnicians.map((tech) => (
              <tr key={tech.id}>
                <td>
                  <div className={styles.techNameCell}>
                    <div className={styles.avatarCircle}>
                      {tech.displayName.charAt(0)}
                    </div>
                    <div className={styles.techNameInfo}>
                      <span className={styles.techName}>{tech.displayName}</span>
                      <span className={styles.techJobs}>
                        {tech.completedJobs} jobs completed
                      </span>
                    </div>
                  </div>
                </td>
                <td>
                  <div className={styles.contactCell}>
                    <span className={styles.contactRow}>
                      <Mail className={styles.contactRowIcon} size={12} />
                      {tech.email}
                    </span>
                    <span className={styles.contactRow}>
                      <Phone className={styles.contactRowIcon} size={12} />
                      {tech.phone}
                    </span>
                  </div>
                </td>
                <td>
                  <div className={styles.specTags}>
                    {tech.specializations.map((spec) => (
                      <span className={styles.specTag} key={spec}>
                        {spec}
                      </span>
                    ))}
                  </div>
                </td>
                <td>
                  <div className={styles.ratingCell}>
                    <Star
                      className={styles.ratingStar}
                      color="#eab308"
                      fill="#eab308"
                      size={14}
                    />
                    {tech.rating}
                  </div>
                </td>
                <td>
                  <span
                    className={technicianStatusClassMap[tech.status] ?? styles.statusPending}
                  >
                    {formatStatusLabel(tech.status)}
                  </span>
                </td>
                <td>
                  {tech.verified ? (
                    <CheckCircle className={styles.verifiedIcon} size={20} />
                  ) : null}
                </td>
                <td>
                  <button
                    className={styles.viewDetailsBtn}
                    onClick={() => setSelectedTechId(tech.id)}
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

      {selectedTech ? (
        <Modal
          className={styles.profileModalContent}
          description={`Technician profile for ${selectedTech.displayName}`}
          onClose={() => setSelectedTechId(null)}
          title={`Technician profile for ${selectedTech.displayName}`}
        >
          <div className={styles.profileModalHeader}>
            <h3 className={styles.profileModalTitle}>Technician Details</h3>
            <button
              aria-label="Close technician details"
              className={styles.profileModalClose}
              onClick={() => setSelectedTechId(null)}
              type="button"
            >
              <X size={18} />
            </button>
          </div>

          <div className={styles.profileAvatarSection}>
            <div className={styles.profileAvatarLg}>
              {selectedTech.displayName.charAt(0)}
            </div>
            <div className={styles.profileAvatarInfo}>
              <span className={styles.profileAvatarName}>
                {selectedTech.displayName}
              </span>
              <span className={styles.profileAvatarSub}>
                <Star color="#eab308" fill="#eab308" size={14} />
                {selectedTech.rating} ({selectedTech.completedJobs} jobs)
              </span>
            </div>
          </div>

          <div className={styles.profileInfoGrid}>
            <div className={styles.profileInfoItem}>
              <span className={styles.profileInfoLabel}>Email</span>
              <span className={styles.profileInfoValue}>{selectedTech.email}</span>
            </div>
            <div className={styles.profileInfoItem}>
              <span className={styles.profileInfoLabel}>Phone</span>
              <span className={styles.profileInfoValue}>{selectedTech.phone}</span>
            </div>
            <div className={styles.profileInfoItem}>
              <span className={styles.profileInfoLabel}>Status</span>
              <span
                className={technicianStatusClassMap[selectedTech.status] ?? styles.statusPending}
              >
                {formatStatusLabel(selectedTech.status)}
              </span>
            </div>
            <div className={styles.profileInfoItem}>
              <span className={styles.profileInfoLabel}>Verification</span>
              <span className={styles.verifiedBadge}>
                Verified <Check size={14} />
              </span>
            </div>
          </div>

          <div>
            <span className={styles.profileSpecLabel}>Specializations</span>
            <div className={styles.specTags}>
              {selectedTech.specializations.map((spec) => (
                <span className={styles.specTag} key={spec}>
                  {spec}
                </span>
              ))}
            </div>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
