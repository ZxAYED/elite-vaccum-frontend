import {
  ArrowRight,
  ClipboardList,
  PackageOpen,
  SearchCheck,
} from "lucide-react";
import Link from "next/link";

import { FadeIn, StaggerGroup, StaggerItem } from "@/components/motion/Animated";

const items = [
  {
    title: "Manage service requests",
    description:
      "Existing customers can review quotes, check appointment status, and track completed work from one dashboard.",
    href: "/auth/login",
    icon: ClipboardList,
    cta: "Open customer portal",
  },
  {
    title: "Browse the parts store",
    description:
      "Shop accessories, replacement parts, and upgrade kits without leaving the public site.",
    href: "/store",
    icon: PackageOpen,
    cta: "Visit the store",
  },
  {
    title: "Start with service discovery",
    description:
      "Learn about installation, repairs, and maintenance first, then move into the dashboard for active jobs.",
    href: "/services",
    icon: SearchCheck,
    cta: "Explore services",
  },
];

export function CustomerAccessPanel() {
  return (
    <section className="bg-[#F4F8F8] py-16 md:py-20 lg:py-24">
      <div className="mx-auto max-w-360 px-4 sm:px-6 lg:px-8">
        <FadeIn className="max-w-2xl" y={24} duration={0.65}>
          <p className="text-xs font-semibold uppercase tracking-[0.26em] text-teal-700">
            Customer Experience
          </p>
          <h2 className="mt-3 max-w-4xl text-3xl font-bold tracking-[-0.03em] text-primary md:text-4xl">
            Discovery stays public. Active service and account management stay protected.
          </h2>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
            The public site remains focused on education and shopping, while authenticated customers handle quotes, appointments, orders, and payments inside the dashboard.
          </p>
        </FadeIn>

        <StaggerGroup className="mt-10 grid auto-rows-fr gap-6 lg:grid-cols-3" delay={0.05} once>
          {items.map(({ title, description, href, icon: Icon, cta }) => (
            <StaggerItem key={title}>
              <article className="landing-card flex h-full flex-col p-6">
                <div className="landing-icon-tile flex size-12 items-center justify-center bg-teal-50 text-teal-700">
                  <Icon size={22} />
                </div>
                <h3 className="mt-5 min-h-[3.75rem] text-[1.9rem] leading-tight font-semibold text-slate-900 lg:text-[1.75rem]">
                  {title}
                </h3>
                <p className="mt-3 flex-1 text-sm leading-7 text-slate-600">{description}</p>
                <Link
                  className="mt-6 inline-flex items-center gap-2 font-semibold text-teal-700 transition hover:text-teal-800"
                  href={href}
                >
                  {cta}
                  <ArrowRight size={16} />
                </Link>
              </article>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </div>
    </section>
  );
}
