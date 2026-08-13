"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  const technician = getCurrentTechnicianProfile();
  const unreadCount = getTechnicianUnreadNotificationCount();

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
        } lg:translate-x-0`}
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

        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/technician" && pathname?.startsWith(`${item.href}/`));
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center justify-between gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                  isActive
                    ? "bg-teal-50 text-primary ring-1 ring-teal-100"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <span className="flex items-center gap-3">
                  <Icon size={18} />
                  {item.label}
                </span>
                {item.href === "/technician/notifications" && unreadCount > 0 ? (
                  <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-amber-100 px-2 py-1 text-[11px] font-semibold text-amber-800">
                    {unreadCount}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-100 p-4">
          <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
            <Image
              src="/nav_profile.jpg"
              alt="Technician"
              width={40}
              height={40}
              className="rounded-full object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900">
                {technician.displayName}
              </p>
              <p className="text-xs text-slate-500">Field Technician</p>
            </div>
            <Shield className="text-teal-700" size={18} />
          </div>

          <button
            type="button"
            aria-disabled="true"
            title="Frontend-only demo. Backend sign-out is not connected yet."
            className="mt-3 flex w-full cursor-not-allowed items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-rose-600 opacity-70"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
