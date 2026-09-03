"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Bell, Menu } from "lucide-react";
import { useGetUnreadNotificationsCountQuery } from "@/redux/api/notificationsApi";
import styles from "./dashboardLayout.module.css";

interface DashboardHeaderProps {
  onMenuToggle: () => void;
}

export default function DashboardHeader({
  onMenuToggle,
}: DashboardHeaderProps) {
  const { data: unreadData } = useGetUnreadNotificationsCountQuery();
  const unreadCount = unreadData?.unreadCount ?? 0;

  return (
    <header className={styles.header}>
      <button className={styles.headerMenuBtn} onClick={onMenuToggle} type="button" aria-label="Toggle navigation">
        <Menu size={22} />
      </button>

      <div className={styles.headerRight}>
        <Link
          href="/admin/notifications"
          className={styles.headerNotification}
          aria-label={unreadCount > 0 ? `Open notifications (${unreadCount} unread)` : "Open notifications"}
        >
          <Bell size={20} />
          {unreadCount > 0 ? (
            <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-teal-600 px-1 text-[11px] font-bold text-white shadow-sm ring-2 ring-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          ) : null}
        </Link>

        <Link href="/admin/profile" className={styles.headerProfile}>
          <div className={styles.headerProfileInfo}>
            <span className={styles.headerProfileName}>Admin</span>
            <span className={styles.headerProfileRole}>Control Center</span>
          </div>
          <div className={styles.headerProfileAvatar}>
            <Image
              src="/nav_profile.jpg"
              alt="Profile"
              width={40}
              height={40}
              className={styles.headerProfileImg}
            />
          </div>
        </Link>
      </div>
    </header>
  );
}
