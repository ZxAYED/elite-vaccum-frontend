import { ArrowRight } from "lucide-react";
import Link from "next/link";

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
    <div className="bg-[white] border border-border rounded-2xl p-8 text-center hover:shadow-lg transition-all">
      {/* Icon */}
      <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-[#E8EDEE]">
        <Icon className="text-primary" size={32} />
      </div>

      {/* Content */}
      <h3 className="text-lg font-bold mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground mb-8">{description}</p>

      {/* Button */}
      <Link
        href={href}
        className="inline-flex items-center justify-center gap-2 w-full rounded-full bg-[#E8EDEE] px-6 py-3 text-sm font-semibold text-primary hover:bg-neutral-light/80 transition"
      >
        {actionLabel}
        <ArrowRight size={16} />
      </Link>
    </div>
  );
}
