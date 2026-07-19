import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const productDir = path.join(appRoot, "src/content/products");

const fieldsByCategory = {
  futterautomaten: [
    ["App-Steuerung", ["app-steuerung", "app", "konnektivitaet"]],
    ["Kamera", ["kamera"]],
    ["Napf", ["napf", "napfmaterial"]],
    ["Reinigung", ["reinigung", "spuelmaschinengeeignet"]],
    ["WLAN", ["wlan", "wifi"]],
    ["Batterie", ["batterie", "notstrom", "backup"]],
    ["Maße", ["masse", "abmessungen"]],
    ["Gewicht", ["gewicht"]]
  ],
  trinkbrunnen: [
    ["Lautstärke", ["lautstaerke", "geraeusch"]],
    ["Filter", ["filter", "filtertyp"]],
    ["Reinigung", ["reinigung", "spuelmaschinengeeignet"]],
    ["Akku", ["akku", "akkulaufzeit", "kabellos"]],
    ["App", ["app"]],
    ["UV", ["uv", "uvc"]],
    ["Trinkhöhe", ["trinkhoehe"]],
    ["Wasserfluss", ["wasserfluss", "durchfluss"]],
    ["Ersatzfilter", ["ersatzfilter"]],
    ["Maße", ["masse", "abmessungen"]],
    ["Gewicht", ["gewicht"]]
  ]
};

let changedFiles = 0;
let addedFields = 0;

for (const file of await listMarkdownFiles(productDir)) {
  const source = await fs.readFile(file, "utf8");
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) continue;

  const frontmatter = match[1];
  const category = frontmatter.match(
    /^category:\s*\{[^\n]*key:\s*["']?([^,"'}\s]+)/m
  )?.[1] ?? frontmatter.match(
    /^category:\s*\r?\n(?:^[ \t]+.*\r?\n)*?^[ \t]+key:\s*["']?([^"'\s]+)/m
  )?.[1];
  const fields = fieldsByCategory[category];
  if (!fields) continue;

  const lines = frontmatter.split(/\r?\n/);
  const specsStart = lines.findIndex((line) => /^specs:\s*$/.test(line));
  if (specsStart < 0) continue;

  let specsEnd = lines.length;
  for (let index = specsStart + 1; index < lines.length; index += 1) {
    if (/^[A-Za-z][\w-]*:/.test(lines[index])) {
      specsEnd = index;
      break;
    }
  }

  const specBlock = lines.slice(specsStart + 1, specsEnd).join("\n");
  const labels = [...specBlock.matchAll(/label:\s*["']?([^,"'}\r\n]+)/g)]
    .map((item) => normalize(item[1]));
  const additions = fields.filter(([, aliases]) =>
    !aliases.some((alias) => labels.some((label) =>
      label === alias || label.includes(alias)
    ))
  );
  if (!additions.length) continue;

  while (specsEnd > specsStart + 1 && !lines[specsEnd - 1].trim()) {
    specsEnd -= 1;
  }
  lines.splice(
    specsEnd,
    0,
    ...additions.map(([label]) =>
      `  - { label: "${label}", value: "Nicht vom Hersteller ausgewiesen" }`
    )
  );

  const nextFrontmatter = lines.join("\n");
  const nextSource = source.replace(frontmatter, nextFrontmatter);
  await fs.writeFile(file, nextSource, "utf8");
  changedFiles += 1;
  addedFields += additions.length;
}

console.log(`Normalisiert: ${changedFiles} Dateien, ${addedFields} Felder ergänzt.`);

async function listMarkdownFiles(directory) {
  return (await fs.readdir(directory, { withFileTypes: true }))
    .filter((entry) => entry.isFile() && /\.mdx?$/i.test(entry.name))
    .map((entry) => path.join(directory, entry.name));
}

function normalize(value) {
  return String(value)
    .toLocaleLowerCase("de")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replaceAll("ß", "ss")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
