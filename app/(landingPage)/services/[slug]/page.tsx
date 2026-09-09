import { redirect } from "next/navigation";

interface PublicServiceSlugPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: PublicServiceSlugPageProps) {
  const { slug } = await params;
  const readable = slug
    .split("-")
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");

  return {
    title: readable
      ? `Request ${readable} - Elite Central Vacuum`
      : "Request Service - Elite Central Vacuum",
  };
}

export default async function PublicServiceSlugPage({
  params,
}: PublicServiceSlugPageProps) {
  const { slug } = await params;
  redirect(`/services/request?service=${encodeURIComponent(slug)}`);
}
