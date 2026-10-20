"use client";

import ShrineExplorer from "@/components/ShrineExplorer";
import { useClientSiteData } from "@/components/ClientSiteData";

export default function Home() {
  const { shrines, figures, discoveryGroups, source } = useClientSiteData();
  return (
    <ShrineExplorer shrines={shrines} figures={figures} discoveryGroups={discoveryGroups} dataSource={source} />
  );
}
