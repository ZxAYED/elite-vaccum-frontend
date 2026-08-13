"use client";

import { CalendarDays, MessageCircle, ShieldCheck, Zap } from "lucide-react";
import Link from "next/link";

import { FadeIn, Pressable } from "@/components/motion/Animated";
import { Button } from "@/components/ui/Button";

export default function ExperienceCard() {
  return (
    <section className="flex w-full justify-center px-4 py-20 md:py-24">
      <div className="w-full max-w-6xl">
        <FadeIn
          className="w-full rounded-[calc(var(--radius-card)+0.25rem)] border border-teal-800/30 bg-[#1f4d4f] px-6 py-14 text-white shadow-[0_36px_90px_-54px_rgba(14,39,40,0.8)] sm:px-10 lg:px-14"
          y={24}
          duration={0.65}
        >
        <div className="mb-6 flex justify-center">
          <span className="rounded-full border border-emerald-400/40 px-6 py-1 text-xs font-medium tracking-[0.22em] text-emerald-300">
            NO CONTRACT / CANCEL ANYTIME
          </span>
        </div>

        <div className="mb-6 flex justify-center">
          <div className="landing-icon-tile flex h-14 w-14 items-center justify-center bg-white text-[#1f4d4f]">
            <CalendarDays size={28} />
          </div>
        </div>

        <h2 className="text-center text-3xl font-extrabold tracking-[-0.04em] sm:text-5xl">
          Experience <span className="text-emerald-300">True</span> Clean.
        </h2>

        <p className="mx-auto mt-4 max-w-2xl text-center text-sm leading-7 text-emerald-100 sm:text-base">
          Elite Central Vacuum offers same-day diagnostics and hospital-grade
          maintenance. Get your system back to factory performance.
        </p>

        <div className="mb-8 mt-10 flex flex-col justify-center gap-4 sm:flex-row">
          <div className="flex flex-col gap-4">
            <Pressable>
              <Button
                asChild
                className="bg-white text-[#1f4d4f] shadow-none hover:bg-emerald-50"
                size="pill"
              >
                <Link href="/services">Schedule Service</Link>
              </Button>
            </Pressable>
            <span className="px-4 text-center text-xs text-emerald-200 sm:text-left">
              NEXT AVAILABLE: AUGUST 14, 2026
            </span>
          </div>
          <div className="flex flex-col gap-4">
            <Pressable>
              <Button
                asChild
                className="border-white/70 bg-transparent text-white hover:bg-white/10 hover:text-white"
                size="pill"
                variant="outline"
              >
                <Link href="/contact">
                  <MessageCircle size={18} />
                  Talk With Our Team
                </Link>
              </Button>
            </Pressable>
            <span className="px-4 text-center text-xs text-emerald-200 sm:text-left">
              EXPERT WALKTHROUGH GUIDE
            </span>
          </div>
        </div>

        <div className="my-8 border-t border-white/15" />

        <div className="flex flex-col justify-center gap-10 text-sm text-emerald-100 sm:flex-row">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-emerald-300" />
            <span>Professional Grade</span>
          </div>

          <div className="flex items-center gap-2">
            <Zap size={18} className="text-emerald-300" />
            <span>Instant Diagnostic</span>
          </div>
        </div>
        </FadeIn>
      </div>
    </section>
  );
}
