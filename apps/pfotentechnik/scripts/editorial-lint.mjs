import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import config from "./editorial-lint.config.mjs";

const strict = process.argv.includes("--strict");
const cwd = process.cwd();

const normalize = (value = "") =>
  value
    .toLocaleLowerCase("de-DE")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();

const countWords = (value = "") =>
  value
    .replace(/<[^>]+>/g, " ")
    .replace(/[`*_>#|[\]{}()-]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .length;

const parseScalar = (raw = "") => {
  const value = raw.trim();
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
};

const splitDocument = (source) => {
  if (!source.startsWith("---")) {
    return { frontmatter: "", body: source };
  }
  const end = source.indexOf("\n---", 3);
  if (end === -1) {
    return { frontmatter: "", body: source };
  }
  return {
    frontmatter: source.slice(4, end),
    body: source.slice(end + 4)
  };
};

const getFrontmatterScalar = (frontmatter, key) => {
  const match = frontmatter.match(
    new RegExp(`^${key}:\\s*(.+)$`, "m")
  );
  return match ? parseScalar(match[1]) : undefined;
};

const getSectionLines = (frontmatter, key) => {
  const lines = frontmatter.split(/\r?\n/);
  const start = lines.findIndex((line) =>
    new RegExp(`^${key}:\\s*$`).test(line)
  );
  if (start === -1) return [];

  const result = [];
  for (let index = start + 1; index < lines.length; index += 1) {
    const line = lines[index];
    if (/^[A-Za-z][\w-]*:\s*/.test(line)) break;
    result.push(line);
  }
  return result;
};

const findFaqQuestions = (frontmatter) =>
  getSectionLines(frontmatter, "faq")
    .map((line) => {
      const match = line.match(
        /^\s*-\s*(?:question|title):\s*(.+)$/
      );
      return match ? parseScalar(match[1]) : undefined;
    })
    .filter(Boolean);

const findHeadings = (body) =>
  body
    .split(/\r?\n/)
    .map((line, index) => {
      const match = line.match(/^(#{2,4})\s+(.+?)\s*$/);
      return match
        ? {
            title: match[2].replace(/\s+#+$/, "").trim(),
            line: index + 1
          }
        : undefined;
    })
    .filter(Boolean);

const findImages = (body) => {
  const images = [];
  const markdownRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  let match;
  while ((match = markdownRegex.exec(body))) {
    images.push({ alt: match[1].trim(), offset: match.index });
  }

  const htmlRegex = /<img\b[^>]*>/gi;
  while ((match = htmlRegex.exec(body))) {
    const altMatch = match[0].match(
      /\balt\s*=\s*["']([^"']*)["']/i
    );
    images.push({
      alt: altMatch?.[1]?.trim() ?? "",
      offset: match.index
    });
  }
  return images;
};

const findParagraphs = (body) =>
  body
    .split(/\n\s*\n/)
    .map((text) => text.trim())
    .filter((text) =>
      text &&
      !text.startsWith("#") &&
      !text.startsWith("- ") &&
      !text.startsWith("* ") &&
      !/^\d+\.\s/.test(text) &&
      !text.startsWith("```") &&
      !text.startsWith("<")
    );

const countListBlocks = (body) => {
  const lines = body.split(/\r?\n/);
  let blocks = 0;
  let inList = false;
  let longestRun = 0;
  let currentRun = 0;

  for (const line of lines) {
    const isList = /^\s*(?:[-*+]|\d+\.)\s+/.test(line);
    if (isList) {
      currentRun += 1;
      longestRun = Math.max(longestRun, currentRun);
      if (!inList) {
        blocks += 1;
        inList = true;
      }
    } else if (line.trim()) {
      inList = false;
      currentRun = 0;
    }
  }
  return { blocks, longestRun };
};

const hasAnySignal = (source, signals) => {
  const haystack = normalize(source);
  return signals.some((signal) =>
    haystack.includes(normalize(signal))
  );
};

const lineFromOffset = (source, offset) =>
  source.slice(0, offset).split("\n").length;

const walk = async (directory) => {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...await walk(fullPath));
    } else if (/\.(md|mdx)$/i.test(entry.name)) {
      files.push(fullPath);
    }
  }
  return files;
};

const lintFile = async (filePath) => {
  const source = await fs.readFile(filePath, "utf8");
  const { frontmatter, body } = splitDocument(source);
  const issues = [];
  const add = (rule, severity, message, line) => {
    if (!config.ignoredRules.includes(rule)) {
      issues.push({ rule, severity, message, line });
    }
  };

  const title = getFrontmatterScalar(frontmatter, "title");
  const description = getFrontmatterScalar(frontmatter, "description");

  if (
    title &&
    (title.length < config.thresholds.minTitleLength ||
      title.length > config.thresholds.maxTitleLength)
  ) {
    add(
      "weakTitle",
      "warning",
      `Titel hat ${title.length} Zeichen; empfohlen sind ${config.thresholds.minTitleLength}–${config.thresholds.maxTitleLength}.`
    );
  }

  if (
    description &&
    (description.length < config.thresholds.minDescriptionLength ||
      description.length > config.thresholds.maxDescriptionLength)
  ) {
    add(
      "weakDescription",
      "warning",
      `Description hat ${description.length} Zeichen; empfohlen sind ${config.thresholds.minDescriptionLength}–${config.thresholds.maxDescriptionLength}.`
    );
  }

  const faqQuestions = findFaqQuestions(frontmatter);
  const normalizedFaq = faqQuestions.map(normalize);
  normalizedFaq.forEach((question, index) => {
    if (normalizedFaq.indexOf(question) !== index) {
      add(
        "duplicateFaq",
        "error",
        `Doppelte FAQ-Frage: „${faqQuestions[index]}“.`
      );
    }
  });

  if (faqQuestions.length > config.thresholds.maxFaqItems) {
    add(
      "excessiveFaq",
      "warning",
      `${faqQuestions.length} FAQ-Einträge; maximal ${config.thresholds.maxFaqItems} empfohlen.`
    );
  }

  const headings = findHeadings(body);
  const headingKeys = headings.map((heading) => normalize(heading.title));
  headingKeys.forEach((heading, index) => {
    if (headingKeys.indexOf(heading) !== index) {
      add(
        "duplicateHeading",
        "warning",
        `Doppelte Überschrift: „${headings[index].title}“.`,
        headings[index].line
      );
    }
  });

  for (const image of findImages(body)) {
    if (!image.alt) {
      add(
        "missingImageAlt",
        "error",
        "Bild ohne Alt-Text.",
        lineFromOffset(body, image.offset)
      );
    }
  }

  for (const paragraph of findParagraphs(body)) {
    const words = countWords(paragraph);
    if (words > config.thresholds.maxParagraphWords) {
      add(
        "longParagraph",
        "warning",
        `Absatz mit ${words} Wörtern; maximal ${config.thresholds.maxParagraphWords} empfohlen.`
      );
    }
  }

  const listStats = countListBlocks(body);
  if (
    listStats.blocks > config.thresholds.maxListBlocks ||
    listStats.longestRun > config.thresholds.maxConsecutiveListItems
  ) {
    add(
      "excessiveLists",
      "warning",
      `${listStats.blocks} Listenblöcke, längste Liste ${listStats.longestRun} Punkte.`
    );
  }

  const combined = `${frontmatter}\n${body}`;
  const checklistCount = config.checklistSignals.reduce(
    (sum, signal) =>
      sum + (normalize(combined).match(
        new RegExp(`\\b${normalize(signal)}\\b`, "g")
      )?.length ?? 0),
    0
  );

  if (checklistCount > config.thresholds.maxChecklistBlocks) {
    add(
      "excessiveChecklists",
      "warning",
      `${checklistCount} Checklisten-Signale; maximal ${config.thresholds.maxChecklistBlocks} empfohlen.`
    );
  }

  const lines = body.split(/\r?\n/);
  for (let index = 0; index < lines.length; index += 1) {
    if (!/^##\s+/.test(lines[index])) continue;
    const nextMeaningful = lines.slice(index + 1).find((line) => line.trim());
    if (
      nextMeaningful &&
      (/^###\s+/.test(nextMeaningful) ||
        /^\s*(?:[-*+]|\d+\.)\s+/.test(nextMeaningful))
    ) {
      add(
        "headingWithoutIntro",
        "warning",
        "H2 beginnt direkt mit Unterüberschrift oder Liste; kurze Einleitung empfohlen.",
        index + 1
      );
    }
  }

  if (
    hasAnySignal(combined, config.medicalTerms) &&
    !hasAnySignal(combined, config.sourceSignals)
  ) {
    add(
      "medicalWithoutSources",
      "warning",
      "Gesundheitsbezogene Signale ohne erkennbare Fachquelle oder Quellenabschnitt."
    );
  }

  return { filePath, issues };
};

const main = async () => {
  const files = [];
  for (const includePath of config.include) {
    files.push(...await walk(path.resolve(cwd, includePath)));
  }

  let errors = 0;
  let warnings = 0;

  for (const filePath of files) {
    const result = await lintFile(filePath);
    if (result.issues.length === 0) continue;

    console.log(`\n${path.relative(cwd, filePath)}`);
    for (const item of result.issues) {
      item.severity === "error" ? errors += 1 : warnings += 1;
      const location = item.line ? `:${item.line}` : "";
      console.log(
        `  ${item.severity.toUpperCase()} ${item.rule}${location} – ${item.message}`
      );
    }
  }

  console.log(
    `\nEditorial Lint: ${files.length} Dateien, ${errors} Fehler, ${warnings} Warnungen.`
  );

  if (errors > 0 || (strict && warnings > 0)) {
    process.exitCode = 1;
  }
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
