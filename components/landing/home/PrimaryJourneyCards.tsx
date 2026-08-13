import { ArrowRight, Wrench } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { FadeIn, Pressable, StaggerGroup, StaggerItem } from "@/components/motion/Animated";
import shopIcon from "@/public/landing/home/shopicon.png";

const cards = [
  {
    title: "Shop Products",
    description:
      "Browse central vacuum systems, accessories, and replacement parts built for dependable everyday performance.",
    href: "/store",
    cta: "Shop now",
    iconType: "image" as const,
    surface: "landing-card landing-card-soft text-slate-900",
    accent: "bg-teal-50",
    ctaClass: "text-teal-700 hover:text-teal-800",
  },
  {
    title: "Book a Service",
    description:
      "Schedule repair, maintenance, or professional installation with technicians who know central vacuum systems inside and out.",
    href: "/services",
    cta: "Request service",
    iconType: "service" as const,
    surface:
      "rounded-[var(--radius-card)] border border-teal-900/10 bg-[linear-gradient(135deg,#1c4f50_0%,#205b5c_100%)] text-white shadow-[0_28px_60px_-46px_rgba(28,79,80,0.5)]",
    accent: "bg-white/12",
    ctaClass: "text-white hover:text-teal-100",
  },
];

export function PrimaryJourneyCards() {
  return (
    <section className="py-8 md:py-20 bg-white">
      <FadeIn className="mx-auto max-w-360 px-4 sm:px-6 lg:px-8" y={24} duration={0.65}>
        <StaggerGroup className="grid auto-rows-fr gap-6 lg:grid-cols-2" delay={0.05} once>
          {cards.map(
            ({
              title,
              description,
              href,
              cta,
              iconType,
              surface,
              accent,
              ctaClass,
            }) => (
              <StaggerItem key={title}>
                <article
                  className={`relative flex h-full flex-col overflow-hidden p-7 md:p-8 ${surface}`}
                >
                  <div className="absolute right-0 top-0 size-28 rounded-full border border-current/10 opacity-30" />
                  <div
                    className={`landing-icon-tile flex size-12 items-center justify-center ${accent}`}
                  >
                    {iconType === "image" ? (
                      <Image
                        src={shopIcon}
                        alt=""
                        aria-hidden="true"
                        className="size-10"
                      />
                    ) : (
                      <Wrench size={20} />
                    )}
                  </div>
                  <h2 className="mt-8 min-h-[3.5rem] text-2xl font-semibold">
                    {title}
                  </h2>
                  <p className="mt-3 flex-1 max-w-md text-sm leading-7 text-inherit/80">
                    {description}
                  </p>
                  <Pressable>
                    <Link
                      className={`mt-8 inline-flex w-fit items-center gap-2 text-sm font-semibold transition-colors ${ctaClass}`}
                      href={href}
                    >
                      {cta}
                      <ArrowRight size={16} />
                    </Link>
                  </Pressable>
                </article>
              </StaggerItem>
            ),
          )}
        </StaggerGroup>
      </FadeIn>
    </section>
  );
}
