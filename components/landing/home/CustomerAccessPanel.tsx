import { ArrowRight, CalendarRange, ShoppingBag, UserRound } from "lucide-react";
import Link from "next/link";

const items = [
  {
    title: "Manage service requests",
    description:
      "Existing customers can review quotes, check appointment status, and track completed work from one dashboard.",
    href: "/auth/login",
    icon: UserRound,
    cta: "Open customer portal",
  },
  {
    title: "Browse the parts store",
    description:
      "Shop accessories, replacement parts, and upgrade kits without leaving the public site.",
    href: "/store",
    icon: ShoppingBag,
    cta: "Visit the store",
  },
  {
    title: "Start with service discovery",
    description:
      "Learn about installation, repairs, and maintenance first, then move into the dashboard for active jobs.",
    href: "/services",
    icon: CalendarRange,
    cta: "Explore services",
  },
];

export function CustomerAccessPanel() {
  return (
    <section className="bg-[#F4F8F8] py-16 md:py-20 lg:py-24">
      <div className="mx-auto max-w-360 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.26em] text-teal-700">
            Customer Experience
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-[-0.03em] text-primary md:text-4xl">
            Discovery stays public. Active service and account management stay protected.
          </h2>
          <p className="mt-4 text-base leading-7 text-slate-600">
            The public site remains focused on education and shopping, while authenticated customers handle quotes, appointments, orders, and payments inside the dashboard.
          </p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {items.map(({ title, description, href, icon: Icon, cta }) => (
            <article
              className="rounded-[2rem] border border-teal-100 bg-white p-6 shadow-[0_24px_52px_-46px_rgba(28,79,80,0.45)]"
              key={title}
            >
              <div className="flex size-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
                <Icon size={22} />
              </div>
              <h3 className="mt-5 text-xl font-semibold text-slate-900">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
              <Link
                className="mt-6 inline-flex items-center gap-2 font-semibold text-teal-700 transition hover:text-teal-800"
                href={href}
              >
                {cta}
                <ArrowRight size={16} />
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
