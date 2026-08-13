"use client";

import { Menu } from "lucide-react";

export default function TechnicianDashboardHeader({
  onMenuToggle,
}: {
  onMenuToggle: () => void;
}) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between bg-white px-4 py-3 lg:px-6">
      <button
        onClick={onMenuToggle}
        className="text-slate-700 lg:hidden"
        type="button"
        aria-label="Open technician navigation"
      >
        <Menu size={22} />
      </button>
      <div className="hidden lg:block" />
    </header>
  );
}
