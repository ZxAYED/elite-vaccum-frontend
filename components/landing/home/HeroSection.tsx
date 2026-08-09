import { ArrowRight, House, PackageCheck, Wrench } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { FadeIn, Pressable, StaggerGroup, StaggerItem } from "@/components/motion/Animated";
import { Button } from "@/components/ui/Button";
import heroVacuum from "@/public/landing/home/vaccum.png";

const highlights = [
  {
    icon: PackageCheck,
    label: "Premium systems, accessories, and replacement parts",
  },
  {
    icon: Wrench,
    label: "Professional repair, maintenance, and installation support",
  },
  {
    icon: House,
    label: "Designed for clean-home infrastructure that lasts",
  },
];

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-white">
      <div className="absolute inset-x-0 top-0 h-px bg-teal-100" />
      <div className="mx-auto grid max-w-360 items-center gap-12 px-4 pb-16 pt-10 sm:px-6 lg:gap-14 lg:pb-[4.5rem] lg:pt-28 xl:px-8 xl:pb-20 2xl:grid-cols-[minmax(0,1fr)_minmax(420px,0.92fr)]">
        <FadeIn className="max-w-2xl">
          <h1 className="mt-2 max-w-[10.2ch] text-[clamp(2.45rem,9.2vw,4.2rem)] font-bold leading-[0.94] tracking-[-0.05em] text-primary sm:max-w-[12ch] 2xl:max-w-none 2xl:text-[4.3rem]">
            Powerful Central Vacuum{" "}
            <span className="text-hero-gradient">Solutions for</span> Modern
            Homes
          </h1>
          <p className="mt-6 max-w-xl text-base leading-8 text-slate-600 sm:text-lg">
            Shop high-performance systems or request expert repair services with
            ease. Experience the invisible infrastructure of a truly clean
            environment.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Pressable>
              <Button asChild size="pill">
                <Link href="/store">
                  Shop Products
                  <ArrowRight size={16} />
                </Link>
              </Button>
            </Pressable>
            <Pressable>
              <Button asChild size="pill" variant="outline">
                <Link href="/services">Request Service</Link>
              </Button>
            </Pressable>
          </div>

          <StaggerGroup className="mt-8 grid auto-rows-fr gap-3 sm:grid-cols-3" delay={0.08}>
            {highlights.map(({ icon: Icon, label }) => (
              <StaggerItem key={label}>
                <article className="landing-card flex h-full flex-col p-4 backdrop-blur">
                  <div className="landing-icon-tile flex size-10 items-center justify-center bg-teal-50 text-teal-700">
                    <Icon size={18} />
                  </div>
                  <p className="mt-4 text-sm leading-7 text-slate-600">{label}</p>
                </article>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </FadeIn>

        <FadeIn
          className="relative mx-auto w-full max-w-2xl 2xl:max-w-[34rem]"
          delay={0.1}
        >
          <div className="absolute inset-x-12 bottom-6 h-16 rounded-full bg-teal-200/50 blur-3xl" />
          <div className="relative overflow-hidden px-4 py-4 sm:px-6 sm:py-6">
            <Image
              src={heroVacuum}
              alt="Elite central vacuum unit with hose and floor attachment"
              priority
              sizes="(max-width: 1279px) 100vw, 42vw"
              className="relative mx-auto h-auto w-full max-w-[34rem] object-contain"
            />
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
