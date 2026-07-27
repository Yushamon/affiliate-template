#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const NAME = "pfotentechnik-seo-price-editor-stability-1.0.0";
const MARKER = "PT_SEO_PRICE_EDITOR_STABILITY_1_0_0";
const args = new Set(process.argv.slice(2));
const CHECK_ONLY = args.has("--check") || args.has("--dry-run");
const NO_BUILD = args.has("--no-build");

const log = (message) => console.log(`[${NAME}] ${message}`);
const fail = (message) => {
  console.error(`[${NAME}] FEHLER: ${message}`);
  process.exit(1);
};

function findRoot(start) {
  let current = path.resolve(start);
  while (true) {
    if (
      fs.existsSync(path.join(current, "package.json")) &&
      fs.existsSync(path.join(current, "apps", "pfotentechnik", "package.json")) &&
      fs.existsSync(path.join(current, "packages", "affiliate-core"))
    ) return current;

    const parent = path.dirname(current);
    if (parent === current) return null;
    current = parent;
  }
}

const root =
  findRoot(process.cwd()) ||
  findRoot(path.dirname(fileURLToPath(import.meta.url)));

if (!root) {
  fail("Repository-Root nicht gefunden. Starte den Installer im affiliate-template-Repository.");
}

const files = {
  page: path.join(root, "apps/pfotentechnik/src/pages/admin/seo/prices.astro"),
  test: path.join(root, "apps/pfotentechnik/test/seo-price-editor-stability-1.0.0.test.mjs"),
  report: path.join(root, "apps/pfotentechnik/reports/product-operations/seo-price-editor-stability-1.0.0.md")
};

if (!fs.existsSync(files.page)) {
  fail(`Pflichtdatei fehlt: ${path.relative(root, files.page)}`);
}

const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const backupRoot = path.join(root, ".patch-backups", `${NAME}-${timestamp}`);
const relative = (file) => path.relative(root, file).split(path.sep).join("/");
const read = (file) => fs.readFileSync(file, "utf8");

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function backup(file) {
  if (CHECK_ONLY || !fs.existsSync(file)) return;
  const target = path.join(backupRoot, relative(file));
  ensureDir(path.dirname(target));
  fs.copyFileSync(file, target);
}

function write(file, content) {
  const before = fs.existsSync(file) ? read(file) : null;
  if (before === content) return false;

  if (!CHECK_ONLY) {
    if (before !== null) backup(file);
    ensureDir(path.dirname(file));
    fs.writeFileSync(file, content);
  }
  return true;
}

function replaceRequired(source, search, replacement, label) {
  if (!source.includes(search)) fail(`Anker nicht gefunden: ${label}`);
  return source.replace(search, replacement);
}

function replaceBetween(source, startMarker, endMarker, replacement, label) {
  const start = source.indexOf(startMarker);
  if (start === -1) fail(`Startanker nicht gefunden: ${label}`);
  const end = source.indexOf(endMarker, start + startMarker.length);
  if (end === -1) fail(`Endanker nicht gefunden: ${label}`);
  return source.slice(0, start) + replacement + source.slice(end);
}

function insertBeforeLast(source, marker, insertion, label) {
  const index = source.lastIndexOf(marker);
  if (index === -1) fail(`Anker nicht gefunden: ${label}`);
  return source.slice(0, index) + insertion + source.slice(index);
}

const persistenceBlock = [
  '  const PRICE_DRAFT_STORAGE_KEY = "pfotentechnik:seo-price-editor-drafts:v1";',
  '  const dirtyEditors = new Set<string>();',
  '',
  '  const loadPersistedDrafts = (): Record<string, Draft> => {',
  '    try {',
  '      const parsed = JSON.parse(sessionStorage.getItem(PRICE_DRAFT_STORAGE_KEY) || "{}");',
  '      return parsed && typeof parsed === "object" ? parsed : {};',
  '    } catch {',
  '      return {};',
  '    }',
  '  };',
  '',
  '  const persistedDrafts = loadPersistedDrafts();',
  '',
  '  const persistDraft = (slug: string, draft: Draft) => {',
  '    persistedDrafts[slug] = { ...draft };',
  '    try {',
  '      sessionStorage.setItem(PRICE_DRAFT_STORAGE_KEY, JSON.stringify(persistedDrafts));',
  '    } catch {',
  '      // Der Editor bleibt auch ohne Storage-Support innerhalb der aktuellen Seite geschützt.',
  '    }',
  '  };',
  '',
  '  const clearPersistedDraft = (slug: string) => {',
  '    delete persistedDrafts[slug];',
  '    try {',
  '      if (Object.keys(persistedDrafts).length) {',
  '        sessionStorage.setItem(PRICE_DRAFT_STORAGE_KEY, JSON.stringify(persistedDrafts));',
  '      } else {',
  '        sessionStorage.removeItem(PRICE_DRAFT_STORAGE_KEY);',
  '      }',
  '    } catch {',
  '      // Kein Abbruch, wenn Session Storage blockiert ist.',
  '    }',
  '  };'
].join("\n");

const syncEditorBlock = [
  '  const writeDraftToEditor = (editor: HTMLFormElement, draft: Draft) => {',
  '    editor.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>("[data-draft]").forEach((input) => {',
  '      const key = input.dataset.draft as keyof Draft;',
  '      input.value = draft[key] ?? "";',
  '    });',
  '  };',
  '',
  '  const syncEditor = (record: OperationsRecord, options: { force?: boolean } = {}) => {',
  '    const editor = document.querySelector<HTMLFormElement>(`[data-editor="${CSS.escape(record.slug)}"]`);',
  '    if (!editor) return false;',
  '',
  '    const archiveButton = editor.querySelector<HTMLButtonElement>("[data-archive-product]");',
  '    if (archiveButton) {',
  '      archiveButton.textContent = record.maintenanceStatus === "archived"',
  '        ? "Aus Archiv lösen"',
  '        : "Bewusst archivieren";',
  '    }',
  '',
  '    const protectedInteraction =',
  '      dirtyEditors.has(record.slug) || editor.contains(document.activeElement);',
  '    if (!options.force && protectedInteraction) return false;',
  '',
  '    const draft = draftFrom(record);',
  '    drafts.set(record.slug, draft);',
  '    writeDraftToEditor(editor, draft);',
  '    editor.dataset.dirty = "false";',
  '    return true;',
  '  };',
  ''
].join("\n");

const applyServerResultBlock = [
  '  const hasProtectedEditorInteraction = () =>',
  '    dirtyEditors.size > 0 || Boolean(document.activeElement?.closest("[data-editor]"));',
  '',
  '  const applyServerResult = (result: any) => {',
  '    const record = result?.record ?? result;',
  '    if (!record?.slug) throw new Error("Die Serverantwort enthält keinen persistierten Produktzustand.");',
  '    updateRow(record);',
  '    refreshMetrics();',
  '    if (!hasProtectedEditorInteraction()) applyView();',
  '    return record;',
  '  };'
].join("\n");

const editorInitializationBlock = [
  '    const initial = records.get(slug);',
  '    const restored = persistedDrafts[slug];',
  '    const initialDraft = restored ?? draftFrom(initial || {});',
  '    drafts.set(slug, initialDraft);',
  '    writeDraftToEditor(editor, initialDraft);',
  '',
  '    if (restored) {',
  '      dirtyEditors.add(slug);',
  '      editor.dataset.dirty = "true";',
  '    } else {',
  '      editor.dataset.dirty = "false";',
  '    }',
  '',
  '    const captureDraft = (input: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement) => {',
  '      const draft = drafts.get(slug) ?? draftFrom(records.get(slug) || {});',
  '      draft[input.dataset.draft as keyof Draft] = input.value;',
  '      drafts.set(slug, draft);',
  '      const wasDirty = dirtyEditors.has(slug);',
  '      dirtyEditors.add(slug);',
  '      editor.dataset.dirty = "true";',
  '      persistDraft(slug, draft);',
  '      if (!wasDirty) {',
  '        setStatus(`${records.get(slug)?.title || slug}: ungespeicherte Eingaben werden vor automatischer Synchronisierung geschützt.`);',
  '      }',
  '    };',
  '',
  '    editor.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>("[data-draft]").forEach((input) => {',
  '      input.addEventListener("input", () => captureDraft(input));',
  '      input.addEventListener("change", () => captureDraft(input));',
  '    });',
  ''
].join("\n");

let page = read(files.page);

if (!page.includes(MARKER)) {
  page = replaceRequired(
    page,
    '<script>\n  type OperationsRecord',
    `<script>\n  // ${MARKER}: schützt aktive und ungespeicherte Preisentwürfe.\n  type OperationsRecord`,
    "Script-Marker"
  );

  page = replaceRequired(
    page,
    '  const drafts = new Map<string, Draft>();',
    `  const drafts = new Map<string, Draft>();\n${persistenceBlock}`,
    "Draft-Map"
  );

  page = replaceBetween(
    page,
    '  const syncEditor = (record: OperationsRecord) => {',
    '  const updateRow = (record: OperationsRecord) => {',
    syncEditorBlock,
    "syncEditor"
  );

  page = replaceBetween(
    page,
    '  const applyServerResult = (result: any) => {',
    '\n\n  document.querySelectorAll<HTMLButtonElement>("[data-view]")',
    applyServerResultBlock,
    "applyServerResult"
  );

  page = replaceBetween(
    page,
    '    const initial = records.get(slug);',
    '    editor.addEventListener("submit", (event) => {',
    editorInitializationBlock,
    "Editor-Initialisierung"
  );

  page = replaceRequired(
    page,
    '          const record = applyServerResult(result);\n          setStatus(`${record.title}: persistierter Zustand wurde beim ersten Speichern übernommen.`);',
    [
      '          dirtyEditors.delete(slug);',
      '          clearPersistedDraft(slug);',
      '          editor.dataset.dirty = "false";',
      '          const record = applyServerResult(result);',
      '          syncEditor(record, { force: true });',
      '          setStatus(`${record.title}: persistierter Zustand wurde beim ersten Speichern übernommen.`);'
    ].join("\n"),
    "Speichererfolg"
  );

  page = replaceRequired(
    page,
    [
      '      for (const record of payload.products || []) updateRow(record);',
      '      refreshMetrics();',
      '      applyView();',
      '      setStatus("Persistierter Produktzustand ist synchronisiert.");'
    ].join("\n"),
    [
      '      for (const record of payload.products || []) updateRow(record);',
      '      refreshMetrics();',
      '      const protectedCount = dirtyEditors.size;',
      '      if (!hasProtectedEditorInteraction()) applyView();',
      '      setStatus(',
      '        protectedCount',
      '          ? `${protectedCount} ungespeicherte Preisentwürfe wurden beibehalten; die übrigen Produktdaten sind synchronisiert.`',
      '          : "Persistierter Produktzustand ist synchronisiert."',
      '      );'
    ].join("\n"),
    "Server-Synchronisierung"
  );

  const dirtyStyle = [
    '',
    `  /* ${MARKER} */`,
    '  .ops-editor[data-dirty="true"] {',
    '    border-color: var(--seo-warning);',
    '    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--seo-warning) 45%, transparent);',
    '  }',
    ''
  ].join("\n");

  page = insertBeforeLast(page, '</style>', dirtyStyle, "Style-Ende");
}

const testSource = [
  'import test from "node:test";',
  'import assert from "node:assert/strict";',
  'import fs from "node:fs/promises";',
  'import path from "node:path";',
  'import { fileURLToPath } from "node:url";',
  '',
  'const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");',
  'const pagePath = path.join(appRoot, "src/pages/admin/seo/prices.astro");',
  'const readPage = () => fs.readFile(pagePath, "utf8");',
  '',
  'test("Preis-Editor schützt aktive und ungespeicherte Eingaben", async () => {',
  '  const source = await readPage();',
  '  assert.match(source, /PT_SEO_PRICE_EDITOR_STABILITY_1_0_0/);',
  '  assert.match(source, /dirtyEditors\\.has\\(record\\.slug\\)/);',
  '  assert.match(source, /editor\\.contains\\(document\\.activeElement\\)/);',
  '  assert.match(source, /if \\(!options\\.force && protectedInteraction\\) return false/);',
  '});',
  '',
  'test("Preisentwürfe überstehen einen Dev-Reload innerhalb des Tabs", async () => {',
  '  const source = await readPage();',
  '  assert.match(source, /sessionStorage\\.setItem\\(PRICE_DRAFT_STORAGE_KEY/);',
  '  assert.match(source, /persistedDrafts\\[slug\\]/);',
  '  assert.match(source, /writeDraftToEditor\\(editor, initialDraft\\)/);',
  '});',
  '',
  'test("Nur erfolgreich gespeicherte Entwürfe werden verworfen", async () => {',
  '  const source = await readPage();',
  '  assert.match(source, /clearPersistedDraft\\(slug\\)/);',
  '  assert.match(source, /syncEditor\\(record, \\{ force: true \\}\\)/);',
  '  assert.match(source, /hasProtectedEditorInteraction/);',
  '  assert.match(source, /if \\(!hasProtectedEditorInteraction\\(\\)\\) applyView\\(\\)/);',
  '});',
  ''
].join("\n");

const report = `# SEO Price Editor Stability 1.0.0

## Ursache

Die Produktpflege lädt nach dem Rendern den persistierten Zustand vom lokalen
Admin-Dienst. Jede Serverantwort rief \`updateRow()\` auf, und \`updateRow()\`
synchronisierte den Editor ohne Rücksicht auf Fokus oder ungespeicherte Eingaben.
Damit konnten verspätete oder wiederholte Synchronisierungen ein gerade
bearbeitetes Preisfeld zurücksetzen.

Im Astro-Entwicklungsmodus kommt hinzu, dass Änderungen an Produktdateien einen
Reload auslösen können. Ein reiner Fokusschutz reicht deshalb nicht.

## Änderung

- Aktive oder geänderte Editoren werden von Server-Synchronisierungen nicht überschrieben.
- Ungespeicherte Entwürfe werden im Session Storage des Tabs gehalten.
- Nach einem Dev-Reload werden Entwürfe wiederhergestellt.
- Serverseitiges Sortieren und Umhängen der Zeilen wird während der Bearbeitung ausgesetzt.
- Erst nach erfolgreichem Speichern wird der Entwurf verworfen und der persistierte Wert erzwungen übernommen.
- Ein sichtbarer Warnrahmen kennzeichnet ungespeicherte Editoren.
`;

const changed = [];
if (write(files.page, page)) changed.push(relative(files.page));
if (write(files.test, testSource)) changed.push(relative(files.test));
if (write(files.report, report)) changed.push(relative(files.report));

const installedSource = CHECK_ONLY ? page : read(files.page);
const requiredChecks = [
  [installedSource.includes(MARKER), "Marker fehlt"],
  [/dirtyEditors\.has\(record\.slug\)/.test(installedSource), "Dirty-Guard fehlt"],
  [/editor\.contains\(document\.activeElement\)/.test(installedSource), "Fokus-Guard fehlt"],
  [/sessionStorage\.setItem\(PRICE_DRAFT_STORAGE_KEY/.test(installedSource), "Session-Entwurf fehlt"],
  [/clearPersistedDraft\(slug\)/.test(installedSource), "Entwurf wird nach Save nicht entfernt"],
  [/syncEditor\(record,\s*\{\s*force:\s*true\s*\}\)/.test(installedSource), "Erzwungener Sync nach Save fehlt"]
];

for (const [ok, message] of requiredChecks) {
  if (!ok) fail(`Validierung fehlgeschlagen: ${message}`);
}

if (CHECK_ONLY) {
  log(changed.length ? `Würde ${changed.length} Datei(en) ändern:` : "Keine Änderungen erforderlich.");
  for (const file of changed) console.log(`- ${file}`);
  process.exit(0);
}

if (changed.length) {
  log(`${changed.length} Datei(en) aktualisiert:`);
  for (const file of changed) console.log(`- ${file}`);
  if (fs.existsSync(backupRoot)) log(`Backups: ${relative(backupRoot)}`);
} else {
  log("Fix ist bereits installiert.");
}

function run(command, commandArgs) {
  const executable =
    process.platform === "win32" && command === "npm" ? "npm.cmd" : command;
  const result = spawnSync(executable, commandArgs, {
    cwd: root,
    stdio: "inherit",
    shell: false
  });
  if (result.error) fail(`${command} konnte nicht gestartet werden: ${result.error.message}`);
  return result.status === 0;
}

log("Führe Preis-Editor- und Price-Intelligence-Tests aus …");
if (
  !run(process.execPath, [
    "--test",
    "apps/pfotentechnik/test/price-intelligence.test.mjs",
    "apps/pfotentechnik/test/seo-price-editor-stability-1.0.0.test.mjs"
  ])
) {
  fail("Preis-Editor-Tests fehlgeschlagen.");
}

if (!NO_BUILD) {
  log("Führe PfotenTechnik-Build aus …");
  if (!run("npm", ["run", "build:pfotentechnik"])) {
    fail("PfotenTechnik-Build fehlgeschlagen.");
  }
}

log("Abgeschlossen.");
