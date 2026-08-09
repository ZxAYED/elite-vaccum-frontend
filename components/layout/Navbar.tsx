"use client";

import {
  Bell,
  LayoutDashboard,
  LogIn,
  Menu,
  ShoppingCart,
  User,
  UserCircle2,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

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

  const navLinkClass = (href: string) =>
    `text-base transition-colors ${
      pathname === href
        ? "font-semibold text-primary"
        : "text-[#1C4F50] hover:text-primary"
    }`;

  return (
    <header className="sticky top-0 z-50 border-b border-[#dff0ec] bg-white/95 backdrop-blur-sm">
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
            <Link href={item.href} className={navLinkClass(item.href)} key={item.href}>
              {item.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <NavIconButton href="/cart" label="Open cart">
            <ShoppingCart size={18} />
          </NavIconButton>
          <NavIconButton href="/user/notifications" label="View notifications" withBadge>
            <Bell size={18} />
          </NavIconButton>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                aria-label="Open account menu"
                className="relative hidden size-10 items-center justify-center rounded-[var(--radius-control)] border border-teal-100 bg-white text-primary shadow-sm transition hover:bg-[var(--brand-soft)] xl:inline-flex"
                type="button"
              >
                <User size={18} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72">
              <DropdownMenuLabel>Customer Access</DropdownMenuLabel>
              <div className="px-3 pb-2">
                <div className="landing-card landing-card-soft flex items-center gap-3 p-3 shadow-none">
                  <div className="landing-icon-tile flex size-10 items-center justify-center bg-teal-50 text-teal-700">
                    <UserCircle2 size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Elite account</p>
                    <p className="text-xs text-slate-500">
                      Quotes, orders, and service updates
                    </p>
                  </div>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem asChild>
                  <Link href="/user">
                    <LayoutDashboard size={16} />
                    Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/user/profile">
                    <UserCircle2 size={16} />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/auth/login">
                    <LogIn size={16} />
                    Sign in
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>

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

      {isOpen ? (
        <div className="border-t border-[#e5f2ef] xl:hidden">
          <div className="mx-auto flex max-w-360 flex-col gap-5 px-4 py-5">
            <div className="flex items-center gap-3">
              <Link
                aria-label="Open cart"
                className="inline-flex size-10 items-center justify-center rounded-[var(--radius-control)] border border-teal-100 bg-white text-primary"
                href="/cart"
              >
                <ShoppingCart size={18} />
              </Link>
              <Link
                aria-label="View notifications"
                className="relative inline-flex size-10 items-center justify-center rounded-[var(--radius-control)] border border-teal-100 bg-white text-primary"
                href="/user/notifications"
              >
                <Bell size={18} />
                <span className="absolute right-2 top-2 size-2 rounded-full bg-[#0ea5b7]" />
              </Link>
              <Link
                aria-label="Open profile"
                className="inline-flex size-10 items-center justify-center rounded-[var(--radius-control)] border border-teal-100 bg-white text-primary"
                href="/user"
              >
                <User size={18} />
              </Link>
            </div>

            <div className="flex flex-col gap-4">
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

            <Button asChild size="pill" variant="ghost">
              <Link href="/auth/login" onClick={() => setIsOpen(false)}>
                Sign in
              </Link>
            </Button>
          </div>
        </div>
      ) : null}
    </header>
  );
}
