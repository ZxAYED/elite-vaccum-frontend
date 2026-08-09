import {
  Code2,
  CircleUser,
  Rocket,
  ShieldCheck,
  Star,
  UsersRound,
} from "lucide-react";
import Image from "next/image";

import {
  FadeIn,
  StaggerGroup,
  StaggerItem,
} from "@/components/motion/Animated";

const stats = [
  { value: "4.9/5", label: "Avg. Rating", icon: Star },
  { value: "8,200", label: "Active Clients", icon: CircleUser },
];

const team = [
  {
    name: "Zayed Iqbal",
    role: "Full Stack Developer",
    img: "/landing/about/team/zayed.png",
    focus:
      "Product architecture, frontend systems, and backend workflow design.",
  },
  {
    name: "Humayun Kabir",
    role: "Full Stack Developer",
    img: "/landing/about/team/humayun.png",
    focus:
      "Interface engineering, dashboard flows, and production-ready UI polish.",
  },
];

const badges = [
  { icon: Code2, index: 1, text: "Full Stack Build" },
  { icon: ShieldCheck, index: 2, text: "Secure UX Flow" },
  { icon: UsersRound, index: 3, text: "Owner Led" },
  { icon: Rocket, index: 4, text: "Launch Ready" },
];

export default function EliteSection() {
  return (
    <section className="space-y-24 bg-[#F9F9F9]">
      {/* Leadership */}
      <div className="px-4">
        <div className="relative mx-auto max-w-[1400px] overflow-hidden rounded-[2rem] bg-[radial-gradient(circle_at_top_left,rgba(0,131,126,0.16),transparent_34%),linear-gradient(135deg,#ffffff_0%,#f0faf8_48%,#ffffff_100%)] px-5 py-12 ring-1 ring-teal-100 md:px-10 lg:px-14">
          <div className="pointer-events-none absolute right-8 top-8 size-28 rounded-full border border-teal-200/70" />
          <div className="pointer-events-none absolute -bottom-16 -left-14 size-44 rounded-full bg-teal-100/50 blur-2xl" />

          <FadeIn
            className="relative mx-auto max-w-3xl text-center"
            once={false}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-700">
              Website Owners
            </p>
            <h3 className="mt-3 text-3xl font-bold text-primary md:text-5xl">
              Designed & developed by the people behind the product.
            </h3>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-600">
              A focused two-person full-stack team shaping the experience,
              building the interface, and keeping the platform practical.
            </p>
          </FadeIn>

          <StaggerGroup
            className="relative mt-10 grid gap-6 lg:grid-cols-2"
            delay={0.08}
            once={false}
          >
            {team.map((member) => (
              <StaggerItem key={member.name}>
                <article className="group grid gap-6 rounded-[1.75rem] bg-white/88 p-5 text-left  ring-1 ring-teal-100  md:grid-cols-[11rem_1fr] md:items-center md:p-6">
                  <div className="relative mx-auto size-44 overflow-hidden rounded-[1.35rem] bg-[var(--brand-soft)]  ring-1 ring-teal-100 md:mx-0">
                    <Image
                      src={member.img}
                      alt={member.name}
                      fill
                      sizes="176px"
                      className="object-cover"
                    />
                  </div>

                  <div>
                    <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-teal-800 ring-1 ring-teal-100">
                      <Code2 className="size-3.5" aria-hidden="true" />
                      Owner Builder
                    </div>
                    <h4 className="text-2xl font-bold text-primary">
                      {member.name}
                    </h4>
                    <p className="mt-1 text-sm font-semibold text-teal-700">
                      {member.role}
                    </p>
                    <p className="mt-4 text-sm leading-7 text-slate-600">
                      {member.focus}
                    </p>
                  </div>
                </article>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </div>
      </div>

      {/* Trust badges */}
      <div className="bg-muted py-10 px-8 md:px-0">
        <StaggerGroup
          className="max-w-360 mx-auto grid grid-cols-1 md:grid-cols-4 gap-6"
          delay={0.06}
          once={false}
        >
          {badges.map((badge) => {
            const Icon = badge.icon;
            return (
              <StaggerItem key={badge.text}>
                <div className="bg-white flex items-center justify-around md:justify-center gap-4 rounded-lg  py-4 md:py-6 text-center  text-xl font-medium">
                  <div className="bg-[#E8EDEE] p-2 rounded-md">
                    <Icon className="w-8 h-8 text-primary" />
                  </div>
                  {badge.text}
                </div>
              </StaggerItem>
            );
          })}
        </StaggerGroup>
      </div>
    </section>
  );
}
