"use client";

import type { ElementType } from "react";
import { useMemo } from "react";
import {
  Activity,
  ArrowRight,
  Compass,
  Home as HomeIcon,
  HousePlus,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Upload,
  Wrench,
} from "lucide-react";
import Link from "next/link";

import {
  FadeIn,
  HoverCard,
  Pressable,
  StaggerGroup,
  StaggerItem,
} from "@/components/motion/Animated";
import {
  useGetAllServicesListQuery,
  useGetServicesQuery,
} from "@/redux/api/servicesApi";

const iconByKey: Record<string, ElementType> = {
  "home-plus": HousePlus,
  home: HomeIcon,
  wrench: Wrench,
  activity: Activity,
  shield: ShieldCheck,
  "shield-check": ShieldCheck,
  shieldcheck: ShieldCheck,
  sparkles: Sparkles,
  sliders: SlidersHorizontal,
  upload: Upload,
  compass: Compass,
};

function getServiceIcon(iconKey?: string): ElementType {
  if (!iconKey) return Wrench;
  const key = iconKey.toLowerCase().replace(/[_\s]/g, "-");
  return iconByKey[key] || iconByKey[iconKey.toLowerCase()] || Wrench;
}

const defaultServices = [
  {
    title: "Vacuum Repair",
    description:
      "Fast diagnostics and expert fixes for low suction, hose issues, inlet problems, and motor wear.",
    icon: Wrench,
    href: "/services/request?service=vacuum-repair",
  },
  {
    title: "Maintenance",
    description:
      "Preventive annual check-ups, filter cleaning, and performance tuning to keep your system running quietly.",
    icon: ShieldCheck,
    href: "/services/request?service=maintenance",
  },
  {
    title: "Installation",
    description:
      "Thoughtful new-system planning and retrofit support for renovations, luxury homes, and builder projects.",
    icon: HousePlus,
    href: "/services/request?service=new-system",
  },
];

export function EngineeredSupportSection() {
  const { data: apiServicesList } = useGetAllServicesListQuery({ status: "ACTIVE" });
  const { data: apiServicesGrouped } = useGetServicesQuery();

  const dynamicServices = useMemo(() => {
    const rawServices =
      apiServicesList && apiServicesList.length > 0
        ? apiServicesList
        : apiServicesGrouped && apiServicesGrouped.length > 0
          ? apiServicesGrouped
          : null;

    if (!rawServices || rawServices.length === 0) return null;

    const active = rawServices.filter(
      (s) => !s.status || s.status.toUpperCase() === "ACTIVE",
    );

    return active;
  }, [apiServicesList, apiServicesGrouped]);

  const totalCount = dynamicServices ? dynamicServices.length : 12;

  const displayServices = useMemo(() => {
    if (dynamicServices && dynamicServices.length >= 3) {
      return dynamicServices.slice(0, 3).map((service) => ({
        title: service.title,
        description: service.summary || service.description,
        icon: getServiceIcon(service.iconKey),
        href: `/services/request?service=${service.slug}`,
      }));
    }
    return defaultServices;
  }, [dynamicServices]);

  return (
    <section className="py-12 md:py-18">
      <div className="mx-auto max-w-360 px-4 sm:px-6 lg:px-8">
        <FadeIn className="mx-auto max-w-2xl text-center" y={24} duration={0.65}>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-700">
            Engineered Support
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-[-0.03em] text-primary md:text-4xl">
            Service expertise built around central vacuum ownership
          </h2>
          <p className="mt-4 text-base leading-7 text-slate-600">
            Our technicians support the full lifecycle of your system, from first
            install to precise maintenance and long-term reliability.
          </p>
        </FadeIn>

        <StaggerGroup className="mt-8 grid auto-rows-fr gap-4 sm:mt-10 sm:gap-6 lg:grid-cols-3" delay={0.05} once>
          {displayServices.map(({ title, description, icon: Icon, href }) => (
            <StaggerItem key={title}>
              <HoverCard className="h-full" yOffset={-6}>
                <article className="landing-card flex h-full flex-col p-5 sm:p-6 lg:p-7 transition-shadow hover:shadow-xl">
                  <div className="landing-icon-tile flex size-12 items-center justify-center bg-teal-50 text-teal-700">
                    <Icon size={22} />
                  </div>
                  <h3 className="mt-6 text-2xl font-semibold text-slate-900 sm:min-h-[3.5rem]">
                    {title}
                  </h3>
                  <p className="mt-3 flex-1 text-sm leading-7 text-slate-600">{description}</p>
                  <Pressable className="mt-8 w-fit" scaleHover={1.04} scaleTap={0.96}>
                    <Link
                      className="inline-flex items-center gap-2 text-sm font-semibold text-teal-700 transition hover:text-teal-800"
                      href={href}
                    >
                      Book Service
                      <ArrowRight size={16} />
                    </Link>
                  </Pressable>
                </article>
              </HoverCard>
            </StaggerItem>
          ))}
        </StaggerGroup>

        <div className="mt-10 text-center">
          <Pressable scaleHover={1.03} scaleTap={0.97} className="inline-block">
            <Link
              href="/services"
              className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50/50 px-6 py-3 text-sm font-semibold text-teal-800 transition hover:bg-teal-100/70"
            >
              <span>Explore all {totalCount} services & installations</span>
              <ArrowRight size={16} />
            </Link>
          </Pressable>
        </div>
      </div>
    </section>
  );
}
