"use client";

import MapPageClient from "@/components/map/MapPageClient";
import { useClientSiteData } from "@/components/ClientSiteData";

export default function MapPage() {
  const { shrines, figures, discoveryGroups, source, isLoading } = useClientSiteData();
  return (
    <MapPageClient shrines={shrines} figures={figures} discoveryGroups={discoveryGroups} dataSource={source} isLoading={isLoading} />
  );
}
