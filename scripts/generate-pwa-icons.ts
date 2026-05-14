import sharp from "sharp";
import path from "path";

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

async function main() {
  console.log("Generating PWA icons from public/logo.jpeg …");

  // icon-192.png — any purpose, dark bg
  await (await containOnBg(192, DARK)).toFile(path.join(OUT, "icon-192.png"));
  console.log("✅ icon-192.png");

  // icon-512.png — any purpose, dark bg
  await (await containOnBg(512, DARK)).toFile(path.join(OUT, "icon-512.png"));
  console.log("✅ icon-512.png");

  // icon-maskable-512.png — 20% safe-zone padding, red bg
  // Safe zone means logo must stay within the centre 80% circle
  // We give ~20% padding all sides = 40% of size reserved for padding
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

  console.log("\n🚀 All PWA icons generated in public/");
}

main().catch((e) => { console.error(e); process.exit(1); });
