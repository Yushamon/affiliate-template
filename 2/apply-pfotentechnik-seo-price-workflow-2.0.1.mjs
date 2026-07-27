#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const PATCH = "pfotentechnik-seo-price-workflow-2.0.1";
const root = process.cwd();
const skipVerify = process.argv.includes("--skip-verify");
const checkOnly = process.argv.includes("--check");

const files = {
  page: "apps/pfotentechnik/src/pages/admin/seo/prices.astro",
  service: "apps/pfotentechnik/src/lib/price-intelligence/service.mjs",
  frontmatter: "apps/pfotentechnik/src/lib/price-intelligence/frontmatter-price.mjs",
  tests: "apps/pfotentechnik/test/product-operations.test.mjs"
};

const fail = (message) => {
  console.error(`\n[${PATCH}] ${message}`);
  process.exit(1);
};

for (const relative of Object.values(files)) {
  if (!fs.existsSync(path.join(root, relative))) {
    fail(`Datei nicht gefunden: ${relative}\nBitte im Root von affiliate-template ausführen.`);
  }
}

const original = Object.fromEntries(
  Object.entries(files).map(([key, relative]) => [key, fs.readFileSync(path.join(root, relative), "utf8")])
);

const replaceFunctionBlock = (source, startPattern, nextPattern, replacement, label) => {
  const start = source.search(startPattern);
  if (start < 0) fail(`Vorprüfung fehlgeschlagen. Funktionsanfang nicht gefunden: ${label}`);
  const tail = source.slice(start);
  const nextMatch = tail.match(nextPattern);
  if (!nextMatch || nextMatch.index == null) fail(`Vorprüfung fehlgeschlagen. Funktionsende nicht gefunden: ${label}`);
  const end = start + nextMatch.index;
  return `${source.slice(0, start)}${replacement}\n\n${source.slice(end)}`;
};

const replaceRegexOnce = (source, regex, replacement, label) => {
  const flags = regex.flags.includes("g") ? regex.flags : `${regex.flags}g`;
  const matches = [...source.matchAll(new RegExp(regex.source, flags))];
  if (matches.length !== 1) fail(`Vorprüfung fehlgeschlagen. ${label}: ${matches.length} Treffer statt 1.`);
  return source.replace(regex, replacement);
};

let page = original.page;
let service = original.service;
let frontmatter = original.frontmatter;
let tests = original.tests;

if (!page.includes("PT_SEO_PRICE_WORKFLOW_2_0_1")) {
  const uiScript = String.raw`

<script>
  // PT_SEO_PRICE_WORKFLOW_2_0_1: robuste Ergänzung ohne Abhängigkeit von Status-Texten.
  document.querySelectorAll("[data-editor]").forEach((editor) => {
    const priceInput = editor.querySelector("[data-draft='current']");
    const priceStateInput = editor.querySelector("[data-draft='priceState']");
    const targetUrlInput = editor.querySelector("[data-draft='targetUrl']");
    const sourceInput = editor.querySelector("[data-draft='sourceLabel']");

    const notifyDraftChange = (input, eventName = "input") => {
      input?.dispatchEvent(new Event(eventName, { bubbles: true }));
    };

    const normalizePriceState = () => {
      if (!priceInput?.value.trim() || !priceStateInput) return;
      if (["unknown", "removed"].includes(priceStateInput.value)) {
        priceStateInput.value = "available";
        notifyDraftChange(priceStateInput, "change");
      }
    };

    priceInput?.addEventListener("input", normalizePriceState);

    targetUrlInput?.addEventListener("blur", () => {
      const raw = targetUrlInput.value.trim();
      if (!raw) return;
      const candidate = /^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : "https://" + raw;
      try {
        const parsed = new URL(candidate);
        if (parsed.protocol === "http:") parsed.protocol = "https:";
        if (parsed.protocol !== "https:") return;
        targetUrlInput.value = parsed.href;
        notifyDraftChange(targetUrlInput);
        if (sourceInput && !sourceInput.value.trim()) {
          sourceInput.value = parsed.hostname.replace(/^www\./, "");
          notifyDraftChange(sourceInput);
        }
      } catch {
        // Die vorhandene Servervalidierung zeigt beim Speichern die konkrete Fehlermeldung.
      }
    });

    editor.addEventListener("submit", normalizePriceState, true);
    editor.addEventListener("keydown", (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        event.preventDefault();
        editor.requestSubmit();
      }
    });
  });
</script>`;

  const styleStart = page.lastIndexOf("<style>");
  if (styleStart < 0) fail("Vorprüfung fehlgeschlagen. Style-Block im SEO-Preisbereich nicht gefunden.");
  page = `${page.slice(0, styleStart)}${uiScript}\n\n${page.slice(styleStart)}`;

  const styleEnd = page.lastIndexOf("</style>");
  if (styleEnd < 0) fail("Vorprüfung fehlgeschlagen. Ende des Style-Blocks nicht gefunden.");
  const css = String.raw`

  /* PT_SEO_PRICE_WORKFLOW_2_0_1 */
  .ops-toolbar {
    position: sticky;
    top: 10px;
    z-index: 20;
    box-shadow: 0 10px 28px color-mix(in srgb, var(--seo-text) 8%, transparent);
  }
  .ops-table {
    overflow: visible;
    padding: 0;
  }
  .ops-head {
    display: none;
  }
  .ops-table article {
    display: grid;
    grid-template-columns: minmax(250px, 1.35fr) minmax(120px, .55fr) minmax(120px, .5fr) minmax(180px, .75fr) minmax(160px, .65fr);
    grid-template-areas: "product price affiliate availability actions";
    gap: 14px;
    align-items: start;
    min-width: 0;
    padding: 16px;
    border-top: 1px solid var(--seo-border);
  }
  .ops-table article[hidden] {
    display: none !important;
  }
  .ops-table article > .ops-cell:nth-child(1) { grid-area: product; }
  .ops-table article > .ops-cell:nth-child(2) { grid-area: price; }
  .ops-table article > .ops-cell:nth-child(5) { grid-area: affiliate; }
  .ops-table article > .ops-cell:nth-child(6) { grid-area: availability; }
  .ops-table article > .ops-cell:nth-child(10) { grid-area: actions; }
  .ops-table article > .ops-cell:nth-child(3),
  .ops-table article > .ops-cell:nth-child(4),
  .ops-table article > .ops-cell:nth-child(7),
  .ops-table article > .ops-cell:nth-child(8),
  .ops-table article > .ops-cell:nth-child(9) {
    display: none;
  }
  .ops-actions {
    display: grid;
    gap: 8px;
    align-self: start;
  }
  .ops-editor[data-saved="true"] {
    border-color: var(--seo-accent);
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--seo-accent) 45%, transparent);
  }
  @media (max-width: 900px) {
    .ops-table article {
      grid-template-columns: 1fr 1fr;
      grid-template-areas:
        "product product"
        "price affiliate"
        "availability availability"
        "actions actions";
    }
    .ops-actions {
      grid-template-columns: 1fr 1fr;
    }
  }
  @media (max-width: 560px) {
    .ops-toolbar {
      top: 0;
    }
    .ops-table article {
      grid-template-columns: 1fr;
      grid-template-areas:
        "product"
        "price"
        "affiliate"
        "availability"
        "actions";
    }
    .ops-actions {
      grid-template-columns: 1fr;
    }
  }
`;
  page = `${page.slice(0, styleEnd)}${css}${page.slice(styleEnd)}`;
}

if (!service.includes("PT_MANUAL_PRICE_STATE_NORMALIZATION_2_0_1")) {
  const validateTargetUrl = String.raw`const validateTargetUrl = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return undefined;
  const normalized = /^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : "https://" + raw;
  const parsed = new URL(normalized);
  if (parsed.protocol === "http:") parsed.protocol = "https:";
  if (parsed.protocol !== "https:") {
    throw new Error("Für Preise und Affiliate-Ziele sind nur HTTPS-URLs erlaubt.");
  }
  return parsed.href;
};`;

  service = replaceRegexOnce(
    service,
    /const validateTargetUrl = \(value\) => \{[\s\S]*?\n\};/,
    validateTargetUrl,
    "URL-Validierung"
  );

  const manualPriceFunction = String.raw`export async function setManualProductPrice(input = {}) {
  // PT_MANUAL_PRICE_STATE_NORMALIZATION_2_0_1
  const slug = validateSlug(input.slug);
  const document = await findDocument(slug);
  const data = document.data ?? {};
  const now = new Date().toISOString();
  const availability = AVAILABILITY_VALUES.includes(input.availability) ? input.availability : undefined;
  const availabilityReason = String(input.availabilityReason || "").trim().slice(0, 500);

  const rawCurrent = String(input.current ?? "").trim();
  const current = rawCurrent ? parseLocalizedPrice(rawCurrent) : null;
  if (rawCurrent && current == null) {
    throw new Error("Der manuelle Preis ist ungültig. Erlaubt sind zum Beispiel 29,99 oder 29.99.");
  }
  const hasCurrent = current != null;
  const requestedPriceState = PRICE_STATE_VALUES.includes(input.priceState) ? input.priceState : undefined;
  const priceState = hasCurrent
    ? requestedPriceState === "stale" ? "stale" : "available"
    : requestedPriceState || data.priceState || (data.price?.current == null ? "unknown" : "available");

  const targetUrlProvided = Object.prototype.hasOwnProperty.call(input, "targetUrl") ||
    Object.prototype.hasOwnProperty.call(input, "affiliateUrl");
  const enteredUrl = validateTargetUrl(input.targetUrl ?? input.affiliateUrl);
  const targetUrl = targetUrlProvided
    ? enteredUrl
    : validateTargetUrl(data.affiliate?.url || data.price?.affiliateUrl || data.price?.source?.url || data.productUrl);

  const sourceLabel =
    String(input.sourceLabel || "").trim().slice(0, 120) ||
    (targetUrl ? hostnameLabel(targetUrl) : "") ||
    (data.price?.source?.type === "manual" ? String(data.price.source.label || "").trim() : "") ||
    "Manuell im SEO Cockpit";
  const comparisonText = String(input.comparisonText || "").trim().slice(0, 360);

  if (!hasCurrent) {
    if (["available", "stale"].includes(priceState) && data.price?.current == null) {
      throw new Error("Für den Status Preis vorhanden oder veraltet muss ein Preis eingegeben werden.");
    }
    const patch = {
      priceState,
      availability,
      availabilityReason,
      availabilityUpdated: availability ? now : undefined,
      sourceLabel,
      comparisonText,
      now
    };
    if (targetUrlProvided) patch.affiliateUrl = targetUrl;
    const persisted = await updateProductOperations(document.file, patch);
    return resultFromDocument(persisted, {
      method: "manual-status",
      targetUrl: targetUrl ?? null,
      affiliateUrl: targetUrl ?? null,
      ctaUpdated: targetUrlProvided
    });
  }

  const currency = validateCurrency(input.currency);
  const persisted = await updateProductPrice(
    document.file,
    {
      current,
      currency,
      status: "unknown",
      comparisonText: comparisonText || undefined,
      checkedAt: now,
      source: {
        id: "manual",
        label: sourceLabel,
        type: "manual"
      }
    },
    {
      affiliateUrl: targetUrl,
      syncAffiliateUrl: targetUrlProvided || Boolean(targetUrl),
      removeAffiliate: targetUrlProvided && !targetUrl,
      now,
      operations: {
        priceState,
        availability,
        availabilityReason,
        availabilityUpdated: availability ? now : undefined
      }
    }
  );

  return resultFromDocument(persisted, {
    checkedAt: now,
    source: sourceLabel,
    targetUrl: targetUrl ?? null,
    affiliateUrl: targetUrl ?? null,
    ctaUpdated: targetUrlProvided,
    method: "manual"
  });
}`;

  service = replaceFunctionBlock(
    service,
    /export async function setManualProductPrice\s*\(/,
    /export async function updateProductOperationsState\s*\(/,
    manualPriceFunction,
    "setManualProductPrice"
  );
}

if (!frontmatter.includes("PT_AFFILIATE_ONLY_UPDATE_2_0_1")) {
  const operationsFunction = String.raw`export async function updateProductOperations(file, patch = {}) {
  const now = patch.now ?? new Date().toISOString();
  return persistMutation(file, async ({ data, frontmatter }) => {
    const nextData = { ...data };
    let price = cleanPrice(data.price ?? { current: null, currency: "EUR", status: "unknown" });

    // PT_AFFILIATE_ONLY_UPDATE_2_0_1: CTA-Ziel unabhängig vom Preis pflegen.
    const hasAffiliatePatch = Object.prototype.hasOwnProperty.call(patch, "affiliateUrl");
    const patchedAffiliateUrl = hasAffiliatePatch ? normalizeHttpsUrl(patch.affiliateUrl) : undefined;
    let affiliate = data.affiliate;
    let removeAffiliate = false;

    if (hasAffiliatePatch) {
      if (patchedAffiliateUrl) {
        affiliate = canonicalAffiliateFrom(data, patchedAffiliateUrl, patch.sourceLabel || data.price?.source?.label);
        nextData.affiliate = affiliate;
      } else {
        affiliate = undefined;
        removeAffiliate = true;
        delete nextData.affiliate;
      }
    }

    if (patch.sourceLabel !== undefined) {
      const sourceLabel = String(patch.sourceLabel || "").trim().slice(0, 120);
      if (sourceLabel) {
        price = {
          ...price,
          source: {
            ...(price.source ?? {}),
            id: price.source?.id || "manual",
            label: sourceLabel,
            type: price.source?.type || "manual"
          }
        };
      }
    }

    if (patch.comparisonText !== undefined) {
      const comparisonText = String(patch.comparisonText || "").trim().slice(0, 360);
      price = { ...price };
      if (comparisonText) price.comparisonText = comparisonText;
      else delete price.comparisonText;
    }

    if (patch.priceState !== undefined) {
      if (!PRICE_STATE_VALUES.includes(patch.priceState)) throw new Error("Unbekannter Preisstatus.");
      nextData.priceState = patch.priceState;
      nextData.priceUpdated = now;
      if (["removed", "unknown"].includes(patch.priceState)) {
        price = { ...price, current: null };
        delete price.checkedAt;
      }
    }

    if (patch.availability !== undefined) {
      if (!AVAILABILITY_VALUES.includes(patch.availability)) throw new Error("Unbekannter Verfügbarkeitsstatus.");
      nextData.availability = patch.availability;
      nextData.availabilityUpdated = now;
      nextData.availabilityReason = String(patch.availabilityReason || "").trim().slice(0, 500) || undefined;
      if (!["out-of-stock", "discontinued"].includes(patch.availability)) {
        if (nextData.maintenanceStatus === "archived") delete nextData.maintenanceStatus;
        if (nextData.recommendationStatus === "archived") delete nextData.recommendationStatus;
        if (nextData.editorialStatus === "archived") delete nextData.editorialStatus;
      }
    }

    if (patch.archive === true) {
      nextData.maintenanceStatus = "archived";
      nextData.recommendationStatus = "archived";
      nextData.editorialStatus = "archived";
    } else if (patch.archive === false) {
      delete nextData.maintenanceStatus;
      delete nextData.recommendationStatus;
      delete nextData.editorialStatus;
    }

    const operationData = { ...nextData, price };
    if (affiliate) operationData.affiliate = affiliate;
    else delete operationData.affiliate;
    const operationFields = operationFieldsFrom(operationData, { now });

    return {
      frontmatter,
      price,
      ...(hasAffiliatePatch ? { affiliate, removeAffiliate } : {}),
      operationFields,
      now
    };
  });
}`;

  frontmatter = replaceFunctionBlock(
    frontmatter,
    /export async function updateProductOperations\s*\(/,
    /export async function migrateProductOperations\s*\(/,
    operationsFunction,
    "updateProductOperations"
  );
}

if (!tests.includes("PT_SEO_PRICE_WORKFLOW_TEST_2_0_1")) {
  tests += String.raw`

// PT_SEO_PRICE_WORKFLOW_TEST_2_0_1
 test("Affiliate-Ziel lässt sich ohne vorhandenen Preis speichern", async (t) => {
  const { dir, file } = await tempProduct();
  t.after(() => fs.rm(dir, { recursive: true, force: true }));
  const persisted = await updateProductOperations(file, {
    priceState: "unknown",
    affiliateUrl: "https://example.com/deal",
    sourceLabel: "example.com"
  });
  assert.equal(persisted.data.price.current, null);
  assert.equal(persisted.data.affiliate.url, "https://example.com/deal");
  assert.equal(persisted.data.affiliateAvailable, true);
});

test("SEO-Preisfilter und sichtbare Aktionen sind gegen CSS-Regression geschützt", async () => {
  const source = await fs.readFile(new URL("../src/pages/admin/seo/prices.astro", import.meta.url), "utf8");
  assert.match(source, /PT_SEO_PRICE_WORKFLOW_2_0_1/);
  assert.match(source, /\.ops-table article\[hidden\][\s\S]*?display:\s*none\s*!important/);
  assert.match(source, /grid-template-areas:\s*"product price affiliate availability actions"/);
});
`;
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

const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const backupRoot = path.join(root, ".patch-backups", `${PATCH}-${stamp}`);
for (const [key] of changedEntries) {
  const relative = files[key];
  const target = path.join(root, relative);
  const backup = path.join(backupRoot, relative);
  fs.mkdirSync(path.dirname(backup), { recursive: true });
  fs.copyFileSync(target, backup);
}

try {
  for (const [key, content] of changedEntries) {
    fs.writeFileSync(path.join(root, files[key]), content, "utf8");
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
    ["npm", ["--workspace", "apps/pfotentechnik", "run", "test:product-operations"]],
    ["npm", ["run", "build:pfotentechnik"]]
  ];
  for (const [command, args] of commands) {
    console.log(`\n[${PATCH}] Prüfe: ${command} ${args.join(" ")}`);
    const result = spawnSync(command, args, {
      cwd: root,
      stdio: "inherit",
      shell: process.platform === "win32"
    });
    if (result.error || result.status !== 0) {
      console.error(`\n[${PATCH}] Verifikation fehlgeschlagen. Die Änderungen bleiben erhalten; Backup liegt unter ${path.relative(root, backupRoot)}.`);
      process.exit(result.status || 1);
    }
  }
}

console.log(`\n[${PATCH}] Abgeschlossen.`);
