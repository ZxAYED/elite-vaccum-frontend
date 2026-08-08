import { ArrowRight, ShoppingBag, Wrench } from "lucide-react";
import Link from "next/link";

const cards = [
  {
    title: "Shop Products",
    description:
      "Browse central vacuum systems, accessories, and replacement parts built for dependable everyday performance.",
    href: "/store",
    cta: "Shop now",
    icon: ShoppingBag,
    surface:
      "border border-teal-100 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbfa_100%)] text-slate-900",
    accent: "bg-teal-50 text-teal-700",
    ctaClass: "text-teal-700 hover:text-teal-800",
  },
  {
    title: "Book a Service",
    description:
      "Schedule repair, maintenance, or professional installation with technicians who know central vacuum systems inside and out.",
    href: "/services",
    cta: "Request service",
    icon: Wrench,
    surface:
      "border border-teal-900/10 bg-[linear-gradient(135deg,#1c4f50_0%,#205b5c_100%)] text-white",
    accent: "bg-white/12 text-white",
    ctaClass: "text-white hover:text-teal-100",
  },
];

export function PrimaryJourneyCards() {
  return (
    <section className="py-8 md:py-12">
      <div className="mx-auto grid max-w-360 gap-6 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
        {cards.map(
          ({ title, description, href, cta, icon: Icon, surface, accent, ctaClass }) => (
            <article
              className={`relative overflow-hidden rounded-[2rem] p-7 shadow-[0_28px_60px_-46px_rgba(28,79,80,0.5)] md:p-8 ${surface}`}
              key={title}
            >
              <div className="absolute right-0 top-0 size-28 rounded-full border border-current/10 opacity-30" />
              <div className={`flex size-12 items-center justify-center rounded-2xl ${accent}`}>
                <Icon size={22} />
              </div>
              <h2 className="mt-8 text-2xl font-semibold">{title}</h2>
              <p className="mt-3 max-w-md text-sm leading-7 text-inherit/80">
                {description}
              </p>
              <Link
                className={`mt-8 inline-flex items-center gap-2 text-sm font-semibold transition-colors ${ctaClass}`}
                href={href}
              >
                {cta}
                <ArrowRight size={16} />
              </Link>
            </article>
          ),
        )}
      </div>
    </section>
  );
}
