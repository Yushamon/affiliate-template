#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const PATCH = 'pfotentechnik-seo-price-workflow-2.0.0';
const root = process.cwd();
const skipVerify = process.argv.includes('--skip-verify');
const checkOnly = process.argv.includes('--check');

const files = {
  page: 'apps/pfotentechnik/src/pages/admin/seo/prices.astro',
  service: 'apps/pfotentechnik/src/lib/price-intelligence/service.mjs',
  frontmatter: 'apps/pfotentechnik/src/lib/price-intelligence/frontmatter-price.mjs',
  tests: 'apps/pfotentechnik/test/product-operations.test.mjs'
};

const fail = (message) => {
  console.error(`\n[${PATCH}] ${message}`);
  process.exit(1);
};

for (const relative of Object.values(files)) {
  if (!fs.existsSync(path.join(root, relative))) fail(`Datei nicht gefunden: ${relative}\nBitte im Root von affiliate-template ausführen.`);
}

const original = Object.fromEntries(
  Object.entries(files).map(([key, relative]) => [key, fs.readFileSync(path.join(root, relative), 'utf8')])
);

const replaceOnce = (source, search, replacement, label) => {
  if (!source.includes(search)) fail(`Vorprüfung fehlgeschlagen. Anker nicht gefunden: ${label}`);
  const first = source.indexOf(search);
  if (source.indexOf(search, first + search.length) !== -1) fail(`Vorprüfung fehlgeschlagen. Anker nicht eindeutig: ${label}`);
  return source.replace(search, replacement);
};

const replaceRegexOnce = (source, regex, replacement, label) => {
  const matches = [...source.matchAll(new RegExp(regex.source, regex.flags.includes('g') ? regex.flags : `${regex.flags}g`))];
  if (matches.length !== 1) fail(`Vorprüfung fehlgeschlagen. ${label}: ${matches.length} Treffer statt 1.`);
  return source.replace(regex, replacement);
};

let page = original.page;
let service = original.service;
let frontmatter = original.frontmatter;
let tests = original.tests;

if (!page.includes('PT_SEO_PRICE_WORKFLOW_2_0_0')) {
  page = replaceOnce(
    page,
    `          const record = applyServerResult(result);\n          syncEditor(record, { force: true });\n          setStatus(\`${'${record.title}'}: persistierter Zustand wurde beim ersten Speichern übernommen.\`);`,
    `          const record = applyServerResult(result);\n          syncEditor(record, { force: true });\n          applyView();\n          editor.dataset.saved = "true";\n          window.setTimeout(() => { delete editor.dataset.saved; }, 1600);\n          setStatus(\`${'${record.title}'}: Preis, Link und Verfügbarkeit wurden gespeichert.\`);`,
    'Speichererfolg'
  );

  page = replaceOnce(
    page,
    `    editor.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>("[data-draft]").forEach((input) => {\n      input.addEventListener("input", () => captureDraft(input));\n      input.addEventListener("change", () => captureDraft(input));\n    });\n    editor.addEventListener("submit", (event) => {`,
    `    editor.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>("[data-draft]").forEach((input) => {\n      input.addEventListener("input", () => captureDraft(input));\n      input.addEventListener("change", () => captureDraft(input));\n    });\n\n    // PT_SEO_PRICE_WORKFLOW_2_0_0: Preis und Link ohne Status-Fallen pflegen.\n    const priceInput = editor.querySelector<HTMLInputElement>("[data-draft='current']");\n    const priceStateInput = editor.querySelector<HTMLSelectElement>("[data-draft='priceState']");\n    const targetUrlInput = editor.querySelector<HTMLInputElement>("[data-draft='targetUrl']");\n    const sourceInput = editor.querySelector<HTMLInputElement>("[data-draft='sourceLabel']");\n\n    priceInput?.addEventListener("input", () => {\n      if (priceInput.value.trim() && priceStateInput && ["unknown", "removed"].includes(priceStateInput.value)) {\n        priceStateInput.value = "available";\n        captureDraft(priceStateInput);\n      }\n    });\n\n    priceStateInput?.addEventListener("change", () => {\n      if (["unknown", "removed"].includes(priceStateInput.value) && priceInput?.value.trim()) {\n        priceInput.value = "";\n        captureDraft(priceInput);\n      }\n    });\n\n    targetUrlInput?.addEventListener("blur", () => {\n      const raw = targetUrlInput.value.trim();\n      if (!raw) return;\n      const normalized = /^[a-z][a-z0-9+.-]*:\\/\\//i.test(raw) ? raw : \`https://${'${raw}'}\`;\n      try {\n        const url = new URL(normalized);\n        if (url.protocol === "http:") url.protocol = "https:";\n        targetUrlInput.value = url.href;\n        captureDraft(targetUrlInput);\n        if (sourceInput && !sourceInput.value.trim()) {\n          sourceInput.value = url.hostname.replace(/^www\\./, "");\n          captureDraft(sourceInput);\n        }\n      } catch {\n        setStatus(\`${'${records.get(slug)?.title || slug}'}: Bitte eine gültige Händler- oder Affiliate-URL eingeben.\`, "error");\n      }\n    });\n\n    editor.addEventListener("keydown", (event) => {\n      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {\n        event.preventDefault();\n        editor.requestSubmit();\n      }\n    });\n\n    editor.addEventListener("submit", (event) => {`,
    'Editor-Workflow'
  );

  page = replaceRegexOnce(
    page,
    /  \.ops-table \{ overflow-x: auto; \}[\s\S]*?  \.ops-actions \{ align-items: stretch; \}/,
    `  .ops-table { overflow: visible; padding: 0; }\n  .ops-head { display: none; }\n  .ops-table article {\n    display: grid;\n    grid-template-columns: minmax(250px, 1.35fr) minmax(120px, .55fr) minmax(120px, .5fr) minmax(180px, .75fr) minmax(160px, .65fr);\n    grid-template-areas: "product price affiliate availability actions";\n    gap: 14px;\n    align-items: start;\n    min-width: 0;\n    padding: 16px;\n    border-top: 1px solid var(--seo-border);\n  }\n  .ops-table article[hidden] { display: none !important; }\n  .ops-table article[data-busy="true"] { opacity: .72; }\n  .ops-table article > .ops-cell:nth-child(1) { grid-area: product; }\n  .ops-table article > .ops-cell:nth-child(2) { grid-area: price; }\n  .ops-table article > .ops-cell:nth-child(5) { grid-area: affiliate; }\n  .ops-table article > .ops-cell:nth-child(6) { grid-area: availability; }\n  .ops-table article > .ops-cell:nth-child(10) { grid-area: actions; }\n  .ops-table article > .ops-cell:nth-child(3),\n  .ops-table article > .ops-cell:nth-child(4),\n  .ops-table article > .ops-cell:nth-child(7),\n  .ops-table article > .ops-cell:nth-child(8),\n  .ops-table article > .ops-cell:nth-child(9) { display: none; }\n  .ops-cell { display: grid; min-width: 0; gap: 5px; }\n  .ops-product a { color: var(--seo-text); font-weight: 850; }\n  .ops-cell small { color: var(--seo-muted); font-size: .72rem; line-height: 1.35; overflow-wrap: anywhere; }\n  .ops-warning { color: var(--seo-warning) !important; }\n  .ops-chip { display: inline-flex; width: fit-content; max-width: 100%; padding: 5px 8px; border-radius: 999px; background: var(--seo-surface-soft); color: var(--seo-muted); font-size: .72rem; font-weight: 800; line-height: 1.25; }\n  .ops-chip[data-state="available"],\n  .ops-chip[data-state="yes"],\n  .ops-chip[data-state="complete"],\n  .ops-chip[data-state="recommended"] { background: var(--seo-accent-soft); color: var(--seo-accent-strong); }\n  .ops-chip[data-state="required"],\n  .ops-chip[data-state="no"],\n  .ops-chip[data-state="unknown"] { background: var(--seo-danger-soft); color: var(--seo-danger); }\n  .ops-chip[data-state="stale"],\n  .ops-chip[data-state="limited"],\n  .ops-chip[data-state="temporarily-unavailable"] { background: var(--seo-warning-soft); color: var(--seo-warning); }\n  .ops-chip[data-state="archived"],\n  .ops-chip[data-state="out-of-stock"],\n  .ops-chip[data-state="discontinued"],\n  .ops-chip[data-state="removed"] { background: var(--seo-surface-soft); color: var(--seo-muted); }\n  .ops-actions { display: grid; gap: 8px; align-items: stretch; align-self: start; }`,
    'Tabellenlayout'
  );

  page = replaceOnce(
    page,
    `  .ops-toolbar {\n    display: grid;`,
    `  .ops-toolbar {\n    position: sticky;\n    top: 10px;\n    z-index: 20;\n    box-shadow: 0 10px 28px color-mix(in srgb, var(--seo-text) 8%, transparent);\n    display: grid;`,
    'Sticky-Filterleiste'
  );

  page = replaceOnce(
    page,
    `    .ops-tabs { display: grid; }\n    .ops-editor { grid-template-columns: 1fr 1fr; }`,
    `    .ops-tabs { display: grid; }\n    .ops-table article {\n      grid-template-columns: 1fr 1fr;\n      grid-template-areas:\n        "product product"\n        "price affiliate"\n        "availability availability"\n        "actions actions";\n    }\n    .ops-actions { grid-template-columns: 1fr 1fr; }\n    .ops-editor { grid-template-columns: 1fr 1fr; }`,
    'Mobile Kartenlayout'
  );

  page = replaceOnce(
    page,
    `  .ops-editor[data-dirty="true"] {\n    border-color: var(--seo-warning);`,
    `  .ops-editor[data-saved="true"] {\n    border-color: var(--seo-accent);\n    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--seo-accent) 45%, transparent);\n  }\n  .ops-editor[data-dirty="true"] {\n    border-color: var(--seo-warning);`,
    'Speicherfeedback'
  );
}

if (!service.includes('PT_MANUAL_PRICE_STATE_NORMALIZATION_2_0_0')) {
  service = replaceOnce(
    service,
    `const validateTargetUrl = (value) => {\n  const raw = String(value || "").trim();\n  if (!raw) return undefined;\n  const parsed = new URL(raw);\n  if (parsed.protocol !== "https:") {\n    throw new Error("Für Preise und Affiliate-Ziele sind nur HTTPS-URLs erlaubt.");\n  }\n  return parsed.href;\n};`,
    `const validateTargetUrl = (value) => {\n  const raw = String(value || "").trim();\n  if (!raw) return undefined;\n  const candidate = /^[a-z][a-z0-9+.-]*:\\/\\//i.test(raw) ? raw : \`https://${'${raw}'}\`;\n  const parsed = new URL(candidate);\n  if (parsed.protocol === "http:") parsed.protocol = "https:";\n  if (parsed.protocol !== "https:") {\n    throw new Error("Für Preise und Affiliate-Ziele sind nur HTTPS-URLs erlaubt.");\n  }\n  return parsed.href;\n};`,
    'URL-Normalisierung'
  );

  service = replaceRegexOnce(
    service,
    /export async function setManualProductPrice\(input = \{\}\) \{[\s\S]*?\n\}\n\nexport async function updateProductOperationsState/,
    `export async function setManualProductPrice(input = {}) {\n  // PT_MANUAL_PRICE_STATE_NORMALIZATION_2_0_0\n  const slug = validateSlug(input.slug);\n  const document = await findDocument(slug);\n  const data = document.data ?? {};\n  const now = new Date().toISOString();\n  const availability = AVAILABILITY_VALUES.includes(input.availability) ? input.availability : undefined;\n  const availabilityReason = String(input.availabilityReason || "").trim().slice(0, 500);\n  const rawCurrent = String(input.current ?? "").trim();\n  const current = rawCurrent ? parseLocalizedPrice(rawCurrent) : null;\n  const hasCurrent = current != null;\n  const requestedPriceState = PRICE_STATE_VALUES.includes(input.priceState) ? input.priceState : undefined;\n  const priceState = hasCurrent\n    ? requestedPriceState === "stale" ? "stale" : "available"\n    : requestedPriceState || data.priceState || (data.price?.current == null ? "unknown" : "available");\n\n  const targetUrlProvided = Object.prototype.hasOwnProperty.call(input, "targetUrl") ||\n    Object.prototype.hasOwnProperty.call(input, "affiliateUrl");\n  const enteredUrl = validateTargetUrl(input.targetUrl ?? input.affiliateUrl);\n  const targetUrl = targetUrlProvided\n    ? enteredUrl\n    : validateTargetUrl(data.affiliate?.url || data.price?.affiliateUrl || data.price?.source?.url || data.productUrl);\n\n  const sourceLabel =\n    String(input.sourceLabel || "").trim().slice(0, 120) ||\n    (targetUrl ? hostnameLabel(targetUrl) : "") ||\n    (data.price?.source?.type === "manual" ? String(data.price.source.label || "").trim() : "") ||\n    "Manuell im SEO Cockpit";\n  const comparisonText = String(input.comparisonText || "").trim().slice(0, 360);\n\n  if (!hasCurrent) {\n    if (["available", "stale"].includes(priceState) && data.price?.current == null) {\n      throw new Error("Für den Status Preis vorhanden oder veraltet muss ein Preis eingegeben werden.");\n    }\n    const patch = {\n      priceState,\n      availability,\n      availabilityReason,\n      availabilityUpdated: availability ? now : undefined,\n      sourceLabel,\n      comparisonText,\n      now\n    };\n    if (targetUrlProvided) patch.affiliateUrl = targetUrl;\n    const persisted = await updateProductOperations(document.file, patch);\n    return resultFromDocument(persisted, {\n      method: "manual-status",\n      targetUrl: targetUrl ?? null,\n      affiliateUrl: targetUrl ?? null,\n      ctaUpdated: targetUrlProvided\n    });\n  }\n\n  const currency = validateCurrency(input.currency);\n  const persisted = await updateProductPrice(\n    document.file,\n    {\n      current,\n      currency,\n      status: "unknown",\n      comparisonText: comparisonText || undefined,\n      checkedAt: now,\n      source: { id: "manual", label: sourceLabel, type: "manual" }\n    },\n    {\n      affiliateUrl: targetUrl,\n      syncAffiliateUrl: targetUrlProvided || Boolean(targetUrl),\n      removeAffiliate: targetUrlProvided && !targetUrl,\n      now,\n      operations: {\n        priceState,\n        availability,\n        availabilityReason,\n        availabilityUpdated: availability ? now : undefined\n      }\n    }\n  );\n\n  return resultFromDocument(persisted, {\n    checkedAt: now,\n    source: sourceLabel,\n    targetUrl: targetUrl ?? null,\n    affiliateUrl: targetUrl ?? null,\n    ctaUpdated: targetUrlProvided,\n    method: "manual"\n  });\n}\n\nexport async function updateProductOperationsState`,
    'Manuelle Preislogik'
  );
}

if (!frontmatter.includes('PT_AFFILIATE_ONLY_UPDATE_2_0_0')) {
  frontmatter = replaceOnce(
    frontmatter,
    `    const nextData = { ...data };\n    let price = cleanPrice(data.price ?? { current: null, currency: "EUR", status: "unknown" });`,
    `    const nextData = { ...data };\n    let price = cleanPrice(data.price ?? { current: null, currency: "EUR", status: "unknown" });\n    // PT_AFFILIATE_ONLY_UPDATE_2_0_0: CTA-Ziel unabhängig vom Preis pflegen.\n    const hasAffiliatePatch = Object.prototype.hasOwnProperty.call(patch, "affiliateUrl");\n    const patchedAffiliateUrl = hasAffiliatePatch ? normalizeHttpsUrl(patch.affiliateUrl) : undefined;\n    let affiliate = data.affiliate;\n    let removeAffiliate = false;\n\n    if (hasAffiliatePatch) {\n      if (patchedAffiliateUrl) {\n        affiliate = canonicalAffiliateFrom(data, patchedAffiliateUrl, patch.sourceLabel || data.price?.source?.label);\n        nextData.affiliate = affiliate;\n      } else {\n        affiliate = undefined;\n        removeAffiliate = true;\n        delete nextData.affiliate;\n      }\n    }\n\n    if (patch.sourceLabel !== undefined) {\n      const sourceLabel = String(patch.sourceLabel || "").trim().slice(0, 120);\n      if (sourceLabel) {\n        price = {\n          ...price,\n          source: {\n            ...(price.source ?? {}),\n            id: price.source?.id || "manual",\n            label: sourceLabel,\n            type: price.source?.type || "manual"\n          }\n        };\n      }\n    }\n\n    if (patch.comparisonText !== undefined) {\n      const comparisonText = String(patch.comparisonText || "").trim().slice(0, 360);\n      price = { ...price };\n      if (comparisonText) price.comparisonText = comparisonText;\n      else delete price.comparisonText;\n    }`,
    'Affiliate-only Vorbereitung'
  );

  frontmatter = replaceOnce(
    frontmatter,
    `    const operationFields = operationFieldsFrom({ ...nextData, price }, { now });\n    return { frontmatter, price, operationFields, now };`,
    `    const operationData = { ...nextData, price };\n    if (affiliate) operationData.affiliate = affiliate;\n    else delete operationData.affiliate;\n    const operationFields = operationFieldsFrom(operationData, { now });\n    return {\n      frontmatter,\n      price,\n      ...(hasAffiliatePatch ? { affiliate, removeAffiliate } : {}),\n      operationFields,\n      now\n    };`,
    'Affiliate-only Persistenz'
  );
}

if (!tests.includes('Affiliate-Ziel lässt sich ohne Preis speichern')) {
  tests = replaceOnce(
    tests,
    `test("gleichzeitige Änderungen werden pro Produkt serialisiert und verlieren keine Daten", async (t) => {`,
    `test("Affiliate-Ziel lässt sich ohne Preis speichern", async (t) => {\n  const { dir, file } = await tempProduct();\n  t.after(() => fs.rm(dir, { recursive: true, force: true }));\n  const persisted = await updateProductOperations(file, {\n    priceState: "unknown",\n    affiliateUrl: "https://example.com/deal",\n    sourceLabel: "example.com"\n  });\n  assert.equal(persisted.data.price.current, null);\n  assert.equal(persisted.data.affiliate.url, "https://example.com/deal");\n  assert.equal(persisted.data.affiliateAvailable, true);\n});\n\ntest("gleichzeitige Änderungen werden pro Produkt serialisiert und verlieren keine Daten", async (t) => {`,
    'Affiliate-only Test'
  );

  tests = replaceOnce(
    tests,
    `  assert.match(saveBlock, /applyServerResult\\(result\\)/);\n});`,
    `  assert.match(saveBlock, /applyServerResult\\(result\\)/);\n  assert.match(source, /PT_SEO_PRICE_WORKFLOW_2_0_0/);\n  assert.match(source, /\\.ops-table article\\[hidden\\] \\{ display: none !important; \\}/);\n});`,
    'UI-Regressionsschutz'
  );
}

const changed = { page, service, frontmatter, tests };
const changedEntries = Object.entries(changed).filter(([key, content]) => content !== original[key]);

if (!changedEntries.length) {
  console.log(`[${PATCH}] Bereits installiert. Keine Änderungen nötig.`);
  process.exit(0);
}

for (const [key, content] of changedEntries) {
  if (!content.trim()) fail(`Interner Fehler: ${files[key]} wäre leer.`);
}

if (checkOnly) {
  console.log(`[${PATCH}] Vorprüfung erfolgreich. ${changedEntries.length} Datei(en) würden geändert.`);
  for (const [key] of changedEntries) console.log(`- ${files[key]}`);
  process.exit(0);
}

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupRoot = path.join(root, '.patch-backups', `${PATCH}-${stamp}`);
for (const [key] of changedEntries) {
  const relative = files[key];
  const target = path.join(root, relative);
  const backup = path.join(backupRoot, relative);
  fs.mkdirSync(path.dirname(backup), { recursive: true });
  fs.copyFileSync(target, backup);
}

try {
  for (const [key, content] of changedEntries) {
    fs.writeFileSync(path.join(root, files[key]), content, 'utf8');
  }
} catch (error) {
  for (const [key] of changedEntries) {
    const relative = files[key];
    const backup = path.join(backupRoot, relative);
    if (fs.existsSync(backup)) fs.copyFileSync(backup, path.join(root, relative));
  }
  fail(`Schreiben fehlgeschlagen, Backup wurde zurückgespielt: ${error instanceof Error ? error.message : String(error)}`);
}

console.log(`[${PATCH}] ${changedEntries.length} Datei(en) aktualisiert:`);
for (const [key] of changedEntries) console.log(`- ${files[key]}`);
console.log(`Backups: ${path.relative(root, backupRoot)}`);

if (!skipVerify) {
  const commands = [
    ['npm', ['--workspace', 'apps/pfotentechnik', 'run', 'test:product-operations']],
    ['npm', ['run', 'build:pfotentechnik']]
  ];
  for (const [command, args] of commands) {
    console.log(`\n[${PATCH}] Prüfe: ${command} ${args.join(' ')}`);
    const result = spawnSync(command, args, { cwd: root, stdio: 'inherit', shell: process.platform === 'win32' });
    if (result.error || result.status !== 0) {
      console.error(`\n[${PATCH}] Verifikation fehlgeschlagen. Die Änderungen bleiben erhalten; Backup liegt unter ${path.relative(root, backupRoot)}.`);
      process.exit(result.status || 1);
    }
  }
}

console.log(`\n[${PATCH}] Abgeschlossen.`);
