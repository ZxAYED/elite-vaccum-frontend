import type { ServiceOffering, ServiceQuotation } from "@/types/domain";

export const publicServiceOfferings: ServiceOffering[] = [
  {
    slug: "vacuum-repair",
    serviceId: "svc-motor-repair",
    group: "Service & Maintenance",
    title: "Vacuum Repair",
    summary: "Diagnostics and repair for suction loss, motor noise, and inlet issues.",
    iconKey: "wrench",
  },
  {
    slug: "maintenance",
    serviceId: "svc-maintenance-visit",
    group: "Service & Maintenance",
    title: "Maintenance & Troubleshooting",
    summary: "Preventative care to ensure your system operates at peak efficiency year-round.",
    iconKey: "activity",
  },
  {
    slug: "low-suction-fix",
    serviceId: "svc-inlet-diagnostics",
    group: "Service & Maintenance",
    title: "Low Suction Fix",
    summary: "Specialized blockage removal and seal integrity checks for restored power.",
    iconKey: "shield",
  },
  {
    slug: "broken-inlet-repair",
    serviceId: "svc-inlet-diagnostics",
    group: "Service & Maintenance",
    title: "Broken Inlet Repair",
    summary: "Replacement of damaged wall valves and low-voltage wiring restoration.",
    iconKey: "sliders",
  },
  {
    slug: "general-service",
    serviceId: "svc-maintenance-visit",
    group: "Service & Maintenance",
    title: "General Service",
    summary: "Comprehensive system health check including filter cleaning and line purging.",
    iconKey: "wrench",
  },
  {
    slug: "system-inspection",
    serviceId: "svc-inlet-diagnostics",
    group: "Service & Maintenance",
    title: "System Inspection",
    summary: "Detailed inspection of your central vacuum system to identify hidden issues.",
    iconKey: "shield",
  },
  {
    slug: "new-system",
    serviceId: "svc-central-installation",
    group: "Installation",
    title: "New System",
    summary: "Full blueprinting and installation for new home constructions.",
    iconKey: "home-plus",
  },
  {
    slug: "custom-fit",
    serviceId: "svc-central-installation",
    group: "Installation",
    title: "Custom Fit",
    summary: "Bespoke layouts for commercial or unique residential spaces.",
    iconKey: "wrench",
  },
  {
    slug: "system-upgrade",
    serviceId: "svc-central-installation",
    group: "Installation",
    title: "System Upgrade",
    summary: "Retrofitting modern power units to existing piping networks.",
    iconKey: "upload",
  },
  {
    slug: "architectural",
    serviceId: "svc-central-installation",
    group: "Installation",
    title: "Architectural",
    summary: "Seamless integration into luxury bespoke home designs.",
    iconKey: "compass",
  },
];

const defaultQuote: ServiceQuotation = {
  slug: "vacuum-repair",
  serviceType: "Vacuum Repair",
  identifiedProblem:
    '"Unit is losing suction and making a high-pitched whistling noise during operation."',
  imageIds: ["prd-titan-hybrid", "prd-elite-500"],
  lineItems: [
    { label: "Labor & Inspection", amountUsd: 85 },
    { label: "Replacement Filter each", amountUsd: 45 },
    { label: "Motor Seal Gasket", amountUsd: 22 },
  ],
  taxRate: 0.07,
  technicianNotes:
    "The primary motor seal has deteriorated, causing the whistling noise. We recommend replacing both the seal and filters to restore full suction power.",
  validityLabel: "Valid for 2 hours",
};

export const publicServiceQuotations: ServiceQuotation[] =
  publicServiceOfferings.map((service) => {
    if (service.slug === defaultQuote.slug) {
      return defaultQuote;
    }

    const isInstallation = service.group === "Installation";

    return {
      slug: service.slug,
      serviceType: service.title,
      identifiedProblem: isInstallation
        ? '"Customer requested a clean installation plan with equipment placement and visit scheduling."'
        : '"Customer requested service support and a technician-prepared quotation preview."',
      imageIds: isInstallation
        ? ["prd-titan-hybrid", "prd-elite-700"]
        : ["prd-elite-500", "prd-pro-hose-kit"],
      lineItems: isInstallation
        ? [
            { label: "Planning & Inspection", amountUsd: 120 },
            { label: "Installation Materials", amountUsd: 180 },
            { label: "Technician Setup", amountUsd: 95 },
          ]
        : [
            { label: "Diagnostic Visit", amountUsd: 85 },
            { label: "Service Materials", amountUsd: 45 },
            { label: "System Calibration", amountUsd: 35 },
          ],
      taxRate: 0.07,
      technicianNotes: isInstallation
        ? "The installation can be scheduled after a preferred visit window is selected. Final scope remains a mock preview until backend quotation approval exists."
        : "The technician recommends a guided service visit to confirm the issue and complete the quoted work scope.",
      validityLabel: "Valid for 2 hours",
    };
  });

export function getPublicServiceBySlug(slug: string) {
  return publicServiceOfferings.find((service) => service.slug === slug);
}

export function getPublicQuotationBySlug(slug: string) {
  return (
    publicServiceQuotations.find((quotation) => quotation.slug === slug) ??
    defaultQuote
  );
}
