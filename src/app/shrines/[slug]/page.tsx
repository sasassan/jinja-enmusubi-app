import { ShrineDetailClient } from "@/components/ShrineDetailClient";
import { getPublishedSlugs } from "@/lib/staticParams";

export async function generateStaticParams() {
  return getPublishedSlugs("shrines");
}

export default async function ShrineDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <ShrineDetailClient slug={slug} />;
}
