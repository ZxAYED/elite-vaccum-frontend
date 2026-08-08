import React from "react";
import DashboardLayout from "@/components/layout/dashboard/DashboardLayout";

export default function AdminDashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
