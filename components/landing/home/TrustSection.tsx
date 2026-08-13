import {
  BadgeCheck,
  BadgeDollarSign,
  Clock3,
  ShieldCheck,
} from "lucide-react";

import { FadeIn, StaggerGroup, StaggerItem } from "@/components/motion/Animated";

const benefits = [
  {
    title: "Expert Technicians",
    description: "Factory-minded specialists with system-specific experience.",
    icon: ShieldCheck,
  },
  {
    title: "Reliable Service",
    description: "Clear communication, punctual arrivals, and careful follow-through.",
    icon: BadgeCheck,
  },
  {
    title: "Transparent Pricing",
    description: "Straightforward scopes, clear estimates, and no surprise add-ons.",
    icon: BadgeDollarSign,
  },
  {
    title: "Fast Response",
    description: "Timely scheduling for maintenance, repairs, and urgent system issues.",
    icon: Clock3,
  },
];

export function TrustSection() {
  return (
    <section className="py-16 md:py-20">
      <div className="mx-auto max-w-360 px-4 sm:px-6 lg:px-8">
        <FadeIn className="overflow-hidden rounded-[calc(var(--radius-card)+0.25rem)] border border-teal-100 bg-[#F3F7F6] px-5 py-6 md:px-8 md:py-8 lg:px-10 lg:py-10" y={24} duration={0.65}>
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:items-center">
            <StaggerGroup className="grid auto-rows-fr gap-4 sm:grid-cols-2" delay={0.05} once>
              {benefits.map(({ title, description, icon: Icon }) => (
                <StaggerItem key={title}>
                  <article className="landing-card flex h-full flex-col p-5 shadow-none">
                    <div className="landing-icon-tile flex size-11 items-center justify-center bg-teal-50 text-teal-700">
                      <Icon size={20} />
                    </div>
                    <h3 className="mt-4 min-h-[3rem] text-lg font-semibold text-slate-900">
                      {title}
                    </h3>
                    <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">{description}</p>
                  </article>
                </StaggerItem>
              ))}
            </StaggerGroup>

            <FadeIn className="max-w-xl lg:pl-4" x={24} y={0} duration={0.65}>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-700">
                Why Elite
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-[-0.03em] text-primary md:text-4xl">
                We define the standard of home air infrastructure.
              </h2>
              <p className="mt-4 text-base leading-7 text-slate-600">
                Elite Central Vacuum combines product guidance with precision
                service so every installation, repair, and maintenance visit
                feels considered, quiet, and built to last.
              </p>
              <ul className="mt-6 flex flex-col gap-3 text-sm font-medium text-primary">
                <li className="flex items-center gap-3">
                  <BadgeCheck size={18} className="text-teal-700" />
                  30+ years of engineering excellence
                </li>
                <li className="flex items-center gap-3">
                  <BadgeCheck size={18} className="text-teal-700" />
                  Licensed and insured professionals
                </li>
              </ul>
            </FadeIn>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
