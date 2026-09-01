import Image from "next/image";
import type { StaticImageData } from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import logo from "@/public/logo.png";

interface AuthLayoutProps {
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
  image: StaticImageData;
  imageAlt: string;
}

export function AuthLayout({
  title,
  description,
  children,
  footer,
  image,
  imageAlt,
}: AuthLayoutProps) {
  return (
    <div className="min-h-svh bg-[linear-gradient(180deg,#fbfdfc_0%,#f2f8f6_100%)] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100svh-3rem)] max-w-7xl items-center gap-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(26rem,0.95fr)]">
        <main className="flex w-full justify-center">
          <section className="w-full max-w-[29rem] rounded-[1.75rem] bg-white/80 p-6 shadow-[0_24px_70px_-52px_rgba(28,79,80,0.55)] backdrop-blur sm:p-8">
            <Link href="/" className="mb-10 inline-flex items-center">
              <Image
                src={logo}
                alt="Elite Central Vacuum"
                priority
                className="h-auto w-28"
              />
            </Link>

            <header className="mb-8">
              <h1 className="text-balance text-4xl font-bold tracking-[-0.04em] text-slate-950">
                {title}
              </h1>
              <p className="mt-3 text-pretty text-sm leading-6 text-slate-600">
                {description}
              </p>
            </header>

            <div className="space-y-6">{children}</div>
            {footer ? <div className="mt-6">{footer}</div> : null}
          </section>
        </main>

        <aside className="hidden lg:block">
          <div className="relative mx-auto aspect-[4/5] max-h-[calc(100svh-5rem)] overflow-hidden rounded-[2rem] bg-[var(--brand-soft)] shadow-[0_30px_90px_-56px_rgba(28,79,80,0.72)]">
            <Image
              src={image}
              alt={imageAlt}
              fill
              className="object-cover"
              priority
              sizes="(min-width: 1024px) 46vw, 100vw"
            />
          </div>
        </aside>
      </div>
    </div>
  );
}
