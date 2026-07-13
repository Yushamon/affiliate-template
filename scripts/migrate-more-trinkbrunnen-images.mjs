import sharp from "sharp";
import path from "node:path";
import { mkdir } from "node:fs/promises";

const generated = "C:/Users/bbuck/.codex/generated_images/019f5628-9672-7d01-aa07-fa98e7216b01";
const outputRoot = "C:/hp/Projekt/affiliate-template/apps/pfotentechnik/src/assets/images/products";
const items = [
  ["petkit-eversweet-ultra", "exec-a08d9417-f970-417f-b6e5-c39f71d168c0.png"],
  ["petkit-eversweet-max-cordless", "exec-6e84b50f-824a-4803-84f0-458fc7d8e2b4.png"],
  ["petkit-eversweet-solo-se", "exec-13755478-160e-4f4c-a89f-89980fb3b628.png"],
  ["petkit-eversweet-5-mini", "exec-6940c3ca-f79e-4639-8ab2-0954dcc2fe69.png"],
  ["oneisall-3-2l-cordless-fountain", "exec-8ca875e5-bf31-4117-becb-74f8f7ad08e7.png"],
  ["oneisall-2-2l-cordless-fountain", "exec-0bfd6871-e06e-4ea3-83b1-ea8efa7025ca.png"],
  ["cat-mate-shell-fountain", "exec-2b81930d-b3de-49e4-9ab2-da88e831bacc.png"],
  ["cat-mate-335-pet-fountain", "exec-3023c578-0661-4d02-8c2f-2c5fff594f1d.png"],
  ["petlibro-dockstream-cordless", "exec-064eeadb-9465-432d-9acd-572733b3436c.png"],
  ["petlibro-glacier-ultrafiltration", "exec-ec0562fb-fcf5-415e-92fa-4be7cc2259d9.png"]
];

const variants = [
  ["hero.webp", 0, 1280, 720, 84],
  ["thumbnail.webp", 1, 640, 480, 82],
  ["comparison.webp", 2, 960, 720, 82],
  ["gallery-1.webp", 3, 960, 720, 82],
  ["gallery-2.webp", 4, 960, 720, 82],
  ["gallery-3.webp", 5, 960, 720, 82]
];

for (const [slug, filename] of items) {
  const output = path.join(outputRoot, slug);
  await mkdir(output, { recursive: true });
  const normalized = await sharp(path.join(generated, filename))
    .resize(1536, 1024, { fit: "fill" })
    .png()
    .toBuffer();
  for (const [name, panel, width, height, quality] of variants) {
    const left = (panel % 3) * 512;
    const top = Math.floor(panel / 3) * 512;
    await sharp(normalized)
      .extract({ left, top, width: 512, height: 512 })
      .resize(width, height, { fit: "cover", position: "centre" })
      .webp({ quality, effort: 5 })
      .toFile(path.join(output, name));
  }
}

console.log(`Generated ${items.length * variants.length} WebP assets.`);
