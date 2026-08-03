import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import {
  evaluateClusterJourney,
  getJourneyRequirements,
  journeyOpportunityReason,
} from "../src/lib/seo/topical-authority/journey-completion.ts";

const requirements = getJourneyRequirements("trinkbrunnen");

const completeDocuments = requirements.map((requirement) => ({
  route: requirement.source,
  links: requirements
    .filter((candidate) => candidate.source === requirement.source)
    .map((candidate) => candidate.target),
}));

test("Trinkbrunnen-Journey wird über konkrete Pflichtkanten bewertet", () => {
  const result = evaluateClusterJourney("trinkbrunnen", completeDocuments);

  assert.equal(result.applicable, true);
  assert.equal(result.complete, true);
  assert.equal(result.requiredEdges, 10);
  assert.equal(result.completedCount, 10);
  assert.deepEqual(result.missingEdges, []);
});

test("eine fehlende Rückkante hält die Chance offen", () => {
  const documents = completeDocuments.map((document) =>
    document.route === "/vergleiche/beste-trinkbrunnen-fuer-katzen/"
      ? {
          ...document,
          links: document.links.filter(
            (link) => link !== "/filter-im-katzentrinkbrunnen-wechseln/",
          ),
        }
      : document,
  );

  const result = evaluateClusterJourney("trinkbrunnen", documents);

  assert.equal(result.complete, false);
  assert.ok(result.missingEdges.includes("Katzenvergleich → Filterratgeber"));
  assert.match(
    journeyOpportunityReason(result, "Fallback"),
    /Fehlend: Katzenvergleich → Filterratgeber/,
  );
});

test("globale Linkquote ist kein Fertigkriterium der kaufnahen Journey", () => {
  const sparseCluster = [
    ...completeDocuments,
    ...Array.from({ length: 40 }, (_, index) => ({
      route: `/medizinische-randseite-${index}/`,
      links: [],
    })),
  ];

  const result = evaluateClusterJourney("trinkbrunnen", sparseCluster);

  assert.equal(result.complete, true);
  assert.equal(result.completedCount, result.requiredEdges);
});

test("Cluster ohne Pflichtkanten nutzen weiterhin die bestehende Fallback-Logik", () => {
  const result = evaluateClusterJourney("gps-tracker", []);

  assert.equal(result.applicable, false);
  assert.equal(result.complete, false);
  assert.equal(result.requiredEdges, 0);
});

test("Loader nutzt die Journey-Prüfung für Opportunity und generische Linkchance", () => {
  const loader = fs.readFileSync(
    path.join(
      process.cwd(),
      "src/lib/seo/topical-authority/loadTopicalAuthority.ts",
    ),
    "utf8",
  );

  assert.match(loader, /evaluateClusterJourney/);
  assert.match(loader, /journeyCompletion\?\.complete/);
  assert.doesNotMatch(
    loader,
    /!byId\.trinkbrunnen\.coverage\.comparisons\s*\|\|\s*byId\.trinkbrunnen\.linkCoverage\s*<\s*70/,
  );
  assert.match(loader, /!item\.journeyCompletion\?\.complete/);
});
