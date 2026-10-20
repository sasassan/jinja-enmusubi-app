"use client";

import { useEffect, useState } from "react";
import { ToriiMotif } from "@/components/motifs/DeityMotifs";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "pwa-install-dismissed";

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    // iOS Safari 独自プロパティ
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIos() {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

/**
 * PWA インストール導線。
 * - Android/Chrome 等: beforeinstallprompt をハンドリングし、ワンタップでインストールを促す。
 * - iOS Safari: beforeinstallprompt が発火しないため、共有→ホーム画面に追加の手順を案内する。
 * 既にインストール済み（standalone 表示）の場合や、ユーザーが閉じた場合は表示しない。
 */
function alreadyDismissed() {
  if (typeof window === "undefined") return true;
  return window.sessionStorage.getItem(DISMISS_KEY) === "1";
}

export function InstallPwaButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [ios] = useState(() => isIos());
  const [dismissed] = useState(() => isStandalone() || alreadyDismissed());
  const [visible, setVisible] = useState(() => !isStandalone() && !alreadyDismissed() && isIos());

  useEffect(() => {
    if (dismissed) return;

    const handleBeforeInstall = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
  }, [dismissed]);

  if (dismissed || !visible) return null;

  function handleDismiss() {
    setVisible(false);
    window.sessionStorage.setItem(DISMISS_KEY, "1");
  }

  async function handleInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setVisible(false);
  }

  return (
    <div className="pwa-install-banner" role="complementary" aria-label="アプリのインストール">
      <ToriiMotif />
      <div className="pwa-install-banner-copy">
        <strong>神社御縁をホーム画面に</strong>
        {ios ? (
          <span>
            共有ボタン
            <span aria-hidden="true"> ⬆︎ </span>
            から「ホーム画面に追加」を選ぶと、アプリのように開けます。
          </span>
        ) : (
          <span>インストールすると、ホーム画面からすぐに開けます。</span>
        )}
      </div>
      <div className="pwa-install-banner-actions">
        {!ios && (
          <button type="button" className="pwa-install-button" onClick={handleInstall}>
            インストール
          </button>
        )}
        <button
          type="button"
          className="pwa-install-dismiss"
          aria-label="閉じる"
          onClick={handleDismiss}
        >
          ×
        </button>
      </div>
    </div>
  );
}
