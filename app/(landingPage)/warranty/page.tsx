import { DynamicPolicyPage } from "@/components/landing/legal/DynamicPolicyPage";

export const metadata = {
  title: "Warranty & Service Guarantee - Elite Central Vacuum",
  description:
    "Comprehensive warranty coverage, installation guarantee, and motor protection policies for Elite Central Vacuum systems.",
};

export default function WarrantyPage() {
  return (
    <DynamicPolicyPage
      slug="warranty"
      defaultEyebrow="Guarantee"
      defaultTitle="Warranty & Service Guarantee"
      defaultDescription="Comprehensive protection for your central vacuum power units, piping installation, attachments, and service repairs."
      fallbackSections={[
        {
          title: "10-Year Limited Motor Warranty",
          body: (
            <p>
              All newly installed Elite central vacuum power units include a 10-year
              limited motor warranty covering manufacturer defects, electrical failure under
              proper surge protection, and mechanical breakdown. Replacement motors or unit
              swaps are fulfilled promptly by authorized Elite service technicians.
            </p>
          ),
        },
        {
          title: "Lifetime Piping & Inlet Guarantee",
          body: (
            <p>
              All in-wall PVC tubing, low-voltage control wiring, and wall inlet valves
              installed by our certified technicians carry a lifetime workmanship guarantee
              against structural detachment or air leakage under standard residential use.
            </p>
          ),
        },
        {
          title: "Accessories & Hose Coverage",
          body: (
            <p>
              Hoses, powerheads, floor brushes, wand extensions, and attachment sets include
              a 2-year warranty against defects in materials and electrical connectors.
              Consumable items such as disposable filter bags are excluded.
            </p>
          ),
        },
        {
          title: "Service & Repair Guarantee",
          body: (
            <p>
              All repair work performed by Elite technicians includes a 90-day parts and
              labor guarantee. If the same issue recurs within 90 days of service completion,
              we inspect and resolve it at zero additional labor cost.
            </p>
          ),
        },
        {
          title: "Warranty Claims & Support",
          body: (
            <p>
              To file a warranty claim, schedule an inspection through your customer portal
              or email our warranty department directly at{" "}
              <a
                className="font-semibold text-primary underline-offset-4 hover:underline"
                href="mailto:zzayediqbalofficial@gmail.com"
              >
                zzayediqbalofficial@gmail.com
              </a>
              .
            </p>
          ),
        },
      ]}
    />
  );
}
