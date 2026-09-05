import { redirect } from "next/navigation";

import {
  activePublicServiceOfferings,
  getPublicServiceBySlug,
} from "@/data/mock/public-services";

interface PublicServiceSlugPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export function generateStaticParams() {
  return activePublicServiceOfferings.map((service) => ({
    slug: service.slug,
  }));
}

export async function generateMetadata({ params }: PublicServiceSlugPageProps) {
  const { slug } = await params;
  const service = getPublicServiceBySlug(slug);

  return {
    title: service
      ? `Request ${service.title} - Elite Central Vacuum`
      : "Request Service - Elite Central Vacuum",
  };
}

export default async function PublicServiceSlugPage({
  params,
}: PublicServiceSlugPageProps) {
  const { slug } = await params;
  redirect(`/services/request?service=${slug}`);
}
