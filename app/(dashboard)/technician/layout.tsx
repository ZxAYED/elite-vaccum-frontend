import TechnicianDashboardLayout from "@/components/layout/dashboard/TechnicianDashboardLayout";

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <TechnicianDashboardLayout>{children}</TechnicianDashboardLayout>;
}
