#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const PATCH = "pfotentechnik-comparison-curated-row-guard-32.6.9";

function findRoot(start) {
  let dir = path.resolve(start);
  for (let i = 0; i < 10; i++) {
    if (
      fs.existsSync(path.join(dir, "package.json")) &&
      fs.existsSync(path.join(dir, "apps", "pfotentechnik", "package.json"))
    ) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error(`[${PATCH}] Repository-Root nicht gefunden.`);
}

const root = findRoot(process.cwd());
const target = path.join(
  root,
  "apps",
  "pfotentechnik",
  "src",
  "domain",
  "comparison",
  "buildComparisonViewModel.ts"
);

if (!fs.existsSync(target)) {
  throw new Error(`[${PATCH}] Datei fehlt: ${path.relative(root, target)}`);
}

let raw = fs.readFileSync(target, "utf8");

const oldBlock = `  const rowCandidates = rawRows.map((row) => {
    const resolvedCells = row.cells.filter(
      (cell) =>
        Boolean(cell.value) &&
        cell.value !== "–"
    );
    const normalizedValues = new Set(
      resolvedCells.map((cell) =>
        cell.value.trim().toLocaleLowerCase("de")
      )
    );

    return {
      ...row,
      resolvedCount: resolvedCells.length,
      coverage:
        row.cells.length > 0
          ? resolvedCells.length / row.cells.length
          : 0,
      hasDifferences: normalizedValues.size > 1
    };
  });

  /*
   * Release Closure 14.0:
   * Nur vollständig belegte Kriterien werden öffentlich ausgespielt.
   * Unvollständige Quellkriterien bleiben im Audit sichtbar, erzeugen aber
   * keine "Keine Angabe"-Wüsten in Desktop-Tabelle oder Mobile Cards.
   */
  const rows: ComparisonRow[] = rowCandidates
    .filter((row) =>
      row.cells.length >= 2 &&
      row.resolvedCount === row.cells.length
    )
    .map(({ resolvedCount: _resolvedCount, coverage: _coverage, ...row }) => row);`;

const newBlock = `  const rowCandidates = rawRows.map((row) => {
    const isResolved = (cell: (typeof row.cells)[number]) =>
      Boolean(cell.value) &&
      cell.value !== "–";

    const resolvedCells = row.cells.filter(isResolved);
    const curatedCells = row.cells.filter((cell) =>
      explicitSlugs.has(cell.productSlug)
    );
    const resolvedCuratedCells = curatedCells.filter(isResolved);

    const normalizedValues = new Set(
      resolvedCells.map((cell) =>
        cell.value.trim().toLocaleLowerCase("de")
      )
    );

    return {
      ...row,
      resolvedCount: resolvedCells.length,
      curatedCount: curatedCells.length,
      resolvedCuratedCount: resolvedCuratedCells.length,
      coverage:
        row.cells.length > 0
          ? resolvedCells.length / row.cells.length
          : 0,
      hasDifferences: normalizedValues.size > 1
    };
  });

  /*
   * Curated Row Guard 32.6.9
   *
   * Die globale Backlink-Union darf eine bestehende Vergleichsmatrix
   * erweitern, aber keine bisher vollständig belegte kuratierte Zeile
   * verschwinden lassen, nur weil ein neu ergänztes Produkt für dieses
   * Kriterium noch keinen belastbaren Wert besitzt.
   *
   * Bei kuratierten items[] entscheidet daher deren Datenabdeckung über die
   * Sichtbarkeit einer Zeile. Nur wenn ein Vergleich gar keine kuratierten
   * Produkt-Items besitzt, bleibt die bisherige Vollabdeckungsregel aktiv.
   */
  const rows: ComparisonRow[] = rowCandidates
    .filter((row) => {
      if (row.cells.length < 2) return false;

      if (row.curatedCount >= 2) {
        return row.resolvedCuratedCount === row.curatedCount;
      }

      return row.resolvedCount === row.cells.length;
    })
    .map(({
      resolvedCount: _resolvedCount,
      curatedCount: _curatedCount,
      resolvedCuratedCount: _resolvedCuratedCount,
      coverage: _coverage,
      ...row
    }) => row);`;

if (!raw.includes(oldBlock)) {
  throw new Error(
    `[${PATCH}] Erwarteter Row-Coverage-Block nicht gefunden. ` +
    `Der lokale Stand weicht vom geprüften GitHub-Stand ab.`
  );
}

const backup = `${target}.${PATCH}.bak`;
if (!fs.existsSync(backup)) {
  fs.copyFileSync(target, backup);
  console.log(`[${PATCH}] Backup: ${path.relative(root, backup)}`);
}

raw = raw.replace(oldBlock, newBlock);
fs.writeFileSync(target, raw, "utf8");

const reportDir = path.join(
  root,
  "apps",
  "pfotentechnik",
  "reports",
  "comparison-selection"
);
fs.mkdirSync(reportDir, { recursive: true });

const reportPath = path.join(
  reportDir,
  "comparison-curated-row-guard-32.6.9.md"
);

fs.writeFileSync(reportPath, `# Comparison Curated Row Guard 32.6.9

## Problem

Seit der globalen Backlink-Union können zusätzliche Produkte in einem Vergleich
sichtbar werden, obwohl für einzelne Kriterien noch keine vollständigen
Vergleichswerte vorliegen.

Die bisherige Zeilenlogik verlangte Vollabdeckung über ALLE sichtbaren Produkte.
Ein einziges ergänztes Produkt ohne Wert konnte dadurch eine zuvor vollständige
Vergleichszeile für alle Nutzer entfernen.

## Neue Regel

Wenn mindestens zwei kuratierte items[] vorhanden sind:

- Sichtbarkeit einer Kriterienzeile richtet sich nach der vollständigen
  Abdeckung der kuratierten items[].
- Backlink-Produkte dürfen fehlende Werte haben, ohne die kuratierte Zeile
  zu löschen.
- Vorhandene Werte von Backlink-Produkten werden selbstverständlich angezeigt.

Wenn keine ausreichende kuratierte Basis existiert, bleibt die bisherige strenge
Vollabdeckung über alle sichtbaren Produkte bestehen.

## Unverändert

- Kein Produkt wird aus dem Vergleich entfernt.
- Membership bleibt items[] ∪ product.comparisons[].
- Keine Volltext-Heuristik entscheidet über Membership.
- Redaktionelle Rankings bleiben geschützt.
`, "utf8");

console.log(`[${PATCH}] Gepatcht: ${path.relative(root, target)}`);
console.log(`[${PATCH}] Kuratierte Tabellenzeilen gegen unvollständige Backlink-Produkte geschützt.`);
console.log(`[${PATCH}] Report: ${path.relative(root, reportPath)}`);
console.log(`[${PATCH}] Fertig.`);
