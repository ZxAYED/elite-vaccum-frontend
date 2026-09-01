"use client";

import { ArrowRight, HousePlus, ShieldCheck, Wrench } from "lucide-react";
import Link from "next/link";

import {
  FadeIn,
  HoverCard,
  Pressable,
  StaggerGroup,
  StaggerItem,
} from "@/components/motion/Animated";

const services = [
  {
    title: "Vacuum Repair",
    description:
      "Fast diagnostics and expert fixes for low suction, hose issues, inlet problems, and motor wear.",
    icon: Wrench,
  },
  {
    title: "Maintenance",
    description:
      "Preventive annual check-ups, filter cleaning, and performance tuning to keep your system running quietly.",
    icon: ShieldCheck,
  },
  {
    title: "Installation",
    description:
      "Thoughtful new-system planning and retrofit support for renovations, luxury homes, and builder projects.",
    icon: HousePlus,
  },
];

export function EngineeredSupportSection() {
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
          {services.map(({ title, description, icon: Icon }) => (
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
                      href="/services"
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
      </div>
    </section>
  );
}
