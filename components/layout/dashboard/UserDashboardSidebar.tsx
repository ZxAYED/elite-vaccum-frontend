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
        className={`fixed inset-y-0 left-0 z-50 flex w-68 flex-col bg-white transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 border-r border-slate-100 shadow-xs`}
      >
        <div className="flex items-center justify-between h-16 px-6 py-6 border-b border-slate-100/80">
          <Link href="/">
            <Image
              src="/logo_dashboard.png"
              alt="Elite Logo"
              width={96}
              height={18}
            />
          </Link>

          <button onClick={onClose} aria-label="Close sidebar" className="lg:hidden p-1 text-slate-500 hover:text-slate-900">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 space-y-1.5 px-3.5 py-5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/user" && pathname?.startsWith(`${item.href}/`));
            const Icon = item.icon;

            return (
              <motion.div
                key={item.href}
                whileHover={{ x: 3 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 450, damping: 25 }}
              >
                <Link
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-center gap-3.5 rounded-lg px-4 py-3 text-[15px] sm:text-base font-medium transition-colors ${
                    isActive
                      ? "bg-teal-50 text-teal-950 font-semibold border-l-4 border-teal-700 shadow-xs"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <Icon size={20} className={isActive ? "text-teal-700 shrink-0" : "text-slate-400 shrink-0"} />
                  <span>{item.label}</span>
                </Link>
              </motion.div>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-3 shadow-xs">
            <Image
              src="/nav_profile.jpg"
              alt="User"
              width={38}
              height={38}
              className="rounded-full object-cover"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900 truncate">John Doe</p>
              <p className="text-xs text-slate-500">Customer Portal</p>
            </div>
            <Shield className="text-teal-700 shrink-0" size={18} />
          </div>

          <motion.button
            whileHover={{ x: 2, scale: 1.01 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 22 }}
            type="button"
            onClick={handleLogout}
            className="mt-3 flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-rose-50 px-4 py-2.5 text-xs sm:text-sm font-semibold text-rose-600 hover:bg-rose-100 hover:text-rose-700 transition-colors"
          >
            <LogOut size={16} className="text-rose-500" />
            Logout
          </motion.button>
        </div>
      </aside>
    </>
  );
}
