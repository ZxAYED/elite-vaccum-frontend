import { ArrowRight, ShieldCheck, ShoppingBag, Wrench } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/Button";
import heroVacuum from "@/public/landing/home/vaccum.png";

const highlights = [
  {
    icon: ShoppingBag,
    label: "Premium systems, accessories, and replacement parts",
  },
  {
    icon: Wrench,
    label: "Professional repair, maintenance, and installation support",
  },
  {
    icon: ShieldCheck,
    label: "Designed for clean-home infrastructure that lasts",
  },
];

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-[linear-gradient(180deg,var(--surface)_0%,#f2faf7_100%)]">
      <div className="absolute inset-x-0 top-0 h-px bg-teal-100" />
      <div className="mx-auto grid max-w-360 items-center gap-12 px-4 pb-16 pt-10 sm:px-6 md:grid-cols-[minmax(0,1.02fr)_minmax(280px,0.98fr)] lg:px-8 lg:pb-20 lg:pt-14">
        <div className="max-w-2xl">
          <p className="inline-flex rounded-full border border-teal-200 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-teal-700 shadow-sm">
            Central Vacuum Commerce + Service
          </p>
          <h1 className="mt-6 text-4xl font-bold tracking-[-0.04em] text-primary sm:text-5xl lg:text-6xl">
            Powerful Central Vacuum Solutions for Modern Homes
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
            Shop premium central vacuum products or book expert repair,
            maintenance, and installation with a team built around cleaner,
            quieter home performance.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild className="h-12 rounded-full px-6 text-sm font-semibold">
              <Link href="/store">
                Shop Products
                <ArrowRight size={16} />
              </Link>
            </Button>
            <Button
              asChild
              className="h-12 rounded-full border-teal-200 px-6 text-sm font-semibold text-primary hover:bg-teal-50"
              variant="outline"
            >
              <Link href="/services">Request Service</Link>
            </Button>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {highlights.map(({ icon: Icon, label }) => (
              <div
                className="rounded-2xl border border-teal-100/90 bg-white/85 p-4 shadow-[0_18px_45px_-38px_rgba(28,79,80,0.55)] backdrop-blur"
                key={label}
              >
                <div className="flex size-10 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
                  <Icon size={18} />
                </div>
                <p className="mt-4 text-sm leading-6 text-slate-600">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-2xl">
          <div className="absolute inset-x-12 bottom-6 h-12 rounded-full bg-teal-200/45 blur-3xl" />
          <div className="relative overflow-hidden rounded-[2rem] border border-teal-100 bg-white px-6 py-8 shadow-[0_40px_90px_-48px_rgba(28,79,80,0.45)] sm:px-10 sm:py-10">
            <div className="absolute -right-10 top-10 size-28 rounded-full bg-teal-100/75 blur-2xl" />
            <div className="absolute -left-4 bottom-8 size-24 rounded-full bg-emerald-100/75 blur-2xl" />
            <Image
              src={heroVacuum}
              alt="Elite central vacuum unit with hose and floor attachment"
              priority
              sizes="(max-width: 767px) 100vw, (max-width: 1279px) 44vw, 42vw"
              className="relative mx-auto h-auto w-full max-w-[34rem] object-contain"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
