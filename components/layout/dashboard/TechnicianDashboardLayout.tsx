"use client";

import { useState } from "react";

import TechnicianDashboardHeader from "./TechnicianDashboardHeader";
import TechnicianDashboardSidebar from "./TechnicianDashboardSidebar";
import DashboardPageTransition from "./DashboardPageTransition";
import { AuthGuard } from "@/components/auth/AuthGuard";

export default function TechnicianDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <AuthGuard allowedRoles={["technician", "TECHNICIAN", "admin", "ADMIN"]}>
      <div className="flex min-h-screen bg-[#f4f7f7]">
        <TechnicianDashboardSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <div className="flex flex-1 flex-col lg:pl-64">
          <TechnicianDashboardHeader onMenuToggle={() => setSidebarOpen(true)} />
          <main className="flex-1 p-4 md:p-6">
            <DashboardPageTransition>{children}</DashboardPageTransition>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
