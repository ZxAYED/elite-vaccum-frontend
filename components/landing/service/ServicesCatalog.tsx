"use client";

import {
  Activity,
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Compass,
  FileCheck2,
  Gauge,
  HomeIcon,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Upload,
  UploadCloud,
  Wrench,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ElementType } from "react";
import { useMemo, useState } from "react";

import {
  FadeIn,
  Pressable,
  StaggerGroup,
  StaggerItem,
} from "@/components/motion/Animated";
import { Button } from "@/components/ui/Button";
import { publicServiceOfferings } from "@/data/mock/public-services";
import { cn } from "@/lib/utils";
import heroVacuum from "@/public/landing/home/vaccum.png";
import serviceVanImage from "@/public/landing/service/service.png";
import type { PublicServiceGroup, PublicServiceIconKey } from "@/types/domain";

const groups: PublicServiceGroup[] = ["Service & Maintenance", "Installation"];

const iconByKey: Record<PublicServiceIconKey, ElementType> = {
  "home-plus": HomeIcon,
  wrench: Wrench,
  activity: Activity,
  shield: ShieldCheck,
  sparkles: Sparkles,
  sliders: SlidersHorizontal,
  upload: Upload,
  compass: Compass,
};

const benefits = [
  { title: "Expert Technicians", icon: BadgeCheck },
  { title: "Accurate Diagnosis", icon: Gauge },
  { title: "Transparent Quotation", icon: FileCheck2 },
  { title: "Reliable Service", icon: CheckCircle2 },
];

const processSteps = [
  {
    title: "Choose Service",
    summary: "Select the type of service you need.",
    icon: Search,
  },
  {
    title: "Submit Request",
    summary: "Provide contact information, location, and requested schedule.",
    icon: UploadCloud,
  },
  {
    title: "Add System Details",
    summary: "Share equipment information, photos, and videos.",
    icon: ClipboardCheck,
  },
  {
    title: "Admin Review",
    summary: "Our team reviews your request and prepares a quotation.",
    icon: FileCheck2,
  },
  {
    title: "Review Quote",
    summary: "Your quotation appears in your customer dashboard for approval.",
    icon: CalendarDays,
  },
  {
    title: "Service Visit",
    summary: "Your technician arrives according to the confirmed schedule.",
    icon: CheckCircle2,
  },
];

export function ServicesCatalog() {
  const [activeGroup, setActiveGroup] =
    useState<PublicServiceGroup>("Service & Maintenance");

  const visibleServices = useMemo(
    () =>
      publicServiceOfferings.filter((service) => service.group === activeGroup),
    [activeGroup],
  );

  return (
    <main className="overflow-hidden bg-white">
      <section className="bg-[linear-gradient(180deg,#effcfa_0%,#ffffff_86%)] pt-16 md:pt-24">
        <div className="mx-auto grid max-w-360 items-center gap-12 px-4 sm:px-6 lg:grid-cols-[1fr_0.9fr] lg:px-8">
          <FadeIn className="max-w-2xl">
            <h1 className="text-5xl font-semibold tracking-[-0.06em] text-primary md:text-6xl lg:text-7xl">
              Professional Vacuum Services & Installation
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-slate-600 md:text-lg">
              Submit your request and receive a customized quotation from our
              experts. Precision engineering for the infrastructure of your
              healthy home.
            </p>
            <div className="mt-9 flex flex-wrap gap-4">
              <Pressable>
                <Button asChild size="pill">
                  <Link href="/services/request?service=vacuum-repair">
                    Request a Service
                  </Link>
                </Button>
              </Pressable>
              <Pressable>
                <Button asChild variant="outline" size="pill">
                  <Link href="/services/request?service=new-system">
                    Request Installation
                  </Link>
                </Button>
              </Pressable>
            </div>
          </FadeIn>

          <FadeIn delay={0.1} y={18} className="relative mx-auto w-full max-w-xl">
            <div className="absolute inset-10 rounded-full bg-teal-100/60 blur-3xl" />
            <Image
              src={heroVacuum}
              alt="Central vacuum unit with hose and floor tool"
              priority
              className="relative mx-auto h-auto w-full object-contain"
            />
          </FadeIn>
        </div>

        <StaggerGroup className="mx-auto mt-16 grid max-w-360 gap-5 px-4 pb-20 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
          {benefits.map(({ title, icon: Icon }) => (
            <StaggerItem key={title}>
              <article className="flex min-h-32 flex-col items-center justify-center rounded-[1.15rem] bg-white/80 p-6 text-center shadow-[0_22px_70px_-54px_rgba(28,79,80,0.65)] ring-1 ring-teal-100">
                <Icon aria-hidden="true" className="mb-4 text-primary" size={22} />
                <h2 className="text-sm font-semibold tracking-[-0.02em] text-slate-900">
                  {title}
                </h2>
              </article>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </section>

      <section id="service-options" className="mx-auto max-w-360 px-4 py-16 sm:px-6 lg:px-8">
        <FadeIn>
          <div className="flex flex-wrap gap-8 text-xl font-semibold md:text-2xl">
            {groups.map((group) => {
              const active = activeGroup === group;

              return (
                <button
                  key={group}
                  type="button"
                  onClick={() => setActiveGroup(group)}
                  className={cn(
                    "relative pb-3 text-slate-400 transition hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--focus-ring)]",
                    active && "text-primary",
                  )}
                >
                  {group}
                  <span
                    className={cn(
                      "absolute inset-x-0 bottom-0 h-0.5 origin-left rounded-full bg-primary transition-transform duration-300",
                      active ? "scale-x-100" : "scale-x-0",
                    )}
                  />
                </button>
              );
            })}
          </div>
        </FadeIn>

        <StaggerGroup
          key={activeGroup}
          className={cn(
            "mt-10 grid overflow-hidden rounded-[1.25rem] bg-[linear-gradient(180deg,#ffffff_0%,#f4fbfa_100%)] ring-1 ring-teal-100",
            activeGroup === "Installation"
              ? "sm:grid-cols-2 xl:grid-cols-4"
              : "sm:grid-cols-2 lg:grid-cols-3",
          )}
          delay={0.04}
        >
          {visibleServices.map((service, index) => {
            const Icon = iconByKey[service.iconKey];

            return (
              <StaggerItem key={service.slug}>
                <article
                  className={cn(
                    "flex min-h-60 h-full flex-col p-8",
                    index !== visibleServices.length - 1 &&
                      "border-b border-teal-100 sm:border-r",
                    activeGroup === "Service & Maintenance" &&
                      "lg:[&:nth-child(3n)]:border-r-0 lg:[&:nth-child(n+4)]:border-b-0",
                    activeGroup === "Installation" &&
                      "xl:border-b-0 xl:[&:nth-child(4n)]:border-r-0",
                  )}
                >
                  <Icon aria-hidden="true" className="text-primary" size={22} />
                  <h2 className="mt-8 text-xl font-semibold tracking-[-0.03em] text-slate-950">
                    {service.title}
                  </h2>
                  <p className="mt-3 max-w-72 text-sm leading-6 text-slate-500">
                    {service.summary}
                  </p>
                  <Pressable className="mt-auto w-fit pt-8">
                    <Link
                      href={`/services/request?service=${service.slug}`}
                      className="inline-flex items-center gap-2 text-sm font-semibold text-primary transition hover:text-teal-700"
                    >
                      Request Service
                      <ArrowRight aria-hidden="true" size={15} />
                    </Link>
                  </Pressable>
                </article>
              </StaggerItem>
            );
          })}
        </StaggerGroup>
      </section>

      <section className="mx-auto max-w-360 px-4 py-18 sm:px-6 lg:px-8">
        <FadeIn className="text-center">
          <h2 className="text-3xl font-semibold tracking-[-0.04em] text-primary md:text-4xl">
            The Path to Pristine Air
          </h2>
        </FadeIn>

        <StaggerGroup className="relative mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-6">
          <div className="absolute left-10 right-10 top-12 hidden h-px bg-teal-100 lg:block" />
          {processSteps.map(({ title, summary, icon: Icon }, index) => (
            <StaggerItem key={title}>
              <article className="relative flex h-full flex-col items-center rounded-[1.1rem] bg-white p-5 text-center shadow-[0_24px_72px_-58px_rgba(28,79,80,0.8)] ring-1 ring-teal-100">
                <div className="relative -mt-10 flex size-14 items-center justify-center rounded-full bg-primary text-white shadow-[0_18px_36px_-24px_rgba(28,79,80,0.8)]">
                  <Icon aria-hidden="true" size={20} />
                </div>
                <h3 className="mt-6 text-sm font-semibold text-primary">
                  {title}
                </h3>
                <p className="mt-2 text-xs leading-5 text-slate-500">{summary}</p>
                <span className="mt-auto pt-5 text-[11px] font-bold uppercase tracking-[0.18em] text-white">
                  <span className="rounded-md bg-primary px-4 py-2">
                    Step {String(index + 1).padStart(2, "0")}
                  </span>
                </span>
              </article>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </section>

      <FadeIn
        once={false}
        className="mx-auto max-w-360 px-4 py-16 sm:px-6 lg:px-8"
      >
        <section className="grid gap-8 rounded-[1.5rem] bg-slate-50 p-6 md:p-10 lg:grid-cols-[1fr_0.9fr] lg:p-14">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-teal-700">
              Ready to Request Service?
            </p>
            <h2 className="mt-3 max-w-2xl text-4xl font-semibold tracking-[-0.05em] text-primary md:text-5xl">
              Help us prepare before your visit.
            </h2>
            <p className="mt-5 max-w-xl text-sm leading-7 text-slate-600">
              Choose a service, tell us what is happening, and request the date
              and time that works best. Our team reviews the request before any
              quotation is created.
            </p>
            <Pressable className="mt-8">
              <Button asChild size="pill">
                <Link href="/services/request?service=vacuum-repair">
                  Request Service
                  <ArrowRight size={16} />
                </Link>
              </Button>
            </Pressable>
          </div>
          <div className="rounded-[1.15rem] bg-white p-6 ring-1 ring-teal-100">
            <h3 className="text-lg font-semibold text-slate-950">
              Have these ready
            </h3>
            <ul className="mt-5 space-y-4 text-sm leading-6 text-slate-600">
              {[
                "Service address",
                "Description of the issue",
                "Requested service date and time",
                "Machine information if available",
                "Photos or video of the system",
              ].map((item) => (
                <li key={item} className="flex gap-3">
                  <CheckCircle2
                    aria-hidden="true"
                    className="mt-0.5 shrink-0 text-primary"
                    size={18}
                  />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>
      </FadeIn>

      <FadeIn className="mx-auto max-w-360 px-4 py-18 sm:px-6 lg:px-8">
        <section className="relative min-h-88 overflow-hidden rounded-[1.35rem] bg-primary">
          <Image
            src={serviceVanImage}
            alt="Elite Central Vacuum service van outside a home"
            fill
            sizes="(min-width: 1024px) 1320px, 100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.72)_0%,rgba(0,0,0,0.42)_46%,rgba(0,0,0,0.12)_100%)]" />
          <div className="relative max-w-lg px-7 py-14 text-white md:px-16 md:py-20">
            <h2 className="text-4xl font-semibold tracking-[-0.05em] md:text-5xl">
              Need help with your vacuum system?
            </h2>
            <p className="mt-5 text-sm leading-7 text-white/80">
              Our concierge team is standing by to help you choose the right
              system or book a same-day repair appointment.
            </p>
            <Pressable className="mt-8">
              <Button asChild variant="outline" size="pill" className="bg-white">
                <Link href="/services/request?service=vacuum-repair">
                  Request Service Now
                </Link>
              </Button>
            </Pressable>
          </div>
        </section>
      </FadeIn>
    </main>
  );
}
