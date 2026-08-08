"use client";

import React, { useState } from "react";
import {
  Camera,
  User,
  Shield,
  Bell,
  Mail,
  Phone,
  Lock,
  Save,
} from "lucide-react";
import styles from "../adminDashboard.module.css";

type ProfileTabKey = "info" | "security" | "notifications";

const profileTabs: { key: ProfileTabKey; label: string; icon: typeof User }[] = [
  { key: "info", label: "Profile Information", icon: User },
  { key: "security", label: "Security", icon: Shield },
  { key: "notifications", label: "Notifications", icon: Bell },
];

const emailNotifications = [
  { label: "New order notifications", defaultChecked: true },
  { label: "Order status updates", defaultChecked: false },
  { label: "New user registrations", defaultChecked: false },
  { label: "Daily revenue reports", defaultChecked: false },
];

export default function AdminProfilePage() {
  const [activeTab, setActiveTab] = useState<ProfileTabKey>("info");
  const [checkStates, setCheckStates] = useState(
    emailNotifications.map((n) => n.defaultChecked)
  );

  const handleCheckToggle = (index: number) => {
    setCheckStates((prev) => prev.map((v, i) => (i === index ? !v : v)));
  };

  return (
    <div>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Admin Profile</h1>
        <p className={styles.pageSubtitle}>
          Manage your account settings and preferences
        </p>
      </div>

      {/* Profile Card */}
      <div className={styles.adminProfileCard}>
        <div className={styles.adminProfileLeft}>
          <div className={styles.adminProfileAvatarWrap}>
            <div className={styles.adminProfileAvatarCircle}>A</div>
            <button className={styles.adminProfileCameraBtn}>
              <Camera size={12} />
            </button>
          </div>
          <div>
            <div className={styles.adminProfileName}>Admin User</div>
            <div className={styles.adminProfileRole}>Super Administrator</div>
            <div className={styles.adminProfileEmail}>admin@service.app</div>
          </div>
        </div>
        <button className={styles.editProfileBtn}>Edit Profile</button>
      </div>

      {/* Profile Tabs */}
      <div className={styles.profileTabs}>
        {profileTabs.map((tab) => {
          const IconComp = tab.icon;
          return (
            <button
              key={tab.key}
              className={`${styles.profileTab} ${
                activeTab === tab.key ? styles.profileTabActive : ""
              }`}
              onClick={() => setActiveTab(tab.key)}
            >
              <IconComp size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ===== Profile Information Tab ===== */}
      {activeTab === "info" && (
        <div className={styles.settingsSectionCard}>
          <h3 className={styles.settingsSectionTitle}>Personal Information</h3>

          <div className={styles.profileFormGrid} style={{ marginTop: 20 }}>
            <div>
              <label className={styles.contactFormLabel}>First Name</label>
              <input
                type="text"
                className={styles.contactFormInput}
                defaultValue="Admin"
              />
            </div>
            <div>
              <label className={styles.contactFormLabel}>Last Name</label>
              <input
                type="text"
                className={styles.contactFormInput}
                defaultValue="User"
              />
            </div>
          </div>

          <div className={styles.contactFormGroup}>
            <label className={styles.profileFormLabelIcon}>
              <Mail size={16} className={styles.profileFormLabelIconSvg} />
              Email Address
            </label>
            <input
              type="email"
              className={styles.contactFormInput}
              defaultValue="admin@service.app"
            />
          </div>

          <div className={styles.contactFormGroup}>
            <label className={styles.profileFormLabelIcon}>
              <Phone size={16} className={styles.profileFormLabelIconSvg} />
              Phone Number
            </label>
            <input
              type="tel"
              className={styles.contactFormInput}
              defaultValue="+1 (555) 000-0000"
            />
          </div>

          <div className={styles.contactFormGroup}>
            <label className={styles.contactFormLabel}>Role</label>
            <input
              type="text"
              className={styles.contactFormInput}
              defaultValue="Super Administrator"
              readOnly
            />
          </div>
        </div>
      )}

      {/* ===== Security Tab ===== */}
      {activeTab === "security" && (
        <div>
          {/* Change Password */}
          <div className={styles.settingsSectionCard}>
            <h3 className={styles.settingsSectionTitle}>Change Password</h3>

            <div className={styles.contactFormGroup} style={{ marginTop: 20 }}>
              <label className={styles.contactFormLabel}>Current Password</label>
              <input
                type="password"
                className={styles.contactFormInput}
                placeholder="Enter current password"
              />
            </div>

            <div className={styles.contactFormGroup}>
              <label className={styles.contactFormLabel}>New Password</label>
              <input
                type="password"
                className={styles.contactFormInput}
                placeholder="Enter new password"
              />
            </div>

            <div className={styles.contactFormGroup}>
              <label className={styles.contactFormLabel}>
                Confirm New Password
              </label>
              <input
                type="password"
                className={styles.contactFormInput}
                placeholder="Confirm new password"
              />
            </div>

            <div className={styles.settingsFormActions}>
              <button className={styles.updatePasswordBtn}>
                <Lock size={16} />
                Update Password
              </button>
            </div>
          </div>

          {/* Two-Factor Authentication */}
          <div className={styles.settingsSectionCard}>
            <h3 className={styles.settingsSectionTitle}>
              Two-Factor Authentication
            </h3>
            <p className={styles.twoFaSubtitle}>
              Add an extra layer of security to your account
            </p>
            <button className={styles.enable2faBtn}>Enable 2FA</button>
          </div>

          {/* Active Sessions */}
          <div className={styles.settingsSectionCard}>
            <h3 className={styles.settingsSectionTitle}>Active Sessions</h3>

            <div className={styles.sessionRow} style={{ marginTop: 16 }}>
              <div className={styles.sessionInfo}>
                <div className={styles.sessionDevice}>
                  MacBook Pro
                  <span className={styles.currentBadge}>Current</span>
                </div>
                <span className={styles.sessionMeta}>
                  New York, USA • 2 minutes ago
                </span>
              </div>
            </div>

            <div className={styles.sessionRow}>
              <div className={styles.sessionInfo}>
                <div className={styles.sessionDevice}>iPhone 14</div>
                <span className={styles.sessionMeta}>
                  New York, USA • 1 hour ago
                </span>
              </div>
              <button className={styles.sessionRemoveBtn}>Remove</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== Notifications Tab ===== */}
      {activeTab === "notifications" && (
        <div className={styles.settingsSectionCard}>
          <h3 className={styles.settingsSectionTitle}>
            Notification Preferences
          </h3>

          <p className={styles.emailNotifLabel} style={{ marginTop: 16 }}>
            Email Notifications
          </p>

          {emailNotifications.map((notif, index) => (
            <div key={index} className={styles.checkboxRow}>
              <span className={styles.checkboxLabel}>{notif.label}</span>
              <input
                type="checkbox"
                className={styles.profileCheckbox}
                checked={checkStates[index]}
                onChange={() => handleCheckToggle(index)}
              />
            </div>
          ))}

          <div className={styles.settingsFormActions}>
            <button className={styles.saveChangesBtn}>
              <Save size={16} />
              Save Preferences
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
