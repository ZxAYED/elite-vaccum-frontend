"use client";

import {
  Bell,
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu,
  Package,
  ReceiptText,
  ShoppingBag,
  ShoppingCart,
  SquareCheckBig,
  User,
  UserCircle2,
  UserCog,
  UserPlus,
  Wrench,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import logo from "@/public/logo.png";
import { useLogoutMutation } from "@/redux/api/authApi";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { logout } from "@/redux/slices/authSlice";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/store", label: "Store" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact Us" },
];

function NavIconButton({
  href,
  label,
  children,
  withBadge = false,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
  withBadge?: boolean;
}) {
  return (
    <Link
      aria-label={label}
      className="relative hidden size-10 items-center justify-center rounded-[var(--radius-control)] border border-teal-100 bg-white text-primary shadow-sm transition hover:bg-[var(--brand-soft)] xl:inline-flex"
      href={href}
    >
      {children}
      {withBadge ? (
        <span className="absolute right-2 top-2 size-2 rounded-full bg-[#0ea5b7]" />
      ) : null}
    </Link>
  );
}

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const [logoutMutation] = useLogoutMutation();

  const userRole = String(user?.role || "CUSTOMER").toUpperCase();
  const isAdmin = userRole === "ADMIN";
  const isTechnician = userRole === "TECHNICIAN";
  const isCustomer = isAuthenticated && !isAdmin && !isTechnician;

  const fullName =
    user?.fullName ||
    (user?.firstName
      ? `${user.firstName} ${user.lastName || ""}`.trim()
      : user?.email || "Elite User");

  const initials = (() => {
    if (user?.fullName) {
      const parts = user.fullName.trim().split(/\s+/);
      return parts.length > 1
        ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
        : `${parts[0][0] || "E"}`.toUpperCase();
    }
    if (user?.firstName) {
      return `${user.firstName[0]}${user.lastName ? user.lastName[0] : ""}`.toUpperCase();
    }
    return user?.email ? user.email[0].toUpperCase() : "E";
  })();

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

  const navLinkClass = (href: string) =>
    `text-base transition-colors ${
      pathname === href
        ? "font-semibold text-primary"
        : "text-[#1C4F50] hover:text-primary"
    }`;

  const notificationsHref = isAdmin
    ? "/admin/notifications"
    : isTechnician
      ? "/technician/notifications"
      : "/user/notifications";

  return (
    <header className="sticky top-0 z-50 border-b border-[#dff0ec] bg-white/95 backdrop-blur-md">
      <nav className="mx-auto flex max-w-360 items-center justify-between px-4 py-4">
        <Link
          href="/"
          className="flex items-center gap-2 font-bold text-xl text-primary"
        >
          <Image
            src={logo}
            alt="Elite Central Vacuum logo"
            priority
            className="h-auto w-[5.5rem] sm:w-[6.5rem]"
          />
        </Link>

        <div className="hidden xl:flex items-center gap-8">
          {navItems.map((item) => (
            <Link
              href={item.href}
              className={navLinkClass(item.href)}
              key={item.href}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <NavIconButton href="/cart" label="Open cart">
            <ShoppingCart size={18} />
          </NavIconButton>
          <NavIconButton
            href={notificationsHref}
            label="View notifications"
            withBadge
          >
            <Bell size={18} />
          </NavIconButton>

          {/* Desktop Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                aria-label="Open account menu"
                className="relative hidden size-10 cursor-pointer items-center justify-center rounded-[var(--radius-control)] border border-teal-100 bg-white text-primary shadow-sm transition hover:bg-[var(--brand-soft)] xl:inline-flex"
                type="button"
              >
                {isAuthenticated ? (
                  <>
                    <span className="flex size-7 items-center justify-center rounded-lg bg-teal-50 text-xs font-bold text-teal-800">
                      {initials}
                    </span>
                    <span className="absolute bottom-1 right-1 size-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                  </>
                ) : (
                  <User size={18} />
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-76 p-2 rounded-2xl">
              {/* Not Logged In */}
              {!isAuthenticated && (
                <>
                  <DropdownMenuLabel className="px-3 pt-1 text-[11px] font-bold uppercase tracking-wider text-teal-800/80">
                    Customer Access
                  </DropdownMenuLabel>
                  <div className="px-2 py-2">
                    <div className="flex items-center gap-3 rounded-xl border border-teal-100 bg-[linear-gradient(180deg,#f9fcfb_0%,#f0f7f5_100%)] p-3">
                      <div className="flex size-10 items-center justify-center rounded-xl bg-white text-teal-700 shadow-sm">
                        <UserCircle2 size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          Elite account
                        </p>
                        <p className="text-xs text-slate-500">
                          Quotes, orders, and service updates
                        </p>
                      </div>
                    </div>
                  </div>
                  <DropdownMenuSeparator className="my-1" />
                  <DropdownMenuGroup>
                    <DropdownMenuItem asChild>
                      <Link
                        href="/auth/login"
                        className="flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-teal-50 hover:text-teal-900"
                      >
                        <LogIn size={16} className="text-teal-600" />
                        Sign in
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link
                        href="/auth/register"
                        className="flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-teal-50 hover:text-teal-900"
                      >
                        <UserPlus size={16} className="text-teal-600" />
                        Create account
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link
                        href="/services"
                        className="flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-teal-50 hover:text-teal-900"
                      >
                        <Wrench size={16} className="text-teal-600" />
                        Book service
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </>
              )}

              {/* Logged in as ADMIN */}
              {isAuthenticated && isAdmin && (
                <>
                  <div className="flex items-center justify-between px-3 pt-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800/80">
                      Administrator
                    </span>
                    <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800 border border-amber-200">
                      ADMIN
                    </span>
                  </div>
                  <div className="px-2 py-2">
                    <div className="flex items-center gap-3 rounded-xl border border-teal-100 bg-[linear-gradient(180deg,#f9fcfb_0%,#f0f7f5_100%)] p-3">
                      <div className="flex size-10 items-center justify-center rounded-xl bg-teal-700 font-bold text-white shadow-sm">
                        {initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {fullName}
                        </p>
                        <p className="truncate text-xs text-slate-500">
                          {user?.email}
                        </p>
                      </div>
                    </div>
                  </div>
                  <DropdownMenuSeparator className="my-1" />
                  <DropdownMenuGroup>
                    <DropdownMenuItem asChild>
                      <Link
                        href="/admin"
                        className="flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-teal-50 hover:text-teal-900"
                      >
                        <LayoutDashboard size={16} className="text-teal-600" />
                        Admin Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link
                        href="/admin/service-requests"
                        className="flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-teal-50 hover:text-teal-900"
                      >
                        <ClipboardCheck size={16} className="text-teal-600" />
                        Service Operations
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link
                        href="/admin/orders"
                        className="flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-teal-50 hover:text-teal-900"
                      >
                        <ShoppingBag size={16} className="text-teal-600" />
                        Orders & Commerce
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link
                        href="/admin/technicians"
                        className="flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-teal-50 hover:text-teal-900"
                      >
                        <UserCog size={16} className="text-teal-600" />
                        Technicians
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link
                        href="/admin/profile"
                        className="flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-teal-50 hover:text-teal-900"
                      >
                        <UserCircle2 size={16} className="text-teal-600" />
                        Profile & Settings
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator className="my-1" />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                  >
                    <LogOut size={16} />
                    Logout
                  </DropdownMenuItem>
                </>
              )}

              {/* Logged in as TECHNICIAN */}
              {isAuthenticated && isTechnician && (
                <>
                  <div className="flex items-center justify-between px-3 pt-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800/80">
                      Technician Portal
                    </span>
                    <span className="rounded-md bg-teal-50 px-2 py-0.5 text-[10px] font-semibold text-teal-800 border border-teal-200">
                      TECH
                    </span>
                  </div>
                  <div className="px-2 py-2">
                    <div className="flex items-center gap-3 rounded-xl border border-teal-100 bg-[linear-gradient(180deg,#f9fcfb_0%,#f0f7f5_100%)] p-3">
                      <div className="flex size-10 items-center justify-center rounded-xl bg-teal-700 font-bold text-white shadow-sm">
                        {initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {fullName}
                        </p>
                        <p className="truncate text-xs text-slate-500">
                          Field Operations
                        </p>
                      </div>
                    </div>
                  </div>
                  <DropdownMenuSeparator className="my-1" />
                  <DropdownMenuGroup>
                    <DropdownMenuItem asChild>
                      <Link
                        href="/technician"
                        className="flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-teal-50 hover:text-teal-900"
                      >
                        <LayoutDashboard size={16} className="text-teal-600" />
                        Technician Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link
                        href="/technician/jobs"
                        className="flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-teal-50 hover:text-teal-900"
                      >
                        <ClipboardList size={16} className="text-teal-600" />
                        My Assigned Jobs
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link
                        href="/technician/schedule"
                        className="flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-teal-50 hover:text-teal-900"
                      >
                        <CalendarDays size={16} className="text-teal-600" />
                        Work Schedule
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link
                        href="/technician/profile"
                        className="flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-teal-50 hover:text-teal-900"
                      >
                        <UserCircle2 size={16} className="text-teal-600" />
                        My Profile
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator className="my-1" />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                  >
                    <LogOut size={16} />
                    Logout
                  </DropdownMenuItem>
                </>
              )}

              {/* Logged in as CUSTOMER */}
              {isAuthenticated && isCustomer && (
                <>
                  <div className="flex items-center justify-between px-3 pt-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800/80">
                      Customer Account
                    </span>
                    <span className="rounded-md bg-teal-50 px-2 py-0.5 text-[10px] font-semibold text-teal-800 border border-teal-200">
                      CUSTOMER
                    </span>
                  </div>
                  <div className="px-2 py-2">
                    <div className="flex items-center gap-3 rounded-xl border border-teal-100 bg-[linear-gradient(180deg,#f9fcfb_0%,#f0f7f5_100%)] p-3">
                      <div className="flex size-10 items-center justify-center rounded-xl bg-teal-700 font-bold text-white shadow-sm">
                        {initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {fullName}
                        </p>
                        <p className="truncate text-xs text-slate-500">
                          {user?.email}
                        </p>
                      </div>
                    </div>
                  </div>
                  <DropdownMenuSeparator className="my-1" />
                  <DropdownMenuGroup>
                    <DropdownMenuItem asChild>
                      <Link
                        href="/user"
                        className="flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-teal-50 hover:text-teal-900"
                      >
                        <LayoutDashboard size={16} className="text-teal-600" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link
                        href="/user/orders"
                        className="flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-teal-50 hover:text-teal-900"
                      >
                        <Package size={16} className="text-teal-600" />
                        My Orders
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link
                        href="/user/services"
                        className="flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-teal-50 hover:text-teal-900"
                      >
                        <SquareCheckBig size={16} className="text-teal-600" />
                        Service Requests
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link
                        href="/user/billing"
                        className="flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-teal-50 hover:text-teal-900"
                      >
                        <ReceiptText size={16} className="text-teal-600" />
                        Billing & Invoices
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link
                        href="/user/profile"
                        className="flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-teal-50 hover:text-teal-900"
                      >
                        <UserCircle2 size={16} className="text-teal-600" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator className="my-1" />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                  >
                    <LogOut size={16} />
                    Logout
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile hamburger trigger */}
          <button
            className="inline-flex size-10 items-center justify-center rounded-[var(--radius-control)] border border-teal-100 bg-white text-primary shadow-sm transition hover:bg-[var(--brand-soft)] xl:hidden"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
            type="button"
          >
            {isOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {isOpen ? (
        <div className="border-t border-[#e5f2ef] xl:hidden">
          <div className="mx-auto flex max-w-360 flex-col gap-5 px-4 py-5">
            {/* Quick action bar */}
            <div className="flex items-center justify-between border-b border-teal-100 pb-4">
              <div className="flex items-center gap-3">
                <Link
                  aria-label="Open cart"
                  className="inline-flex size-10 items-center justify-center rounded-[var(--radius-control)] border border-teal-100 bg-white text-primary"
                  href="/cart"
                  onClick={() => setIsOpen(false)}
                >
                  <ShoppingCart size={18} />
                </Link>
                <Link
                  aria-label="View notifications"
                  className="relative inline-flex size-10 items-center justify-center rounded-[var(--radius-control)] border border-teal-100 bg-white text-primary"
                  href={notificationsHref}
                  onClick={() => setIsOpen(false)}
                >
                  <Bell size={18} />
                  <span className="absolute right-2 top-2 size-2 rounded-full bg-[#0ea5b7]" />
                </Link>
              </div>

              {isAuthenticated ? (
                <div className="flex items-center gap-2 text-xs font-semibold text-teal-800">
                  <span className="flex size-7 items-center justify-center rounded-lg bg-teal-100 text-teal-900 font-bold">
                    {initials}
                  </span>
                  <span className="max-w-32 truncate">{fullName}</span>
                </div>
              ) : null}
            </div>

            {/* Navigation links */}
            <div className="flex flex-col gap-3">
              {navItems.map((item) => (
                <Link
                  href={item.href}
                  className={navLinkClass(item.href)}
                  key={item.href}
                  onClick={() => setIsOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            {/* Mobile Auth Actions */}
            <div className="border-t border-teal-100 pt-3">
              {!isAuthenticated ? (
                <div className="grid grid-cols-2 gap-3">
                  <Button asChild size="pill" variant="outline">
                    <Link href="/auth/login" onClick={() => setIsOpen(false)}>
                      Sign in
                    </Link>
                  </Button>
                  <Button asChild size="pill">
                    <Link
                      href="/auth/register"
                      onClick={() => setIsOpen(false)}
                    >
                      Sign up
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <Button asChild size="pill">
                    <Link
                      href={
                        isAdmin
                          ? "/admin"
                          : isTechnician
                            ? "/technician"
                            : "/user"
                      }
                      onClick={() => setIsOpen(false)}
                    >
                      <LayoutDashboard size={16} />
                      Go to Dashboard
                    </Link>
                  </Button>
                  <Button
                    onClick={() => {
                      setIsOpen(false);
                      handleLogout();
                    }}
                    size="pill"
                    variant="ghost"
                    className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                  >
                    <LogOut size={16} />
                    Logout
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
