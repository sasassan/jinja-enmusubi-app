"use client";

import Link from "next/link";
import { useState } from "react";
import { useClientSiteData } from "@/components/ClientSiteData";

type Fortune = { rank: string; wish: string; travel: string; advice: string };

const fortunes: Fortune[] = [
  { rank: "大吉", wish: "思いがけない良縁に恵まれそう。", travel: "朝の参道に幸運あり。", advice: "感謝の気持ちを言葉にしましょう。" },
  { rank: "吉", wish: "少しずつ願いに近づく兆し。", travel: "水辺の社を訪ねるとよい日。", advice: "焦らず一歩ずつ進めば道が開けます。" },
  { rank: "中吉", wish: "心を整えることでご縁が結ばれます。", travel: "森の木漏れ日がよい知らせを運びます。", advice: "身近な人への思いやりを大切に。" },
  { rank: "小吉", wish: "日常のなかに小さな喜びが見つかります。", travel: "近くの神社への散歩が吉。", advice: "身の回りを整えると心も晴れやかに。" },
  { rank: "末吉", wish: "結びの時はゆっくり訪れます。", travel: "次の機会に道が開けそう。", advice: "今は種をまき、静かに待ちましょう。" },
];

export default function FortunePage() {
  const { shrines } = useClientSiteData();
  const [drawing, setDrawing] = useState(false);
  const [result, setResult] = useState<{ fortune: Fortune; shrineName: string | null } | null>(null);

  function drawFortune() {
    if (drawing) return;
    setDrawing(true);
    window.setTimeout(() => {
      const fortune = fortunes[Math.floor(Math.random() * fortunes.length)];
      const shrine = shrines.length ? shrines[Math.floor(Math.random() * shrines.length)] : null;
      setResult({ fortune, shrineName: shrine?.name ?? null });
      setDrawing(false);
    }, 900);
  }

  return (
    <main className="fortune-page">
      <header className="goshuincho-header fortune-header">
        <Link href="/" className="goshuincho-back">← 参道へ戻る</Link>
        <p className="eyebrow">OMIKUJI · 御縁みくじ</p>
        <h1>今日のご縁を占う</h1>
        <p>心を静めて、おみくじを一枚お引きください。</p>
      </header>
      <section className="fortune-stage section-pad">
        <div className={`omikuji-box${drawing ? " drawing" : ""}`} aria-hidden="true">
          <span className="box-torii">⛩</span>
          <span className="box-kanji">御神籤</span>
          <span className="omikuji-stick">—</span>
          <span className="omikuji-stick">—</span>
          <span className="omikuji-stick">—</span>
        </div>
        <button className="primary-button fortune-draw" onClick={drawFortune} disabled={drawing} aria-busy={drawing}>
          {drawing ? "おみくじを引いています…" : result ? "もう一度、引いてみる" : "おみくじを引く"}
        </button>
        <p className="fortune-hint" aria-live="polite">{drawing ? "筒を振って、ご縁を結んでいます。" : "引いたおみくじは、今日の小さな道しるべです。"}</p>
        {result && !drawing && (
          <article className="fortune-result" aria-live="polite">
            <p className="eyebrow">YOUR FORTUNE</p>
            <p className="fortune-rank">{result.fortune.rank}</p>
            <dl>
              <div><dt>願いごと</dt><dd>{result.fortune.wish}</dd></div>
              <div><dt>お参り</dt><dd>{result.fortune.travel}</dd></div>
              <div><dt>心がけ</dt><dd>{result.fortune.advice}</dd></div>
            </dl>
            {result.shrineName && <p className="fortune-recommendation">今日のご縁先 <strong>{result.shrineName}</strong></p>}
            <Link href="/" className="outline-button">神社を探す →</Link>
          </article>
        )}
      </section>
    </main>
  );
}
