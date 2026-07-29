import test from "node:test";
import assert from "node:assert/strict";
import { normalizeInternalPath, isSelfLinkTarget, filterSelfLinkItems } from "../src/domain/content/internalUrlPolicy.ts";

test("Redirect-Alias wird auf finale Comparison aufgelöst", () => {
  assert.equal(normalizeInternalPath("https://www.pfotentechnik.de/futterautomat-mit-kamera?utm_source=x#modelle"), "/vergleiche/beste-futterautomaten-mit-kamera/");
});

test("Slash, Host und Protokoll sind für Selbstlinks irrelevant", () => {
  assert.equal(isSelfLinkTarget("http://www.pfotentechnik.de/vergleiche/beste-futterautomaten-ohne-wlan", "https://pfotentechnik.de/vergleiche/beste-futterautomaten-ohne-wlan/"), true);
});

test("reine Sprunglinks bleiben erhalten", () => {
  assert.equal(isSelfLinkTarget("#faq", "/vergleiche/beste-futterautomaten-ohne-wlan/"), false);
});

test("funktionaler Filterzustand wird nicht als gewöhnlicher Selbstlink entfernt", () => {
  assert.equal(isSelfLinkTarget("/vergleiche/beste-futterautomaten-ohne-wlan/?filter=akku", "/vergleiche/beste-futterautomaten-ohne-wlan/"), false);
});

test("Empfehlungslisten verlieren nur echte Selbstlinks", () => {
  const items = filterSelfLinkItems([{href:"/futterautomat-ohne-wlan/"},{href:"/produkt/cat-mate-c500/"}], "/vergleiche/beste-futterautomaten-ohne-wlan/");
  assert.deepEqual(items.map((item)=>item.href), ["/produkt/cat-mate-c500/"]);
});
