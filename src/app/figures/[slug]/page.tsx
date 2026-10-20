import { FigureDetailClient } from "@/components/EntityDetailClient";
import { getPublishedSlugs } from "@/lib/staticParams";

export async function generateStaticParams() {
  return getPublishedSlugs("historical_figures");
}

export default async function FigureDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <FigureDetailClient slug={slug} />;
}
