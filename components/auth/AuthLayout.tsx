import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import authImage from "@/public/auth.png";
import logo from "@/public/logo.png";

interface AuthLayoutProps {
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthLayout({
  title,
  description,
  children,
  footer,
}: AuthLayoutProps) {
  return (
    <div className="relative flex min-h-screen overflow-hidden bg-[var(--background)]">
      <main className="flex w-full flex-col justify-center px-6 py-10 sm:px-10 lg:w-1/2 lg:px-20">
        <Link
          href="/"
          className="absolute left-6 top-4 inline-flex h-16 items-center sm:left-10 lg:left-20"
        >
          <Image src={logo} alt="Elite Central Vacuum" priority />
        </Link>

        <div className="mx-auto w-full max-w-md pt-16">
          <header className="mb-8">
            <h1 className="text-balance text-4xl font-bold text-slate-950">
              {title}
            </h1>
            <p className="mt-3 text-pretty text-sm text-slate-600">
              {description}
            </p>
          </header>

          <div className="space-y-6">{children}</div>
          {footer ? <div className="mt-6">{footer}</div> : null}
        </div>
      </main>

      <aside className="relative hidden lg:flex lg:w-1/2 lg:items-center lg:justify-center lg:bg-[linear-gradient(135deg,var(--brand),var(--brand-hover))]">
        <Image
          src={authImage}
          alt="Elite Central Vacuum technician preparing a service call"
          width={1600}
          height={1600}
          className="h-full w-full object-cover"
          priority
        />
      </aside>
    </div>
  );
}
