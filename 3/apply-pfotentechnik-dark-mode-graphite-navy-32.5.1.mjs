#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const PATCH = "pfotentechnik-dark-mode-graphite-navy-32.5.1";
const root = process.cwd();
const target = path.join(
  root,
  "apps/pfotentechnik/src/styles/pfotentechnik-design-tokens.css"
);

function fail(message) {
  console.error(`[${PATCH}] FEHLER: ${message}`);
  process.exit(1);
}

if (!fs.existsSync(target)) {
  fail(`Erwartete Datei fehlt: ${path.relative(root, target)}`);
}

let source = fs.readFileSync(target, "utf8");

const markerStart = "/* pfotentechnik-theme-state-machine-26.0.0:start */";
const markerEnd = "/* pfotentechnik-theme-state-machine-26.0.0:end */";

if (!source.includes(markerStart) || !source.includes(markerEnd)) {
  fail("Theme-State-Machine-Marker nicht gefunden. Patch wird nicht blind angewendet.");
}

const before = source;

const darkTokens = {
  "--pt-color-text": "#f3f5f4",
  "--pt-color-text-muted": "#a9b3b8",
  "--pt-color-border": "#27343e",
  "--pt-color-border-strong": "#364651",
  "--pt-color-surface": "#101820",
  "--pt-color-surface-soft": "#141e27",
  "--pt-color-surface-raised": "#19242e",
  "--pt-color-page": "#091119",
  "--pt-color-brand-100": "#153126",
  "--pt-color-brand-050": "#10241d",
  "--pt-color-success-soft": "#153126",
  "--pt-color-danger-soft": "#382023",
  "--pt-color-warning-soft": "#332b1c",
  "--pt-color-on-accent": "#ffffff",
  "--pt-color-accent-text": "#72d69a",
  "--pt-color-action-bg": "#3b9b67",
  "--pt-color-action-bg-hover": "#49aa75",
  "--pt-color-action-text": "#ffffff",
  "--pt-color-link": "var(--pt-color-accent-text)",
  "--pt-shadow-xs": "0 1px 2px rgb(0 0 0 / 0.22)",
  "--pt-shadow-sm": "0 5px 18px rgb(0 0 0 / 0.28)",
  "--pt-shadow-md": "0 12px 34px rgb(0 0 0 / 0.34)",
  "--pt-shadow-lg": "0 24px 58px rgb(0 0 0 / 0.4)"
};

function replaceDeclarations(block, label) {
  let found = 0;
  let changed = 0;

  for (const [token, value] of Object.entries(darkTokens)) {
    const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`(^\\s*${escaped}:\\s*)[^;]+;`, "m");

    if (!re.test(block)) {
      fail(`${label}: Token fehlt: ${token}`);
    }

    found += 1;
    const next = block.replace(re, `$1${value};`);
    if (next !== block) changed += 1;
    block = next;
  }

  if (found !== Object.keys(darkTokens).length) {
    fail(
      `${label}: Erwartet ${Object.keys(darkTokens).length} vorhandene Tokens, gefunden ${found}.`
    );
  }

  console.log(`[${PATCH}] ${label}: ${found} Tokens gefunden, ${changed} Werte geändert.`);
  return block;
}

function findBalancedBlock(text, selectorStart, searchFrom = 0) {
  const start = text.indexOf(selectorStart, searchFrom);
  if (start < 0) fail(`Block nicht gefunden: ${selectorStart}`);

  const open = text.indexOf("{", start);
  if (open < 0) fail(`Öffnende Klammer fehlt: ${selectorStart}`);

  let depth = 0;
  for (let i = open; i < text.length; i += 1) {
    if (text[i] === "{") depth += 1;
    if (text[i] === "}") {
      depth -= 1;
      if (depth === 0) {
        return { start, end: i + 1, text: text.slice(start, i + 1) };
      }
    }
  }

  fail(`Block nicht geschlossen: ${selectorStart}`);
}

function replaceRange(text, range, replacement) {
  return text.slice(0, range.start) + replacement + text.slice(range.end);
}

// 1. System-Dark-Mode
const media = findBalancedBlock(source, "@media (prefers-color-scheme: dark)");
let mediaText = media.text;

const mediaRoot = findBalancedBlock(mediaText, ":root");
const patchedMediaRoot = replaceDeclarations(mediaRoot.text, "System-Dark-Mode");
mediaText = replaceRange(mediaText, mediaRoot, patchedMediaRoot);
source = replaceRange(source, media, mediaText);

// 2. Expliziter Dark-Mode
const explicitDark = findBalancedBlock(source, ':root[data-theme="dark"],');
const patchedExplicitDark = replaceDeclarations(explicitDark.text, "Expliziter Dark-Mode");
source = replaceRange(source, explicitDark, patchedExplicitDark);

// Sicherstellen, dass alle Zielwerte in beiden Dark-Blöcken stehen.
function verifyBlock(block, label) {
  for (const [token, value] of Object.entries(darkTokens)) {
    const declaration = `${token}: ${value};`;
    if (!block.includes(declaration)) {
      fail(`${label}: Zielwert fehlt nach Patch: ${declaration}`);
    }
  }
}

const verifyMedia = findBalancedBlock(source, "@media (prefers-color-scheme: dark)");
verifyBlock(findBalancedBlock(verifyMedia.text, ":root").text, "System-Dark-Mode");

const verifyExplicit = findBalancedBlock(source, ':root[data-theme="dark"],');
verifyBlock(verifyExplicit.text, "Expliziter Dark-Mode");

// Light Mode schützen.
const requiredLightValues = [
  "--pt-color-text: #132019;",
  "--pt-color-text-muted: #5a6d62;",
  "--pt-color-border: #d8e4dc;",
  "--pt-color-surface: #ffffff;",
  "--pt-color-surface-soft: #f4f8f5;",
  "--pt-color-page: #f3f7f4;",
  "--pt-color-action-bg: #2f8f5b;",
  "--pt-color-action-bg-hover: #26784c;"
];

for (const declaration of requiredLightValues) {
  if (!source.includes(declaration)) {
    fail(`Light-Mode-Schutz fehlgeschlagen: ${declaration}`);
  }
}

if (source === before) {
  console.log(`[${PATCH}] Dark Mode ist bereits vollständig auf Graphite-Navy gesetzt.`);
  process.exit(0);
}

const temp = `${target}.tmp-${process.pid}`;
fs.writeFileSync(temp, source, "utf8");
fs.renameSync(temp, target);

console.log(`[${PATCH}] Graphite-Navy Dark Mode installiert.`);
console.log(`[${PATCH}] Geändert: ${path.relative(root, target)}`);
console.log(`[${PATCH}] Light Mode bleibt unverändert.`);
console.log(`[${PATCH}] Keine .bak-Datei angelegt.`);
console.log("");
console.log("Neue zentrale Dark-Mode-Basis:");
console.log("  page           #091119");
console.log("  surface        #101820");
console.log("  surface-soft   #141e27");
console.log("  surface-raised #19242e");
console.log("  accent/action  #3b9b67");
console.log("");
console.log("Empfohlener Kurztest:");
console.log("  npm --workspace apps/pfotentechnik run build");
