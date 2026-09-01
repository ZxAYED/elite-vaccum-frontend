"use client";

import React, { useState } from "react";
import UserDashboardSidebar from "./UserDashboardSidebar";
import UserDashboardHeader from "./UserDashboardHeader";
import DashboardPageTransition from "./DashboardPageTransition";
import { AuthGuard } from "@/components/auth/AuthGuard";

export default function UserDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <AuthGuard allowedRoles={["customer", "CUSTOMER", "admin", "ADMIN"]}>
      <div className="flex min-h-screen bg-gray-100">
        <UserDashboardSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <div className="flex flex-1 flex-col lg:pl-64">
          <UserDashboardHeader onMenuToggle={() => setSidebarOpen(true)} />

          <main className="flex-1 p-4 md:p-6">
            <DashboardPageTransition>{children}</DashboardPageTransition>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
