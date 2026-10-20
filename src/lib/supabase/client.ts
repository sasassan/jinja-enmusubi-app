import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null = null;
let browserCredentials: { url: string; key: string } | null = null;
let browserClientFailed = false;

function createClient(url: string, key: string): SupabaseClient | null {
  try {
    browserClient = createSupabaseClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
    browserClientFailed = false;
    return browserClient;
  } catch (err) {
    browserClientFailed = true;
    console.error("ブラウザ Supabase クライアントの作成に失敗しました:", err);
    return null;
  }
}

/**
 * SupabaseProvider から URL/key を受け取り、ブラウザクライアントを初期化する。
 * 失敗しても例外を上げず、後続の getSupabaseBrowserClient が復旧できるよう credentials は保持する。
 */
export function createBrowserSupabaseClient(url: string, key: string): SupabaseClient | null {
  browserCredentials = { url, key };
  return createClient(url, key);
}

export function getSupabaseBrowserClient(): SupabaseClient {
  if (browserClient) return browserClient;

  if (browserCredentials && !browserClientFailed) {
    const client = createClient(browserCredentials.url, browserCredentials.key);
    if (client) return client;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "Supabase ブラウザクライアントが初期化されていません。AuthProvider/SupabaseProvider で初期化するか、NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY を設定してください。"
    );
  }

  const client = createClient(url, key);
  if (client) return client;

  throw new Error("Supabase ブラウザクライアントの作成に失敗しました。");
}
