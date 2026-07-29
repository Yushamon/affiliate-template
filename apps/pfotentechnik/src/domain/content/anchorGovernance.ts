import type { InternalLinkDefinition, InternalLinkGroup } from "@affiliate-core/linking/types";

export type AnchorGovernanceOwner = {
  target: string;
  priority: number;
  intent: string;
  exact: boolean;
};

export const anchorGovernanceOwners: Readonly<Record<string, AnchorGovernanceOwner>> =
  Object.freeze({
  "futterautomat für große hunde": {
    "target": "/vergleiche/futterautomat-fuer-grosse-hunde/",
    "priority": 100,
    "intent": "buying-guide",
    "exact": true
  },
  "futterautomaten für große hunde": {
    "target": "/vergleiche/futterautomat-fuer-grosse-hunde/",
    "priority": 100,
    "intent": "buying-guide",
    "exact": true
  },
  "katze trinkt viel": {
    "target": "/katze-trinkt-viel/",
    "priority": 100,
    "intent": "medical-guide",
    "exact": true
  },
  "katze trinkt zu viel": {
    "target": "/katze-trinkt-viel/",
    "priority": 100,
    "intent": "medical-guide",
    "exact": true
  },
  "hund trinkt viel": {
    "target": "/hund-trinkt-ploetzlich-viel/",
    "priority": 100,
    "intent": "medical-guide",
    "exact": true
  },
  "hund trinkt plötzlich viel": {
    "target": "/hund-trinkt-ploetzlich-viel/",
    "priority": 100,
    "intent": "medical-guide",
    "exact": true
  },
  "gps-tracker ohne abo": {
    "target": "/vergleiche/gps-tracker-ohne-abo/",
    "priority": 100,
    "intent": "comparison",
    "exact": true
  },
  "bluetooth-tag": {
    "target": "/gps-oder-bluetooth/",
    "priority": 100,
    "intent": "knowledge",
    "exact": true
  },
  "gps-tracker oder bluetooth-tag": {
    "target": "/gps-oder-bluetooth/",
    "priority": 100,
    "intent": "knowledge",
    "exact": true
  },
  "hund frisst zu schnell": {
    "target": "/hund-frisst-zu-schnell/",
    "priority": 100,
    "intent": "medical-guide",
    "exact": true
  },
  "futterautomat gegen schlingen": {
    "target": "/hund-frisst-zu-schnell/",
    "priority": 100,
    "intent": "knowledge",
    "exact": true
  },
  "futterautomat mit kamera": {
    "target": "/vergleiche/beste-futterautomaten-mit-kamera/",
    "priority": 100,
    "intent": "comparison",
    "exact": true
  },
  "futterautomat ohne wlan": {
    "target": "/vergleiche/beste-futterautomaten-ohne-wlan/",
    "priority": 100,
    "intent": "comparison",
    "exact": true
  },
  "futterautomat für zwei katzen": {
    "target": "/vergleiche/beste-futterautomaten-fuer-zwei-katzen/",
    "priority": 100,
    "intent": "comparison",
    "exact": true
  },
  "futterautomat für nassfutter": {
    "target": "/vergleiche/beste-futterautomaten-fuer-nassfutter/",
    "priority": 100,
    "intent": "comparison",
    "exact": true
  }
});

const groupRank: Record<InternalLinkGroup, number> = {
  hub: 50,
  comparison: 40,
  knowledge: 30,
  product: 20,
  manufacturer: 10
};

export const normalizeGovernedAnchor = (value?: string) =>
  String(value ?? "")
    .trim()
    .toLocaleLowerCase("de-DE")
    .normalize("NFKC")
    .replace(/[\u00a0\u202f]/g, " ")
    .replace(/[‐‑‒–—]/g, "-")
    .replace(/\s+/g, " ");

const normalizeTarget = (value?: string) => {
  try {
    const url = new URL(String(value ?? ""), "https://pfotentechnik.de/");
    let pathname = decodeURI(url.pathname).replace(/\/{2,}/g, "/");
    return pathname === "/" ? "/" : pathname.replace(/\/+$/, "") + "/";
  } catch {
    return "";
  }
};

const priorityRank = (value?: string) => value === "high" ? 30 : value === "low" ? 10 : 20;

const definitionRank = (definition: InternalLinkDefinition) =>
  priorityRank(definition.priority) * 100 +
  groupRank[definition.group ?? "knowledge"];

export const applyAnchorGovernance = (
  definitions: InternalLinkDefinition[]
): InternalLinkDefinition[] => {
  const claims = new Map<string, InternalLinkDefinition[]>();

  for (const definition of definitions) {
    for (const anchor of definition.anchorAliases ?? []) {
      const normalized = normalizeGovernedAnchor(anchor);
      if (!normalized) continue;
      const list = claims.get(normalized) ?? [];
      list.push(definition);
      claims.set(normalized, list);
    }
  }

  const winnerByAnchor = new Map<string, string>();
  for (const [anchor, claimants] of claims) {
    const explicit = anchorGovernanceOwners[anchor];
    if (explicit) {
      const target = normalizeTarget(explicit.target);
      const owner = claimants.find((definition) => normalizeTarget(definition.href) === target);
      if (owner) {
        winnerByAnchor.set(anchor, owner.id);
        continue;
      }
    }

    const winner = [...claimants].sort((left, right) =>
      definitionRank(right) - definitionRank(left) ||
      normalizeTarget(left.href).localeCompare(normalizeTarget(right.href), "de-DE") ||
      left.id.localeCompare(right.id, "de-DE")
    )[0];
    if (winner) winnerByAnchor.set(anchor, winner.id);
  }

  return definitions
    .map((definition) => {
      const anchors = (definition.anchorAliases ?? []).filter((anchor) =>
        winnerByAnchor.get(normalizeGovernedAnchor(anchor)) === definition.id
      );
      const governedExclusive = anchors.filter((anchor) =>
        Boolean(anchorGovernanceOwners[normalizeGovernedAnchor(anchor)])
      );
      return {
        ...definition,
        anchorAliases: anchors,
        exclusiveAnchors: Array.from(new Set([
          ...(definition.exclusiveAnchors ?? []),
          ...governedExclusive
        ]))
      };
    })
    .filter((definition) => (definition.anchorAliases?.length ?? 0) > 0)
    .sort((left, right) =>
      definitionRank(right) - definitionRank(left) ||
      left.id.localeCompare(right.id, "de-DE")
    );
};
