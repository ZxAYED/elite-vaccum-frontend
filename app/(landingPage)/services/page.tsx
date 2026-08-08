import Link from "next/link";
import { ArrowRight, ShieldCheck, ShoppingBag } from "lucide-react";

import ServiceBanner from "@/components/landing/common/ServiceBanner";
import ServiceOptions from "@/components/landing/service/ServiceOptions";
import StoreSection from "@/components/landing/service/StoreSection";

export const metadata = {
  title: "Services - Elite Central Vacuum",
  description:
    "Professional central vacuum repair, installation, maintenance, and parts for residential homes.",
};

export default function Services() {
  return (
    <main>
      <ServiceBanner />
      <ServiceOptions />

      <section className="bg-white py-8 md:py-12">
        <div className="max-w-360 mx-auto px-4">
          <div className="rounded-3xl border border-teal-100 bg-[#F4F8F8] p-6 md:flex md:items-center md:justify-between md:gap-8 md:p-8">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-teal-800">
                <ShieldCheck size={16} />
                Customer dashboard workflow
              </div>
              <h2 className="mt-4 text-2xl font-bold text-primary md:text-3xl">
                Quotes, scheduling, payments, and live service status happen after sign in.
              </h2>
              <p className="mt-3 text-sm leading-6 text-gray-600 md:text-base">
                Keep browsing services here, then use the authenticated customer portal for approvals, appointments, and account management.
              </p>
            </div>

            <div className="mt-6 flex flex-col gap-3 md:mt-0 md:min-w-[260px]">
              <Link
                className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 font-semibold text-white transition hover:opacity-90"
                href="/auth/login"
              >
                Open customer portal
                <ArrowRight size={16} />
              </Link>
              <Link
                className="inline-flex items-center justify-center gap-2 rounded-full border border-teal-200 bg-white px-6 py-3 font-semibold text-teal-800 transition hover:bg-teal-50"
                href="/store"
              >
                <ShoppingBag size={16} />
                Shop parts and accessories
              </Link>
            </div>
          </div>
        </div>
      </section>

      <StoreSection />
    </main>
  );
}
