import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const THIS_DIR = path.dirname(fileURLToPath(import.meta.url));
export const APP_ROOT = path.resolve(THIS_DIR, "../..");
export const CONTENT_ROOT = path.join(APP_ROOT, "src", "content");
export const COMPARISON_DIR = path.join(CONTENT_ROOT, "comparisons");
export const PRODUCT_DIR = path.join(CONTENT_ROOT, "products");
export const MANUFACTURER_DIR = path.join(CONTENT_ROOT, "manufacturers");
export const REPORT_DIR = path.join(APP_ROOT, "reports", "comparison-platform");

export function walk(dir, exts = [".md", ".mdx"]) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory()
      ? walk(full, exts)
      : exts.includes(path.extname(entry.name).toLowerCase()) ? [full] : [];
  });
}

export function splitFrontmatter(source) {
  const normalized = source.replace(/\r\n/g, "\n");
  if (!normalized.startsWith("---\n")) return { frontmatter: "", body: normalized };
  const end = normalized.indexOf("\n---", 4);
  if (end < 0) return { frontmatter: "", body: normalized };
  return {
    frontmatter: normalized.slice(4, end),
    body: normalized.slice(end + 4).replace(/^\n/, "")
  };
}

function scalar(raw) {
  const value = raw.trim();
  if (!value) return "";
  if (/^(true|false)$/i.test(value)) return value.toLowerCase() === "true";
  if (/^(null|~)$/i.test(value)) return null;
  if (/^-?\d+(\.\d+)?$/.test(value)) return Number(value);
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1).replace(/\\"/g, '"');
  }
  if (value.startsWith("[") && value.endsWith("]")) {
    return value.slice(1, -1).split(",").map((v) => scalar(v)).filter((v) => v !== "");
  }
  return value;
}

export function parseYamlSubset(text) {
  const lines = text.replace(/\t/g, "  ").split("\n");
  const root = {};
  const stack = [{ indent: -1, value: root }];

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    if (!raw.trim() || raw.trimStart().startsWith("#")) continue;
    const indent = raw.match(/^ */)[0].length;
    const trimmed = raw.trim();
    while (stack.length > 1 && indent <= stack.at(-1).indent) stack.pop();
    const parent = stack.at(-1).value;

    if (trimmed.startsWith("- ")) {
      if (!Array.isArray(parent)) continue;
      const rest = trimmed.slice(2);
      const pair = rest.match(/^([^:]+):(.*)$/);
      if (pair) {
        const obj = {};
        parent.push(obj);
        const key = pair[1].trim();
        const tail = pair[2].trim();
        obj[key] = tail ? scalar(tail) : {};
        stack.push({ indent, value: obj });
        if (!tail) stack.push({ indent: indent + 1, value: obj[key] });
      } else {
        parent.push(scalar(rest));
      }
      continue;
    }

    const match = trimmed.match(/^([^:]+):(.*)$/);
    if (!match || Array.isArray(parent)) continue;
    const key = match[1].trim();
    const tail = match[2].trim();
    if (tail) {
      parent[key] = scalar(tail);
      continue;
    }

    let j = i + 1;
    while (j < lines.length && (!lines[j].trim() || lines[j].trimStart().startsWith("#"))) j++;
    const next = lines[j] || "";
    const nextIndent = next.match(/^ */)[0].length;
    const isArray = nextIndent > indent && next.trim().startsWith("- ");
    parent[key] = isArray ? [] : {};
    stack.push({ indent, value: parent[key] });
  }
  return root;
}

export function loadEntries(dir) {
  return walk(dir).map((file) => {
    const source = fs.readFileSync(file, "utf8");
    const { frontmatter, body } = splitFrontmatter(source);
    return {
      file,
      rel: path.relative(APP_ROOT, file).replaceAll(path.sep, "/"),
      source,
      body,
      data: parseYamlSubset(frontmatter)
    };
  });
}

export function slugOf(entry) {
  return String(entry.data.slug || path.basename(entry.file).replace(/\.mdx?$/, ""));
}
export function issue(level, code, entry, message, details = {}) {
  return { level, code, file: entry?.rel || null, slug: entry ? slugOf(entry) : null, message, ...details };
}
export function ensureReportDir() {
  fs.mkdirSync(REPORT_DIR, { recursive: true });
}
export function collectMarkdownLinks(body) {
  return [...body.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)]
    .map((m) => m[1])
    .filter((href) => href.startsWith("/") && !href.startsWith("//"));
}
