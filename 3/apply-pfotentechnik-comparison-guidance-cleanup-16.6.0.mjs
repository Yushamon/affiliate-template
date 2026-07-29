#!/usr/bin/env node
import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const VERSION = "16.6.0";
const LABEL = `pfotentechnik-comparison-guidance-cleanup-${VERSION}`;
const rootArg = process.argv.find((value) => value.startsWith("--root="));
const root = resolve(rootArg ? rootArg.slice("--root=".length) : process.cwd());
const skipChecks = process.argv.includes("--skip-checks");

const PATHS = {
  shell: "packages/affiliate-core/src/components/comparison/ComparisonShell.astro",
  insight: "packages/affiliate-core/src/components/comparison/ComparisonInsightSummary.astro",
  methodology: "packages/affiliate-core/src/components/comparison/ComparisonMethodology.astro",
  css: "packages/affiliate-core/src/components/comparison/comparison-editorial-cover.css"
};

const backupRoot = join(root, ".patch-backups", `${LABEL}-${new Date().toISOString().replaceAll(":", "-")}`);

for (const relativePath of Object.values(PATHS)) {
  const target = join(backupRoot, relativePath);
  await mkdir(dirname(target), { recursive: true });
  await cp(join(root, relativePath), target);
}

let shell = await readFile(join(root, PATHS.shell), "utf8");
shell = shell
  .replace(/import ComparisonProsCons from "\.\/ComparisonProsCons\.astro";\n?/, "")
  .replace(/import ComparisonVerdict from "\.\/ComparisonVerdict\.astro";\n?/, "")
  .replace(/\n\s*<ComparisonProsCons products=\{model\.products\} \/>\s*/g, "\n")
  .replace(/\n\s*<div id="vergleich-fazit">[\s\S]*?<\/div>\s*(?=\n\s*<\/div>)/, "\n");

if (shell.includes("<ComparisonProsCons")) throw new Error("Alter Pros/Cons-Block wurde nicht entfernt.");
if (shell.includes("<ComparisonVerdict")) throw new Error("Alter Fazitblock wurde nicht entfernt.");

await writeFile(join(root, PATHS.shell), shell, "utf8");
console.log(`Geändert: ${PATHS.shell}`);

const insight = `---
import type { ComparisonProduct, ComparisonRow } from "../../comparison/model";

type Props = {
  products: ComparisonProduct[];
  rows: ComparisonRow[];
};

const { products, rows } = Astro.props as Props;

const normalize = (value: string | undefined) =>
  (value ?? "").trim().toLocaleLowerCase("de-DE");

const meaningfulRows = rows.filter((row) => {
  const values = row.cells
    .map((cell) => normalize(cell.value))
    .filter((value) => value && value !== "–" && value !== "keine angabe");

  return new Set(values).size > 1;
});

const strongestDifferences = meaningfulRows.slice(0, 5);
const documentedRows = rows.filter((row) =>
  row.cells.some((cell) => {
    const value = normalize(cell.value);
    return value && value !== "–" && value !== "keine angabe";
  })
);

const decisionHint =
  meaningfulRows.length > 0
    ? \`\${meaningfulRows.length} Kriterien unterscheiden die Modelle tatsächlich. Konzentriere dich vor allem auf die Punkte unten.\`
    : "Die Modelle unterscheiden sich in den dokumentierten Kerndaten nur wenig. Entscheidend sind deshalb Alltagstauglichkeit, Größe und Bedienung.";
---

<section class="comparison-buying-guidance" aria-labelledby="comparison-buying-guidance-title">
  <div class="comparison-buying-guidance__intro">
    <span class="comparison-eyebrow">Kaufberatung</span>
    <h2 id="comparison-buying-guidance-title">Darauf solltest du bei der Auswahl achten</h2>
    <p>{decisionHint}</p>
  </div>

  {strongestDifferences.length > 0 && (
    <div class="comparison-buying-guidance__criteria">
      {strongestDifferences.map((row, index) => (
        <article>
          <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
          <div>
            <h3>{row.criterion.label}</h3>
            <p>
              {row.criterion.description ??
                "Prüfe im Direktvergleich, welche Ausprägung zu deinem Alltag und deinen Anforderungen passt."}
            </p>
          </div>
          <a href="#direktvergleich">Vergleichen</a>
        </article>
      ))}
    </div>
  )}

  <div class="comparison-buying-guidance__note">
    <strong>{products.length} Modelle betrachtet</strong>
    <span>
      Für {documentedRows.length} von {rows.length} Kriterien liegen verwertbare Angaben vor.
      Fehlende Angaben werden nicht als Vorteil gewertet.
    </span>
  </div>
</section>
`;

await writeFile(join(root, PATHS.insight), insight, "utf8");
console.log(`Geändert: ${PATHS.insight}`);

const methodology = `---
type Props = {
  productCount: number;
  criterionCount: number;
};

const { productCount, criterionCount } = Astro.props as Props;
---

<details class="comparison-methodology comparison-methodology--compact" id="methodik">
  <summary>
    <span>
      <span class="comparison-eyebrow">Transparenz</span>
      <strong>So entsteht dieser Vergleich</strong>
    </span>
    <span aria-hidden="true">+</span>
  </summary>

  <div class="comparison-methodology__content">
    <p>
      Wir ordnen {productCount} Modelle anhand von {criterionCount}
      nachvollziehbaren Merkmalen ein. Produktdaten, redaktionelle Bewertung
      und bekannte Einschränkungen werden getrennt betrachtet.
    </p>

    <ul>
      <li><strong>Eignung vor Funktionsmenge:</strong> Mehr Funktionen bedeuten nicht automatisch eine bessere Empfehlung.</li>
      <li><strong>Fehlende Angaben bleiben sichtbar:</strong> Nicht belegte Herstellerinformationen werden nicht positiv gewertet.</li>
      <li><strong>Empfehlungen folgen dem Einsatzzweck:</strong> Gesamtsieger und Alternativen erfüllen unterschiedliche Bedürfnisse.</li>
    </ul>

    <a href="/so-bewerten-wir/">Bewertungsmethodik vollständig ansehen</a>
  </div>
</details>
`;

await writeFile(join(root, PATHS.methodology), methodology, "utf8");
console.log(`Geändert: ${PATHS.methodology}`);

const cssBlock = `
/* PT_COMPARISON_GUIDANCE_CLEANUP_16_6_0_START */
.comparison-buying-guidance {
  display: grid;
  gap: 1.25rem;
}

.comparison-buying-guidance__intro {
  display: grid;
  gap: .45rem;
}

.comparison-buying-guidance__intro h2 {
  max-width: 18ch;
  margin: 0;
  color: var(--comparison-text);
  font-size: clamp(1.75rem, 7vw, 2.5rem);
  line-height: 1.08;
}

.comparison-buying-guidance__intro p {
  max-width: 48rem;
  margin: 0;
  color: var(--comparison-muted);
  font-size: 1rem;
  line-height: 1.55;
}

.comparison-buying-guidance__criteria {
  display: grid;
  gap: .75rem;
}

.comparison-buying-guidance__criteria article {
  display: grid;
  grid-template-columns: 2.25rem minmax(0, 1fr) auto;
  align-items: start;
  gap: .75rem;
  padding: 1rem;
  border: 1px solid var(--comparison-line);
  border-radius: var(--pt-radius-lg);
  background: var(--comparison-surface);
}

.comparison-buying-guidance__criteria article > span {
  display: grid;
  width: 2.25rem;
  height: 2.25rem;
  place-items: center;
  border-radius: var(--pt-radius-pill);
  color: var(--comparison-accent);
  background: var(--comparison-surface-soft);
  font-size: .75rem;
  font-weight: 900;
}

.comparison-buying-guidance__criteria h3 {
  margin: 0 0 .25rem;
  color: var(--comparison-text);
  font-size: 1rem;
  line-height: 1.25;
}

.comparison-buying-guidance__criteria p {
  margin: 0;
  color: var(--comparison-muted);
  font-size: .88rem;
  line-height: 1.45;
}

.comparison-buying-guidance__criteria a {
  align-self: center;
  color: var(--comparison-accent);
  font-size: .82rem;
  font-weight: 800;
  text-decoration: none;
}

.comparison-buying-guidance__note {
  display: grid;
  gap: .2rem;
  padding: .9rem 1rem;
  border-left: .2rem solid var(--comparison-accent);
  color: var(--comparison-muted);
  background: var(--comparison-surface-soft);
  font-size: .85rem;
  line-height: 1.45;
}

.comparison-buying-guidance__note strong {
  color: var(--comparison-text);
}

.comparison-methodology--compact {
  overflow: hidden;
  border: 1px solid var(--comparison-line);
  border-radius: var(--pt-radius-xl);
  background: var(--comparison-surface);
}

.comparison-methodology--compact summary {
  display: flex;
  min-height: 4.5rem;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem;
  cursor: pointer;
  list-style: none;
}

.comparison-methodology--compact summary::-webkit-details-marker {
  display: none;
}

.comparison-methodology--compact summary > span:first-child {
  display: grid;
  gap: .15rem;
}

.comparison-methodology--compact summary strong {
  color: var(--comparison-text);
  font-size: 1.05rem;
}

.comparison-methodology--compact summary > span:last-child {
  color: var(--comparison-accent);
  font-size: 1.6rem;
  line-height: 1;
  transition: transform .2s ease;
}

.comparison-methodology--compact[open] summary > span:last-child {
  transform: rotate(45deg);
}

.comparison-methodology--compact .comparison-methodology__content {
  display: grid;
  gap: 1rem;
  padding: 0 1rem 1rem;
  color: var(--comparison-muted);
}

.comparison-methodology--compact .comparison-methodology__content p,
.comparison-methodology--compact .comparison-methodology__content ul {
  margin: 0;
}

.comparison-methodology--compact .comparison-methodology__content ul {
  display: grid;
  gap: .65rem;
  padding-left: 1.15rem;
}

.comparison-methodology--compact .comparison-methodology__content a {
  justify-self: start;
  color: var(--comparison-accent);
  font-weight: 800;
}

@media (max-width: 35.99rem) {
  .comparison-buying-guidance__criteria article {
    grid-template-columns: 2.25rem minmax(0, 1fr);
  }

  .comparison-buying-guidance__criteria a {
    grid-column: 2;
    justify-self: start;
  }
}
/* PT_COMPARISON_GUIDANCE_CLEANUP_16_6_0_END */
`;

let css = await readFile(join(root, PATHS.css), "utf8");
css = css.replace(
  /\/\* PT_COMPARISON_GUIDANCE_CLEANUP_16_6_0_START \*\/[\s\S]*?\/\* PT_COMPARISON_GUIDANCE_CLEANUP_16_6_0_END \*\//g,
  ""
).trimEnd();

await writeFile(join(root, PATHS.css), `${css}\n\n${cssBlock}\n`, "utf8");
console.log(`Geändert: ${PATHS.css}`);

if (!skipChecks) {
  for (const script of [
    "design-system:tokens:audit",
    "design-system:components:audit",
    "design-system:responsive:audit",
    "design-system:visual-qa:strict",
    "build"
  ]) {
    const result = spawnSync(
      "npm",
      ["--workspace", "apps/pfotentechnik", "run", script],
      { cwd: root, shell: process.platform === "win32", stdio: "inherit" }
    );
    if (result.status !== 0) throw new Error(`Check fehlgeschlagen: ${script}`);
  }

  spawnSync(
    "npm",
    ["--workspace", "apps/pfotentechnik", "run", "comparison:audit:strict"],
    { cwd: root, shell: process.platform === "win32", stdio: "inherit" }
  );
}

console.log(`\n[${LABEL}] ABGESCHLOSSEN.`);
console.log("- alte Stärken-/Einschränkungen-Karten entfernt");
console.log("- wiederholter Fazit-/Siegerblock entfernt");
console.log("- Statistikboxen durch Kaufberatung ersetzt");
console.log("- Methodik kompakt und aufklappbar");
console.log("- keine neue CSS-Datei");
