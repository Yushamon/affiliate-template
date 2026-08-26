import test from "node:test";
import assert from "node:assert/strict";
import { matchDemandNodes, nodesFromSearch, scoreDocument } from "../src/lib/demand-discovery/engine.mjs";

const document = (route, title, headings, body, cluster) => ({ route, title, description: "", headings, body, cluster, topics: [cluster], tags: [], aliases: [] });
const node = (id, userProblem, expectedOwner) => ({ id, cluster: id.includes("camera") ? "haustierkameras" : "katzenklappen", topic: id, userProblem, intent: "informational", sourceSignals: [{ type: "existing-research" }], candidateQueries: [], expectedOwner, confidence: "high" });

test("Tailgating ist vor dem ergänzten Abschnitt nur partial", () => {
  const demand = node("cat-flap-tailgating", "Mikrochip Rechte je Tier App Offline Tailgating", "/katzenklappen/");
  const before = [document("/katzenklappen/", "Katzenklappen auswählen", ["Mikrochip und App"], "Rechte je Tier und Offline-Betrieb", "katzenklappen")];
  assert.equal(matchDemandNodes([demand], before)[0].status, "partial");
});

test("Tailgating wird nach expliziter Systemgrenze covered", () => {
  const demand = node("cat-flap-tailgating", "Mikrochip Rechte je Tier App Offline Tailgating", "/katzenklappen/");
  const after = [document("/katzenklappen/", "Katzenklappen auswählen", ["Systemgrenze Tailgating", "Mikrochip und App"], "Rechte je Tier, Offline-Betrieb und mechanisches Hinterherlaufen durch eine offene Klappe", "katzenklappen")];
  assert.equal(matchDemandNodes([demand], after)[0].status, "covered");
});

test("Indoor-Kamera-vs-Pet-Cam ist ohne direkte Antwort partial", () => {
  const demand = node("camera-indoor-vs-pet", "Normale Indoor Kamera oder spezielle Haustierkamera", "/haustierkameras/");
  const docs = [document("/haustierkameras/", "Haustierkameras auswählen", ["Produktklassen"], "Furbo Enabot Kamera mit App", "haustierkameras")];
  assert.equal(matchDemandNodes([demand], docs)[0].status, "partial");
});

test("ausreichend behandelter Ausfall-Node wird covered", () => {
  const demand = { ...node("feeder-outage", "Futterautomat Stromausfall WLAN Internetausfall lokaler Zeitplan Batteriebackup App Cloud", "/futterautomat-bei-stromausfall/"), cluster: "futterautomaten" };
  const docs = [document("/futterautomat-bei-stromausfall/", "Futterautomat bei Stromausfall Batterie WLAN Offline Betrieb", ["Strom WLAN Internet Cloud und Mechanik", "Lokale Zeitpläne und Batteriebackup"], "Ausfalltest ohne App und Cloud", "futterautomaten")];
  assert.equal(matchDemandNodes([demand], docs)[0].status, "covered");
});

test("missing erzeugt nur Research Candidate und keine automatische Seite", () => {
  const demand = node("cat-flap-unknown", "Quantenportal fuer Katzen", null);
  const result = matchDemandNodes([demand], [document("/haustierkameras/", "Haustierkameras", [], "Kamera", "haustierkameras")])[0];
  assert.equal(result.status, "missing");
  assert.equal(result.newPageRequired, true);
  assert.match(result.recommendedAction, /Research Candidate/);
});

test("Search-Nodes entstehen nur aus gemessenen, nicht aus erfundenen Queries", () => {
  const search = { generatedAt: "2026-08-25T00:00:00Z", ranges: { "28d": { queries: [
    { query: "futterautomat fuer 2 katzen", impressions: 2, sources: ["google"], providers: { google: { impressions: 2, clicks: 0, position: 50 } } },
    { query: "abs filetype:fods", impressions: 20, sources: ["bing"], providers: { bing: { impressions: 20 } } },
  ] } } };
  const nodes = nodesFromSearch(search);
  assert.equal(nodes.length, 1);
  assert.deepEqual(nodes[0].candidateQueries, ["futterautomat fuer 2 katzen"]);
  assert.equal(nodes[0].sourceSignals[0].type, "gsc");
});

test("nicht validiertes Data Finding erzeugt keine Content-Aktion", () => {
  const demand = { ...node("gps-data-finding", "Validiertes GPS Abo Finding integrieren", "/warum-brauchen-gps-tracker-ein-abo/"), cluster: "gps-tracker", publicationGate: "needs-review" };
  const result = matchDemandNodes([demand], [document("/warum-brauchen-gps-tracker-ein-abo/", "Warum benötigen Tracker ein Abo", [], "Mobilfunkkosten", "gps-tracker")])[0];
  assert.equal(result.publicationBlocked, true);
  assert.match(result.recommendedAction, /Keine Content-Aktion/);
});

test("Matching kombiniert Titel, Überschrift, Body, Graph und Route statt nur Keywords", () => {
  const demand = node("camera-indoor-vs-pet", "Normale Indoor Kamera oder spezielle Haustierkamera", "/haustierkameras/");
  const scored = scoreDocument(demand, document("/haustierkameras/", "Haustierkameras", ["Indoor Kamera"], "Spezielle Funktionen", "haustierkameras"));
  assert.equal(scored.signals.expectedOwner, true);
  assert.ok(scored.signals.headingScore > 0);
  assert.ok(scored.signals.bodyScore > 0);
  assert.ok(scored.signals.clusterMatch);
});
