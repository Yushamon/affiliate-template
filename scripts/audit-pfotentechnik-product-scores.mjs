#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const productsDir = path.join(root, "apps/pfotentechnik/src/content/products");
const files = fs.readdirSync(productsDir).filter((file) => file.endsWith(".md"));
const findings = [];

const readNumber = (text, key) => {
  const match = text.match(new RegExp("^" + key + ":\\s*([0-9.]+)\\s*$", "m"));
  return match ? Number(match[1]) : null;
};

for (const file of files) {
  const fullPath = path.join(productsDir, file);
  const text = fs.readFileSync(fullPath, "utf8");
  const score = readNumber(text, "score");
  const rating = readNumber(text, "rating");
  const ratingsBlock = text.match(/^ratings:\s*\n((?:\s{2}.+\n?)+)/m);

  if (!ratingsBlock) continue;

  const values = [...ratingsBlock[1].matchAll(/^\s{2}["']?[^:"']+["']?:\s*([0-9.]+)\s*$/gm)]
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
