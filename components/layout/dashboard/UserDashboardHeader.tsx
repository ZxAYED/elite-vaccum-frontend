"use client";

import { Menu } from "lucide-react";

export default function UserDashboardHeader({
  onMenuToggle,
}: {
  onMenuToggle: () => void;
}) {
  return (
    <header className="sticky top-0 z-30 h-16 flex items-center justify-between  bg-white px-4 py-3 lg:px-6">
      <button onClick={onMenuToggle} className="lg:hidden text-gray-700">
        <Menu size={22} />
      </button>
    </header>
  );
}
