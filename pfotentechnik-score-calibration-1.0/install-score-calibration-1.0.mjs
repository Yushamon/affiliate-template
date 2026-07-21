#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const productPath = path.join(
  root,
  "apps/pfotentechnik/src/content/products/petlibro-one-rfid-smart-feeder.md"
);
const auditPath = path.join(root, "scripts/audit-pfotentechnik-product-scores.mjs");
const manifestPath = path.join(root, ".pfotentechnik-score-calibration-1.0.json");

if (!fs.existsSync(productPath)) {
  console.error("Produktdatei fehlt:", productPath);
  process.exit(1);
}

const backupRoot = path.join(
  root,
  `.pfotentechnik-score-calibration-1.0-backup-${new Date()
    .toISOString()
    .replace(/[:.]/g, "-")}`
);

for (const file of [productPath, ...(fs.existsSync(auditPath) ? [auditPath] : [])]) {
  const backup = path.join(backupRoot, path.relative(root, file));
  fs.mkdirSync(path.dirname(backup), { recursive: true });
  fs.copyFileSync(file, backup);
}

let content = fs.readFileSync(productPath, "utf8");

const replacements = [
  [/^rating:\s*4\.7\s*$/m, "rating: 4.1"],
  [/^score:\s*93\s*$/m, "score: 82"],
  [/^\s{2}"app":\s*4\.5\s*$/m, '  "app": 4.2'],
  [/^\s{2}"portionierung":\s*4\.5\s*$/m, '  "portionierung": 4.4'],
  [/^\s{2}"reinigung":\s*4\.5\s*$/m, '  "reinigung": 3.8'],
  [/^\s{2}"zuverlaessigkeit":\s*4\.5\s*$/m, '  "zuverlaessigkeit": 4.2'],
  [/^\s{2}"sicherheit":\s*5\s*$/m, '  "sicherheit": 4.4'],
  [/^\s{2}"preisleistung":\s*4\s*$/m, '  "preisleistung": 3.6']
];

for (const [pattern, replacement] of replacements) {
  if (!pattern.test(content)) {
    console.error("Erwarteter Wert fehlt:", pattern);
    process.exit(1);
  }
  content = content.replace(pattern, replacement);
}

fs.writeFileSync(productPath, content, "utf8");

const auditScript = `#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const productsDir = path.join(root, "apps/pfotentechnik/src/content/products");
const files = fs.readdirSync(productsDir).filter((file) => file.endsWith(".md"));
const findings = [];

const readNumber = (text, key) => {
  const match = text.match(new RegExp("^" + key + ":\\\\s*([0-9.]+)\\\\s*$", "m"));
  return match ? Number(match[1]) : null;
};

for (const file of files) {
  const fullPath = path.join(productsDir, file);
  const text = fs.readFileSync(fullPath, "utf8");
  const score = readNumber(text, "score");
  const rating = readNumber(text, "rating");
  const ratingsBlock = text.match(/^ratings:\\s*\\n((?:\\s{2}.+\\n?)+)/m);

  if (!ratingsBlock) continue;

  const values = [...ratingsBlock[1].matchAll(/^\\s{2}["']?[^:"']+["']?:\\s*([0-9.]+)\\s*$/gm)]
    .map((match) => Number(match[1]))
    .filter(Number.isFinite);

  if (!values.length) continue;

  const normalized = values.map((value) => value <= 5 ? value * 20 : value);
  const calculatedScore = Math.round(
    normalized.reduce((sum, value) => sum + value, 0) / normalized.length
  );
  const calculatedRating = Number((calculatedScore / 20).toFixed(1));

  if (score !== null && score !== calculatedScore) {
    findings.push({
      file,
      type: "score-mismatch",
      stored: score,
      calculated: calculatedScore
    });
  }

  if (rating !== null && Math.abs(rating - calculatedRating) > 0.05) {
    findings.push({
      file,
      type: "rating-mismatch",
      stored: rating,
      calculated: calculatedRating
    });
  }

  if (calculatedScore >= 90) {
    findings.push({
      file,
      type: "exceptional-score-review",
      calculated: calculatedScore,
      note: "90+ sollte nur mit klarer, belegter Spitzenleistung vergeben werden."
    });
  }
}

if (findings.length) {
  console.error("Produkt-Score-Audit fehlgeschlagen:");
  for (const finding of findings) {
    console.error("-", JSON.stringify(finding));
  }
  process.exit(1);
}

console.log("Produkt-Score-Audit bestanden:", files.length, "Dateien geprüft.");
`;

fs.mkdirSync(path.dirname(auditPath), { recursive: true });
fs.writeFileSync(auditPath, auditScript, "utf8");

const verify = fs.readFileSync(productPath, "utf8");
for (const expected of [
  "rating: 4.1",
  "score: 82",
  '"app": 4.2',
  '"portionierung": 4.4',
  '"reinigung": 3.8',
  '"zuverlaessigkeit": 4.2',
  '"sicherheit": 4.4',
  '"preisleistung": 3.6'
]) {
  if (!verify.includes(expected)) {
    console.error("Verifikation fehlgeschlagen:", expected);
    process.exit(1);
  }
}

fs.writeFileSync(
  manifestPath,
  JSON.stringify(
    {
      installedAt: new Date().toISOString(),
      backupRoot,
      files: [
        path.relative(root, productPath),
        path.relative(root, auditPath)
      ]
    },
    null,
    2
  ) + "\n",
  "utf8"
);

console.log("");
console.log("Score Calibration 1.0 installiert.");
console.log("- PETLIBRO One RFID Smart Feeder: 93 -> 82");
console.log("- rating: 4.7 -> 4.1");
console.log("- Gesamtscore entspricht jetzt dem Mittel der sechs Kriterien");
console.log("- Audit-Script angelegt");
console.log("");
console.log("Prüfen:");
console.log("  node scripts/audit-pfotentechnik-product-scores.mjs");
console.log("  npm run build:pfotentechnik");
