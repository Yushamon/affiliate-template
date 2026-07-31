import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export type InternalLinkAdvisory = {
  route: string;
  message: string;
  severity: string;
  classification: string;
  rationale: string;
  action: string;
  codexPrompt: string;
};

export type InternalLinkAdvisoryReport = {
  available: boolean;
  generatedAt: string | null;
  ageHours: number | null;
  stale: boolean;
  total: number;
  source: string;
  advisories: InternalLinkAdvisory[];
};

const appRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../..",
);

const reportPath = path.join(
  appRoot,
  "reports",
  "internal-linking",
  "internal-link-health-audit.json",
);

const normalizeRoute = (value: unknown): string => {
  if (typeof value !== "string" || !value.trim()) return "";
  const clean = value.trim().split(/[?#]/, 1)[0];
  const route = clean.startsWith("/") ? clean : `/${clean}`;
  return route.endsWith("/") ? route : `${route}/`;
};

const buildAction = (route: string) =>
  `Passende indexierbare Quellseiten im selben Themencluster ermitteln, den fachlich stärksten natürlichen Link ergänzen und anschließend den Internal-Link-Health-Audit erneut ausführen. Zielroute: ${route}`;

const buildCodexPrompt = (route: string, message: string) => `Du arbeitest direkt im Repository Yushamon/affiliate-template.

Projekt:
apps/pfotentechnik

Aufgabe:
Behebe das Internal-Linking-Finding für ${route}.

Finding:
- Typ: NO_INCOMING_INTERNAL_LINK
- Befund: ${message}
- Klassifikation: advisory

Vorgehen:
1. Ermittle die fachlich passendsten indexierbaren Quellseiten anhand von Themencluster, Suchintention und Decision Journey.
2. Prüfe vorhandene Links, Selbstlinks, Redirects und Canonicals.
3. Ergänze genau dort natürliche redaktionelle Links, wo sie dem Nutzer tatsächlich helfen.
4. Keine Footer-, Boilerplate- oder Keyword-Links nur zur Erfüllung des Audits.
5. Keine medizinisch oder fachlich unpassenden Produktverlinkungen.
6. Führe danach den zuständigen Internal-Link-Health-Audit erneut aus.
7. Dokumentiere geänderte Dateien, Linktexte, Zielroute und Validierung.

Akzeptanz:
- ${route} besitzt mindestens einen fachlich sinnvollen eingehenden Hauptinhaltslink.
- Kein Selbstlink, kein kaputtes Ziel und keine künstliche Überoptimierung.
- Das Finding ist im erneut erzeugten Report nicht mehr aktiv.`;

export function loadInternalLinkAdvisories(
  now = new Date(),
): InternalLinkAdvisoryReport {
  const source = path.relative(appRoot, reportPath).replaceAll("\\", "/");

  if (!fs.existsSync(reportPath)) {
    return {
      available: false,
      generatedAt: null,
      ageHours: null,
      stale: true,
      total: 0,
      source,
      advisories: [],
    };
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(reportPath, "utf8"));
    const generatedAt =
      typeof parsed?.generatedAt === "string" ? parsed.generatedAt : null;
    const generatedTime = generatedAt ? Date.parse(generatedAt) : Number.NaN;
    const ageHours = Number.isFinite(generatedTime)
      ? Math.max(0, (now.getTime() - generatedTime) / 3_600_000)
      : null;

    const findings = Array.isArray(parsed?.findings) ? parsed.findings : [];
    const byRoute = new Map<string, InternalLinkAdvisory>();

    for (const finding of findings) {
      if (finding?.code !== "NO_INCOMING_INTERNAL_LINK") continue;
      if (finding?.suppressed === true || finding?.status === "resolved") continue;

      const route = normalizeRoute(
        finding?.targetRoute ?? finding?.route ?? finding?.normalizedTarget,
      );
      if (!route) continue;

      const message =
        typeof finding?.message === "string" && finding.message.trim()
          ? finding.message.trim()
          : `${route} besitzt im geprüften Linkgraph keinen eingehenden Link.`;

      byRoute.set(route, {
        route,
        message,
        severity:
          String(finding?.effectiveSeverity ?? finding?.severity ?? "warning"),
        classification: String(finding?.classification ?? "advisory"),
        rationale: String(
          finding?.rationale ??
            "Redaktioneller Hinweis ohne nachgewiesenen Fehler im gebauten HTML.",
        ),
        action: buildAction(route),
        codexPrompt: buildCodexPrompt(route, message),
      });
    }

    const advisories = [...byRoute.values()].sort((a, b) =>
      a.route.localeCompare(b.route, "de"),
    );

    return {
      available: true,
      generatedAt,
      ageHours,
      stale: ageHours === null || ageHours > 24,
      total: advisories.length,
      source,
      advisories,
    };
  } catch {
    return {
      available: false,
      generatedAt: null,
      ageHours: null,
      stale: true,
      total: 0,
      source,
      advisories: [],
    };
  }
}
