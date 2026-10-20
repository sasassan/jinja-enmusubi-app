// ビルド後に .next/static 以下の静的アセット（JS/CSS/フォント等のアプリシェル）を
// 走査し、Service Worker がプリキャッシュ対象として読み込む一覧を public/precache-manifest.json
// に書き出し、scripts/sw-template.js のビルドID差し込みも行って public/sw.js を生成する
// postbuild スクリプト。
import { readFileSync, readdirSync, statSync, writeFileSync, existsSync, cpSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, "..");
const nextDir = path.join(projectRoot, ".next");
const staticDir = path.join(nextDir, "static");
const buildIdPath = path.join(nextDir, "BUILD_ID");
const templatePath = path.join(__dirname, "sw-template.js");
const swOutPath = path.join(projectRoot, "public", "sw.js");
const manifestOutPath = path.join(projectRoot, "public", "precache-manifest.json");

const hasBuild = existsSync(staticDir) && existsSync(buildIdPath);
const buildId = hasBuild ? readFileSync(buildIdPath, "utf-8").trim() : "dev";

/** @type {string[]} */
const assets = [];

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      walk(full);
    } else {
      const rel = path.relative(staticDir, full).split(path.sep).join("/");
      assets.push(`/_next/static/${rel}`);
    }
  }
}

if (hasBuild) {
  walk(staticDir);
}

const manifest = {
  version: buildId,
  generatedAt: new Date().toISOString(),
  assets,
};

writeFileSync(manifestOutPath, JSON.stringify(manifest), "utf-8");

const template = readFileSync(templatePath, "utf-8");
writeFileSync(swOutPath, template.replaceAll("__BUILD_ID__", buildId), "utf-8");

console.log(
  `[generate-sw-manifest] build=${buildId} assets=${assets.length} -> ${path.relative(projectRoot, manifestOutPath)}, ${path.relative(projectRoot, swOutPath)}`
);

if (!hasBuild) {
  console.warn(
    "[generate-sw-manifest] .next/static が見つからないため、開発用の空マニフェストで public/sw.js を生成しました。"
  );
}

// output: "standalone" の場合、`next build` が public/ を .next/standalone/public
// へコピーするのはこのスクリプト実行前（build ステップ内）のため、ここで生成した
// sw.js / precache-manifest.json を standalone 側にも反映する。
const standalonePublicDir = path.join(nextDir, "standalone", "public");
if (existsSync(standalonePublicDir)) {
  cpSync(swOutPath, path.join(standalonePublicDir, "sw.js"));
  cpSync(manifestOutPath, path.join(standalonePublicDir, "precache-manifest.json"));
  console.log("[generate-sw-manifest] .next/standalone/public にも sw.js / precache-manifest.json を反映しました。");
}
