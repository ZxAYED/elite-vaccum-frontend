import { LegalPage } from "@/components/landing/legal/LegalPage";

export const metadata = {
  title: "Privacy Policy - Elite Central Vacuum",
  description:
    "Privacy information for Elite Central Vacuum website visitors and customer portal users.",
};

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Privacy"
      title="Privacy Policy"
      description="This page explains how the Elite Central Vacuum website is designed to handle contact, service, shopping, and customer account information."
      sections={[
        {
          title: "Information We Collect",
          body: (
            <p>
              The current website is mock-driven and prepares frontend flows for
              contact requests, service requests, product browsing, checkout,
              and customer dashboard activity. When backend services are
              connected, submitted forms may collect details such as name,
              email, phone number, service location, appointment preferences,
              order information, uploaded media, and support notes.
            </p>
          ),
        },
        {
          title: "How Information Is Used",
          body: (
            <p>
              Information is intended to support service routing, quotations,
              appointment scheduling, product order management, customer
              notifications, and account support. We do not design this website
              to sell personal information.
            </p>
          ),
        },
        {
          title: "Contact And Service Data",
          body: (
            <p>
              Service request details, uploaded images or videos, and schedule
              preferences should be used only to understand the requested work,
              prepare a quotation, coordinate technicians, and maintain customer
              history inside the dashboard.
            </p>
          ),
        },
        {
          title: "Data Security",
          body: (
            <p>
              The frontend is structured for validation, accessible forms, and
              future secure backend integration. Production deployments should
              use encrypted transport, controlled access, and least-privilege
              storage for any customer data.
            </p>
          ),
        },
        {
          title: "Contact",
          body: (
            <p>
              For privacy questions, contact{" "}
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
