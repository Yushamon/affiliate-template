import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const generatedRoot =
  "C:/Users/bbuck/.codex/generated_images/019f5628-9672-7d01-aa07-fa98e7216b01";
const outputRoot =
  "C:/hp/Projekt/affiliate-template/apps/pfotentechnik/src/assets/images/products";

const products = [
  ["petlibro-dockstream-2-smart", "exec-a40a47b0-657d-4a2f-aa70-42200924cba5.png", "exec-f11d3caa-cf6b-47cd-bb3b-4d9fbfc9b315.png"],
  ["petlibro-dockstream-rfid-smart", "exec-2c162d52-c47c-4563-8d19-778476431637.png", "exec-2443fe9e-85fa-4075-94ba-1fe91782cc7c.png"],
  ["petlibro-stainless-steel-fountain", "exec-af4ec0f8-4cbb-4576-8ebc-b8e2eba917db.png", "exec-5622f922-f2f8-4d8e-9abf-01d8a8567629.png"],
  ["petlibro-capsule-dog-fountain", "exec-340bf0aa-cb94-4d80-a2a8-df48a8ea5742.png", "exec-5a9f18bc-98e2-4e97-9945-2dbb42515be2.png"],
  ["petkit-eversweet-max-2-uvc", "exec-83fe9a78-3119-4c4b-934c-914c63549018.png", "exec-3874853a-b01c-4b08-a530-e537980b49dc.png"],
  ["petkit-eversweet-3-pro-uvc", "exec-bcc093f2-c0ad-49b9-bcb5-af7d091ed2e4.png", "exec-4c340d0e-6793-47d3-a54d-cba05815ec11.png"],
  ["petkit-eversweet-solo-2-fountain", "exec-a1067e31-5ff3-4abc-8471-3132ccbedb04.png", "exec-08229eea-8e50-45a4-adbe-8c12ed224bc3.png"],
  ["oneisall-3-5l-cordless-fountain", "exec-e130bc7a-998b-466d-8610-95bc0955a45b.png", "exec-cb637dc9-a23b-44fb-b03f-01dfd7977e1a.png"],
  ["oneisall-7l-dog-water-fountain", "exec-21fddaf0-dda9-4871-b241-6344bef2a7ea.png", "exec-37bc0c17-0178-4518-9fb9-4be08bd290a2.png"],
  ["xiaomi-smart-pet-fountain-2", "exec-9821d0c8-9e17-4a5c-abed-0611c6c146fc.png", "exec-e78594d2-a9cf-4479-a3fb-8bf5b8a9ffea.png"]
];

const galleryCrops = [
  { left: 0, top: 0 },
  { left: 636, top: 0 },
  { left: 636, top: 636 }
];

for (const [slug, heroFile, detailsFile] of products) {
  const directory = path.join(outputRoot, slug);
  const heroSource = path.join(generatedRoot, heroFile);
  const detailsSource = path.join(generatedRoot, detailsFile);
  await mkdir(directory, { recursive: true });

  await sharp(heroSource)
    .resize(1280, 720, { fit: "cover", position: "centre" })
    .webp({ quality: 84 })
    .toFile(path.join(directory, "hero.webp"));

  await sharp(heroSource)
    .resize(640, 480, { fit: "cover", position: "centre" })
    .webp({ quality: 82 })
    .toFile(path.join(directory, "thumbnail.webp"));

  await sharp(heroSource)
    .resize(960, 720, { fit: "cover", position: "centre" })
    .webp({ quality: 84 })
    .toFile(path.join(directory, "comparison.webp"));

  for (const [index, crop] of galleryCrops.entries()) {
    await sharp(detailsSource)
      .extract({ ...crop, width: 618, height: 618 })
      .resize(960, 720, { fit: "cover", position: "centre" })
      .webp({ quality: 84 })
      .toFile(path.join(directory, `gallery-${index + 1}.webp`));
  }
}

console.log(`Created ${products.length * 6} optimized WebP assets for ${products.length} products.`);
