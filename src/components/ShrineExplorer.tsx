"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { Shrine, Figure } from "@/lib/types";
import { DeityMotif } from "@/components/motifs/DeityMotifs";
import {
  EMPTY_FILTERS,
  decodeFiltersFromParams,
  encodeFiltersToParams,
  filterShrines,
  REGION_GROUPS,
  withDistance,
  type Filters,
  type GeoState,
} from "@/lib/filters";
import { useAuth } from "@/components/auth/AuthProvider";
import { UserMenu } from "@/components/auth/UserMenu";
import { useFavorites } from "@/lib/favorites";
import { VisitRecordForm } from "@/components/visits/VisitRecordForm";
import { useVisits } from "@/lib/visits";

const RECENT_KEY = "jinja-goen:recent";
const RADIUS_OPTIONS = [3, 5, 10, 30, 50];
const SEARCH_DEBOUNCE_MS = 180;
const RESULTS_PAGE_SIZE = 50;

function readIds(key: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function writeIds(key: string, ids: string[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(ids));
}

// <button> 内にブロック要素を置かないよう <article> + role="button" で実装
function ShrineCard({
  shrine,
  distanceKm,
  onSelect,
}: {
  shrine: Shrine;
  distanceKm?: number | null;
  onSelect: (shrine: Shrine) => void;
}) {
  return (
    <article
      className="shrine-card"
      role="button"
      tabIndex={0}
      onClick={() => onSelect(shrine)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onSelect(shrine);
      }}
      aria-label={`${shrine.name}の詳細を見る`}
    >
      <div className="motif-tile" aria-hidden="true">
        <DeityMotif deities={shrine.deities} lineages={shrine.lineages} benefits={shrine.benefits} />
      </div>
      <div className="shrine-copy">
        <p className="eyebrow">
          {shrine.prefecture}
          {distanceKm != null ? ` · 現在地から約${distanceKm.toFixed(1)}km` : ""}
        </p>
        <h3>{shrine.name}</h3>
        <p className="reading">{shrine.reading}</p>
        <div className="tags">
          {(shrine.deities.length > 0 ? shrine.deities.slice(0, 2) : ["御祭神情報なし"]).map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </div>
    </article>
  );
}

type DiscoveryGroup = {
  label: string;
  value: string;
  items: string[];
};

export default function ShrineExplorer({
  shrines,
  figures,
  discoveryGroups,
  dataSource,
}: {
  shrines: Shrine[];
  figures: Figure[];
  discoveryGroups: DiscoveryGroup[];
  dataSource: "db" | "fallback";
}) {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [visibleResults, setVisibleResults] = useState({ key: "", count: RESULTS_PAGE_SIZE });
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [radiusKm, setRadiusKm] = useState<number | null>(null);
  const [selected, setSelected] = useState<Shrine | null>(null);
  const [geo, setGeo] = useState<GeoState>({ status: "idle" });
  const [navOpen, setNavOpen] = useState(false);
  const [showVisitForm, setShowVisitForm] = useState(false);
  // 初回マウント時のみ localStorage を読み込む(遅延初期化。SSR時は window 未定義のため空配列)
  const [recent, setRecent] = useState<string[]>(() => readIds(RECENT_KEY));

  // URL クエリから検索条件を復元する。useSearchParams は CSR 完了後に値が確定するため、
  // searchParams が変化するたびに状態を同期する（初回マウント時も含む）。
  useEffect(() => {
    const decoded = decodeFiltersFromParams(searchParams);
    /* eslint-disable react-hooks/set-state-in-effect */
    setQuery(decoded.query);
    setFilters(decoded.filters);
    setRadiusKm(decoded.radiusKm);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [searchParams]);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedQuery(query.trim()), SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timeout);
  }, [query]);

  const { user } = useAuth();
  const { favorites, toggleFavorite } = useFavorites(user);
  const { visits, reload: reloadVisits } = useVisits(user);

  // 神様/人物詳細ページなどから ?shrine=slug で遷移してきた場合、該当神社の詳細を自動的に開く
  useEffect(() => {
    const slug = searchParams.get("shrine");
    if (!slug) return;
    const target = shrines.find((s) => s.slug === slug);
    if (target) openDetail(target);
  }, [searchParams, shrines]);

  const prefectures = useMemo(
    () => Array.from(new Set(shrines.map((s) => s.prefecture))).filter(Boolean),
    [shrines]
  );
  const figureNames = useMemo(() => figures.map((f) => f.name), [figures]);

  const activeFilterCount = Object.values(filters).filter(Boolean).length + (radiusKm ? 1 : 0);

  const shrinesWithDistance = useMemo(() => withDistance(shrines, geo), [shrines, geo]);

  const results = useMemo(
    () =>
      filterShrines(shrinesWithDistance, {
        query: debouncedQuery,
        filters,
        radiusKm,
        sortByDistance: geo.status === "granted",
      }),
    [shrinesWithDistance, debouncedQuery, filters, radiusKm, geo.status]
  );
  const resultKey = JSON.stringify([debouncedQuery, filters, radiusKm, geo.status]);
  const visibleResultCount = visibleResults.key === resultKey ? visibleResults.count : RESULTS_PAGE_SIZE;
  const visibleResultItems = results.slice(0, visibleResultCount);

  // 現在の検索条件を /map に引き継ぐためのクエリ文字列("地図で探す"導線用)
  const mapHref = useMemo(() => {
    const params = encodeFiltersToParams(new URLSearchParams(), { query, filters, radiusKm });
    const qs = params.toString();
    return qs ? `/map?${qs}` : "/map";
  }, [query, filters, radiusKm]);

  const nearbyShrines = useMemo(() => {
    if (geo.status !== "granted") return [];
    return [...shrinesWithDistance]
      .sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity))
      .slice(0, 5);
  }, [shrinesWithDistance, geo.status]);

  const recentShrines = useMemo(
    () => recent.map((id) => shrines.find((s) => s.id === id)).filter((s): s is Shrine => Boolean(s)),
    [recent, shrines]
  );
  const favoriteShrines = useMemo(
    () => favorites.map((id) => shrines.find((s) => s.id === id)).filter((s): s is Shrine => Boolean(s)),
    [favorites, shrines]
  );

  function openDetail(shrine: Shrine) {
    setSelected(shrine);
    setShowVisitForm(false);
    setRecent((prev) => {
      const next = [shrine.id, ...prev.filter((id) => id !== shrine.id)].slice(0, 8);
      writeIds(RECENT_KEY, next);
      return next;
    });
  }

  function setSingleFilter(key: keyof Filters, value: string) {
    setFilters((prev) => ({ ...prev, [key]: value && prev[key] !== value ? value : null }));
  }

  // 現在地から探す: Geolocation API を呼び出し、取得後に距離順ソート・距離フィルタを有効化
  function handleNearby() {
    if (!navigator.geolocation) {
      setGeo({ status: "denied", message: "このブラウザは位置情報に対応していません。地域から絞り込んでください。" });
      return;
    }
    setGeo({ status: "loading" });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeo({ status: "granted", lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      (err) => {
        const msg =
          err.code === err.PERMISSION_DENIED
            ? "位置情報の利用が許可されていません。地域から絞り込んでください。"
            : "位置情報を取得できませんでした。地域から絞り込んでください。";
        setGeo({ status: "denied", message: msg });
      },
      { timeout: 10000, maximumAge: 60000 }
    );
  }

  return (
    <main>
      <header className="site-header">
        <span className="wordmark"><span className="wordmark-torii" aria-hidden="true" />神社御縁</span>
        <button aria-label="メニューを開く" className="menu-button" onClick={() => setNavOpen(true)}>
          ☰
        </button>
      </header>

      {navOpen && (
        <>
          <div className="nav-drawer-backdrop" onClick={() => setNavOpen(false)} />
          <nav className="nav-drawer" aria-label="メインメニュー">
            <button className="nav-drawer-close" aria-label="メニューを閉じる" onClick={() => setNavOpen(false)}>
              ×
            </button>
            <p className="eyebrow">JINJA GOEN</p>
            <UserMenu onNavigate={() => setNavOpen(false)} />
            <hr className="nav-drawer-divider" />
            <Link href="/" className="nav-drawer-link" onClick={() => setNavOpen(false)}>
              <DeityMotif />
              神社を探す
            </Link>
            <Link href="/deities" className="nav-drawer-link" onClick={() => setNavOpen(false)}>
              <DeityMotif deities={["天神"]} />
              神様から探す
            </Link>
            <Link href="/figures" className="nav-drawer-link" onClick={() => setNavOpen(false)}>
              <DeityMotif deities={["縁結び"]} />
              人物から探す
            </Link>
            <Link href={mapHref} className="nav-drawer-link" onClick={() => setNavOpen(false)}>
              <DeityMotif deities={["山"]} />
              地図で探す
            </Link>
            <Link href="/collection" className="nav-drawer-link" onClick={() => setNavOpen(false)}>
              <DeityMotif deities={["稲荷"]} />
              わたしの御朱印帳・ご縁のしるし
            </Link>
            <Link href="/fortune" className="nav-drawer-link" onClick={() => setNavOpen(false)}>
              <DeityMotif deities={["筆"]} />
              おみくじを引く
            </Link>
            <Link href="/visits" className="nav-drawer-link" onClick={() => setNavOpen(false)}>
              <DeityMotif deities={["筆"]} />
              参拝記録一覧
            </Link>
          </nav>
        </>
      )}

      {dataSource === "fallback" && (
        <p className="data-fallback-notice" role="status">
          現在データを読み込めません。ネットワーク環境をご確認のうえ再度お試しください。
        </p>
      )}

      <section className="hero home-hero">
        <p className="eyebrow">JINJA GOEN</p>
        <h1><span className="hero-highlight">森の参道をたどって</span><br />ご縁の神社へ</h1>
        <p>
          神様・御利益・由緒・地域から、
          <br />
          あなたにぴったりの参拝先を見つけましょう。
        </p>
        <label className="search-box">
          <span aria-hidden="true">手水</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="お探しの神社は？ 神社名・地域・御祭神"
            aria-label="お探しの神社は？ 神社名、地域、御祭神から検索"
          />
        </label>
      </section>

      <section className="discovery section-pad">
        <div className="section-heading">
          <p className="eyebrow">FIND A SHRINE</p>
          <h2>想いから探す（複数選択で絞り込み）</h2>
        </div>
        <div className="discovery-grid">
          {discoveryGroups.map((group) => (
            <div className="discovery-card" key={group.value}>
              <p>{group.label}</p>
              <div>
                {group.items.map((item) => (
                  <button
                    key={item}
                    className={filters[group.value as keyof Filters] === item ? "chip active" : "chip"}
                    onClick={() => setSingleFilter(group.value as keyof Filters, item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
              {group.value === "deity" && (
                <Link href="/deities" className="discovery-more-link">
                  すべての神様を見る →
                </Link>
              )}
            </div>
          ))}

          <div className="discovery-card">
            <p>人物から探す</p>
            <div>
              {figureNames.slice(0, 4).map((item) => (
                <button
                  key={item}
                  className={filters.figure === item ? "chip active" : "chip"}
                  onClick={() => setSingleFilter("figure", item)}
                >
                  {item}
                </button>
              ))}
              {figureNames.length === 0 && <span className="chip-empty">登録されている人物はまだありません</span>}
            </div>
            <Link href="/figures" className="discovery-more-link">
              すべての人物を見る →
            </Link>
          </div>

          <div className="discovery-card">
            <p>地域から探す</p>
            <div>
              {prefectures.map((item) => (
                <button
                  key={item}
                  className={filters.prefecture === item ? "chip active" : "chip"}
                  onClick={() => setSingleFilter("prefecture", item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="discovery-card">
            <label htmlFor="home-region-filter">地方ブロック</label>
            <select id="home-region-filter" value={filters.region ?? ""} onChange={(event) => setSingleFilter("region", event.target.value)}>
              <option value="">全国</option>
              {REGION_GROUPS.map(({ name }) => <option key={name} value={name}>{name}</option>)}
            </select>
          </div>

          {/* 現在地から探す */}
          <button className="nearby" onClick={handleNearby} disabled={geo.status === "loading"} aria-busy={geo.status === "loading"}>
            <span aria-hidden="true">⌖</span>
            <strong>現在地から探す</strong>
            <small>
              {geo.status === "loading"
                ? "位置情報を取得中…"
                : geo.status === "granted"
                ? `現在地を取得しました（${geo.lat.toFixed(3)}, ${geo.lng.toFixed(3)}）`
                : geo.status === "denied"
                ? geo.message
                : "位置情報を利用して近くの神社を表示します"}
            </small>
          </button>

          {geo.status === "granted" && (
            <div className="discovery-card radius-card">
              <p>現在地から○km以内で絞り込む</p>
              <div>
                <button className={radiusKm === null ? "chip active" : "chip"} onClick={() => setRadiusKm(null)}>
                  指定なし
                </button>
                {RADIUS_OPTIONS.map((km) => (
                  <button key={km} className={radiusKm === km ? "chip active" : "chip"} onClick={() => setRadiusKm(km)}>
                    {km}km以内
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {geo.status === "granted" && (
        <section className="section-pad recent-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">NEARBY</p>
              <h2>あなたの近くの神社</h2>
            </div>
          </div>
          {nearbyShrines.length > 0 ? (
            <div className="shrine-list">
              {nearbyShrines.map(({ shrine, distanceKm }) => (
                <ShrineCard key={shrine.id} shrine={shrine} distanceKm={distanceKm} onSelect={openDetail} />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <DeityMotif />
              <strong>近くに登録されている神社が見つかりませんでした</strong>
              <p>対応エリア（福岡・佐賀・長崎）以外にいる場合は表示されない場合があります。</p>
            </div>
          )}
        </section>
      )}

      <section className="section-pad recent-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">RECENTLY VIEWED</p>
            <h2>最近見た神社</h2>
          </div>
        </div>
        {recentShrines.length > 0 ? (
          <div className="shrine-list">
            {recentShrines.map((shrine) => (
              <ShrineCard key={shrine.id} shrine={shrine} onSelect={openDetail} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <DeityMotif />
            <strong>まだ見た神社がありません</strong>
            <p>気になる神社をタップすると、ここに表示されます。</p>
          </div>
        )}
      </section>

      <section className="section-pad recent-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">FAVORITES</p>
            <h2>お気に入り</h2>
          </div>
        </div>
        {favoriteShrines.length > 0 ? (
          <div className="shrine-list">
            {favoriteShrines.map((shrine) => (
              <ShrineCard key={shrine.id} shrine={shrine} onSelect={openDetail} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <DeityMotif />
            <strong>お気に入りはまだありません</strong>
            <p>神社の詳細画面から「お気に入りに追加」でここに保存できます。</p>
          </div>
        )}
      </section>

      <section className="section-pad results-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">SHRINES</p>
            <h2>{activeFilterCount > 0 || query ? "条件に合う神社" : "西九州の神社"}</h2>
          </div>
          <span>{results.length}件</span>
        </div>
        {(activeFilterCount > 0 || query.trim()) && (
          <button className="clear-filter" onClick={() => { setQuery(""); setFilters(EMPTY_FILTERS); setRadiusKm(null); }}>
            検索条件をすべて解除
          </button>
        )}
        <div className="shrine-list">
          {visibleResultItems.map(({ shrine, distanceKm }) => (
            <ShrineCard key={shrine.id} shrine={shrine} distanceKm={distanceKm} onSelect={openDetail} />
          ))}
        </div>
        {results.length > visibleResultCount && (
          <button
            className="outline-button map-load-more"
            onClick={() => setVisibleResults({ key: resultKey, count: visibleResultCount + RESULTS_PAGE_SIZE })}
          >
            さらに50社を表示（残り{results.length - visibleResultCount}社）
          </button>
        )}
        {results.length === 0 && (
          <div className="empty-state">
            <DeityMotif />
            <strong>条件に合う神社が見つかりませんでした</strong>
            <p>キーワードを変えるか、「想いから探す」の条件を解除してお試しください。</p>
          </div>
        )}
      </section>

      <section className="map-preview section-pad">
        <div>
          <p className="eyebrow">MAP</p>
          <h2>地図から確かめる</h2>
          <p>検索条件に合う神社を、地図上でも確認できます。</p>
          <Link href={mapHref} className="outline-button">
            地図を開く <span>→</span>
          </Link>
        </div>
        <div className="map-art" aria-label="地図表示のプレビュー">
          <i className="pin p1" />
          <i className="pin p2" />
          <i className="pin p3" />
          <span>福岡</span>
          <span>佐賀</span>
          <span>長崎</span>
        </div>
      </section>

      <footer className="site-footer">
        <p>神社御縁 — その土地の神様と、あなたを結ぶ。</p>
        <Link href="/privacy">プライバシーポリシー</Link>
      </footer>

      {selected && (
        <div className="sheet-backdrop" role="dialog" aria-modal="true" aria-label={`${selected.name}の詳細`} onClick={() => setSelected(null)}>
          <article className="detail-sheet" onClick={(e) => e.stopPropagation()}>
            <button className="close" aria-label="閉じる" onClick={() => setSelected(null)}>
              ×
            </button>
            <p className="eyebrow">{selected.prefecture}{selected.municipality ? ` · ${selected.municipality}` : ""}</p>
            <div className="detail-sheet-header">
              <div className="detail-motif" aria-hidden="true">
                <DeityMotif deities={selected.deities} lineages={selected.lineages} benefits={selected.benefits} />
              </div>
              <div>
                <h2>{selected.name}</h2>
                <p className="reading">{selected.reading || "読み不明"}</p>
              </div>
            </div>

            <h3>御祭神</h3>
            <div className="deity-role-groups">
              {(["principal", "co_enshrined", "enshrined", "associated"] as const).map((roleKey) => {
                const group = selected.deityRefs.filter((d) => d.role === roleKey);
                if (group.length === 0) return null;
                return (
                  <div className="deity-role-group" key={roleKey}>
                    <b>{group[0].roleLabel}</b>
                    <p>
                      {group.map((d, i) => (
                        <span key={d.slug}>
                          {i > 0 && "・"}
                          <Link href={`/deities/${encodeURIComponent(d.slug)}`}>{d.name}</Link>
                        </span>
                      ))}
                    </p>
                  </div>
                );
              })}
              {selected.deityRefs.length === 0 && <p className="unknown-value">御祭神の情報は登録されていません。</p>}
            </div>

            {selected.figureRefs.length > 0 && (
              <>
                <h3>関連する人物</h3>
                <p className="history">
                  {selected.figureRefs.map((f, i) => (
                    <span key={f.slug}>
                      {i > 0 && "・"}
                      <Link href={`/figures/detail?slug=${encodeURIComponent(f.slug)}`}>{f.name}</Link>
                    </span>
                  ))}
                </p>
              </>
            )}

            <div className="detail-meta">
              <div>
                <b>信仰系統</b>
                <p>{selected.lineages.length > 0 ? selected.lineages.join("・") : "不明"}</p>
              </div>
              <div>
                <b>御利益</b>
                {selected.benefits.length > 0 ? (
                  <p className="benefit-badges">
                    {selected.benefits.map((benefit) => <span className="benefit-badge" key={benefit}>{benefit}</span>)}
                  </p>
                ) : <p>不明</p>}
              </div>
              <div>
                <b>アクセス</b>
                <p>{selected.accessInfo || "不明"}</p>
              </div>
              <div>
                <b>駐車場</b>
                <p>{selected.parkingInfo || "不明"}</p>
              </div>
              <div>
                <b>参拝時間</b>
                <p>{selected.worshipHours || "不明"}</p>
              </div>
            </div>

            <h3>由緒 — なぜこの場所に鎮座するのか</h3>
            <div className="provenance-list">
              {selected.founded && (
                <div className="provenance-item">
                  <b>創建</b>
                  <p className="history">{selected.founded}</p>
                </div>
              )}
              {selected.history && (
                <div className="provenance-item">
                  <b>歴史</b>
                  <p className="history">{selected.history}</p>
                </div>
              )}
              {selected.nameOrigin && (
                <div className="provenance-item">
                  <b>社名の由来</b>
                  <p className="history">{selected.nameOrigin}</p>
                </div>
              )}
              {selected.culturalProperties && (
                <div className="provenance-item">
                  <b>文化財</b>
                  <p className="history">{selected.culturalProperties}</p>
                </div>
              )}
              {!selected.founded && !selected.history && !selected.nameOrigin && !selected.culturalProperties && (
                <p className="unknown-value">由緒の詳細は登録されていません。</p>
              )}
            </div>

            {selected.sources.length > 0 ? (
              <div className="source-list">
                {selected.sources.map((src) => (
                  <a key={src.url + src.fieldName} href={src.url} target="_blank" rel="noreferrer" className="source">
                    情報出典: {src.name} ↗
                    <small>最終確認: {src.verifiedAt}</small>
                  </a>
                ))}
              </div>
            ) : (
              <p className="unknown-value">出典情報は登録されていません。</p>
            )}

            <div className="sheet-actions">
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${selected.latitude},${selected.longitude}`}
                target="_blank"
                rel="noreferrer"
                className="primary-button"
              >
                ここへ行く
              </a>
              <Link href={`/map?focus=${selected.slug}`} className="outline-button">
                地図で見る
              </Link>
              <button
                className={favorites.includes(selected.id) ? "outline-button active" : "outline-button"}
                onClick={() => toggleFavorite(selected.id)}
              >
                {favorites.includes(selected.id) ? "★ お気に入り済み" : "☆ お気に入りに追加"}
              </button>
              {!showVisitForm && (
                <button className="outline-button" onClick={() => setShowVisitForm(true)}>
                  参拝を記録
                </button>
              )}
            </div>

            {showVisitForm && (
              <div className="visit-form-container">
                {user ? (
                  <VisitRecordForm
                    shrine={selected}
                    existingVisit={visits.find((v) => v.shrineId === selected.id) ?? null}
                    onSaved={() => {
                      reloadVisits();
                      setShowVisitForm(false);
                    }}
                    onCancel={() => setShowVisitForm(false)}
                  />
                ) : (
                  <div className="visit-login-prompt">
                    <p>参拝記録を保存するには、ログインが必要です。</p>
                    <div className="sheet-actions">
                      <Link href="/login" className="primary-button">
                        ログイン / 新規登録
                      </Link>
                      <button className="outline-button" onClick={() => setShowVisitForm(false)}>
                        キャンセル
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </article>
        </div>
      )}
    </main>
  );
}
