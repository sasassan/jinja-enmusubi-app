"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
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

// Leaflet はブラウザの window/document に依存するため、Next.js の SSR とは競合する。
// dynamic import + ssr:false でクライアントのみに読み込み、初回 Home 表示の負荷にも影響させない。
const MapView = dynamic(() => import("@/components/map/MapView"), {
  ssr: false,
  loading: () => (
    <div className="map-canvas map-canvas-loading" aria-busy="true">
      地図を読み込んでいます…
    </div>
  ),
});

const RADIUS_OPTIONS = [3, 5, 10, 30, 50];
const SEARCH_DEBOUNCE_MS = 180;
const MAP_RESULT_PAGE_SIZE = 50;

type DiscoveryGroup = { label: string; value: string; items: string[] };

export default function MapPageClient({
  shrines,
  figures,
  discoveryGroups,
  dataSource,
  isLoading,
}: {
  shrines: Shrine[];
  figures: Figure[];
  discoveryGroups: DiscoveryGroup[];
  dataSource: "db" | "fallback";
  isLoading: boolean;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [visibleResults, setVisibleResults] = useState({ key: "", count: MAP_RESULT_PAGE_SIZE });
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [radiusKm, setRadiusKm] = useState<number | null>(null);
  const [focusSlug, setFocusSlug] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [geo, setGeo] = useState<GeoState>({ status: "idle" });

  // URL クエリから検索条件を復元する。useSearchParams は CSR 完了後に値が確定するため、
  // useState の遅延初期化では空の searchParams が使われることがある。初回マウント時に一度だけ復元する。
  const filtersInitializedRef = useRef(false);
  useEffect(() => {
    if (filtersInitializedRef.current) return;
    filtersInitializedRef.current = true;
    const decoded = decodeFiltersFromParams(searchParams);
    setQuery(decoded.query);
    setFilters(decoded.filters);
    setRadiusKm(decoded.radiusKm);
    setFocusSlug(searchParams.get("focus"));
  }, [searchParams]);

  // /map → ホーム でも検索条件を引き継ぐため、現在のクエリを付与した戻りリンクを生成する
  const homeHref = useMemo(() => {
    const qs = searchParams.toString();
    return qs ? `/?${qs}` : "/";
  }, [searchParams]);

  // 検索条件が変わるたびに URL を同期し、共有・再読み込み・Home への戻り遷移でも条件を保持できるようにする。
  // 初回マウント時の復元が完了するまでは実行しない（空の state で URL を上書きするのを防ぐ）。
  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    if (!filtersInitializedRef.current) return;
    const params = encodeFiltersToParams(new URLSearchParams(), { query, filters, radiusKm });
    const qs = params.toString();
    router.replace(qs ? `/map?${qs}` : "/map", { scroll: false });
  }, [query, filters, radiusKm]);
  /* eslint-enable react-hooks/exhaustive-deps */

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedQuery(query.trim()), SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timeout);
  }, [query]);

  const prefectures = useMemo(
    () => Array.from(new Set(shrines.map((s) => s.prefecture))).filter(Boolean),
    [shrines]
  );
  const figureNames = useMemo(() => figures.map((f) => f.name).sort((a, b) => a.localeCompare(b, "ja")), [figures]);
  const activeFilterCount = Object.values(filters).filter(Boolean).length + (radiusKm ? 1 : 0);
  const hasSearchConditions = Boolean(query.trim() || activeFilterCount > 0);

  function setSingleFilter(key: keyof Filters, value: string) {
    setFilters((prev) => ({ ...prev, [key]: value && prev[key] !== value ? value : null }));
  }

  function handleLocate() {
    if (!navigator.geolocation) {
      setGeo({ status: "denied", message: "このブラウザは位置情報に対応していません。地図は初期表示のまま検索できます。" });
      return;
    }
    setGeo({ status: "loading" });
    navigator.geolocation.getCurrentPosition(
      (pos) => setGeo({ status: "granted", lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => {
        const msg =
          err.code === err.PERMISSION_DENIED
            ? "位置情報の利用が許可されていません。地図は初期表示のまま検索できます。"
            : err.code === err.TIMEOUT
            ? "位置情報の取得がタイムアウトしました。地図は初期表示のまま検索できます。"
            : "位置情報を取得できませんでした。地図は初期表示のまま検索できます。";
        setGeo({ status: "denied", message: msg });
      },
      { timeout: 10000, maximumAge: 60000 }
    );
  }

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
  const visibleResultCount = visibleResults.key === resultKey ? visibleResults.count : MAP_RESULT_PAGE_SIZE;
  const visibleResultItems = results.slice(0, visibleResultCount);

  return (
    <main className="map-page">
      <header className="site-header">
        <Link href={homeHref} className="back-link" aria-label="神社を探すへ戻る">
          ← <span className="wordmark">地図で探す</span>
        </Link>
      </header>

      {isLoading ? (
        <p className="data-fallback-notice" role="status">全国の神社データを読み込んでいます…</p>
      ) : dataSource === "fallback" ? (
        <p className="data-fallback-notice" role="alert">
          現在データを読み込めません。ネットワーク環境をご確認のうえ、再読み込みしてください。
        </p>
      ) : null}

      {geo.status === "denied" && (
        <p className="status-banner" role="status">
          {geo.message}
        </p>
      )}

      <div className="map-toolbar">
        <label className="search-box map-search">
          <span aria-hidden="true">⌕</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="神社名・住所・御祭神・御利益・由緒で検索"
            aria-label="神社名・住所・御祭神・御利益・由緒で検索"
          />
        </label>

        <div className="map-toolbar-actions">
          <button className="chip filter-toggle" aria-expanded={filterOpen} onClick={() => setFilterOpen((v) => !v)}>
            絞り込み{activeFilterCount > 0 ? `（${activeFilterCount}）` : ""}
          </button>
          <button className="chip locate-button" onClick={handleLocate} disabled={geo.status === "loading"} aria-busy={geo.status === "loading"}>
            <span aria-hidden="true">⌖</span>
            {geo.status === "loading"
              ? "取得中…"
              : geo.status === "granted"
              ? "現在地：取得済み"
              : "現在地を取得"}
          </button>
        </div>

        {filterOpen && (
          <div className="map-filter-panel">
            <div className="discovery-card">
              <label htmlFor="map-deity-filter">神様から探す</label>
              <select id="map-deity-filter" value={filters.deity ?? ""} onChange={(event) => setSingleFilter("deity", event.target.value)}>
                <option value="">すべての御祭神</option>
                {discoveryGroups.find((group) => group.value === "deity")?.items.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </div>
            <div className="discovery-card">
              <label htmlFor="map-lineage-filter">信仰系統から探す</label>
              <select id="map-lineage-filter" value={filters.lineage ?? ""} onChange={(event) => setSingleFilter("lineage", event.target.value)}>
                <option value="">すべての系統</option>
                {discoveryGroups.find((group) => group.value === "lineage")?.items.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </div>
            <div className="discovery-card">
              <label htmlFor="map-benefit-filter">御利益から探す</label>
              <select id="map-benefit-filter" value={filters.benefit ?? ""} onChange={(event) => setSingleFilter("benefit", event.target.value)}>
                <option value="">すべての御利益</option>
                {discoveryGroups.find((group) => group.value === "benefit")?.items.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </div>
            {figureNames.length > 0 && (
              <div className="discovery-card">
                <label htmlFor="map-figure-filter">人物から探す</label>
                <select id="map-figure-filter" value={filters.figure ?? ""} onChange={(event) => setSingleFilter("figure", event.target.value)}>
                  <option value="">すべての人物</option>
                  {figureNames.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </div>
            )}
            <div className="discovery-card">
              <label htmlFor="map-region-filter">地方から探す</label>
              <select id="map-region-filter" value={filters.region ?? ""} onChange={(event) => setSingleFilter("region", event.target.value)}>
                <option value="">全国</option>
                {REGION_GROUPS.map(({ name }) => <option key={name} value={name}>{name}</option>)}
              </select>
            </div>
            <div className="discovery-card">
              <label htmlFor="map-prefecture-filter">都道府県から探す</label>
              <select id="map-prefecture-filter" value={filters.prefecture ?? ""} onChange={(event) => setSingleFilter("prefecture", event.target.value)}>
                <option value="">すべての都道府県</option>
                {prefectures.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </div>
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
            {hasSearchConditions && (
              <button
                className="clear-filter"
                onClick={() => {
                  setQuery("");
                  setFilters(EMPTY_FILTERS);
                  setRadiusKm(null);
                }}
              >
                検索条件をすべて解除
              </button>
            )}
          </div>
        )}
      </div>

      <MapView shrines={results} geo={geo} focusSlug={focusSlug} highlightResults={hasSearchConditions} />

      <section className="map-results section-pad">
        <div className="section-heading">
          <div>
            <p className="eyebrow">SHRINES ON MAP</p>
            <h2>地図上の神社</h2>
          </div>
          <span>{isLoading ? "読み込み中…" : `${results.length}件`}</span>
        </div>
        {isLoading ? (
          <p className="map-results-loading" role="status">検索できるようデータを準備しています…</p>
        ) : results.length > 0 ? (
          <>
            <div className="shrine-list">
              {visibleResultItems.map(({ shrine, distanceKm }) => (
                <Link href={`/shrines/detail?slug=${encodeURIComponent(shrine.slug)}`} key={shrine.id} className="entity-card map-result-card">
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
                </Link>
              ))}
            </div>
            {results.length > visibleResultCount && (
              <button
                className="outline-button map-load-more"
                onClick={() => setVisibleResults({ key: resultKey, count: visibleResultCount + MAP_RESULT_PAGE_SIZE })}
              >
                さらに50社を表示（残り{results.length - visibleResultCount}社）
              </button>
            )}
          </>
        ) : (
          <div className="empty-state">
            <DeityMotif />
            <strong>条件に合う神社が見つかりませんでした</strong>
            <p>キーワードを変えるか、「絞り込み」の条件を解除してお試しください。</p>
          </div>
        )}
      </section>
    </main>
  );
}
