"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  CalendarDays,
  ClipboardCheck,
  CreditCard,
  FileText,
  LayoutDashboard,
  LogOut,
  PackageSearch,
  Settings,
  ShoppingBag,
  Star,
  Tags,
  UserCog,
  Users,
  Wrench,
  X,
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useLogoutMutation } from "@/redux/api/authApi";
import { useAppDispatch } from "@/redux/hooks";
import { logout } from "@/redux/slices/authSlice";
import styles from "./dashboardLayout.module.css";

type AdminNavItem = {
  label: string;
  href?: string;
  icon: typeof LayoutDashboard;
  soon?: boolean;
};

const navGroups: Array<{
  label?: string;
  items: AdminNavItem[];
}> = [
  {
    items: [{ label: "Overview", href: "/admin", icon: LayoutDashboard }],
  },
  {
    label: "Customers",
    items: [{ label: "Customers", href: "/admin/customers", icon: Users }],
  },
  {
    label: "Catalog",
    items: [
      { label: "Products", href: "/admin/products", icon: PackageSearch },
      { label: "Categories", href: "/admin/categories", icon: Tags },
    ],
  },
  {
    label: "Service Operations",
    items: [
      {
        label: "Service Requests",
        href: "/admin/service-requests",
        icon: ClipboardCheck,
      },
      { label: "Services", href: "/admin/services", icon: Wrench },
      { label: "Quotations", href: "/admin/quotations", icon: FileText },
      {
        label: "Schedule",
        href: "/admin/schedule",
        icon: CalendarDays,
      },
    ],
  },
  {
    label: "Commerce",
    items: [
      { label: "Orders", href: "/admin/orders", icon: ShoppingBag },
      { label: "Billing", href: "/admin/financials", icon: CreditCard },
    ],
  },
  {
    label: "Team",
    items: [
      { label: "Technicians", href: "/admin/technicians", icon: UserCog },
    ],
  },
  {
    label: "Insights",
    items: [
      { label: "Reviews", href: "/admin/reviews", icon: Star },
      { label: "Reports", href: "/admin/reports", icon: BarChart3 },
    ],
  },
  {
    items: [{ label: "Settings", href: "/admin/settings", icon: Settings }],
  },
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
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [logoutMutation] = useLogoutMutation();

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
            <Image
              src="/logo-white.png"
              alt="Elite Logo"
              width={112}
              height={48}
              className={styles.logoImage}
            />
          </Link>
          <button
            aria-label="Close sidebar"
            className={styles.sidebarCloseBtn}
            onClick={onToggle}
            type="button"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className={styles.sidebarNav}>
          {navGroups.map((group, groupIndex) => (
            <div
              className={styles.sidebarNavGroup}
              key={group.label ?? `primary-${groupIndex}`}
            >
              {group.label ? (
                <p className={styles.sidebarNavGroupLabel}>{group.label}</p>
              ) : null}

              {group.items.map((item) => {
                const isActive =
                  item.href &&
                  (pathname === item.href ||
                    (item.href !== "/admin" &&
                      pathname?.startsWith(`${item.href}/`)));
                const IconComponent = item.icon;
                const content = (
                  <>
                    <IconComponent size={18} />
                    <span>{item.label}</span>
                    {item.soon ? (
                      <span className={styles.sidebarSoonBadge}>Soon</span>
                    ) : null}
                  </>
                );

                if (!item.href) {
                  return (
                    <div
                      className={`${styles.sidebarNavItem} ${styles.sidebarNavItemMuted}`}
                      key={item.label}
                      title={`${item.label} is planned for a later admin pass`}
                    >
                      {content}
                    </div>
                  );
                }

                return (
                  <motion.div
                    key={item.href}
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ type: "spring", stiffness: 450, damping: 25 }}
                  >
                    <Link
                      href={item.href}
                      className={`${styles.sidebarNavItem} ${
                        isActive ? styles.sidebarNavItemActive : ""
                      }`}
                      onClick={() => {
                        if (window.innerWidth < 1024) onToggle();
                      }}
                    >
                      {content}
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Logout */}
        <div className={styles.sidebarLogout}>
          <motion.button
            whileHover={{ x: 3, scale: 1.01 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 22 }}
            onClick={async () => {
              try {
                await logoutMutation().unwrap();
              } catch {
                // proceed with client logout regardless
              }
              dispatch(logout());
              toast.success("Logged out successfully.");
              router.push("/auth/login");
            }}
            className={styles.sidebarLogoutBtn}
            type="button"
          >
            <LogOut size={18} className="text-red-400" />
            <span>Logout</span>
          </motion.button>
        </div>
      </aside>
    </>
  );
}
