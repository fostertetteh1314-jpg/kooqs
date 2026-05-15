import sharp from "sharp";
import path from "path";
import fs from "fs";

const SRC = path.join(process.cwd(), "public", "logo.jpeg");
const OUT = path.join(process.cwd(), "public");

// Brand colors
const DARK = { r: 10, g: 10, b: 10, alpha: 1 };   // #0A0A0A
const RED  = { r: 220, g: 26, b: 23, alpha: 1 };   // #DC1A17

async function containOnBg(size: number, bg: { r: number; g: number; b: number; alpha: number }) {
  const padding = Math.round(size * 0.08);
  const inner = size - padding * 2;
  const resized = await sharp(SRC)
    .resize(inner, inner, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  return sharp({
    create: { width: size, height: size, channels: 4, background: bg },
  })
    .png()
    .composite([{ input: resized, gravity: "center" }]);
}

// iOS startup images: one per device resolution
// logo is centered at ~28% of the shorter axis
const SPLASH_DEVICES = [
  { w: 1290, h: 2796 }, // iPhone 15 Pro Max / 14 Pro Max
  { w: 1179, h: 2556 }, // iPhone 15 Pro / 14 Pro
  { w: 1170, h: 2532 }, // iPhone 15 / 14 / 13 / 12
  { w: 1284, h: 2778 }, // iPhone 14 Plus / 13 Pro Max / 12 Pro Max
  { w: 1125, h: 2436 }, // iPhone 11 Pro / XS / X
  { w: 828,  h: 1792 }, // iPhone 11 / XR
  { w: 750,  h: 1334 }, // iPhone SE 2nd/3rd / 8 / 7
  { w: 1668, h: 2388 }, // iPad Pro 11"
  { w: 2048, h: 2732 }, // iPad Pro 12.9"
];

async function generateSplash(w: number, h: number): Promise<void> {
  const logoSize = Math.round(Math.min(w, h) * 0.28);
  const logoPadding = Math.round(logoSize * 0.08);
  const logoInner = logoSize - logoPadding * 2;

  const logoResized = await sharp(SRC)
    .resize(logoInner, logoInner, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  // Logo with subtle circular border effect (just the raw logo centered)
  const outPath = path.join(OUT, "splash", `apple-splash-${w}x${h}.png`);

  await sharp({
    create: { width: w, height: h, channels: 4, background: DARK },
  })
    .png()
    .composite([{
      input: logoResized,
      gravity: "center",
    }])
    .toFile(outPath);

  console.log(`✅ apple-splash-${w}x${h}.png`);
}

async function main() {
  console.log("Generating PWA icons from public/logo.jpeg …\n");

  // icon-192.png — any purpose, dark bg
  await (await containOnBg(192, DARK)).toFile(path.join(OUT, "icon-192.png"));
  console.log("✅ icon-192.png");

  // icon-512.png — any purpose, dark bg
  await (await containOnBg(512, DARK)).toFile(path.join(OUT, "icon-512.png"));
  console.log("✅ icon-512.png");

  // icon-maskable-512.png — 20% safe-zone padding, red bg
  const maskPadding = Math.round(512 * 0.18);
  const maskInner = 512 - maskPadding * 2;
  const maskResized = await sharp(SRC)
    .resize(maskInner, maskInner, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  await sharp({ create: { width: 512, height: 512, channels: 4, background: RED } })
    .png()
    .composite([{ input: maskResized, gravity: "center" }])
    .toFile(path.join(OUT, "icon-maskable-512.png"));
  console.log("✅ icon-maskable-512.png");

  // apple-icon.png — 180x180, dark bg (iOS home screen)
  await (await containOnBg(180, DARK)).toFile(path.join(OUT, "apple-icon.png"));
  console.log("✅ apple-icon.png");

  // favicon.png — 32x32, dark bg
  await (await containOnBg(32, DARK)).toFile(path.join(OUT, "favicon.png"));
  console.log("✅ favicon.png");

  // iOS splash images
  console.log("\nGenerating iOS startup splash images …");
  const splashDir = path.join(OUT, "splash");
  if (!fs.existsSync(splashDir)) fs.mkdirSync(splashDir, { recursive: true });

  for (const { w, h } of SPLASH_DEVICES) {
    await generateSplash(w, h);
  }

  console.log("\n🚀 All PWA icons + splash images generated in public/");
}

main().catch((e) => { console.error(e); process.exit(1); });
