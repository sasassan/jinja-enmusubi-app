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

  useEffect(() => {
    let active = true;
    getSiteData()
      .then((data) => {
        if (active) setSiteData(data);
      })
      .catch(() => {
        if (active) setSiteData(EMPTY_SITE_DATA);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return { ...siteData, isLoading };
}
