"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  LogOut,
  Package,
  ReceiptText,
  Settings,
  Shield,
  Star,
  SquareCheckBig,
  StretchHorizontal,
  UserRound,
  X,
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useLogoutMutation } from "@/redux/api/authApi";
import { useAppDispatch } from "@/redux/hooks";
import { logout } from "@/redux/slices/authSlice";

const navItems = [
  { label: "Overview", href: "/user", icon: StretchHorizontal },
  {
    label: "Service Requests",
    href: "/user/services",
    icon: SquareCheckBig,
  },
  { label: "Orders", href: "/user/orders", icon: Package },
  { label: "Billing", href: "/user/billing", icon: ReceiptText },
  { label: "Reviews", href: "/user/reviews", icon: Star },
  { label: "Notifications", href: "/user/notifications", icon: Bell },
  { label: "Profile", href: "/user/profile", icon: UserRound },
  { label: "Settings", href: "/user/settings", icon: Settings },
];

export default function UserDashboardSidebar({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [logoutMutation] = useLogoutMutation();

  const handleLogout = async () => {
    try {
      await logoutMutation().unwrap();
    } catch {
      // client logout proceeds
    }
    dispatch(logout());
    toast.success("Logged out successfully.");
    router.push("/auth/login");
  };

  return (
    <>
      {isOpen ? (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-white transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 border-r border-slate-100 shadow-sm`}
      >
        <div className="flex items-center justify-between h-14 px-6 py-8">
          <Link href="/">
            <Image
              src="/logo_dashboard.png"
              alt="Elite Logo"
              width={88}
              height={14}
            />
          </Link>

          <button onClick={onClose} aria-label="Close sidebar" className="lg:hidden">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 space-y-1.5 px-3 py-4">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/user" && pathname?.startsWith(`${item.href}/`));
            const Icon = item.icon;

            return (
              <motion.div
                key={item.href}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 450, damping: 25 }}
              >
                <Link
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-center gap-3 rounded-md px-3.5 py-2.5 text-sm font-medium transition ${
                    isActive
                      ? "bg-teal-50 text-teal-900 font-semibold border-l-4 border-teal-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <Icon size={18} className={isActive ? "text-teal-700" : "text-slate-500"} />
                  {item.label}
                </Link>
              </motion.div>
            );
          })}
        </nav>

        <div className="p-3.5 border-t border-slate-100">
          <div className="flex items-center gap-2.5 rounded-lg border border-slate-200 bg-slate-50/80 p-2.5 shadow-xs">
            <Image
              src="/nav_profile.jpg"
              alt="User"
              width={36}
              height={36}
              className="rounded-full object-cover border border-slate-200"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-900 truncate">John Doe</p>
              <p className="text-[11px] text-slate-500">Customer Portal</p>
            </div>
            <Shield className="text-teal-700 shrink-0" size={16} />
          </div>

          <motion.button
            whileHover={{ x: 3, scale: 1.01 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 22 }}
            type="button"
            onClick={handleLogout}
            className="mt-2.5 flex w-full cursor-pointer items-center gap-2.5 rounded-md bg-rose-50/70 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-100 hover:text-rose-700 transition-colors"
          >
            <LogOut size={16} className="text-rose-500" />
            Logout
          </motion.button>
        </div>
      </aside>
    </>
  );
}
