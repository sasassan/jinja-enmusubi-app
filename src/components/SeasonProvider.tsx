"use client";

import { createContext, useContext, useEffect, useState, type CSSProperties, type ReactNode } from "react";

export type Season = "spring" | "summer" | "autumn" | "winter" | "newyear";

type SeasonContextValue = {
  season: Season | null;
  label: string;
};

const seasonLabels: Record<Season, string> = {
  spring: "春",
  summer: "夏",
  autumn: "秋",
  winter: "冬",
  newyear: "正月",
};

const SeasonContext = createContext<SeasonContextValue>({ season: null, label: "" });

function getSeason(date: Date): Season {
  const month = date.getMonth() + 1;
  const day = date.getDate();

  if (month === 1 && day <= 15) return "newyear";
  if (month >= 3 && month <= 5) return "spring";
  if (month >= 6 && month <= 8) return "summer";
  if (month >= 9 && month <= 11) return "autumn";
  return "winter";
}

export function useSeason() {
  return useContext(SeasonContext);
}

export function SeasonProvider({ children }: { children: ReactNode }) {
  const [season, setSeason] = useState<Season | null>(null);

  useEffect(() => {
    const updateSeason = () => {
      const nextSeason = getSeason(new Date());
      document.documentElement.dataset.season = nextSeason;
      setSeason(nextSeason);
    };

    updateSeason();
    const interval = window.setInterval(updateSeason, 60 * 60 * 1000);
    window.addEventListener("focus", updateSeason);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", updateSeason);
    };
  }, []);

  const contextValue = { season, label: season ? seasonLabels[season] : "" };

  return (
    <SeasonContext.Provider value={contextValue}>
      {season === "newyear" && (
        <aside className="newyear-banner" role="note">
          <span aria-hidden="true">🎍</span> 初詣におすすめ <span aria-hidden="true">🎍</span>
        </aside>
      )}
      {season && season !== "newyear" && (
        <div className={`season-atmosphere season-atmosphere--${season}`} aria-hidden="true">
          {Array.from({ length: 14 }, (_, index) => {
            const style = {
              left: `${(index * 37 + 7) % 100}%`,
              animationDelay: `${(index % 7) * -1.8}s`,
              animationDuration: `${12 + (index % 5) * 2}s`,
            } satisfies CSSProperties;
            return <span className="season-particle" key={index} style={style} />;
          })}
        </div>
      )}
      {children}
    </SeasonContext.Provider>
  );
}
