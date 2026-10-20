import { getSupabaseBrowserClient } from "@/lib/supabase/client";

/**
 * クライアントサイドで現在のユーザーが管理者か判定する。
 */
export async function isAdminBrowser(): Promise<boolean> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.rpc("is_admin");
  if (error) {
    console.error("is_admin RPC error:", error);
    return false;
  }
  return !!data;
}
