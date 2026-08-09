import { LegalPage } from "@/components/landing/legal/LegalPage";

export const metadata = {
  title: "Accessibility - Elite Central Vacuum",
  description:
    "Accessibility statement for the Elite Central Vacuum website and customer portal.",
};

export default function AccessibilityPage() {
  return (
    <LegalPage
      eyebrow="Accessibility"
      title="Accessibility Statement"
      description="Elite Central Vacuum aims to provide a clear, keyboard-friendly, responsive, and readable website experience."
      sections={[
        {
          title: "Our Commitment",
          body: (
            <p>
              The website is built with semantic HTML, visible labels, keyboard
              focus states, responsive layouts, and reduced-motion support where
              animation is used.
            </p>
          ),
        },
        {
          title: "Interface Standards",
          body: (
            <p>
              Forms use persistent labels, validation feedback, accessible
              controls, and clear action states. Interactive elements are
              designed with usable hit areas and visible focus treatment.
            </p>
          ),
        },
        {
          title: "Motion And Responsiveness",
          body: (
            <p>
              Animations are intended to support orientation without blocking
              access to content. Reduced-motion preferences are respected by the
              motion components used across the landing pages.
            </p>
          ),
        },
        {
          title: "Ongoing Improvements",
          body: (
            <p>
              Accessibility should be reviewed as new backend features,
              dashboard flows, uploads, checkout, and scheduling interactions are
              connected. Issues should be corrected as part of normal product
              maintenance.
            </p>
          ),
        },
        {
          title: "Report An Issue",
          body: (
            <p>
              If you find an accessibility issue, email{" "}
              <a
                className="font-semibold text-primary underline-offset-4 hover:underline"
                href="mailto:zzayediqbalofficial@gmail.com"
              >
                zzayediqbalofficial@gmail.com
              </a>{" "}
              with the page URL and a short description of the problem.
            </p>
          ),
        },
      ]}
    />
  );
}
