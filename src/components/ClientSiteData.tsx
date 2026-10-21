"use client";

import { useEffect, useState } from "react";
import { getSiteData, type SiteData } from "@/lib/data";

const EMPTY_SITE_DATA: SiteData = {
  shrines: [],
  deities: [],
  figures: [],
  lineages: [],
  benefits: [],
  discoveryGroups: [],
  source: "fallback",
};

export function useClientSiteData() {
  const [siteData, setSiteData] = useState<SiteData>(EMPTY_SITE_DATA);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let active = true;
    getSiteData()
      .then((data) => {
        if (!active) return;
        setSiteData(data);
        setError(data.source === "fallback" ? "神社データを取得できませんでした。通信環境を確認して再試行してください。" : null);
      })
      .catch(() => {
        if (!active) return;
        setSiteData(EMPTY_SITE_DATA);
        setError("神社データの読み込みに失敗しました。");
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [reloadToken]);

  const retry = () => {
    setIsLoading(true);
    setError(null);
    setReloadToken((value) => value + 1);
  };

  return { ...siteData, isLoading, error, retry };
}
