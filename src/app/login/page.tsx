"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const supabase = getSupabaseBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

      if (signInError) {
        setError("メールアドレスまたはパスワードが正しくありません。");
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("ログイン機能を現在利用できません。時間をおいて再度お試しください。");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <header className="site-header">
        <Link href="/" className="wordmark" style={{ textDecoration: "none" }}>
          神社御縁
        </Link>
      </header>

      <section className="hero">
        <Link href="/" className="goshuincho-back">
          ← 神社を探す
        </Link>
        <p className="eyebrow">SIGN IN</p>
        <h1>ログイン</h1>
        <p>
          お気に入りや参拝記録を、端末を超えて管理するにはログインが必要です。
        </p>
      </section>

      <section className="section-pad auth-section">
        <form onSubmit={handleSubmit} className="auth-form auth-card">
          <label className="auth-field">
            <span>メールアドレス</span>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
            />
          </label>

          <label className="auth-field">
            <span>パスワード</span>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              placeholder="8文字以上"
            />
          </label>

          {error && (
            <p className="auth-error" role="alert">
              {error}
            </p>
          )}

          <button type="submit" className="primary-button" disabled={isLoading} aria-busy={isLoading}>
            {isLoading ? "ログイン中…" : "ログインする"}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            アカウントをお持ちでない方は
            <Link href="/signup">新規登録</Link>
          </p>
          <p className="auth-note">
            ログインすると、
            <Link href="/privacy">プライバシーポリシー</Link>
            に同意したものとみなされます。
          </p>
        </div>
      </section>
    </main>
  );
}
