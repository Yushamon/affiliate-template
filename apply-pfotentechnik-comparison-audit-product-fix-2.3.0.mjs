import fs from "node:fs";
import path from "node:path";

const PATCH = "pfotentechnik-comparison-audit-product-fix-2.3.0";
const root = process.cwd();
const app = path.join(root, "apps", "pfotentechnik");
const backupRoot = path.join(root, ".patch-backups", `${PATCH}-${new Date().toISOString().replace(/[:.]/g, "-")}`);
const changed = [];
const backups = new Map();

function fail(message) {
  throw new Error(`[${PATCH}] ${message}`);
}

function read(file) {
  if (!fs.existsSync(file)) fail(`Datei fehlt: ${path.relative(root, file)}`);
  return fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n");
}

function backup(file, content) {
  if (backups.has(file)) return;
  const target = path.join(backupRoot, path.relative(root, file));
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content, "utf8");
  backups.set(file, target);
}

function write(file, content) {
  const old = read(file);
  if (old === content) return false;
  backup(file, old);
  fs.writeFileSync(file, content, "utf8");
  changed.push(path.relative(root, file));
  return true;
}

function restoreAll() {
  for (const [file, target] of backups) {
    fs.copyFileSync(target, file);
  }
}

function patchAudit() {
  const file = path.join(app, "scripts", "comparison-platform", "audit.mjs");
  let text = read(file);

  if (text.includes("const explicitValues =") && text.includes("...overrides")) {
    console.log(`[${PATCH}] Audit-Merge bereits vorhanden.`);
    return;
  }

  const rx = /    const values = item\?\.values && typeof item\.values === "object" \? item\.values : \{\};\n/;
  if (!rx.test(text)) {
    fail("Audit-Anker für item.values nicht gefunden.");
  }

  text = text.replace(rx, `    const overrides =
      item?.overrides && typeof item.overrides === "object"
        ? item.overrides
        : {};
    const explicitValues =
      item?.values && typeof item.values === "object"
        ? item.values
        : {};
    const values = {
      ...overrides,
      ...explicitValues
    };
`);

  write(file, text);
}

function ensureSpec(rel, label, value) {
  const file = path.join(app, rel);
  let text = read(file);
  const labelRx = new RegExp(`^\\s*- label: ["']?${label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["']?\\s*$`, "m");
  if (labelRx.test(text)) {
    console.log(`[${PATCH}] ${path.basename(file)}: ${label} bereits vorhanden.`);
    return;
  }

  const anchor = /^specs:\s*$/m;
  if (!anchor.test(text)) fail(`${rel}: specs:-Block nicht gefunden.`);

  text = text.replace(anchor, `specs:
  - label: "${label}"
    value: "${value.replace(/"/g, '\\"')}"`);
  write(file, text);
}

function ensureManufacturer(rel, data) {
  const file = path.join(app, rel);
  let text = read(file);

  if (/^manufacturer:\s*$/m.test(text)) {
    const start = text.search(/^manufacturer:\s*$/m);
    const rest = text.slice(start);
    const endMatch = rest.slice(rest.indexOf("\n") + 1).match(/^[A-Za-z][A-Za-z0-9_-]*:\s*/m);
    const end = endMatch
      ? start + rest.indexOf("\n") + 1 + endMatch.index
      : -1;
    const replacement = `manufacturer:
  key: "${data.slug}"
  name: "${data.name}"
  slug: "${data.slug}"
`;
    text = end >= 0 ? text.slice(0, start) + replacement + text.slice(end) : text.slice(0, start) + replacement;
  } else {
    const categoryIndex = text.search(/^category:\s*$/m);
    if (categoryIndex < 0) fail(`${rel}: manufacturer und category nicht gefunden.`);
    text = text.slice(0, categoryIndex) + `manufacturer:
  key: "${data.slug}"
  name: "${data.name}"
  slug: "${data.slug}"
` + text.slice(categoryIndex);
  }

  write(file, text);
}

try {
  if (!fs.existsSync(path.join(app, "package.json"))) {
    fail("Bitte im Root von affiliate-template ausführen.");
  }

  patchAudit();

  ensureSpec(
    "src/content/products/garmin-alpha-t-20.md",
    "Übertragung",
    "VHF-Direktübertragung an ein kompatibles Garmin-Alpha-Handgerät"
  );

  ensureSpec(
    "src/content/products/paj-pet-finder-4g-mini.md",
    "Übertragung",
    "GPS-Position über 4G/LTE mit integriertem 2G-Fallback an App und Webportal"
  );
  ensureSpec(
    "src/content/products/paj-pet-finder-4g-mini.md",
    "Abo",
    "27 Monate Tracking enthalten; danach kostenpflichtiger PAJ-Tarif erforderlich"
  );

  ensureSpec(
    "src/content/products/petkit-eversweet-ultra.md",
    "Kapazität",
    "5 Liter Frischwasser plus 1,8 Liter Abwasser"
  );

  ensureSpec(
    "src/content/products/petlibro-polar-wet-food-feeder.md",
    "Portionierung",
    "Drei zeitgesteuerte Fächer mit je 200 ml"
  );

  ensureSpec(
    "src/content/products/petlibro-space-smart-feeder.md",
    "Kapazität",
    "8 Liter laut PLAF107-Handbuch"
  );
  ensureSpec(
    "src/content/products/petlibro-space-smart-feeder.md",
    "Portionierung",
    "Volumetrisch; etwa 20 ml je Einheit, bis zu 50 Einheiten pro Mahlzeit"
  );

  ensureManufacturer(
    "src/content/products/petsafe-freshfeed-refrigerated-feeder.md",
    { slug: "petsafe", name: "PetSafe" }
  );

  console.log("");
  console.log(`[${PATCH}] Erfolgreich.`);
  console.log(`[${PATCH}] Geänderte Dateien: ${changed.length}`);
  for (const file of changed) console.log(`- ${file}`);
  console.log(`[${PATCH}] Backups: ${path.relative(root, backupRoot)}`);
  console.log("");
  console.log("Jetzt ausführen:");
  console.log("npm --workspace apps/pfotentechnik run audit:products:strict");
  console.log("npm --workspace apps/pfotentechnik run comparison:audit");
  console.log("npm --workspace apps/pfotentechnik run lint:content");
  console.log("npm run build:pfotentechnik");
} catch (error) {
  restoreAll();
  console.error(`[${PATCH}] Fehlgeschlagen; alle Dateien wurden zurückgesetzt.`);
  console.error(error?.stack || error);
  process.exit(1);
}
