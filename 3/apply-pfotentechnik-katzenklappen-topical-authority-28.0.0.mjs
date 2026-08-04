#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { spawnSync } from "node:child_process";

const PATCH = "pfotentechnik-katzenklappen-topical-authority-28.0.0";
const APP = path.join("apps", "pfotentechnik");
const rel = (...parts) => path.join(APP, ...parts);

const PAYLOADS = new Map([
  [rel("src", "content", "pages", "smarte-katzenklappen.md"), "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"],
  [rel("test", "katzenklappen-topical-authority-28.0.0.test.mjs"), "H4sIAAAAAAAEALVWTY/bNhC9+1cMdJIBfQS5tNjABdpgi6TtNkWDtkB290BLI4sxRarkcDfrYP9Nf0Zv+WMdypItOXZ2kUUvtig+vhnOGz5KNq2xBMI55L/KmgYibUo8277JHVlZUPRiJrfAyo1BldvPtILq8VwY72cJ3YQ+jHl2mP44A8AbobwgfKm8I7Q/GW813iU8s0LqR7/j315abFCTS2b3PWOW5c4WuZLL3KHJybSyECoVnmpjJd3l77er08I0rUKSRmcUUp8VRnNe1hiCBbTWFOhcVtyW8fzFMIei5LnYohIkb3AOi++4Cll4/6NU+PZOF3HYa/beSB0HqgR24AQiT9W3EdPNwpbj6GdBG9RrJdoWddpvC5boJG0ItLf8rHBFCD8wXujSrYUm1FECcRc7lGpIbV8MTvF4leJoPY7YZQK93hnjhIrHPJlCvaI6gW8YeIDjMUyCZs40GMeSsOlSCw8ZCcuZZFIXypfI8fMbtCuFsqgxj+bzpKOphHIYHp8WBhaLBUQ5K1f6NeUb5H4w3mH6PH3GwbaxyPoh1P1DQkiuayMJStSAH1olNxxNczqlWIe+QcUFgl+kXju4MUo5+vSPLuXqiDylKfygzWWXyMfulzdnPOEZ5+0aYQnTWnDHS64AFrWW6zxKeqAKcc7gcoecaJlH11vgffJF+oNFh+T9EEZ1dN5ixfi0kWs+FLVsJyR8jrTGgvZccFqEAfJArl8d+ok1eiDrJ7LXaNnLuGfsdmOI5f/BvUv+68ivO08YTMV5FdzwuB0f2kmyb/OjzhLIMoYqduSlwqQ7jJ+f+R7Y+/NjYeVL4zUdeFWJ2J6P0Y10TurVeblCl8Dl9dQGXvklB0OtCf4cfMql4HUJv21bI30d/Jd2dnDkqNdMsuiuijgKNxG/DUvyVnDMowJkTTm14kZQUcdMlED+l7C+ATYcz/LCGqWGi91pAL4+LXzftukuXwjlJ6wpHxdizPiOG+TizR9vz+H5Vfasc7nA+s47TqrhbaqTSxup2cZ5O65bcotsiFzZifvxcGqnF5ykmnKWBt2vhi5G1Fejq+EqX4YoJ469vsrzqW7D7eiwM+jq0781qwhaFHXIbCOxXgoLGy6kRs8zWxXTN7ca7UTCyliIh+bf3ttgqt4XT8t5YNpB0OTIktBDBbnH+tpDNBObOgFuhPaVKIgjWrfznUeBd/QD+nreG8+kM7pOH33ksJLHmpxFG30LhV647yT8DzkCW6R1CgAA"],
  [rel("reports", "topical-authority", "katzenklappen-roadmap-28.0.0.md"), "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"],
]);

// The roadmap payload uses Brotli for a smaller, independently checksummed source.
PAYLOADS.set(
  rel("reports", "topical-authority", "katzenklappen-roadmap-28.0.0.md"),
  zlib.gzipSync(zlib.brotliDecompressSync(Buffer.from(
    "G3sdADwcT4clzyPjUjDjvObEqopfWl6ycI2htPCvzv//ELU09B4NYUPwnLRpYtVZr9p27o/TR6EeuBR4tKRywJs8z6enV+gl5Z9L28FABjSwgU6PMeA8oRkH2d5m6rT+7U5dM8G79wkpwjZHkItcOe1THp5yYj4/gna4lfB4Cnj7PyC3jp6lHSuWR1q1rTlVwYAFSLj8n05d07EdJi9TcZ/8//1/rz5JAbmksBSWHVTQ8Xt3strKBYSNcEOe0rnD2K08TAS6RKOutG8tiW0kQOCtM+85/HzIrKh/ng25VSPcRmjGYVrf50efV0/rhqPoc8GX15X48q63O+64mAfv74yfg/SKBQdJqw2i7tx0W7IS77CkrDpR9wp2I4p3kCDBcBBLuhJ7eDymaWvEwZjz5jGzr30WZZAE9iWzGuXWWeBhzClTnppWVf9CcSNmHS9YHnv6yaKOJCoVy3fmqZDtMPhthOF0IXhC8SaI/v9wQnlIF8SXvAm45tu3M58IDckdaTj1ciaufVITvLfhu4DGty5/5unO/0Kfp4gOuB55uIYdK7pzXI7tT51FyPofAO4Z3AQvDNyNMHDh4kM4ElGooL+1wn8RE7mumvsCKfxnMBsOSqYL6pqZNNkGCJV7PGs4IGPyQ4U321oCO4WQHFWaR051FzO4X3eB90hN31Ti/K6lUfwHitceNh+ns5wVc639nCP7cq8ieRFEjDnZ/zsSpftEtIHBc+3TtIEN7G71yPaEXtHn4sM7YtlF1wHnIPUw1CO3WfqnniNE6pd1I+vWRt2JgsLo60SAdfV+PpHDf4jamHqrqAw3SMTXSA2zrylDGWhBmU3DImYg+Y+ySh9IW5+92F+5pW6dVrcL3D56FJadQ3OUo2cSCSB0XnbCFx3NE4uVo1HIEH9eFsOCNxexbrD/blfW2NA6BW63T9az/9kPl4kC+0TCkW/umAtx51WD2aeVJCJS2G4mcXWNmnsGacwbkdd3VN6UIt5JTACFFy9QXrduzO42+FcRZNJc9qDbyHpCmMiMdGVya+H5wha3CQOtZt9fmm19xxMJewtuyhizDBuOulGIaB1HVqlKQwpZVj/N1iBEiVup6jbU3/mMezeTDz3ltKbBaPjXm6nI2CWqB1FXNcTjPNOyeT0bB/AwC/E+7xCSxalf3c3jyn00K2R7iY5OCH8Nv5qrdFjgdYAdIh7PkU+7n07+v/W/vJ8JQD2TT5JTHvYYfRfKNryQLP7/2Yodh1Q1JGMqzDly6GkxqqwjysKHCA+JxyPHAaZ3gShb39RxU3u0641JNBD8IkJs3WkFx8vB9Gm8nFrNFDHEDXbus9mougZ9nFHo6b42pDVIkqyEWMLsjvwA9xkx1KzrN6ZiCbPtqHj+B7wB8ACHypMXnAsJlYiCs/OTNtT/LnmsRab0H7vSyB63xZCqRXW85kBRIV/0Gs6RwZCwXhKACrd+VkG5JZkI3MYX/bNamFAVTZL41/gT6NdMk1mYDpCMS/KPziL5TzJNE3gbtuPRMV7HPFeYvbMd2ZeGs+l+2uwapAXIICz84fQhu0sjjFGDkT0DBh/9u+aH6zXfRKixQiNnKXCw1f3JhcaqMSup9gDUf4Mji40nw2+UCn5kEVsjUCkdsg0ojH9DyxVRY6RpqcGdRRDS8VaS/+Ah2EM4c8EIPKnMtespQAu/r2K/cyy0tEiS30GuqRC2nBNau4n0YMkXw2no6YNWy34zFnXX6rRd1Q8sMfeLcGf9qBNUkIvu/z9dsTPlYYifM6dZR/LQ7OB0JUdkkXZFr30QYR2qy2viIicG0NxjrqJPSJwxKWe/NHMlmrJ8XSWXIfJy7FX52hjcIjzsg9eAVLmP14TR9/+hLOEAmcuM9U0taAIyoxU5zLbMRElhDyv6hQWRZSm0sHZ63XpC0Zc31a6TlKml3fXjAad4x3OkGZFiTTyUCJ21DCwCCwyXRwwsVbN3nrSPKMMxcA+VsgxAJg09yRTdlmIgiS/FwnolT6+xLj0KbI/ovv4gX5UXjB9t30J60FFrcEIRuesU6Z3Tq+ZbsjRIMUciUmV1kZgu5sFxpEgoCmEixBQIAeXRZTtS6xaLbG5v4fiGki5GjwrpmQj8Q+qq/XSMIHsqMmsR2m7AHDUqVVKxdEx9oI2SYx+JVc1GVIsJXqeK6HL73hivNHEDwGe1jA8nU+2qVHO/VN3lpFSwJNkWBKyHUyFtmwTk2hzehKfvjX5CbJbT8mD6qCt4HLSjOnetdem57kTUTS7rMfsMqA542vXo7UOC1D9Vq69TZ2Md8PrGWOlToKbSZ8ds4D1+nskaw3HDHpMwlgjdvEKoyg1PETAnQjgtXFhjQxjA/MTPWwqLag2mSdk9WDn+evpJ9dYBnrJiY2A2kaqK1DqErGYqQCq9ceV+kUfH/0Ig7jsh/wXjfqWLX3uHslkvJF5HmZTWdPAIUU52KCQljvHIVagA4GTTzVGSljcHh9sf+i6L6a9oNpwPZxO1EtktBZepLAjhHnC7gHpwtYZ0c3REbxc/kSEwcLFZObUzu6d3R663ZV/XOB/ypl9tOC6cIhAlsf4Zw5shnuLRvpi/UCFBfaGD6WeonGeFzXlVugQbumRcTi4uaCmDOc9Xrn+pfsQklQhajAxcvEMELM7oXlCwKEeiezwUD8PUBpGPPL8rW75GdpfbPOFqe8Cp/DgLMX7h3nTQ/OFz4taCY7cf5wnPpVq9dsgshIRExuNf9OIkKmlznqo+31Bn61osMRuCjNbEcuGiym3Yk9kgnKWIbpwyjmKkLKb7/qwPjw9hmfZ1mSZfEmzsgcbhIMiqZilZy0jRrMwFuzSYDP8xveaevOc0dBVqfTJpTv+1+wf/cz4UN5Z4ZcgXcrA9DawXANMHRiQd2Ib5eksi6U/LhfXI4ile1/WTKNy17oWTVqOJkfFbmC04SAk6aVihDyrrCzhSlYplwZq9OSRmlqlBMIn2xiDOfofvra6Ou1eVfjabUwiRsnXH08kU2O0pVCgxLKo1/bckE5ZXNDkjM5+JsCz7z+Sd2wYuLgQy3NRONmjOTVgnv2Ps+JbMLoSGRP2y2olBKOn9x6SASed5bBOd4eNnq1XvGmXPFtsItMCRpCGDTYU5eIh4OPV+KWBKNHnaa9z027JpJRpC0Uy0oh8ztuEXxI4ZxLyvqA2bz/RsFc3nSolw2icUIfeqqytA4za8OVkRYxgE3fcxasTGFahH52KdAkskUj3OOnf46PelMl1YPlAwhZJOsS2GqInwxqOFZnW/YXaO7Wqth7pOB3tg8OXFYeCm1gWRxPHBlEZqWou/x1yrau1Iw01Rbd3AWNQn7DUSPjWcqMFGdirDJsxmq0+SsMvTDNFr02pamEzlQx+21tPbe/vTQ63pgGsydabWAHOoWz7Z9uQ7l5od2ruNzZiBdXq/nlg/r+ra8Pf2fGVgbNaAO1t+Ydvt0aXCk5U99vJdZPCmIYnskuF2F0Yju/2hOxNVuXp+CA/FEUOukulcqf+EB2s7FZug8/T9FgTNGpGis9l0DN7XanBDdYwxalkjUckHvjYW6vrArkhRapRFbhNZK0sI90YVTsVl1xwPX6DtvGFhsTolI6G5rwZ9hFQPGFtFWzpe1JpOjZENQWzjoFASuftRrGLXx1k7R2KfEwuiMPBicwrwdpBx+t6beAIXGMrxhQJ7+cH0VEowcZyprQ55pDN33RrQVw6C+KALqW9J4EAr39ghDCyBMbRdxKyz2WpdASV/LtFXkoCQxgMJAQ612kOCjA5b68GH0YJmw+NnUx6qnG1cCtEA",
    "base64",
  ))).toString("base64"),
);

const EXISTING = {
  package: rel("package.json"),
  journey: rel("src", "lib", "seo", "topical-authority", "journey-completion.ts"),
  overview: rel("src", "content", "pages", "smarte-haustiertechnik.md"),
  sureflap: rel("src", "content", "products", "sureflap-mikrochip-katzenklappe-connect.md"),
  zeromouse: rel("src", "content", "products", "zeromouse-2-0.md"),
  surefeed: rel("src", "content", "manufacturers", "surefeed.md"),
  zeromouseBrand: rel("src", "content", "manufacturers", "zeromouse.md"),
};

function findRoot(start) {
  let current = path.resolve(start);
  for (let i = 0; i < 16; i += 1) {
    if (fs.existsSync(path.join(current, APP, "package.json"))) return current;
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
  throw new Error("Repository-Wurzel nicht gefunden.");
}

const ROOT = findRoot(process.cwd());
const BACKUP = path.join(ROOT, ".patch-backups", `${PATCH}-${new Date().toISOString().replace(/[:.]/g, "-")}`);
const touched = [...Object.values(EXISTING), ...PAYLOADS.keys()];
const before = new Map();
const decode = (value) => zlib.gunzipSync(Buffer.from(value, "base64"));
const log = (message) => console.log(`[${PATCH}] ${message}`);

function read(relative) {
  const file = path.join(ROOT, relative);
  if (!fs.existsSync(file)) throw new Error(`Pflichtdatei fehlt: ${relative}`);
  const value = fs.readFileSync(file, "utf8");
  if (/^(<<<<<<<|=======|>>>>>>>)(?: .*)?$/m.test(value)) throw new Error(`Konfliktmarker in ${relative}`);
  return value;
}

function replaceOnce(source, oldValue, newValue, label) {
  if (source.includes(newValue)) return source;
  const first = source.indexOf(oldValue);
  if (first < 0 || source.indexOf(oldValue, first + oldValue.length) >= 0) throw new Error(`Kein eindeutiger Strukturanker: ${label}`);
  return source.slice(0, first) + newValue + source.slice(first + oldValue.length);
}

function write(relative, value) {
  const file = path.join(ROOT, relative);
  const data = Buffer.isBuffer(value) ? value : Buffer.from(value, "utf8");
  if (fs.existsSync(file) && fs.readFileSync(file).equals(data)) return;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, data);
  log(`Geändert: ${relative}`);
}

function run(script) {
  log(`Prüfe: ${script}`);
  const command = process.platform === "win32" ? (process.env.ComSpec || "cmd.exe") : "npm";
  const args = process.platform === "win32"
    ? ["/d", "/s", "/c", "npm", "--workspace", "apps/pfotentechnik", "run", script]
    : ["--workspace", "apps/pfotentechnik", "run", script];
  const result = spawnSync(command, args, { cwd: ROOT, stdio: "inherit", shell: false });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${script} fehlgeschlagen (Exit ${result.status}).`);
}

for (const relative of Object.values(EXISTING)) read(relative);
for (const [relative, payload] of PAYLOADS) {
  const file = path.join(ROOT, relative);
  if (fs.existsSync(file) && !fs.readFileSync(file).equals(decode(payload))) throw new Error(`Konflikt mit verwalteter Zieldatei: ${relative}`);
}
fs.mkdirSync(BACKUP, { recursive: true });
for (const relative of touched) {
  const file = path.join(ROOT, relative);
  const value = fs.existsSync(file) ? fs.readFileSync(file) : null;
  before.set(relative, value);
  if (value) {
    const target = path.join(BACKUP, relative);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, value);
  }
}

try {
  for (const [relative, payload] of PAYLOADS) write(relative, decode(payload));

  let value = read(EXISTING.package);
  value = replaceOnce(value, '    "test:topical-authority": "node --test test/topical-authority-center.test.mjs",', '    "test:topical-authority": "node --test test/topical-authority-center.test.mjs",\n    "test:topical-authority:katzenklappen": "node --test test/katzenklappen-topical-authority-28.0.0.test.mjs",', "package test script");
  write(EXISTING.package, value);

  value = read(EXISTING.journey);
  value = replaceOnce(value, '{id:"comparison-to-filter",source:"/vergleiche/beste-trinkbrunnen-fuer-katzen/",target:"/filter-im-katzentrinkbrunnen-wechseln/",label:"Katzenvergleich → Filterratgeber"}\n]};', '{id:"comparison-to-filter",source:"/vergleiche/beste-trinkbrunnen-fuer-katzen/",target:"/filter-im-katzentrinkbrunnen-wechseln/",label:"Katzenvergleich → Filterratgeber"}\n],\nkatzenklappen:[\n{id:"overview-to-hub",source:"/smarte-haustiertechnik/",target:"/smarte-katzenklappen/",label:"Haustiertechnik → Katzenklappen-Hub"},\n{id:"hub-to-sureflap",source:"/smarte-katzenklappen/",target:"/produkt/sureflap-mikrochip-katzenklappe-connect/",label:"Hub → vollständige Mikrochip-Klappe"},\n{id:"hub-to-zeromouse",source:"/smarte-katzenklappen/",target:"/produkt/zeromouse-2-0/",label:"Hub → Beuteerkennungs-Nachrüstung"},\n{id:"sureflap-to-hub",source:"/produkt/sureflap-mikrochip-katzenklappe-connect/",target:"/smarte-katzenklappen/",label:"Mikrochip-Klappe → Hub"},\n{id:"zeromouse-to-hub",source:"/produkt/zeromouse-2-0/",target:"/smarte-katzenklappen/",label:"Nachrüstung → Hub"},\n{id:"surefeed-to-hub",source:"/hersteller/surefeed/",target:"/smarte-katzenklappen/",label:"Sure Petcare → Hub"},\n{id:"zeromouse-brand-to-hub",source:"/hersteller/zeromouse/",target:"/smarte-katzenklappen/",label:"ZeroMOUSE → Hub"}\n]};', "Katzenklappen-Journey");
  write(EXISTING.journey, value);

  value = read(EXISTING.overview);
  value = replaceOnce(value, '        cta: "Trinkbrunnen auswählen"', '        cta: "Trinkbrunnen auswählen"\n      - label: "Selektiver Zugang"\n        title: "Smarte Katzenklappen"\n        text: "Mikrochip-Zugang, App-Funktionen, Durchgangsmaß, Einbau und spezialisierte Beuteerkennung."\n        href: "/smarte-katzenklappen/"\n        cta: "Katzenklappen auswählen"', "Overview-Karte");
  value = replaceOnce(value, 'In Mehrtierhaushalten muss die Regel je Tier und Richtung verständlich konfigurierbar sein.\n', 'In Mehrtierhaushalten muss die Regel je Tier und Richtung verständlich konfigurierbar sein.\n\nDer Cornerstone [Smarte Katzenklappen](/smarte-katzenklappen/) trennt lokale Mikrochip-Erkennung, App-Funktionen und spezialisierte Nachrüstung und führt zu den vorhandenen konkreten Produktprüfungen.\n', "Overview-Übergabe");
  write(EXISTING.overview, value);

  value = read(EXISTING.sureflap);
  value = replaceOnce(value, '  label: "Katzenklappen"\n', '  label: "Katzenklappen"\n  path: "/smarte-katzenklappen/"\n', "SureFlap-Kategorie");
  value = replaceOnce(value, 'Die SureFlap Mikrochip Katzenklappe Connect verbindet individuelle Mikrochip-Zutrittsregeln mit App-Funktionen. Die lokale Tiererkennung gehört zur Klappe. Für Fernverriegelung, Aktivitätsmeldungen, Statistiken und Änderungen per App ist zusätzlich der Sure Petcare Hub erforderlich.\n', 'Die SureFlap Mikrochip Katzenklappe Connect verbindet individuelle Mikrochip-Zutrittsregeln mit App-Funktionen. Die lokale Tiererkennung gehört zur Klappe. Für Fernverriegelung, Aktivitätsmeldungen, Statistiken und Änderungen per App ist zusätzlich der Sure Petcare Hub erforderlich.\n\nDie breite Auswahl zwischen lokaler Mikrochip-Erkennung, App-Funktionen und Nachrüstung ordnet der Hub [Smarte Katzenklappen](/smarte-katzenklappen/) ein. Diese Produktseite bleibt der Intent-Owner für die konkrete SureFlap-Connect-Prüfung.\n', "SureFlap-Rücklink");
  write(EXISTING.sureflap, value);

  value = read(EXISTING.zeromouse);
  value = replaceOnce(value, '  label: Smarte Haustiertechnik\n  path: /smarte-haustiertechnik/', '  label: Katzenklappen\n  path: /smarte-katzenklappen/', "ZeroMOUSE-Kategorie");
  value = replaceOnce(value, 'Wer nur fremde Katzen aussperren will, braucht keine KI-Beuteerkennung. Dafür genügt eine passende Mikrochip-Klappe.\n', 'Wer nur fremde Katzen aussperren will, braucht keine KI-Beuteerkennung. Dafür genügt eine passende Mikrochip-Klappe.\n\nDie vorausgehende Auswahl zwischen vollständiger Klappe, App-Funktionen und spezialisierter Nachrüstung erklärt [Smarte Katzenklappen](/smarte-katzenklappen/). ZeroMOUSE bleibt hier bewusst als Zusatzmodul eingeordnet und wird nicht mit vollständigen Klappen in eine gemeinsame Rangliste gestellt.\n', "ZeroMOUSE-Rücklink");
  write(EXISTING.zeromouse, value);

  value = read(EXISTING.surefeed);
  value = replaceOnce(value, '[SureFlap Mikrochip Katzenklappe Connect ansehen](/produkt/sureflap-mikrochip-katzenklappe-connect/)\n', '[SureFlap Mikrochip Katzenklappe Connect ansehen](/produkt/sureflap-mikrochip-katzenklappe-connect/)\n\nDie herstellerübergreifende Auswahl nach Zugang, Passform, Einbau und App-Bedarf bündelt der Cornerstone [Smarte Katzenklappen](/smarte-katzenklappen/).\n', "SureFeed-Übergabe");
  write(EXISTING.surefeed, value);

  value = read(EXISTING.zeromouseBrand);
  value = replaceOnce(value, 'Die Lösung ersetzt weder die Katzenklappe noch deren Mikrochip-Zugangskontrolle. Kompatibilität, WLAN, Stromversorgung und die konkrete Einbausituation müssen vor dem Kauf geprüft werden.\n', 'Die Lösung ersetzt weder die Katzenklappe noch deren Mikrochip-Zugangskontrolle. Kompatibilität, WLAN, Stromversorgung und die konkrete Einbausituation müssen vor dem Kauf geprüft werden.\n\nZur Abgrenzung von vollständiger Mikrochip-Klappe, App-Funktionen und Nachrüstung führt der Auswahl-Hub [Smarte Katzenklappen](/smarte-katzenklappen/). Die konkrete Produktprüfung bleibt bei [ZeroMOUSE 2.0](/produkt/zeromouse-2-0/).\n', "ZeroMOUSE-Hersteller-Übergabe");
  write(EXISTING.zeromouseBrand, value);

  run("test:topical-authority:katzenklappen");
  for (const script of ["audit:topical-authority:strict", "audit:decision-journeys:strict", "audit:internal-link-health:strict", "audit:content-quality:strict", "build"]) run(script);
  log(`Fertig. Backup: ${path.relative(ROOT, BACKUP)}`);
} catch (error) {
  for (const [relative, value] of before) {
    const file = path.join(ROOT, relative);
    if (value === null) fs.rmSync(file, { force: true });
    else {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, value);
    }
  }
  console.error(`[${PATCH}] Rollback abgeschlossen.`);
  throw error;
}
