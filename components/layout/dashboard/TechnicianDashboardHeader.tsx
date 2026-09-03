"use client";

import Link from "next/link";
import { Bell, Menu, Wrench } from "lucide-react";
import { useAppSelector } from "@/redux/hooks";
import { useGetUnreadNotificationsCountQuery } from "@/redux/api/notificationsApi";

export default function TechnicianDashboardHeader({
  onMenuToggle,
}: {
  onMenuToggle: () => void;
}) {
  const user = useAppSelector((state) => state.auth.user);
  const { data: unreadData } = useGetUnreadNotificationsCountQuery();
  const unreadCount = unreadData?.unreadCount ?? 0;

  const displayName = user?.fullName || [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Technician";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "TC";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 py-3 backdrop-blur-md lg:px-6">
      <button
        onClick={onMenuToggle}
        className="rounded-lg p-1.5 text-slate-700 transition hover:bg-slate-100 lg:hidden"
        type="button"
        aria-label="Open technician navigation"
      >
        <Menu size={22} />
      </button>

      <div className="hidden items-center gap-2 text-sm font-semibold text-slate-700 lg:flex">
        <span className="flex size-6 items-center justify-center rounded-md bg-teal-100 text-teal-800">
          <Wrench size={14} />
        </span>
        Field Operations <span className="text-slate-400">·</span> <span className="text-teal-900">{displayName}</span>
      </div>

      <div className="flex items-center gap-3">
        <Link
          href="/technician/notifications"
          className="relative flex size-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-xs transition hover:border-teal-300 hover:bg-teal-50/50 hover:text-teal-900"
          aria-label={unreadCount > 0 ? `Open notifications (${unreadCount} unread)` : "Open notifications"}
        >
          <Bell size={19} />
          {unreadCount > 0 ? (
            <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-teal-600 px-1 text-[11px] font-bold text-white shadow-xs ring-2 ring-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          ) : null}
        </Link>

        <Link
          href="/technician/profile"
          className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white p-1.5 pr-3 shadow-xs transition hover:border-teal-300 hover:bg-slate-50"
        >
          <div className="flex size-7 items-center justify-center rounded-lg bg-teal-800 text-xs font-bold text-white">
            {initials}
          </div>
          <div className="hidden flex-col text-left sm:flex">
            <span className="text-xs font-semibold text-slate-900 leading-tight">
              {displayName}
            </span>
            <span className="text-[10px] text-teal-700 font-medium leading-none">
              Certified Tech
            </span>
          </div>
        </Link>
      </div>
    </header>
  );
}
