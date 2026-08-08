"use client";

import React, { useState } from "react";
import { Pencil, Save, Plus, Trash2 } from "lucide-react";
import styles from "../adminDashboard.module.css";

type TabKey = "legal" | "faqs" | "contact" | "notifications";

const tabs: { key: TabKey; label: string }[] = [
  { key: "legal", label: "Legal & Terms" },
  { key: "faqs", label: "FAQs" },
  { key: "contact", label: "Contact Info" },
  { key: "notifications", label: "Notifications" },
];

const legalSections = [
  {
    title: "Terms of Service",
    lastUpdated: "November 15, 2024",
    content: [
      "By accessing and using this service platform, you agree to be bound by these Terms of Service. Please read them carefully.",
      "<strong>1. Service Agreement</strong>\nYou agree to use our platform only for lawful purposes and in accordance with these Terms.",
      "<strong>2. User Responsibilities</strong>\nYou are responsible for maintaining the confidentiality of your account and password.",
      "<strong>3. Service Modifications</strong>\nWe reserve the right to modify or discontinue the service at any time without notice.",
    ],
  },
  {
    title: "Privacy Policy",
    lastUpdated: "November 15, 2024",
    content: [
      "By accessing and using this service platform, you agree to be bound by these Terms of Service. Please read them carefully.",
      "<strong>1. Service Agreement</strong>\nYou agree to use our platform only for lawful purposes and in accordance with these Terms.",
      "<strong>2. User Responsibilities</strong>\nYou are responsible for maintaining the confidentiality of your account and password.",
      "<strong>3. Service Modifications</strong>\nWe reserve the right to modify or discontinue the service at any time without notice.",
    ],
  },
  {
    title: "Acceptance of Terms",
    lastUpdated: "November 15, 2024",
    content: [
      "By accessing and using this service platform, you agree to be bound by these Terms of Service. Please read them carefully.",
      "<strong>1. Service Agreement</strong>\nYou agree to use our platform only for lawful purposes and in accordance with these Terms.",
      "<strong>2. User Responsibilities</strong>\nYou are responsible for maintaining the confidentiality of your account and password.",
      "<strong>3. Service Modifications</strong>\nWe reserve the right to modify or discontinue the service at any time without notice.",
    ],
  },
];

const initialFaqsData = [
  {
    question: "Are technicians verified?",
    answer:
      "Yes, all our technicians undergo a thorough background check and verification process before joining our platform.",
  },
  {
    question: "What is the cancellation policy?",
    answer:
      "You can cancel or reschedule your booking up to 2 hours before the scheduled time without any charges.",
  },
  {
    question: "How do I track my service request?",
    answer:
      'You can track your service request in real-time through the app under the "Order Tracking" section.',
  },
  {
    question: "What payment methods are accepted?",
    answer:
      "We accept all major credit cards, debit cards, and digital payment methods including Apple Pay and Google Pay.",
  },
];

const notificationToggles = [
  { label: "Booking Confirmed", defaultOn: false },
  { label: "My customer", defaultOn: false },
  { label: "Technician Assigned", defaultOn: false },
  { label: "Technician on the Way", defaultOn: true },
  { label: "Service Completed", defaultOn: true },
  { label: "Payment Received", defaultOn: true },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("legal");
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [toggleStates, setToggleStates] = useState(
    notificationToggles.map((t) => t.defaultOn)
  );

  // FAQs state
  const [faqs, setFaqs] = useState(initialFaqsData);
  const [showFaqModal, setShowFaqModal] = useState(false);
  const [faqModalMode, setFaqModalMode] = useState<"add" | "edit">("add");
  const [editFaqIndex, setEditFaqIndex] = useState<number | null>(null);
  const [faqQuestion, setFaqQuestion] = useState("");
  const [faqAnswer, setFaqAnswer] = useState("");

  const handleEditLegal = (title: string) => {
    setEditTitle(title);
    setEditContent("");
    setShowEditModal(true);
  };

  const handleToggle = (index: number) => {
    setToggleStates((prev) => prev.map((v, i) => (i === index ? !v : v)));
  };

  const handleAddFaq = () => {
    setFaqModalMode("add");
    setFaqQuestion("");
    setFaqAnswer("");
    setEditFaqIndex(null);
    setShowFaqModal(true);
  };

  const handleEditFaq = (index: number) => {
    setFaqModalMode("edit");
    setFaqQuestion(faqs[index].question);
    setFaqAnswer(faqs[index].answer);
    setEditFaqIndex(index);
    setShowFaqModal(true);
  };

  const handleDeleteFaq = (index: number) => {
    setFaqs((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveFaq = () => {
    if (faqModalMode === "add") {
      setFaqs((prev) => [...prev, { question: faqQuestion, answer: faqAnswer }]);
    } else if (editFaqIndex !== null) {
      setFaqs((prev) =>
        prev.map((item, i) =>
          i === editFaqIndex
            ? { question: faqQuestion, answer: faqAnswer }
            : item
        )
      );
    }
    setShowFaqModal(false);
  };

  return (
    <div>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>System Configuration</h1>
        <p className={styles.pageSubtitle}>
          Manage app settings, content, and notifications
        </p>
      </div>

      {/* Tabs */}
      <div className={styles.settingsTabs}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`${styles.settingsTab} ${
              activeTab === tab.key ? styles.settingsTabActive : ""
            }`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ===== Legal & Terms Tab ===== */}
      {activeTab === "legal" && (
        <div>
          {legalSections.map((section, index) => (
            <div key={index} className={styles.legalSection}>
              <div className={styles.legalSectionHeader}>
                <h3 className={styles.legalSectionTitle}>{section.title}</h3>
                <button
                  className={styles.legalEditBtn}
                  onClick={() => handleEditLegal(section.title)}
                >
                  <Pencil size={14} />
                  Edit
                </button>
              </div>
              <p className={styles.legalSectionDate}>
                Last updated: {section.lastUpdated}
              </p>
              <div className={styles.legalContentCard}>
                {section.content.map((paragraph, pIndex) => (
                  <p
                    key={pIndex}
                    dangerouslySetInnerHTML={{ __html: paragraph }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ===== FAQs Tab ===== */}
      {activeTab === "faqs" && (
        <div>
          {/* Add FAQ Button */}
          <div className={styles.addFaqBtnWrap}>
            <button className={styles.addFaqBtn} onClick={handleAddFaq}>
              <Plus size={16} />
              Add FAQ
            </button>
          </div>

          {/* FAQ Cards */}
          {faqs.map((faq, index) => (
            <div key={index} className={styles.faqCardItem}>
              <div className={styles.faqCardHeader}>
                <p className={styles.faqCardQuestion}>{faq.question}</p>
                <div className={styles.faqCardActions}>
                  <button
                    className={styles.faqEditIconBtn}
                    onClick={() => handleEditFaq(index)}
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    className={styles.faqDeleteIconBtn}
                    onClick={() => handleDeleteFaq(index)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <p className={styles.faqCardAnswer}>{faq.answer}</p>
            </div>
          ))}
        </div>
      )}

      {/* ===== Contact Info Tab ===== */}
      {activeTab === "contact" && (
        <div className={styles.settingsSectionCard}>
          <h3 className={styles.settingsSectionTitle}>Contact Information</h3>

          <div className={styles.contactFormGroup} style={{ marginTop: 20 }}>
            <label className={styles.contactFormLabel}>Live Chat Link</label>
            <input
              type="text"
              className={styles.contactFormInput}
              defaultValue="https://support.service.app/chat"
            />
          </div>

          <div className={styles.contactFormGroup}>
            <label className={styles.contactFormLabel}>
              Support Phone Number
            </label>
            <input
              type="text"
              className={styles.contactFormInput}
              defaultValue="+1 (800) 123-4567"
            />
          </div>

          <div className={styles.contactFormGroup}>
            <label className={styles.contactFormLabel}>Support Email</label>
            <input
              type="email"
              className={styles.contactFormInput}
              defaultValue="support@service.app"
            />
          </div>

          <div className={styles.settingsFormActions}>
            <button className={styles.saveChangesBtn}>
              <Save size={16} />
              Save Changes
            </button>
          </div>
        </div>
      )}

      {/* ===== Notifications Tab ===== */}
      {activeTab === "notifications" && (
        <div>
          {/* Automated Notifications */}
          <div className={styles.settingsSectionCard}>
            <h3 className={styles.settingsSectionTitle}>
              Automated Notifications
            </h3>
            <p className={styles.settingsSectionSubtitle}>
              Configure automatic notifications sent to customers
            </p>

            {notificationToggles.map((toggle, index) => (
              <div key={index} className={styles.toggleRow}>
                <span className={styles.toggleLabel}>{toggle.label}</span>
                <label className={styles.toggleSwitch}>
                  <input
                    type="checkbox"
                    checked={toggleStates[index]}
                    onChange={() => handleToggle(index)}
                  />
                  <span className={styles.toggleSlider} />
                </label>
              </div>
            ))}
          </div>

          {/* Send Push Notification */}
          <div className={styles.settingsSectionCard}>
            <h3 className={styles.pushNotifTitle}>Send Push Notification</h3>
            <p className={styles.pushNotifSubtitle}>
              Send special offers or announcements to all users
            </p>

            <div className={styles.contactFormGroup}>
              <label className={styles.contactFormLabel}>
                Notification Title
              </label>
              <input
                type="text"
                className={styles.contactFormInput}
                placeholder="e.g., Special Offer: 20% Off AC Service"
              />
            </div>

            <div className={styles.contactFormGroup}>
              <label className={styles.contactFormLabel}>Message</label>
              <textarea
                className={styles.pushNotifTextarea}
                placeholder="Enter your message here..."
              />
            </div>

            <div className={styles.settingsFormActions}>
              <button className={styles.sendNotifBtn}>Send Notification</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Legal Modal */}
      {showEditModal && (
        <div
          className={styles.modalOverlay}
          onClick={() => setShowEditModal(false)}
        >
          <div
            className={styles.editLegalModalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className={styles.editLegalTitle}>Edit {editTitle}</h3>

            <label className={styles.editLegalLabel}>Content</label>
            <textarea
              className={styles.editLegalTextarea}
              placeholder="Enter legal document content here........."
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
            />

            <p className={styles.editLegalNote}>
              Use line breaks to separate paragraphs. The content will be
              displayed exactly as you type it.
            </p>

            <div className={styles.editLegalActions}>
              <button
                className={styles.editLegalCancelBtn}
                onClick={() => setShowEditModal(false)}
              >
                Cancel
              </button>
              <button className={styles.saveChangesBtn}>
                <Save size={16} />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FAQ Add/Edit Modal */}
      {showFaqModal && (
        <div
          className={styles.modalOverlay}
          onClick={() => setShowFaqModal(false)}
        >
          <div
            className={styles.faqModalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className={styles.faqModalTitle}>
              {faqModalMode === "add" ? "Add FAQ" : "Edit FAQ"}
            </h3>

            <div className={styles.contactFormGroup}>
              <label className={styles.contactFormLabel}>Question</label>
              <input
                type="text"
                className={styles.contactFormInput}
                placeholder="Enter FAQ question"
                value={faqQuestion}
                onChange={(e) => setFaqQuestion(e.target.value)}
              />
            </div>

            <div className={styles.contactFormGroup}>
              <label className={styles.contactFormLabel}>Answer</label>
              <textarea
                className={styles.pushNotifTextarea}
                placeholder="Enter FAQ answer"
                value={faqAnswer}
                onChange={(e) => setFaqAnswer(e.target.value)}
              />
            </div>

            <div className={styles.faqModalActions}>
              <button
                className={styles.editLegalCancelBtn}
                onClick={() => setShowFaqModal(false)}
              >
                Cancel
              </button>
              <button
                className={styles.faqModalSaveBtn}
                onClick={handleSaveFaq}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
