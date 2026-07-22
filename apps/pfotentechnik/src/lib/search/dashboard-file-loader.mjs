import fs from "node:fs";

export function readSearchJsonFile(file, diagnostics = []) {
  if (!fs.existsSync(file)) {
    diagnostics.push({ level: "warning", code: "file-missing", message: `Search-Datendatei fehlt: ${file}`, source: file });
    return null;
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(file, "utf8"));
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      diagnostics.push({ level: "error", code: "invalid-root", message: "Search-JSON muss ein Objekt enthalten.", source: file });
      return null;
    }
    return parsed;
  } catch {
    diagnostics.push({ level: "error", code: "json-read-failed", message: "Search-JSON konnte nicht gelesen werden.", source: file });
    return null;
  }
}

export function readSearchDashboardCandidates({ rangesFile, singleFile }) {
  const diagnostics = [];
  const ranges = readSearchJsonFile(rangesFile, diagnostics);
  if (ranges?.ranges && typeof ranges.ranges === "object") return { root: ranges, source: "ranges", diagnostics };
  const single = readSearchJsonFile(singleFile, diagnostics);
  return { root: single, source: single ? "single" : "none", diagnostics };
}
