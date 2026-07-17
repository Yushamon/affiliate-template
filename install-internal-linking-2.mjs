#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const backupRoot = path.join(
  root,
  `.internal-linking-2-backup-${new Date().toISOString().replace(/[:.]/g, "-")}`
);

const files = {
  types: "packages/affiliate-core/src/linking/types.ts",
  engine: "packages/affiliate-core/src/linking/linkEngine.ts",
  internal: "apps/pfotentechnik/src/domain/content/internalLinks.ts",
  page: "apps/pfotentechnik/src/pages/[slug].astro"
};

const read = (relativePath) => {
  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Datei nicht gefunden: ${relativePath}`);
  }
  return fs.readFileSync(absolutePath, "utf8");
};

const backup = (relativePath, content) => {
  const target = path.join(backupRoot, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content, "utf8");
};

const write = (relativePath, before, after) => {
  if (before === after) {
    console.log(`Unverändert: ${relativePath}`);
    return false;
  }

  backup(relativePath, before);
  fs.writeFileSync(path.join(root, relativePath), after, "utf8");
  console.log(`Aktualisiert: ${relativePath}`);
  return true;
};

const replaceOnce = (content, pattern, replacement, label) => {
  if (typeof pattern === "string") {
    if (!content.includes(pattern)) {
      throw new Error(`Muster nicht gefunden: ${label}`);
    }
    return content.replace(pattern, replacement);
  }

  if (!pattern.test(content)) {
    throw new Error(`Muster nicht gefunden: ${label}`);
  }

  pattern.lastIndex = 0;
  return content.replace(pattern, replacement);
};

const updateTypes = () => {
  const before = read(files.types);
  let after = before;

  if (!after.includes("export type InternalLinkGroup")) {
    after = replaceOnce(
      after,
      /export type LinkPriority\s*=\s*\|\s*"low"\s*\|\s*"normal"\s*\|\s*"high";/,
      `export type LinkPriority =
  | "low"
  | "normal"
  | "high";

export type InternalLinkGroup =
  | "knowledge"
  | "comparison"
  | "product"
  | "manufacturer";`,
      "InternalLinkGroup nach LinkPriority"
    );
  }

  if (!after.includes("group?: InternalLinkGroup;")) {
    after = replaceOnce(
      after,
      /group\?:\s*string;/,
      "group?: InternalLinkGroup;",
      "group-Typ"
    );
  }

  return write(files.types, before, after);
};

const updateEngine = () => {
  const before = read(files.engine);
  let after = before;

  if (!after.includes("InternalLinkGroup,")) {
    after = replaceOnce(
      after,
      /import type \{\s*InternalLinkDefinition,\s*LinkPriority\s*\} from "\.\/types";/,
      `import type {
  InternalLinkDefinition,
  InternalLinkGroup,
  LinkPriority
} from "./types";`,
      "Engine-Typimport"
    );
  }

  if (!after.includes("score: number;")) {
    after = replaceOnce(
      after,
      /export interface LinkMatch \{([\s\S]*?)length:\s*number;\s*\}/,
      (match, body) =>
        `export interface LinkMatch {${body}length: number;\n  score: number;\n}`,
      "LinkMatch.score"
    );
  }

  after = after.replace(
    /sourceGroup\?:\s*string;/,
    "sourceGroup?: InternalLinkGroup;"
  );

  if (!after.includes("const funnelWeight:")) {
    after = replaceOnce(
      after,
      /const priorityWeight:[\s\S]*?\n\};/,
      (match) => `${match}

const funnelWeight: Record<
  InternalLinkGroup,
  Partial<Record<InternalLinkGroup, number>>
> = {
  knowledge: {
    comparison: 40,
    knowledge: 30,
    product: 20,
    manufacturer: 10
  },
  comparison: {
    product: 40,
    manufacturer: 25,
    knowledge: 15,
    comparison: 0
  },
  product: {
    manufacturer: 35,
    comparison: 30,
    knowledge: 20,
    product: 0
  },
  manufacturer: {
    product: 35,
    comparison: 25,
    knowledge: 20,
    manufacturer: 0
  }
};`,
      "Funnel-Gewichtung"
    );
  }

  if (!after.includes("const getDefinitionScore")) {
    after = replaceOnce(
      after,
      /const getPriorityWeight = \([\s\S]*?\)\s*=>\s*priorityWeight\[definition\.priority \?\? "normal"\];/,
      `const getPriorityWeight = (
  definition: InternalLinkDefinition
) => priorityWeight[definition.priority ?? "normal"] * 100;

const getFunnelWeight = (
  sourceGroup?: InternalLinkGroup,
  targetGroup?: InternalLinkGroup
) => {
  if (!sourceGroup || !targetGroup) {
    return 0;
  }

  return funnelWeight[sourceGroup]?.[targetGroup] ?? 0;
};

const getDefinitionScore = (
  definition: InternalLinkDefinition,
  options: LinkEngineOptions,
  keywordLength: number,
  index: number
) =>
  getPriorityWeight(definition) +
  getFunnelWeight(options.sourceGroup, definition.group) +
  Math.min(keywordLength, 40) -
  Math.min(Math.floor(index / 500), 20);`,
      "Scoring-Funktionen"
    );
  }

  if (!after.includes("const contextsOverlap")) {
    after = replaceOnce(
      after,
      /const normalizeContext = \(value\?: string\) =>[\s\S]*?value\?\.trim\(\)\.toLowerCase\(\);/,
      `const normalizeContext = (value?: string) =>
  value
    ?.trim()
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\\s+/g, " ")
    .trim();

const tokenizeContext = (value?: string) =>
  new Set(
    (normalizeContext(value) ?? "")
      .split(" ")
      .filter((token) => token.length >= 3)
      .map((token) =>
        token.replace(/(en|er|e|n|s)$/i, "").trim()
      )
      .filter((token) => token.length >= 3)
  );

const contextsOverlap = (
  left?: string,
  right?: string
) => {
  const normalizedLeft = normalizeContext(left);
  const normalizedRight = normalizeContext(right);

  if (!normalizedLeft || !normalizedRight) {
    return false;
  }

  if (
    normalizedLeft === normalizedRight ||
    normalizedLeft.includes(normalizedRight) ||
    normalizedRight.includes(normalizedLeft)
  ) {
    return true;
  }

  const leftTokens = tokenizeContext(normalizedLeft);
  const rightTokens = tokenizeContext(normalizedRight);

  return [...leftTokens].some((token) =>
    rightTokens.has(token)
  );
};`,
      "Kontext-Normalisierung"
    );

    after = replaceOnce(
      after,
      /return definition\.contexts\.some\([\s\S]*?\n\s*\);\n\};/,
      `return definition.contexts.some((context) =>
    normalizedSourceContexts.some((source) =>
      contextsOverlap(context, source)
    )
  );
};`,
      "Kontextabgleich"
    );
  }

  if (!after.includes("score: getDefinitionScore(")) {
    after = replaceOnce(
      after,
      /length:\s*match\[0\]\.length\s*\n\s*\}/,
      `length: match[0].length,
          score: getDefinitionScore(
            definition,
            options,
            match[0].length,
            match.index
          )
        }`,
      "Match-Score"
    );
  }

  if (!after.includes("const scoreDifference = b.score - a.score;")) {
    after = replaceOnce(
      after,
      /const priorityDifference =[\s\S]*?return priorityDifference;\s*\}/,
      `const scoreDifference = b.score - a.score;

    if (scoreDifference !== 0) {
      return scoreDifference;
    }`,
      "Sortierung nach Score"
    );
  }

  after = after
    .replace(
      /\nconst linkedTargets = new Set<string>\(\);/,
      "\n  const linkedTargets = new Set<string>();"
    )
    .replace(
      /\n\s*if \(linkedTargets\.has\(match\.definition\.href\)\) \{\s*\n+\s*continue;\s*\n+\s*\}/,
      `

    if (linkedTargets.has(match.definition.href)) {
      continue;
    }`
    );

  return write(files.engine, before, after);
};

const updateInternalLinks = () => {
  const before = read(files.internal);
  let after = before;

  if (!after.includes(".flatMap((keyword) =>")) {
    after = replaceOnce(
      after,
      /const buildTitleKeywords = \([\s\S]*?\)\s*=>\s*uniqueStrings\(\[[\s\S]*?\]\)\.filter\(\(keyword\) => keyword\.length >= 4\);/,
      `const buildTitleKeywords = (
  title: string,
  extra: string[] = []
) =>
  uniqueStrings(
    [
      title,
      titleWithoutYear(title),
      titleWithoutSuffix(title),
      titleWithoutSuffix(titleWithoutYear(title)),
      ...extra
    ].flatMap((keyword) => {
      const normalized = keyword
        .replace(/[|:–—]/g, " ")
        .replace(/\\s+/g, " ")
        .trim();

      return [
        keyword,
        normalized,
        normalized
          .replace(/\\b(?:Test|Vergleich|Ratgeber)\\b/gi, "")
          .trim()
      ];
    })
  ).filter((keyword) => keyword.length >= 4);`,
      "Titelvarianten"
    );
  }

  if (!after.includes("...(linking.priority === \"high\"")) {
    after = replaceOnce(
      after,
      /keywords:\s*uniqueStrings\(linking\.keywords\),/,
      `keywords: uniqueStrings([
      ...linking.keywords,
      ...(linking.priority === "high"
        ? buildTitleKeywords(page.data.title)
        : [])
    ]),`,
      "Cornerstone-Keywords"
    );
  }

  after = after.replace(
    /(const manufacturerDefinition[\s\S]*?group:\s*"manufacturer",[\s\S]*?priority:\s*)"normal"/,
    '$1"low"'
  );

  return write(files.internal, before, after);
};

const updatePage = () => {
  const before = read(files.page);
  let after = before;

  if (/maxLinksPerPage=\{3\}/.test(after)) {
    after = after.replace(
      /maxLinksPerPage=\{3\}/,
      "maxLinksPerPage={5}"
    );
  }

  return write(files.page, before, after);
};

try {
  const changed = [
    updateTypes(),
    updateEngine(),
    updateInternalLinks(),
    updatePage()
  ].filter(Boolean).length;

  console.log("");
  console.log(`Internal Linking 2.0 installiert. ${changed} Datei(en) geändert.`);
  console.log(`Backups: ${path.relative(root, backupRoot)}`);
  console.log("");
  console.log("Jetzt ausführen:");
  console.log("  npm run build:pfotentechnik");
  console.log("  git diff --check");
  console.log("  git diff");
} catch (error) {
  console.error("");
  console.error("Installation abgebrochen:");
  console.error(error instanceof Error ? error.message : error);
  console.error("");
  console.error("Es wurden nur Dateien geschrieben, deren Muster eindeutig erkannt wurden.");
  console.error(`Vorherige Versionen liegen unter: ${path.relative(root, backupRoot)}`);
  process.exit(1);
}
