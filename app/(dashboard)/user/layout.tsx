import React from "react";
import UserDashboardLayout from "@/components/layout/dashboard/UserDashboardLayout";

export default function AdminDashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <UserDashboardLayout>{children}</UserDashboardLayout>;
}
