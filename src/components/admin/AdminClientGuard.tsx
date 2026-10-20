"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { isAdminBrowser } from "@/lib/admin-browser";

export function AdminClientGuard({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const [verification, setVerification] = useState<{ userId: string; allowed: boolean } | null>(null);
  const userId = user?.id;

  useEffect(() => {
    if (!userId) return;

    let active = true;
    isAdminBrowser()
      .then((allowed) => {
        if (active) setVerification({ userId, allowed });
      })
      .catch(() => {
        if (active) setVerification({ userId, allowed: false });
      });

    return () => {
      active = false;
    };
  }, [userId]);

  if (isLoading || (userId && verification?.userId !== userId)) {
    return <p className="admin-note" role="status">管理者権限を確認しています…</p>;
  }

  if (!user || !verification?.allowed || verification.userId !== user.id) {
    return (
      <section className="admin-unauthorized" role="alert">
        <h1>アクセス権限がありません</h1>
        <p>管理者として登録されたアカウントでログインしてください。</p>
        <div className="admin-actions">
          <Link href="/" className="admin-button secondary">神社を探す</Link>
        </div>
      </section>
    );
  }

  return children;
}
