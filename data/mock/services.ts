import type { Service } from "@/types/domain";

export const mockServices: Service[] = [
  {
    id: "svc-central-installation",
    slug: "central-vacuum-installation",
    name: "Central Vacuum Installation",
    category: "Installation",
    description:
      "Planning, rough-in coordination, power-unit placement, and system startup for new or remodeled homes.",
    basePriceUsd: 420,
    status: "active",
    commonIssues: [
      "Rough-in planning",
      "Power unit placement",
      "Inlet layout review",
      "Startup calibration",
    ],
  },
  {
    id: "svc-motor-repair",
    slug: "motor-repair",
    name: "Motor Repair",
    category: "Repair",
    description:
      "Troubleshooting for worn motors, reduced suction, overheating, and unexpected shutdowns.",
    basePriceUsd: 189,
    status: "active",
    commonIssues: [
      "Loss of suction",
      "Motor overheating",
      "Unit will not start",
      "Burning odor",
    ],
  },
  {
    id: "svc-maintenance-visit",
    slug: "annual-maintenance-visit",
    name: "Annual Maintenance Visit",
    category: "Maintenance",
    description:
      "Routine inspection, filter replacement guidance, and airflow testing across the full system.",
    basePriceUsd: 149,
    status: "active",
    commonIssues: [
      "Filter checks",
      "Inlet performance",
      "Canister cleaning",
      "Accessory wear",
    ],
  },
  {
    id: "svc-inlet-diagnostics",
    slug: "inlet-diagnostics",
    name: "Inlet Diagnostics",
    category: "Troubleshooting",
    description:
      "Pinpoint clogs, wiring issues, or weak suction at specific wall inlets and hose connections.",
    basePriceUsd: 129,
    status: "active",
    commonIssues: [
      "Blocked inlet",
      "Intermittent suction",
      "Wiring fault",
      "Hose handle issue",
    ],
  },
  {
    id: "svc-accessory-fit",
    slug: "accessory-fit-service",
    name: "Accessory Fit Service",
    category: "Support",
    description:
      "Verify hose, wand, and accessory compatibility for legacy and modern central vacuum systems.",
    basePriceUsd: 95,
    status: "active",
    commonIssues: [
      "Tool compatibility",
      "Hose replacement",
      "Wand fitment",
      "Accessory upgrades",
    ],
  },
];
