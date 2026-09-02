"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  CalendarDays,
  ClipboardList,
  LogOut,
  Settings,
  Shield,
  StretchHorizontal,
  UserRound,
  X,
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useLogoutMutation } from "@/redux/api/authApi";
import { useAppDispatch } from "@/redux/hooks";
import { logout } from "@/redux/slices/authSlice";

import {
  getCurrentTechnicianProfile,
  getTechnicianUnreadNotificationCount,
} from "@/data/mock/technician-dashboard";

const navItems = [
  { label: "Overview", href: "/technician", icon: StretchHorizontal },
  { label: "My Jobs", href: "/technician/jobs", icon: ClipboardList },
  { label: "Schedule", href: "/technician/schedule", icon: CalendarDays },
  { label: "Notifications", href: "/technician/notifications", icon: Bell },
  { label: "Profile", href: "/technician/profile", icon: UserRound },
  { label: "Settings", href: "/technician/settings", icon: Settings },
];

export default function TechnicianDashboardSidebar({
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

  const technician = getCurrentTechnicianProfile();
  const unreadCount = getTechnicianUnreadNotificationCount();

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
        <div className="flex h-16 items-center justify-between px-6">
          <Link href="/">
            <Image src="/logo_dashboard.png" alt="Elite Logo" width={92} height={24} />
          </Link>

          <button
            onClick={onClose}
            aria-label="Close sidebar"
            className="lg:hidden"
            type="button"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 space-y-1.5 px-3 py-4">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/technician" && pathname?.startsWith(`${item.href}/`));
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
                  className={`flex items-center justify-between gap-3 rounded-md px-3.5 py-2.5 text-sm font-medium transition ${
                    isActive
                      ? "bg-teal-50 text-teal-900 font-semibold border-l-4 border-teal-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Icon size={18} className={isActive ? "text-teal-700" : "text-slate-500"} />
                    {item.label}
                  </span>
                  {item.href === "/technician/notifications" && unreadCount > 0 ? (
                    <span className="inline-flex min-w-5 items-center justify-center rounded-md bg-amber-100 px-1.5 py-0.2 text-[10px] font-semibold text-amber-800">
                      {unreadCount}
                    </span>
                  ) : null}
                </Link>
              </motion.div>
            );
          })}
        </nav>

        <div className="border-t border-slate-100 p-3.5">
          <div className="flex items-center gap-2.5 rounded-lg border border-slate-200 bg-slate-50/80 p-2.5 shadow-xs">
            <Image
              src="/nav_profile.jpg"
              alt="Technician"
              width={36}
              height={36}
              className="rounded-full object-cover border border-slate-200"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-slate-900">
                {technician.displayName}
              </p>
              <p className="text-[11px] text-slate-500">Field Technician</p>
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
