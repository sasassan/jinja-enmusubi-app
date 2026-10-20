import sharp from "sharp";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const iconSvg = readFileSync(path.join(projectRoot, "public/icons/icon.svg"));
const foregroundSvg = readFileSync(path.join(projectRoot, "public/icons/icon-foreground.svg"));
const iconDir = path.join(projectRoot, "public/icons");
const resourcesDir = path.join(projectRoot, "resources");

async function render(svg, size, outputPath, background) {
  let image = sharp(svg, { density: 384 }).resize(size, size);
  if (background) image = image.flatten({ background });
  await image.png().toFile(outputPath);
  console.log(`generated ${path.relative(projectRoot, outputPath)} (${size}x${size})`);
}

const iconTargets = [
  ["icon-192x192.png", 192],
  ["icon-512x512.png", 512],
  ["icon-192.png", 192],
  ["icon-512.png", 512],
  ["apple-touch-icon.png", 180],
];

for (const [file, size] of iconTargets) {
  await render(iconSvg, size, path.join(iconDir, file));
}

const maskableBackground = Buffer.from(
  '<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512"><defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="512" gradientUnits="userSpaceOnUse"><stop stop-color="#FFE8EE"/><stop offset="1" stop-color="#FFF8F0"/></linearGradient></defs><rect width="512" height="512" fill="url(#bg)"/></svg>'
);
const maskableForeground = await sharp(foregroundSvg, { density: 384 }).resize(512, 512).png().toBuffer();
await sharp(maskableBackground)
  .composite([{ input: maskableForeground }])
  .png()
  .toFile(path.join(iconDir, "icon-512x512-maskable.png"));
await sharp(maskableBackground)
  .composite([{ input: maskableForeground }])
  .png()
  .toFile(path.join(iconDir, "icon-512-maskable.png"));
console.log("generated icon-512x512-maskable.png (512x512, padded)");

await render(iconSvg, 1024, path.join(resourcesDir, "icon-ios-1024.png"));
await render(iconSvg, 512, path.join(resourcesDir, "icon-android-512.png"));
await render(foregroundSvg, 432, path.join(resourcesDir, "android-adaptive-foreground-432.png"));
await sharp({ create: { width: 432, height: 432, channels: 4, background: "#FFF8F0" } })
  .png()
  .toFile(path.join(resourcesDir, "android-adaptive-background-432.png"));
console.log("generated android-adaptive-background-432.png (432x432, #FFF8F0)");

