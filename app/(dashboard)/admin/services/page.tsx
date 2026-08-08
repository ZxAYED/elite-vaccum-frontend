"use client";

import { useState } from "react";
import { DollarSign, Pencil, Plus, Search, Trash2, X } from "lucide-react";

import { Modal } from "@/components/ui/Modal";
import { mockServices } from "@/data/mock/services";
import { formatCurrencyUsd } from "@/lib/formatters";

import styles from "../adminDashboard.module.css";

interface ServiceFormData {
  basePrice: string;
  category: string;
  commonIssues: string;
  name: string;
  status: string;
}

const emptyForm: ServiceFormData = {
  basePrice: "0",
  category: "",
  commonIssues: "",
  name: "",
  status: "Active",
};

export default function ServiceManagementPage() {
  const [activeModal, setActiveModal] = useState<"add" | "edit" | null>(null);
  const [formData, setFormData] = useState<ServiceFormData>(emptyForm);

  const openAdd = () => {
    setFormData(emptyForm);
    setActiveModal("add");
  };

  const openEdit = (serviceId: string) => {
    const service = mockServices.find((item) => item.id === serviceId);
    if (!service) return;

    setFormData({
      name: service.name,
      category: service.category,
      basePrice: String(service.basePriceUsd),
      commonIssues: service.commonIssues.join(", "),
      status: service.status === "active" ? "Active" : "Inactive",
    });
    setActiveModal("edit");
  };

  return (
    <div>
      <div className={styles.pageHeaderWithAction}>
        <div>
          <h1 className={styles.pageTitle}>Service Management</h1>
          <p className={styles.pageSubtitle}>
            Manage service types, pricing, and issue patterns
          </p>
        </div>
        <button className={styles.addServiceBtn} onClick={openAdd} type="button">
          <Plus size={16} />
          Add Service
        </button>
      </div>

      <div className={styles.searchInputFull}>
        <Search className={styles.searchIcon} size={16} />
        <input
          className={styles.searchInput}
          placeholder="Search services by name or category…"
          style={{ width: "100%" }}
          type="text"
        />
      </div>

      <div className={styles.servicesGrid}>
        {mockServices.map((service) => (
          <div className={styles.serviceCard} key={service.id}>
            <div className={styles.serviceCardHeader}>
              <div className={styles.serviceCardTitle}>
                <span className={styles.serviceCardName}>{service.name}</span>
                <span className={styles.serviceActiveBadge}>{service.status}</span>
              </div>
              <div className={styles.serviceCardActions}>
                <button
                  aria-label={`Edit ${service.name}`}
                  className={styles.serviceEditBtn}
                  onClick={() => openEdit(service.id)}
                  type="button"
                >
                  <Pencil size={16} />
                </button>
                <button
                  aria-label={`Remove ${service.name}`}
                  className={styles.serviceDeleteBtn}
                  type="button"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <span className={styles.serviceCardCategory}>{service.category}</span>

            <div className={styles.servicePriceBar}>
              <DollarSign className={styles.servicePriceIcon} size={16} />
              <span>Base Price: {formatCurrencyUsd(service.basePriceUsd)}</span>
            </div>

            <div>
              <span className={styles.serviceIssuesLabel}>Common Issues:</span>
              <div className={styles.serviceIssuesTags} style={{ marginTop: 6 }}>
                {service.commonIssues.map((issue) => (
                  <span className={styles.serviceIssueTag} key={issue}>
                    {issue}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {activeModal ? (
        <Modal
          className={styles.serviceModalContent}
          description="Local service editor preview"
          onClose={() => setActiveModal(null)}
          title={activeModal === "edit" ? "Edit service" : "Add service"}
        >
          <div className="flex items-center justify-between">
            <h3 className={styles.serviceModalTitle}>
              {activeModal === "edit" ? "Edit Service" : "Add New Service"}
            </h3>
            <button
              aria-label="Close service editor"
              className={styles.detailModalClose}
              onClick={() => setActiveModal(null)}
              type="button"
            >
              <X size={18} />
            </button>
          </div>

          <p className={styles.modalNote}>
            This editor is a frontend-only preview. It prepares the shape of the
            service form without saving changes yet.
          </p>

          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="serviceName">
              Service Name
            </label>
            <input
              className={styles.formInput}
              id="serviceName"
              onChange={(event) =>
                setFormData((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
              placeholder="e.g., Motor Repair…"
              type="text"
              value={formData.name}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="serviceCategory">
              Category
            </label>
            <input
              className={styles.formInput}
              id="serviceCategory"
              onChange={(event) =>
                setFormData((current) => ({
                  ...current,
                  category: event.target.value,
                }))
              }
              placeholder="e.g., Repair…"
              type="text"
              value={formData.category}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="basePrice">
              Base Price ($)
            </label>
            <input
              className={styles.formInput}
              id="basePrice"
              onChange={(event) =>
                setFormData((current) => ({
                  ...current,
                  basePrice: event.target.value,
                }))
              }
              placeholder="0"
              type="number"
              value={formData.basePrice}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="commonIssues">
              Common Issues (comma-separated)
            </label>
            <textarea
              className={styles.formTextarea}
              id="commonIssues"
              onChange={(event) =>
                setFormData((current) => ({
                  ...current,
                  commonIssues: event.target.value,
                }))
              }
              placeholder="e.g., Loss of suction, Motor overheating…"
              value={formData.commonIssues}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="serviceStatus">
              Status
            </label>
            <select
              className={styles.formSelect}
              id="serviceStatus"
              onChange={(event) =>
                setFormData((current) => ({
                  ...current,
                  status: event.target.value,
                }))
              }
              value={formData.status}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <div className={styles.serviceModalActions}>
            <button
              className={styles.serviceModalCancelBtn}
              onClick={() => setActiveModal(null)}
              type="button"
            >
              Cancel
            </button>
            <button className={styles.serviceModalSaveBtn} type="button">
              Save Local Draft
            </button>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
