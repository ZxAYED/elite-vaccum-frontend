import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { Pressable } from "@/components/motion/Animated";

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
    <div className="group flex h-full flex-col rounded-3xl bg-white p-6 text-center shadow-[0_18px_50px_-42px_rgba(28,79,80,0.42)] ring-1 ring-teal-100 transition-[transform,box-shadow] duration-200 hover:-translate-y-1 hover:shadow-[0_24px_60px_-44px_rgba(28,79,80,0.55)]">
      <div className="mx-auto mb-5 flex size-12 items-center justify-center rounded-2xl bg-teal-50">
        <Icon className="text-primary" size={24} />
      </div>

      <h3 className="text-lg font-semibold text-primary">{title}</h3>
      <p className="mt-2 text-sm text-slate-500">{description}</p>

      <Pressable className="mt-6 w-full">
        <Link
          href={href}
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-[var(--brand-soft)] px-6 py-3 text-sm font-semibold text-primary transition hover:bg-teal-100"
        >
          {actionLabel}
          <ArrowRight size={16} />
        </Link>
      </Pressable>
    </div>
  );
}
