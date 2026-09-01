"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { HoverCard, Pressable, motion } from "@/components/motion/Animated";

interface ContactInfoCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  actionLabel: string;
  href: string;
}

export default function ContactInfoCard({
  icon: Icon,
  title,
  description,
  actionLabel,
  href,
}: ContactInfoCardProps) {
  return (
    <HoverCard className="h-full" yOffset={-8}>
      <article className="group flex h-full flex-col rounded-3xl bg-white p-6 text-center shadow-[0_18px_50px_-42px_rgba(28,79,80,0.42)] ring-1 ring-teal-100 transition-shadow hover:shadow-[0_24px_60px_-40px_rgba(28,79,80,0.45)]">
        <motion.div
          className="mx-auto mb-5 flex size-12 items-center justify-center rounded-2xl bg-teal-50"
          whileHover={{ scale: 1.12, rotate: [0, -6, 6, 0] }}
          transition={{ type: "spring", stiffness: 400, damping: 18 }}
        >
          <Icon className="text-primary" size={24} />
        </motion.div>

        <h3 className="text-lg font-semibold text-primary">{title}</h3>
        <p className="mt-2 text-sm text-slate-500">{description}</p>

        <Pressable className="mt-6 w-full" scaleHover={1.02} scaleTap={0.96}>
          <Link
            href={href}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-[var(--brand-soft)] px-6 py-3 text-sm font-semibold text-primary transition-colors hover:bg-teal-100"
          >
            {actionLabel}
            <ArrowRight size={16} />
          </Link>
        </Pressable>
      </article>
    </HoverCard>
  );
}
