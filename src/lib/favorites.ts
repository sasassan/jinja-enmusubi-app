"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

const FAVORITES_KEY = "jinja-goen:favorites";

function readLocalFavorites(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(FAVORITES_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

function writeLocalFavorites(ids: string[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(ids));
}

export function clearLocalFavorites() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(FAVORITES_KEY);
}

async function fetchServerFavorites(): Promise<string[]> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.from("favorites").select("shrine_id");
  if (error) {
    console.error("Failed to fetch favorites:", error);
    return [];
  }
  return (data ?? []).map((row) => row.shrine_id);
}

async function addServerFavorite(shrineId: string, userId: string) {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.from("favorites").insert({ shrine_id: shrineId, user_id: userId });
  if (error) console.error("Failed to add favorite:", error);
  return !error;
}

async function removeServerFavorite(shrineId: string, userId: string) {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.from("favorites").delete().eq("shrine_id", shrineId).eq("user_id", userId);
  if (error) console.error("Failed to remove favorite:", error);
  return !error;
}

/**
 * お気に入りの状態を管理するフック。
 * 未ログイン時は localStorage のみ、ログイン時は localStorage とサーバーの和集合を保持する。
 * ログイン時にローカルのお気に入りをサーバーへマージする。
 */
export function useFavorites(user: User | null) {
  const [favorites, setFavorites] = useState<string[]>(() => readLocalFavorites());
  const [isSyncing, setIsSyncing] = useState(false);
  const hasSyncedForUser = useRef<string | undefined>(undefined);

  // ログイン時のマージ同期
  useEffect(() => {
    const userId = user?.id;
    if (!userId || hasSyncedForUser.current === userId) return;

    async function sync() {
      if (!userId) return;
      setIsSyncing(true);
      try {
        const local = readLocalFavorites();
        const server = await fetchServerFavorites();

        // 両方を和集合にマージ
        const merged = Array.from(new Set([...local, ...server]));
        writeLocalFavorites(merged);
        setFavorites(merged);

        // サーバーに存在しないローカル分を追加
        const toAdd = local.filter((id) => !server.includes(id));
        await Promise.all(toAdd.map((id) => addServerFavorite(id, userId)));
      } finally {
        setIsSyncing(false);
        hasSyncedForUser.current = userId;
      }
    }

    sync();
  }, [user]);

  const toggleFavorite = useCallback(
    async (shrineId: string) => {
      const current = readLocalFavorites();
      const isAdding = !current.includes(shrineId);
      const next = isAdding ? [shrineId, ...current] : current.filter((id) => id !== shrineId);

      // 楽観的に localStorage を更新
      writeLocalFavorites(next);
      setFavorites(next);

      // ログイン中はサーバーにも反映
      if (user) {
        if (isAdding) {
          await addServerFavorite(shrineId, user.id);
        } else {
          await removeServerFavorite(shrineId, user.id);
        }
      }
    },
    [user]
  );

  return { favorites, toggleFavorite, isSyncing };
}
