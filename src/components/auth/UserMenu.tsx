"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";

export function UserMenu({ onNavigate }: { onNavigate?: () => void }) {
  const { user, isLoading, signOut } = useAuth();

  if (isLoading) {
    return (
      <div className="user-menu">
        <span className="user-menu-loading">読み込み中…</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="user-menu">
        <Link href="/login" className="nav-drawer-link" onClick={onNavigate}>
          ログイン / 新規登録
        </Link>
      </div>
    );
  }

  const displayName = user.user_metadata.display_name || user.email || "ユーザー";

  return (
    <div className="user-menu">
      <p className="user-menu-name">{displayName} さま</p>
      <Link href="/visits" className="nav-drawer-link" onClick={onNavigate}>
        参拝記録一覧
      </Link>
      <button
        type="button"
        className="nav-drawer-link"
        onClick={async () => {
          await signOut();
          onNavigate?.();
        }}
      >
        ログアウト
      </button>
    </div>
  );
}
