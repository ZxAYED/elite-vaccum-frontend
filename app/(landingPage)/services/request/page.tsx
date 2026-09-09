import Link from "next/link";

import { ServiceRequestForm } from "@/components/landing/service/request/ServiceRequestForm";
import { Button } from "@/components/ui/Button";
import type { ServiceOffering } from "@/types/domain";

export const metadata = {
  title: "Request Service - Elite Central Vacuum",
  description:
    "Submit a central vacuum service request with location, schedule, equipment details, and media.",
};

interface ServicesRequestPageProps {
  searchParams: Promise<{ service?: string | string[] }>;
}

/** Resolves the requested offering from `GET /services/:slug` (Phase 7.2). */
async function resolveService(slug?: string): Promise<ServiceOffering | undefined> {
  if (!slug) return undefined;

  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    "http://localhost:3000";

  try {
    const res = await fetch(`${apiUrl}/services/${encodeURIComponent(slug)}`, {
      cache: "no-store",
    });
    if (!res.ok) return undefined;

    const json = await res.json();
    const item = json?.data ?? json;
    if (!item?.slug) return undefined;

    return {
      id: item.id,
      serviceId: item.id || item.serviceId || item.key,
      slug: item.slug,
      group:
        String(item.group ?? "").toUpperCase() === "INSTALLATION"
          ? "Installation"
          : "Service & Maintenance",
      title: item.title,
      summary: item.summary || "",
      description: item.description || "",
      iconKey: (item.iconKey || "wrench").toLowerCase(),
      status: item.status || "ACTIVE",
      sortOrder: item.sortOrder ?? 999,
      recommendedSymptoms: item.recommendedSymptoms || [],
      requestCount: item.requestCount ?? 0,
      reviewCount: item.reviewCount ?? 0,
      createdAt: item.createdAt || new Date().toISOString(),
      updatedAt: item.updatedAt || new Date().toISOString(),
    };
  } catch {
    // Service catalog unreachable — fall through to the picker below.
    return undefined;
  }
}

export default async function ServicesRequestPage({
  searchParams,
}: ServicesRequestPageProps) {
  const params = await searchParams;
  const serviceSlug = Array.isArray(params.service)
    ? params.service[0]
    : params.service;
  const service = await resolveService(serviceSlug);

  if (!service) {
    return (
      <main className="bg-[linear-gradient(180deg,#effcfa_0%,#ffffff_45%)] py-24">
        <section className="mx-auto max-w-2xl px-4 text-center sm:px-6">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-teal-700">
            Select a Service
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-primary">
            Choose a service before starting your request.
          </h1>
          <p className="mt-5 text-base leading-7 text-slate-600">
            The request form needs a valid service so the dashboard can keep
            your request, quote, and schedule connected.
          </p>
          <Button asChild size="pill" className="mt-8">
            <Link href="/services">Back to Services</Link>
          </Button>
        </section>
      </main>
    );
  }

  return <ServiceRequestForm service={service} />;
}
