const increment = (counts, key) => {
  counts.set(key, (counts.get(key) ?? 0) + 1);
};

export function collectAuditIssueCounts(report = {}) {
  const counts = new Map();

  for (const product of report.products ?? []) {
    const identity = String(product.file || product.slug || "unbekannt");
    for (const error of product.errors ?? []) {
      increment(counts, `product:${identity}:${String(error)}`);
    }
  }

  for (const duplicate of report.duplicateSlugs ?? []) {
    const files = [...(duplicate.files ?? [])].map(String).sort().join("|");
    increment(counts, `duplicate:${String(duplicate.slug || "unbekannt")}:${files}`);
  }

  return counts;
}

const total = (counts) =>
  [...counts.values()].reduce((sum, value) => sum + value, 0);

export function compareAuditReports(before = {}, after = {}) {
  const beforeCounts = collectAuditIssueCounts(before);
  const afterCounts = collectAuditIssueCounts(after);
  const regressions = [];

  for (const [key, count] of afterCounts) {
    const previous = beforeCounts.get(key) ?? 0;
    if (count > previous) {
      regressions.push({ key, previous, current: count, added: count - previous });
    }
  }

  return {
    beforeIssues: total(beforeCounts),
    afterIssues: total(afterCounts),
    regressions,
    hasRegression: regressions.length > 0
  };
}

export function formatAuditRegression(regression, limit = 8) {
  const lines = regression.regressions.slice(0, limit).map((item) => {
    const readable = item.key
      .replace(/^product:/, "Produkt: ")
      .replace(/^duplicate:/, "Doppelter Slug: ");
    return `- ${readable} (+${item.added})`;
  });
  if (regression.regressions.length > limit) {
    lines.push(`- … und ${regression.regressions.length - limit} weitere`);
  }
  return lines.join("\n");
}
