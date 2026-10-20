import { DeityDetailClient } from "@/components/EntityDetailClient";
import { getPublishedSlugs } from "@/lib/staticParams";

export async function generateStaticParams() {
  return getPublishedSlugs("deities");
}

export default async function DeityDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <DeityDetailClient slug={slug} />;
}
