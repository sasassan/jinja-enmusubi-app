"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("パスワードが一致しません。");
      return;
    }
    if (password.length < 8) {
      setError("パスワードは8文字以上で入力してください。");
      return;
    }

    setIsLoading(true);

    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: displayName || email.split("@")[0] },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      // 確認メール不要の環境では自動ログインされる。確認メールが有効な場合は session が null になる。
      if (data.session) {
        // profiles レコードを作成（失敗してもログイン自体は継続）
        if (data.user) {
          try {
            await supabase.from("profiles").insert({
              id: data.user.id,
              display_name: displayName || null,
            });
          } catch (profileErr) {
            console.error("Failed to create profile:", profileErr);
          }
        }
        setSuccess(true);
        router.push("/");
        router.refresh();
      } else {
        setSuccess(true);
      }
    } catch {
      setError("新規登録機能を現在利用できません。時間をおいて再度お試しください。");
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
        <p className="eyebrow">SIGN UP</p>
        <h1>新規登録</h1>
        <p>
          メールアドレスとパスワードで、アカウントを作成します。
        </p>
      </section>

      <section className="section-pad auth-section">
        {success ? (
          <div className="auth-success">
            <p>アカウントを作成しました。</p>
            <p className="auth-note">
              確認メールをお送りした場合は、メール内のリンクをクリックして登録を完了してください。
            </p>
            <p className="auth-note">
              <Link href="/login">ログイン画面へ</Link>
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form auth-card">
            <label className="auth-field">
              <span>表示名（任意）</span>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="例：たろう"
              />
            </label>

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
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                placeholder="8文字以上"
              />
            </label>

            <label className="auth-field">
              <span>パスワード（確認）</span>
              <input
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
              {isLoading ? "登録中…" : "アカウントを作成する"}
            </button>
          </form>
        )}

        <div className="auth-footer">
          <p>
            すでにアカウントをお持ちの方は
            <Link href="/login">ログイン</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
