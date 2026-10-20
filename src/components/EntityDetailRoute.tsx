"use client";

import { useSearchParams } from "next/navigation";
import { DeityDetailClient, FigureDetailClient } from "@/components/EntityDetailClient";
import { ShrineDetailClient } from "@/components/ShrineDetailClient";

export function EntityDetailRoute({ kind }: { kind: "deity" | "figure" | "shrine" }) {
  const slug = useSearchParams().get("slug");
  if (!slug) return <main><section className="hero"><h1>詳細を表示できません</h1><p>対象の情報が指定されていません。</p></section></main>;
  if (kind === "deity") return <DeityDetailClient slug={slug} />;
  if (kind === "figure") return <FigureDetailClient slug={slug} />;
  return <ShrineDetailClient slug={slug} />;
}
