"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useClientSiteData } from "@/components/ClientSiteData";
import { useVisits } from "@/lib/visits";
import { useUserBadges } from "@/lib/badges";
import { GoshuinStamp, type GoshuinEntry } from "@/components/goshuincho/GoshuinStamp";

const regions = [
  { name: "北海道", prefectures: ["北海道"] },
  { name: "東北", prefectures: ["青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県"] },
  { name: "関東", prefectures: ["茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県"] },
  { name: "中部", prefectures: ["新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県", "静岡県", "愛知県"] },
  { name: "近畿", prefectures: ["三重県", "滋賀県", "京都府", "大阪府", "兵庫県", "奈良県", "和歌山県"] },
  { name: "中国", prefectures: ["鳥取県", "島根県", "岡山県", "広島県", "山口県"] },
  { name: "四国", prefectures: ["徳島県", "香川県", "愛媛県", "高知県"] },
  { name: "九州・沖縄", prefectures: ["福岡県", "佐賀県", "長崎県", "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県"] },
];

const prefectureAbbreviations: Record<string, string> = {
  北海道: "北海", 青森県: "青森", 岩手県: "岩手", 宮城県: "宮城", 秋田県: "秋田", 山形県: "山形", 福島県: "福島",
  茨城県: "茨城", 栃木県: "栃木", 群馬県: "群馬", 埼玉県: "埼玉", 千葉県: "千葉", 東京都: "東京", 神奈川県: "神奈川",
  新潟県: "新潟", 富山県: "富山", 石川県: "石川", 福井県: "福井", 山梨県: "山梨", 長野県: "長野", 岐阜県: "岐阜", 静岡県: "静岡", 愛知県: "愛知",
  三重県: "三重", 滋賀県: "滋賀", 京都府: "京都", 大阪府: "大阪", 兵庫県: "兵庫", 奈良県: "奈良", 和歌山県: "和歌山",
  鳥取県: "鳥取", 島根県: "島根", 岡山県: "岡山", 広島県: "広島", 山口県: "山口", 徳島県: "徳島", 香川県: "香川", 愛媛県: "愛媛", 高知県: "高知",
  福岡県: "福岡", 佐賀県: "佐賀", 長崎県: "長崎", 熊本県: "熊本", 大分県: "大分", 宮崎県: "宮崎", 鹿児島県: "鹿児島", 沖縄県: "沖縄",
};

function levelFor(count: number) {
  if (count >= 30) return { name: "全国巡拝者", next: null, progress: 100 };
  if (count >= 10) return { name: "奉拝者", next: 30, progress: (count / 30) * 100 };
  if (count >= 3) return { name: "巡拝者", next: 10, progress: ((count - 3) / 7) * 100 };
  return { name: "参拝者", next: 3, progress: (count / 3) * 100 };
}

function VisitCalendar({ visits }: { visits: { visitedAt: string }[] }) {
  const counts = new Map<string, number>();
  visits.forEach(({ visitedAt }) => counts.set(visitedAt, (counts.get(visitedAt) ?? 0) + 1));
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 181);
  const cells = Array.from({ length: 182 }, (_, index) => {
    const date = new Date(firstDay.getFullYear(), firstDay.getMonth(), firstDay.getDate() + index);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    return { key, count: counts.get(key) ?? 0 };
  });
  return (
    <div className="visit-calendar" role="group" aria-label="過去半年の参拝カレンダー">
      {cells.map(({ key, count }) => (
        <span key={key} className={`calendar-day level-${Math.min(count, 4)}`} title={`${key}：${count}件`} aria-label={`${key}：${count}件`} />
      ))}
    </div>
  );
}

export default function CollectionPage() {
  const { user } = useAuth();
  const { visits, isLoading } = useVisits(user);
  const { badges, isLoading: isBadgesLoading, error: badgesError } = useUserBadges(user);
  const { shrines } = useClientSiteData();

  const shrineById = useMemo(() => new Map(shrines.map((shrine) => [shrine.id, shrine])), [shrines]);
  const uniqueShrines = useMemo(() => Array.from(new Map(visits.map((visit) => [visit.shrineId, visit])).values()), [visits]);
  const visitedPrefectures = new Set(uniqueShrines.map((visit) => shrineById.get(visit.shrineId)?.prefecture).filter((name): name is string => Boolean(name)));
  const visitedRegions = regions.filter((region) => region.prefectures.some((prefecture) => visitedPrefectures.has(prefecture)));
  const level = levelFor(uniqueShrines.length);

  const entries: GoshuinEntry[] = visits.map((visit) => {
    const shrine = shrineById.get(visit.shrineId);
    return {
      id: visit.id,
      shrineName: shrine?.name ?? visit.shrineName,
      prefecture: shrine?.prefecture ?? "参拝の記録",
      visitedAt: visit.visitedAt.replace(/-/g, "."),
      deities: shrine?.deities ?? [],
      lineages: shrine?.lineages ?? [],
      benefits: shrine?.benefits ?? [],
    };
  });

  return (
    <main className="collection-page">
      <header className="goshuincho-header collection-header">
        <Link href="/" className="goshuincho-back">← 参道へ戻る</Link>
        <p className="eyebrow">MY SHRINE BOOK</p>
        <h1>わたしの御朱印帳</h1>
        <p>参拝の足あとと、神様とのご縁を一冊に。</p>
      </header>

      {!user ? (
        <section className="section-pad">
          <div className="ema-panel collection-login">
            <span aria-hidden="true">⛩</span>
            <strong>参拝の記録をひらく</strong>
            <p>ログインすると、御朱印帳や参拝の歩みを自分の記録からご覧いただけます。</p>
            <Link className="primary-button" href="/login">ログイン / 新規登録</Link>
          </div>
        </section>
      ) : (
        <>
          <section className="collection-summary section-pad" aria-label="巡拝者の記録">
            <div className="level-seal"><span>第</span><strong>{level.name}</strong><small>奉拝</small></div>
            <div className="level-copy">
              <p className="eyebrow">YOUR JOURNEY</p>
              <h2>{level.name}</h2>
              <p>参拝した神社 <strong>{uniqueShrines.length}</strong> 社 · 地方 <strong>{visitedRegions.length}</strong> / 8</p>
              <div className="level-progress" role="progressbar" aria-label="次の巡拝者レベルまで" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(level.progress)}>
                <span style={{ width: `${level.progress}%` }} />
              </div>
              <small>{level.next ? `次の称号まで あと ${Math.max(0, level.next - uniqueShrines.length)} 社` : "全国の神社とご縁を結びました"}</small>
            </div>
          </section>

          <section className="collection-section section-pad">
            <div className="section-heading"><div><p className="eyebrow">GOSHUIN · 朱印</p><h2>集めた御朱印</h2></div><span>{entries.length}件</span></div>
            {isLoading ? <p role="status">参拝帳を開いています…</p> : entries.length ? (
              <div className="goshuin-grid">{entries.map((entry) => <GoshuinStamp key={entry.id} entry={entry} />)}</div>
            ) : (
              <div className="ema-panel collection-empty"><span aria-hidden="true">絵馬</span><strong>帳面はまだ白紙です</strong><p>神社を訪れて参拝を記録すると、ここにご縁の朱印が集まります。</p><Link href="/" className="primary-button">最初の神社を探す</Link></div>
            )}
          </section>

          <section className="collection-section collection-badges section-pad">
            <div className="section-heading"><div><p className="eyebrow">OMAMORI · お守り</p><h2>ご縁のしるし</h2></div><span>{badges.filter((badge) => badge.earnedAt).length} / {badges.length}</span></div>
            {isBadgesLoading ? <p role="status">バッジを確認しています…</p> : badgesError ? <p role="alert">バッジを読み込めませんでした。時間をおいて再度お試しください。</p> : badges.length ? (
              <div className="badge-grid">
                {badges.map((badge) => {
                  const earned = Boolean(badge.earnedAt);
                  return (
                    <article className={`omamori-badge${earned ? " earned" : ""}`} key={badge.id}>
                      <span className="badge-charm" aria-hidden="true">{badge.iconEmoji ?? "⛩️"}</span>
                      <strong>{badge.name}</strong>
                      <p>{badge.description ?? ""}</p>
                      <small>{earned ? "奉拝" : "未獲得"}</small>
                    </article>
                  );
                })}
              </div>
            ) : <p>バッジはまだ登録されていません。</p>}
          </section>

          <section className="collection-section section-pad">
            <div className="section-heading"><div><p className="eyebrow">FOOTPRINTS · 足あと</p><h2>地方ごとの巡拝</h2></div><span>{visitedPrefectures.size} / 47 都道府県</span></div>
            <div className="region-list">
              {regions.map((region) => {
                const count = region.prefectures.filter((prefecture) => visitedPrefectures.has(prefecture)).length;
                return (
                  <div className="region-row" key={region.name}>
                    <div className="region-row-heading"><strong>{region.name}</strong><span>{count} / {region.prefectures.length}</span></div>
                    <div className="prefecture-grid">
                      {region.prefectures.map((prefecture) => {
                        const visited = visitedPrefectures.has(prefecture);
                        return <span className={visited ? "prefecture-stamp visited" : "prefecture-stamp"} key={prefecture} aria-label={`${prefecture}${visited ? " 参拝済み" : " 未参拝"}`} title={prefecture}>{prefectureAbbreviations[prefecture]}</span>;
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="collection-section section-pad calendar-section">
            <div className="section-heading"><div><p className="eyebrow">SANPAI · 参拝暦</p><h2>半年の参拝カレンダー</h2></div><Link href="/visits">記録を見る →</Link></div>
            <VisitCalendar visits={visits} />
            <p className="calendar-legend"><span>少</span>{[0, 1, 2, 3, 4].map((levelValue) => <i className={`calendar-day level-${levelValue}`} key={levelValue} />)}<span>多</span></p>
          </section>
        </>
      )}
    </main>
  );
}
