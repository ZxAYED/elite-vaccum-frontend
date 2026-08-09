import { LegalPage } from "@/components/landing/legal/LegalPage";

export const metadata = {
  title: "Terms of Service - Elite Central Vacuum",
  description:
    "Terms for using the Elite Central Vacuum website, store, service request flow, and customer dashboard.",
};

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Terms"
      title="Terms of Service"
      description="These terms describe expected use of the Elite Central Vacuum website and its public and customer-facing workflows."
      sections={[
        {
          title: "Website Use",
          body: (
            <p>
              You may use this website to browse central vacuum products, learn
              about services, submit mock service request information, and review
              customer portal screens. Do not misuse forms, attempt unauthorized
              access, or submit harmful content.
            </p>
          ),
        },
        {
          title: "Service Requests And Quotations",
          body: (
            <p>
              Public service request and dashboard quotation flows are currently
              frontend-only unless connected to a backend. Any displayed
              quotation, order, schedule, or dashboard data may be mock data used
              for interface demonstration.
            </p>
          ),
        },
        {
          title: "Product And Checkout Information",
          body: (
            <p>
              Product listings, cart totals, checkout summaries, invoices, and
              order records shown in this application should be treated as
              demonstration data until real payment, inventory, fulfillment, and
              backend integrations are connected.
            </p>
          ),
        },
        {
          title: "No Unauthorized Use",
          body: (
            <p>
              You agree not to interfere with website operation, reverse engineer
              private systems, upload malicious files, or use the website in a
              way that could disrupt service for other users.
            </p>
          ),
        },
        {
          title: "Contact",
          body: (
            <p>
              Questions about these terms can be sent to{" "}
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
