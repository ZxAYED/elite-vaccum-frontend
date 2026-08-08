"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardCheck,
  ShoppingCart,
  Wrench,
  Users,
  DollarSign,
  Settings,
  LogOut,
  X,
  UserCog,
} from "lucide-react";
import styles from "./dashboardLayout.module.css";

const navItems = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  {
    label: "Order Confirmation",
    href: "/admin/order-confirmation",
    icon: ClipboardCheck,
  },
  { label: "Orders", href: "/admin/orders", icon: ShoppingCart },
  { label: "Services", href: "/admin/services", icon: Wrench },
  { label: "Technicians", href: "/admin/technicians", icon: UserCog },
  { label: "Customers", href: "/admin/customers", icon: Users },
  { label: "Financials", href: "/admin/financials", icon: DollarSign },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

interface DashboardSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function DashboardSidebar({
  isOpen,
  onToggle,
}: DashboardSidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && <div className={styles.sidebarOverlay} onClick={onToggle} />}

      <aside
        className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ""}`}
      >
        {/* Logo */}
        <div className={styles.sidebarLogo}>
          <Link href="/">
            {" "}
            <Image
              src="/logo_dashboard.png"
              alt="Elite Logo"
              width={120}
              height={48}
              className={styles.logoImage}
            />
          </Link>
          <button className={styles.sidebarCloseBtn} onClick={onToggle}>
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className={styles.sidebarNav}>
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/admin" && pathname?.startsWith(item.href));
            const IconComponent = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.sidebarNavItem} ${
                  isActive ? styles.sidebarNavItemActive : ""
                }`}
                onClick={() => {
                  if (window.innerWidth < 1024) onToggle();
                }}
              >
                <IconComponent size={18} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className={styles.sidebarLogout}>
          <button className={styles.sidebarLogoutBtn}>
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
