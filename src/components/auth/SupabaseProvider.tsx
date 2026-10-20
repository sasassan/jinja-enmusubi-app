"use client";

import { useEffect } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { AuthProvider } from "./AuthProvider";
import type { ReactNode } from "react";

export function SupabaseProvider({
  children,
  supabaseUrl,
  supabaseAnonKey,
}: {
  children: ReactNode;
  supabaseUrl: string;
  supabaseAnonKey: string;
}) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (supabaseUrl && supabaseAnonKey) {
      createBrowserSupabaseClient(supabaseUrl, supabaseAnonKey);
    }
  }, [supabaseUrl, supabaseAnonKey]);

  return <AuthProvider initialUser={null}>{children}</AuthProvider>;
}
