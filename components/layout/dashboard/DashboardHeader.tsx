"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Bell, Menu } from "lucide-react";
import styles from "./dashboardLayout.module.css";

interface DashboardHeaderProps {
  onMenuToggle: () => void;
}

export default function DashboardHeader({
  onMenuToggle,
}: DashboardHeaderProps) {
  return (
    <header className={styles.header}>
      <button className={styles.headerMenuBtn} onClick={onMenuToggle}>
        <Menu size={22} />
      </button>

      <div className={styles.headerRight}>
        <button className={styles.headerNotification}>
          <Bell size={20} />
          <span className={styles.headerNotificationDot} />
        </button>

        <Link href="/admin/profile" className={styles.headerProfile}>
          <div className={styles.headerProfileInfo}>
            <span className={styles.headerProfileName}>Armand</span>
            <span className={styles.headerProfileRole}>Premium</span>
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
