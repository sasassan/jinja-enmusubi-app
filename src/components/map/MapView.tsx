"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import type { Shrine } from "@/lib/types";
import type { GeoState } from "@/lib/filters";

const JAPAN_CENTER: [number, number] = [36.5, 137.5];
const JAPAN_ZOOM = 5;

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function shrinePinIcon(highlighted: boolean, label: string) {
  const ariaLabel = escapeHtml(`${label}の位置、詳細を開く`);
  return L.divIcon({
    className: "shrine-pin-icon",
    html: `<span role="button" tabindex="0" aria-label="${ariaLabel}" style="--pin-color:${highlighted ? "#9e2b24" : "#D4483A"}"></span>`,
    iconSize: [26, 34],
    iconAnchor: [13, 32],
    popupAnchor: [0, -30],
  });
}

const CURRENT_LOCATION_ICON = L.divIcon({
  className: "current-location-icon",
  html: `<span class="pulse"></span><span class="dot"></span>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

/** 詳細への深いリンク(?focus=slug)やフォーカス指定があった場合、その神社へ地図をなめらかに移動する。 */
function FlyToFocus({ position }: { position: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.flyTo(position, Math.max(map.getZoom(), 14), { duration: 0.6 });
    }
  }, [position, map]);
  return null;
}

function FlyToResults({ positions, active }: { positions: [number, number][]; active: boolean }) {
  const map = useMap();
  useEffect(() => {
    if (!active || positions.length === 0) return;
    if (positions.length === 1) {
      map.flyTo(positions[0], Math.max(map.getZoom(), 14), { duration: 0.6 });
      return;
    }
    map.fitBounds(L.latLngBounds(positions), { padding: [32, 32], maxZoom: 11, animate: true, duration: 0.6 });
  }, [active, map, positions]);
  return null;
}

function FlyToCurrentLocation({ latitude, longitude }: { latitude: number | null; longitude: number | null }) {
  const map = useMap();
  useEffect(() => {
    if (latitude != null && longitude != null) {
      map.flyTo([latitude, longitude], Math.max(map.getZoom(), 12), { duration: 0.6 });
    }
  }, [latitude, longitude, map]);
  return null;
}

export type MapMarkerShrine = { shrine: Shrine; distanceKm: number | null };

export default function MapView({
  shrines,
  geo,
  focusSlug,
  highlightResults,
}: {
  shrines: MapMarkerShrine[];
  geo: GeoState;
  focusSlug: string | null;
  highlightResults: boolean;
}) {
  const [tileError, setTileError] = useState(false);
  const [isOffline, setIsOffline] = useState(() => typeof navigator !== "undefined" && !navigator.onLine);

  useEffect(() => {
    const goOnline = () => setIsOffline(false);
    const goOffline = () => setIsOffline(true);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  const focusShrine = useMemo(
    () => shrines.find((s) => s.shrine.slug === focusSlug)?.shrine ?? null,
    [shrines, focusSlug]
  );
  const focusPosition: [number, number] | null = focusShrine && focusShrine.latitude != null && focusShrine.longitude != null
    ? [focusShrine.latitude, focusShrine.longitude]
    : null;
  const resultPositions = useMemo(
    () => shrines.filter(({ shrine }) => shrine.latitude != null && shrine.longitude != null)
      .map(({ shrine }) => [shrine.latitude!, shrine.longitude!] as [number, number]),
    [shrines]
  );
  const markers = useMemo(
    () => shrines.filter(({ shrine }) => shrine.latitude != null && shrine.longitude != null)
      .map(({ shrine, distanceKm }) => ({
      shrine,
      distanceKm,
      icon: shrinePinIcon(shrine.slug === focusSlug || highlightResults, shrine.name),
    })),
    [shrines, focusSlug, highlightResults]
  );

  const initialCenter: [number, number] = geo.status === "granted" ? [geo.lat, geo.lng] : JAPAN_CENTER;
  const initialZoom = geo.status === "granted" ? 12 : JAPAN_ZOOM;

  return (
    <div className="map-canvas">
      <MapContainer
        center={initialCenter}
        zoom={initialZoom}
        scrollWheelZoom
        style={{ height: "100%", width: "100%" }}
        aria-label="神社の位置を示す地図。マーカーはTabキーで移動でき、EnterまたはSpaceで詳細情報を開きます。"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors'
          maxZoom={19}
          eventHandlers={{
            tileerror: () => setTileError(true),
            tileload: () => setTileError(false),
          }}
        />

        <MarkerClusterGroup chunkedLoading maxClusterRadius={56} spiderfyOnMaxZoom disableClusteringAtZoom={16}>
          {markers.map(({ shrine, distanceKm, icon }) => (
            <Marker
              key={shrine.id}
              position={[shrine.latitude!, shrine.longitude!]}
              icon={icon}
              keyboard
              alt={shrine.name}
            >
              <Popup minWidth={200}>
                <div className="map-popup">
                  <p className="map-popup-pref">
                    {shrine.prefecture}
                    {shrine.municipality ? ` · ${shrine.municipality}` : ""}
                  </p>
                  <strong>{shrine.name}</strong>
                  <p className="map-popup-reading">{shrine.reading || "読み不明"}</p>
                  <p className="map-popup-address">{shrine.address || `${shrine.prefecture}${shrine.municipality}`}</p>
                  <p className="map-popup-deity">
                    {shrine.deityRefs.find((d) => d.role === "principal")?.name ??
                      shrine.deities[0] ??
                      "御祭神情報なし"}
                  </p>
                  {distanceKm != null && (
                    <p className="map-popup-distance">現在地から約{distanceKm.toFixed(1)}km</p>
                  )}
                  <div className="map-popup-actions">
                    <Link href={`/shrines/detail?slug=${encodeURIComponent(shrine.slug)}`}>詳細を見る</Link>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${shrine.latitude},${shrine.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      ここへ行く
                    </a>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>

        {geo.status === "granted" && (
          <Marker position={[geo.lat, geo.lng]} icon={CURRENT_LOCATION_ICON} zIndexOffset={1000}>
            <Popup>現在地</Popup>
          </Marker>
        )}

        <FlyToCurrentLocation
          latitude={geo.status === "granted" ? geo.lat : null}
          longitude={geo.status === "granted" ? geo.lng : null}
        />
        <FlyToResults positions={resultPositions} active={highlightResults} />
        <FlyToFocus position={focusPosition} />
      </MapContainer>

      {(tileError || isOffline) && (
        <div className="map-tile-error" role="status">
          地図タイルを読み込めませんでした。通信状況をご確認のうえ再度お試しください。
        </div>
      )}
    </div>
  );
}
