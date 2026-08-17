import fs from "node:fs";
import path from "node:path";

const PATCH = "pfotentechnik-gps-product-media-paths-32.4.3";
const root = process.cwd();
const productDir = path.join(root, "apps/pfotentechnik/src/content/products");

const products = [
  { file: "tractive-dog-6.md", slug: "tractive-dog-6", label: "Tractive DOG 6" },
  { file: "weenect-xs.md", slug: "weenect-xs", label: "Weenect XS" },
  { file: "paj-pet-finder-4g-mini.md", slug: "paj-pet-finder-4g-mini", label: "PAJ GPS PET Finder 4G Mini" },
];

function replaceImagesBlock(source, p) {
  const block = `images:
  hero:
    src: "../../assets/images/products/${p.slug}/hero.webp"
    alt: "${p.label}"
  thumbnail:
    src: "../../assets/images/products/${p.slug}/thumbnail.webp"
    alt: "${p.label} – kompakte Produktansicht"
  comparison:
    src: "../../assets/images/products/${p.slug}/comparison.webp"
    alt: "${p.label} im GPS-Tracker-Vergleich"
  gallery:
    - src: "../../assets/images/products/${p.slug}/gallery-1.webp"
      alt: "${p.label} – Produktansicht"
    - src: "../../assets/images/products/${p.slug}/gallery-2.webp"
      alt: "${p.label} – Lifestyle-Aufnahme"
    - src: "../../assets/images/products/${p.slug}/gallery-3.webp"
      alt: "${p.label} – Outdoor-Aufnahme"`;

  const re = /^images:\s*\n(?:(?:[ \t]+.*|[ \t]*\n))*?(?=^[A-Za-z_][A-Za-z0-9_-]*:\s*|\Z)/m;
  if (!re.test(source)) throw new Error(`[${PATCH}] images:-Block nicht gefunden: ${p.file}`);
  return source.replace(re, block + "\n");
}

for (const p of products) {
  const target = path.join(productDir, p.file);
  if (!fs.existsSync(target)) throw new Error(`[${PATCH}] Produktdatei fehlt: ${path.relative(root, target)}`);

  const mediaDir = path.join(root, "apps/pfotentechnik/src/assets/images/products", p.slug);
  for (const image of ["hero.webp", "thumbnail.webp", "comparison.webp", "gallery-1.webp", "gallery-2.webp", "gallery-3.webp"]) {
    const imagePath = path.join(mediaDir, image);
    if (!fs.existsSync(imagePath)) {
      throw new Error(`[${PATCH}] Erwartetes Bild fehlt: ${path.relative(root, imagePath)}`);
    }
  }

  const before = fs.readFileSync(target, "utf8");
  const after = replaceImagesBlock(before, p);
  if (after === before) {
    console.log(`[${PATCH}] Bereits aktuell: ${path.relative(root, target)}`);
    continue;
  }

  const backupDir = path.join(root, ".patch-backups", PATCH);
  fs.mkdirSync(backupDir, { recursive: true });
  fs.copyFileSync(target, path.join(backupDir, p.file));
  fs.writeFileSync(target, after, "utf8");
  console.log(`[${PATCH}] Aktualisiert: ${path.relative(root, target)}`);
}

console.log(`[${PATCH}] Fertig.`);
