"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { haversineKm } from "@/lib/types";

type NearbyShrine = {
  slug: string;
  name: string;
  reading: string;
  prefecture: string;
  municipality: string;
  latitude: number;
  longitude: number;
  roleLabel: string;
};

type GeoState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "granted"; lat: number; lng: number }
  | { status: "denied"; message: string };

/** 神様・人物の詳細ページで使う「関連する神社」一覧。現在地取得時は距離順に並べ替える。 */
export function NearbyShrineList({ shrines }: { shrines: NearbyShrine[] }) {
  const [geo, setGeo] = useState<GeoState>({ status: "idle" });

  function handleNearby() {
    if (!navigator.geolocation) {
      setGeo({ status: "denied", message: "このブラウザは位置情報に対応していません。" });
      return;
    }
    setGeo({ status: "loading" });
    navigator.geolocation.getCurrentPosition(
      (pos) => setGeo({ status: "granted", lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setGeo({ status: "denied", message: "位置情報を取得できませんでした。" }),
      { timeout: 10000, maximumAge: 60000 }
    );
  }

  const sorted = useMemo(() => {
    if (geo.status !== "granted") return shrines.map((s) => ({ shrine: s, distanceKm: null as number | null }));
    return [...shrines]
      .map((s) => ({ shrine: s, distanceKm: haversineKm(geo.lat, geo.lng, s.latitude, s.longitude) }))
      .sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
  }, [shrines, geo]);

  if (shrines.length === 0) {
    return (
      <div className="empty-state">
        <strong>関連する神社は登録されていません</strong>
        <p>データ拡充を予定しています。</p>
      </div>
    );
  }

  return (
    <div>
      <button className="outline-button" onClick={handleNearby} disabled={geo.status === "loading"}>
        {geo.status === "granted" ? "現在地から近い順に表示中" : "現在地から近い順に並べる"}
      </button>
      {geo.status === "denied" && <p className="unknown-value">{geo.message}</p>}
      <div className="entity-list" style={{ marginTop: 16 }}>
        {sorted.map(({ shrine, distanceKm }) => (
          <Link href={`/shrines/detail?slug=${encodeURIComponent(shrine.slug)}`} key={shrine.slug} className="entity-card">
            <div className="shrine-copy" style={{ padding: "16px" }}>
              <p className="eyebrow">
                {shrine.prefecture} {shrine.municipality}
                {distanceKm != null ? ` · 約${distanceKm.toFixed(1)}km` : ""}
              </p>
              <h3>{shrine.name}</h3>
              <p className="reading">{shrine.reading}</p>
              <div className="tags">
                <span>{shrine.roleLabel}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
