"use client";

import React, { useState } from "react";
import DashboardSidebar from "./DashboardSidebar";
import DashboardHeader from "./DashboardHeader";
import DashboardPageTransition from "./DashboardPageTransition";
import { AuthGuard } from "@/components/auth/AuthGuard";
import styles from "./dashboardLayout.module.css";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  return (
    <AuthGuard allowedRoles={["admin", "ADMIN"]}>
      <div className={styles.dashboardWrapper}>
        <DashboardSidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />
        <div className={styles.dashboardMain}>
          <DashboardHeader onMenuToggle={toggleSidebar} />
          <main className={styles.dashboardContent}>
            <DashboardPageTransition>{children}</DashboardPageTransition>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
