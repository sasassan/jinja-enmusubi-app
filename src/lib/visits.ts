"use client";

import { useEffect, useState, useCallback } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { syncUserBadges } from "@/lib/badges";
import type { User } from "@supabase/supabase-js";

export type Visit = {
  id: string;
  shrineId: string;
  shrineName: string;
  shrineSlug: string;
  visitedAt: string; // ISO date
  memo: string;
  createdAt: string;
  receivedPhysicalGoshuin: boolean;
};

export type VisitInput = {
  shrineId: string;
  visitedAt: string;
  memo: string;
  receivedPhysicalGoshuin?: boolean;
};

export async function fetchVisits(): Promise<Visit[]> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("visits")
    .select(`id, shrine_id, visited_at, memo, created_at, received_physical_goshuin, shrines ( name, slug )`)
    .order("visited_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch visits:", error);
    throw error;
  }

  return (data ?? []).map((row: unknown) => {
    const r = row as {
      id: string;
      shrine_id: string;
      visited_at: string;
      memo: string | null;
      created_at: string;
      received_physical_goshuin: boolean | null;
      shrines: { name: string; slug: string } | null;
    };
    return {
      id: r.id,
      shrineId: r.shrine_id,
      shrineName: r.shrines?.name ?? "不明な神社",
      shrineSlug: r.shrines?.slug ?? "",
      visitedAt: r.visited_at.slice(0, 10),
      memo: r.memo ?? "",
      createdAt: r.created_at,
      receivedPhysicalGoshuin: r.received_physical_goshuin ?? false,
    };
  });
}

export async function createVisit(input: VisitInput, userId: string): Promise<string> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.from("visits").insert({
    shrine_id: input.shrineId,
    user_id: userId,
    visited_at: `${input.visitedAt}T00:00:00+09:00`,
    memo: input.memo.trim() || null,
    received_physical_goshuin: input.receivedPhysicalGoshuin ?? false,
  }).select("id").single();
  if (error) throw error;
  try {
    await syncUserBadges(userId);
  } catch (badgeError) {
    console.error("Failed to update earned badges:", badgeError);
  }
  return data.id;
}

export async function updateVisit(id: string, input: Partial<VisitInput>): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const updates: Record<string, unknown> = {};
  if (input.visitedAt !== undefined) {
    updates.visited_at = `${input.visitedAt}T00:00:00+09:00`;
  }
  if (input.memo !== undefined) {
    updates.memo = input.memo.trim() || null;
  }
  if (input.receivedPhysicalGoshuin !== undefined) {
    updates.received_physical_goshuin = input.receivedPhysicalGoshuin;
  }
  const { error } = await supabase.from("visits").update(updates).eq("id", id);
  if (error) throw error;
  try {
    const { data, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (data.user) await syncUserBadges(data.user.id);
  } catch (badgeError) {
    console.error("Failed to update earned badges:", badgeError);
  }
}

export async function deleteVisit(id: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.from("visits").delete().eq("id", id);
  if (error) throw error;
}

/**
 * 参拝記録の一覧を取得するフック。
 * 未ログイン時は空配列を返し、エラー時も空配列でフォールバックする。
 */
export function useVisits(user: User | null) {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!user) {
        setVisits([]);
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchVisits();
        if (!cancelled) setVisits(data);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e : new Error("参拝記録の取得に失敗しました"));
          setVisits([]);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const reload = useCallback(async () => {
    if (!user) {
      setVisits([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchVisits();
      setVisits(data);
    } catch (e) {
      setError(e instanceof Error ? e : new Error("参拝記録の取得に失敗しました"));
      setVisits([]);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  return { visits, isLoading, error, reload };
}
