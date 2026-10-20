// 神社御縁 PWA Service Worker
//
// 戦略:
// - アプリシェル (JS/CSS/フォント等の /_next/static 配下) は precache-manifest.json
//   に基づきインストール時にプリキャッシュし、以降は cache-first で高速配信する。
// - ページ (ナビゲーション) は network-first。オンライン時は常に最新の SSR 結果を取得し、
//   取得できたレスポンスは per-URL でキャッシュする。オフライン時はキャッシュ済みの
//   同一 URL のレスポンスを返し、キャッシュも無ければ /offline にフォールバックする。
// - その他の GET リクエスト (画像・API 等) は network-first + キャッシュフォールバック。
const VERSION_PLACEHOLDER = "__BUILD_ID__";
const APP_SHELL_CACHE = `shrine-app-shell-${VERSION_PLACEHOLDER}`;
const PAGES_CACHE = "shrine-pages-v1";
const RUNTIME_CACHE = "shrine-runtime-v1";
const OFFLINE_URL = "/offline";

const CORE_ASSETS = [OFFLINE_URL, "/manifest.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(APP_SHELL_CACHE);
      await cache.addAll(CORE_ASSETS).catch(() => {});

      try {
        const res = await fetch("/precache-manifest.json", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          const assets = Array.isArray(data.assets) ? data.assets : [];
          await Promise.all(
            assets.map((url) =>
              cache.add(url).catch(() => {
                /* 個別のアセット取得失敗はプリキャッシュ全体を失敗させない */
              })
            )
          );
        }
      } catch {
        /* precache-manifest.json が無い/取得失敗でもインストール自体は継続する */
      }

      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter(
            (key) =>
              key.startsWith("shrine-app-shell-") && key !== APP_SHELL_CACHE
          )
          .map((key) => caches.delete(key))
      );
      await self.clients.claim();
    })()
  );
});

function isStaticAsset(url) {
  return (
    url.pathname === "/manifest.json" ||
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    /\.(?:css|js|woff2?|ttf|otf|png|jpe?g|gif|webp|avif|svg|ico)$/.test(url.pathname)
  );
}

async function handleNavigate(request) {
  const pagesCache = await caches.open(PAGES_CACHE);
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      pagesCache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await pagesCache.match(request);
    if (cached) return cached;
    const shellCache = await caches.open(APP_SHELL_CACHE);
    const offline = await shellCache.match(OFFLINE_URL);
    if (offline) return offline;
    return Response.error();
  }
}

async function handleStaticAsset(request) {
  const shellCache = await caches.open(APP_SHELL_CACHE);
  const cached = await shellCache.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      shellCache.put(request, response.clone());
    }
    return response;
  } catch {
    return cached || Response.error();
  }
}

async function handleRuntime(request) {
  const runtimeCache = await caches.open(RUNTIME_CACHE);
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      runtimeCache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await runtimeCache.match(request);
    if (cached) return cached;
    throw new Error("network-and-cache-miss");
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(handleNavigate(request));
    return;
  }

  if (isStaticAsset(url)) {
    event.respondWith(handleStaticAsset(request));
    return;
  }

  event.respondWith(handleRuntime(request).catch(() => caches.match(request)));
});
