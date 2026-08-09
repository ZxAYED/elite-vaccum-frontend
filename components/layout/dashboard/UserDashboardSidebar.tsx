"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Bell,
  LogOut,
  Package,
  ReceiptText,
  Settings,
  Shield,
  SquareCheckBig,
  StretchHorizontal,
  X,
} from "lucide-react";

const navItems = [
  { label: "Overview", href: "/user", icon: StretchHorizontal },
  {
    label: "Service Requests",
    href: "/user/services",
    icon: SquareCheckBig,
  },
  { label: "Orders", href: "/user/orders", icon: Package },
  { label: "Billing", href: "/user/billing", icon: ReceiptText },
  { label: "Reviews", href: "/user/reviews", icon: ReceiptText },
  { label: "Notifications", href: "/user/notifications", icon: Bell },
  { label: "Profile", href: "/user/profile", icon: Settings },
];

export default function UserDashboardSidebar({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();

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
        <div className="flex items-center justify-between h-12 px-6 py-8">
          <Link href="/">
            <Image
              src="/logo_dashboard.png"
              alt="Elite Logo"
              width={80}
              height={12}
            />
          </Link>

          <button onClick={onClose} className="lg:hidden">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/user" && pathname?.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 rounded-sm px-3 py-3.5 text-sm font-medium transition ${
                  isActive
                    ? "bg-[#E8EDEE] text-[#2B3440] border-l-3 border-[#1C4F50]"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4">
          <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
            <Image
              src="/nav_profile.jpg"
              alt="User"
              width={40}
              height={40}
              className="rounded-full object-cover"
            />
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">John Doe</p>
              <p className="text-xs text-gray-500">Customer Portal</p>
            </div>
            <Shield className="text-teal-700" size={18} />
          </div>

          <button className="mt-3 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50">
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
