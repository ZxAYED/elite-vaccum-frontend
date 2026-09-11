import { DynamicPolicyPage } from "@/components/landing/legal/DynamicPolicyPage";

interface PolicyPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PolicyPageProps) {
  const { slug } = await params;
  const formattedTitle = slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  return {
    title: `${formattedTitle} Policy - Elite Central Vacuum`,
    description: `Official ${formattedTitle} documentation and legal policy for Elite Central Vacuum.`,
  };
}

export default async function PolicySlugPage({ params }: PolicyPageProps) {
  const { slug } = await params;
  const formattedTitle = slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  return (
    <DynamicPolicyPage
      slug={slug}
      defaultEyebrow="Legal Policy"
      defaultTitle={`${formattedTitle} Policy`}
      defaultDescription={`Official policy statement and legal terms for Elite Central Vacuum regarding ${formattedTitle.toLowerCase()}.`}
      fallbackSections={[
        {
          title: "Policy Overview",
          body: (
            <p>
              This policy outlines standard practices and guidelines for Elite Central Vacuum.
              Content is retrieved directly from the administrative policy management service.
            </p>
          ),
        },
        {
          title: "Inquiries & Clarifications",
          body: (
            <p>
              If you have any questions or require additional information regarding this policy,
              please contact our support team at{" "}
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
