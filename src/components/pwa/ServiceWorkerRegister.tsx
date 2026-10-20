"use client";

import { useEffect } from "react";

/**
 * Service Worker 登録用のクライアントコンポーネント。
 * layout.tsx から一度だけマウントし、対応ブラウザでのみ /sw.js を登録する。
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* SW 登録失敗時もアプリ本体の動作は継続させる */
      });
    };

    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", register, { once: true });
    }
  }, []);

  return null;
}
