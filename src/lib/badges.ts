"use client";

import { useCallback, useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export type Badge = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  iconEmoji: string | null;
  criteriaType: string;
  criteriaValue: number;
  earnedAt: string | null;
};

type BadgeRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon_emoji: string | null;
  criteria_type: string;
  criteria_value: number | null;
};

type VisitCriteriaRow = {
  shrine_id: string;
  visited_at: string;
  created_at: string;
  received_physical_goshuin: boolean | null;
  shrines: {
    name: string;
    address: string | null;
    prefectures: { name: string } | null;
  } | null;
};

type EarnedBadgeRow = { badge_id: string; earned_at: string };

function monthOf(visitedAt: string): number {
  const date = new Date(visitedAt);
  return new Date(date.getTime() + 9 * 60 * 60 * 1000).getUTCMonth() + 1;
}

function hourOfJst(dateValue: string): number {
  const date = new Date(dateValue);
  return new Date(date.getTime() + 9 * 60 * 60 * 1000).getUTCHours();
}

function uniqueShrineCount(visits: VisitCriteriaRow[]): number {
  return new Set(visits.map((visit) => visit.shrine_id)).size;
}

function criteriaCount(criteriaType: string, visits: VisitCriteriaRow[]): number {
  const prefectures = new Set(visits.map((visit) => visit.shrines?.prefectures?.name).filter((name): name is string => Boolean(name)));
  const countUniqueMatches = (matches: (visit: VisitCriteriaRow) => boolean) => uniqueShrineCount(visits.filter(matches));

  switch (criteriaType) {
    case "total_visits":
      return uniqueShrineCount(visits);
    case "ichinomiya_visits":
      return countUniqueMatches((visit) => /一之宮|一ノ宮|一宮|一の宮/.test(visit.shrines?.name ?? ""));
    case "spring_visits":
      return countUniqueMatches((visit) => [3, 4, 5].includes(monthOf(visit.visited_at)));
    case "autumn_visits":
      return countUniqueMatches((visit) => [9, 10, 11].includes(monthOf(visit.visited_at)));
    case "mountain_visits":
      return countUniqueMatches((visit) => /山|岳|峰/.test(`${visit.shrines?.name ?? ""}${visit.shrines?.address ?? ""}`));
    case "sea_visits":
      return countUniqueMatches((visit) => /海|浜|浦|湊|港|岬|磯|渚/.test(`${visit.shrines?.name ?? ""}${visit.shrines?.address ?? ""}`));
    case "goshuin_count":
      return visits.filter((visit) => visit.received_physical_goshuin === true).length;
    case "prefecture_count":
      return prefectures.size;
    case "early_visits":
      return visits.filter((visit) => hourOfJst(visit.created_at) < 6).length;
    case "november_visits":
      return visits.filter((visit) => monthOf(visit.visited_at) === 11).length;
    case "january_visits":
      return visits.filter((visit) => monthOf(visit.visited_at) === 1).length;
    default:
      return 0;
  }
}

export async function syncUserBadges(userId: string): Promise<Badge[]> {
  const supabase = getSupabaseBrowserClient();
  const [badgeResult, visitResult, earnedResult] = await Promise.all([
    supabase
      .from("badges")
      .select("id, name, slug, description, icon_emoji, criteria_type, criteria_value")
      .order("created_at", { ascending: true }),
    supabase
      .from("visits")
      .select("shrine_id, visited_at, created_at, received_physical_goshuin, shrines ( name, address, prefectures ( name ) )")
      .eq("user_id", userId)
      .order("visited_at", { ascending: true }),
    supabase.from("user_badges").select("badge_id, earned_at").eq("user_id", userId),
  ]);

  if (badgeResult.error) throw badgeResult.error;
  if (visitResult.error) throw visitResult.error;
  if (earnedResult.error) throw earnedResult.error;

  const badgeRows = (badgeResult.data ?? []) as BadgeRow[];
  const visitRows = (visitResult.data ?? []) as unknown as VisitCriteriaRow[];
  const earnedRows = (earnedResult.data ?? []) as EarnedBadgeRow[];
  const earnedIds = new Set(earnedRows.map((earned) => earned.badge_id));
  const newlyEarned = badgeRows
    .filter((badge) => !earnedIds.has(badge.id) && criteriaCount(badge.criteria_type, visitRows) >= (badge.criteria_value ?? 1))
    .map((badge) => ({ user_id: userId, badge_id: badge.id }));

  if (newlyEarned.length) {
    const { error } = await supabase
      .from("user_badges")
      .upsert(newlyEarned, { onConflict: "user_id,badge_id", ignoreDuplicates: true });
    if (error) throw error;
  }

  const { data: savedEarned, error: savedError } = await supabase
    .from("user_badges")
    .select("badge_id, earned_at")
    .eq("user_id", userId);
  if (savedError) throw savedError;

  const earnedAtById = new Map(((savedEarned ?? []) as EarnedBadgeRow[]).map((earned) => [earned.badge_id, earned.earned_at]));
  return badgeRows.map((badge) => ({
    id: badge.id,
    name: badge.name,
    slug: badge.slug,
    description: badge.description,
    iconEmoji: badge.icon_emoji,
    criteriaType: badge.criteria_type,
    criteriaValue: badge.criteria_value ?? 1,
    earnedAt: earnedAtById.get(badge.id) ?? null,
  }));
}

export function useUserBadges(user: User | null) {
  const [state, setState] = useState<{
    userId: string | null;
    badges: Badge[];
    isLoading: boolean;
    error: Error | null;
  }>({ userId: null, badges: [], isLoading: false, error: null });

  const reload = useCallback(async () => {
    if (!user) return;
    setState((current) => ({ ...current, userId: user.id, isLoading: true, error: null }));
    try {
      const badges = await syncUserBadges(user.id);
      setState({ userId: user.id, badges, isLoading: false, error: null });
    } catch (cause) {
      setState({
        userId: user.id,
        badges: [],
        isLoading: false,
        error: cause instanceof Error ? cause : new Error("バッジの取得に失敗しました"),
      });
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    let active = true;
    void syncUserBadges(user.id).then(
      (badges) => {
        if (active) setState({ userId: user.id, badges, isLoading: false, error: null });
      },
      (cause: unknown) => {
        if (active) {
          setState({
            userId: user.id,
            badges: [],
            isLoading: false,
            error: cause instanceof Error ? cause : new Error("バッジの取得に失敗しました"),
          });
        }
      }
    );
    return () => {
      active = false;
    };
  }, [user]);

  const matchesUser = state.userId === user?.id;
  return {
    badges: matchesUser ? state.badges : [],
    isLoading: Boolean(user) && (!matchesUser || state.isLoading),
    error: matchesUser ? state.error : null,
    reload,
  };
}
