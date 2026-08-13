import { Button } from "@/components/ui/Button";
import {
  FadeIn,
  StaggerGroup,
  StaggerItem,
} from "@/components/motion/Animated";
import {
  Headphones,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  Target,
  Wrench,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export const metadata = {
  title: "About Elite - Central Vacuum Services",
  description:
    "Learn about Elite Central Vacuum Services, our mission, values, and commitment to excellence.",
};

export default function About() {
  const trustMetrics = [
    { value: "20+", label: "Years of Experience" },
    { value: "100%", label: "Service Guarantee" },
  ];

  const values = [
    {
      icon: Sparkles,
      eyebrow: "Vision",
      title: "Our Vision",
      body: "Make premium central vacuum ownership simpler, more reliable, and easier to support across the full life of the system.",
    },
    {
      icon: Target,
      eyebrow: "Mission",
      title: "Our Mission",
      body: "Deliver dependable equipment, professional service, clear communication, and long-term support customers can count on.",
    },
  ];

  const whyElite = [
    {
      icon: Wrench,
      title: "Expert Service",
      body: "Experienced technicians handle installation, repair, maintenance, and troubleshooting with practical attention to detail.",
    },
    {
      icon: ShieldCheck,
      title: "Reliable Systems",
      body: "We focus on equipment and service decisions that support cleaner, quieter, long-lasting home performance.",
    },
    {
      icon: MessageSquareText,
      title: "Clear Communication",
      body: "From first request to follow-up, the process stays straightforward, transparent, and easier to manage.",
    },
    {
      icon: Headphones,
      title: "Complete Support",
      body: "Customers can rely on Elite for ongoing maintenance, upgrades, and service guidance after installation.",
    },
  ];

  const owners = [
    {
      name: "Zayed Iqbal",
      role: "Full Stack Developer",
      image: "/landing/about/team/zayed.png",
      description:
        "Builds production-ready full stack systems across NestJS, Next.js, MongoDB, PostgreSQL, and Redis with a focus on clean architecture and scalable workflows.",
    },
    {
      name: "Humayun Kabir",
      role: "Full Stack Developer",
      image: "/landing/about/team/humayun.png",
      description:
        "Develops end-to-end product experiences with NestJS, Next.js, MongoDB, PostgreSQL, and Redis, balancing reliable backend structure with polished user-facing interfaces.",
    },
  ];

  return (
    <main className="bg-white">
      <section className="relative overflow-hidden border-b border-slate-200 bg-slate-950">
        <Image
          src="/landing/service/service.png"
          alt="Elite service vehicle parked outside a residential property"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-slate-950/55" />
        <div className="relative mx-auto flex min-h-[30rem] max-w-7xl items-end px-4 py-16 sm:px-6 md:min-h-[34rem] md:py-20 lg:px-8">
          <FadeIn className="max-w-3xl text-white" y={24} duration={0.65}>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#BCFF56]">
              Our Expertise
            </p>
            <h1 className="mt-5 text-4xl font-semibold tracking-[-0.05em] sm:text-5xl lg:text-6xl">
              About Elite Central Vacuum
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-100 sm:text-lg">
              Reliable central vacuum solutions, professional service, and a
              smoother experience from installation to maintenance.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="pill">
                <Link href="/services">Request Service</Link>
              </Button>
              <Button
                asChild
                size="pill"
                variant="outline"
                className="border-white/80 bg-transparent text-white hover:bg-white hover:text-black"
              >
                <Link href="/contact">Contact Us</Link>
              </Button>
            </div>
          </FadeIn>
        </div>
      </section>

      <section className="py-14 md:py-20 lg:py-24">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[1.02fr_0.98fr] lg:gap-14 lg:px-8">
          <FadeIn className="max-w-2xl" y={24} duration={0.65}>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-700">
              Brand Story
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-primary sm:text-4xl lg:text-5xl">
              A better standard for central vacuum service.
            </h2>
            <p className="mt-6 text-base leading-8 text-slate-600 sm:text-lg">
              Elite brings together experienced service professionals, quality
              equipment, and a more organized customer experience so central
              vacuum installation, repair, and maintenance are easier to manage.
            </p>
            <p className="mt-5 text-base leading-8 text-slate-600 sm:text-lg">
              The goal is straightforward: dependable system performance,
              cleaner communication, and service support that feels consistent
              from the first request through long-term care.
            </p>

            <div className="mt-10 grid gap-6 border-t border-slate-200 pt-6 sm:grid-cols-2 sm:gap-10">
              {trustMetrics.map((metric) => (
                <div key={metric.label}>
                  <p className="text-3xl font-semibold tracking-[-0.05em] text-primary sm:text-4xl">
                    {metric.value}
                  </p>
                  <p className="mt-2 text-sm font-medium uppercase tracking-[0.2em] text-slate-500">
                    {metric.label}
                  </p>
                </div>
              ))}
            </div>
          </FadeIn>

          <FadeIn y={24} duration={0.65}>
            <div className="">
              <div className="relative aspect-[5/4] overflow-hidden">
                <Image
                  src="/landing/about/about.png"
                  alt="Elite technician providing central vacuum service at a home"
                  fill
                  sizes="(max-width: 1024px) 100vw, 48vw"
                  className="object-contain"
                />
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      <section className="bg-[#F5FAF9] py-14 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeIn y={24} duration={0.65}>
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-700">
                Direction
              </p>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-primary sm:text-4xl">
                Built around dependable systems and long-term support.
              </h2>
            </div>
          </FadeIn>

          <StaggerGroup
            className="mt-10 grid gap-5 lg:grid-cols-2"
            delay={0.05}
            once
            amount={0.15}
          >
            {values.map((item) => {
              const Icon = item.icon;

              return (
                <StaggerItem key={item.title} y={24} duration={0.65}>
                  <article className="flex h-full flex-col rounded-[24px] border border-teal-100 bg-white p-7">
                    <div className="flex size-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
                      <Icon size={22} />
                    </div>
                    <p className="mt-6 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                      {item.eyebrow}
                    </p>
                    <h3 className="mt-3 text-2xl font-semibold text-primary">
                      {item.title}
                    </h3>
                    <p className="mt-4 text-base leading-7 text-slate-600">
                      {item.body}
                    </p>
                  </article>
                </StaggerItem>
              );
            })}
          </StaggerGroup>
        </div>
      </section>

      <section className="py-14 md:py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeIn className="max-w-2xl" y={24} duration={0.65}>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-700">
              Why Elite
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-primary sm:text-4xl">
              Why homeowners choose Elite
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              The experience is designed to feel reliable from the first call
              through long-term system support.
            </p>
          </FadeIn>

          <StaggerGroup
            className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4"
            delay={0.05}
            once
            amount={0.15}
          >
            {whyElite.map((item) => {
              const Icon = item.icon;

              return (
                <StaggerItem key={item.title} y={24} duration={0.65}>
                  <article className="h-full rounded-[22px] border border-slate-200 bg-white p-6">
                    <div className="flex size-11 items-center justify-center rounded-2xl bg-[#E8F3F2] text-teal-700">
                      <Icon size={20} />
                    </div>
                    <h3 className="mt-5 text-xl font-semibold text-primary">
                      {item.title}
                    </h3>
                    <p className="mt-3 text-sm leading-7 text-slate-600">
                      {item.body}
                    </p>
                  </article>
                </StaggerItem>
              );
            })}
          </StaggerGroup>
        </div>
      </section>

      <section className="bg-[#F5FAF9] py-14 md:py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeIn
            className="mx-auto max-w-3xl text-center"
            y={24}
            duration={0.65}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-700">
              Built by the Team
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-primary sm:text-4xl">
              Designed and developed by the team behind the platform.
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              The platform experience is shaped by the same people responsible
              for its architecture, workflows, and interface quality.
            </p>
          </FadeIn>

          <StaggerGroup
            className="mt-10 grid gap-6 lg:grid-cols-2"
            delay={0.05}
            once
            amount={0.15}
          >
            {owners.map((owner) => (
              <StaggerItem key={owner.name} y={24} duration={0.65}>
                <article className="grid h-full gap-6 rounded-[28px] border border-teal-100 bg-white p-6 md:grid-cols-[12rem_1fr] md:items-center md:p-7">
                  <div className="relative mx-auto aspect-square w-full max-w-[12rem] overflow-hidden rounded-[24px] bg-[#EAF3F2]">
                    <Image
                      src={owner.image}
                      alt={owner.name}
                      fill
                      sizes="192px"
                      className="object-cover"
                    />
                  </div>

                  <div className="min-w-0">
                    <span className="inline-flex rounded-full bg-teal-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-teal-800">
                      Owner / Builder
                    </span>
                    <h3 className="mt-5 text-2xl font-semibold text-primary">
                      {owner.name}
                    </h3>
                    <p className="mt-1 text-sm font-semibold text-teal-700">
                      {owner.role}
                    </p>
                    <p className="mt-4 text-sm leading-7 text-slate-600">
                      {owner.description}
                    </p>
                  </div>
                </article>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </div>
      </section>

      <section className="py-14 md:py-20 lg:py-24">
        <div className="mx-auto rounded-[32px]  max-w-5xl bg-primary px-4 sm:px-6 lg:px-8">
          <FadeIn
            className=" px-6 py-10 text-center sm:px-10 sm:py-14"
            y={24}
            duration={0.65}
          >
            <h2 className="text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl">
              Ready to take care of your central vacuum system?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-white sm:text-lg">
              Request service, schedule an installation, or speak with the Elite
              team about your system.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button className="bg-white text-primary" asChild size="pill">
                <Link href="/services">Request Service</Link>
              </Button>
              <Button asChild size="pill" variant="outline">
                <Link href="/contact">Contact Us</Link>
              </Button>
            </div>
          </FadeIn>
        </div>
      </section>
    </main>
  );
}
