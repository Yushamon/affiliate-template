#!/usr/bin/env node

const palettes = {
  light: {
    page: "#f5f6f3", surface: "#ffffff", primary: "#171a18", secondary: "#545c57",
    action: "#176b45", actionText: "#ffffff", status: ["#1d7547", "#8a4b00", "#ad2f2f", "#175ea8", "#545c57"],
    evidence: ["#175ea8", "#8a4b00", "#545c57"],
  },
  dark: {
    page: "#0c0d0d", surface: "#141615", primary: "#f2f4f1", secondary: "#adb5af",
    action: "#55c58a", actionText: "#0c0d0d", status: ["#66c98e", "#f0b45a", "#ff8d8d", "#73b8ff", "#adb5af"],
    evidence: ["#73b8ff", "#f0b45a", "#adb5af"],
  },
};

function rgb(hex) {
  const value = hex.slice(1);
  return [0, 2, 4].map((offset) => Number.parseInt(value.slice(offset, offset + 2), 16) / 255);
}
function luminance(hex) {
  return rgb(hex).map((channel) => channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4)
    .reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0);
}
function contrast(foreground, background) {
  const [light, dark] = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (light + .05) / (dark + .05);
}
function result(name, foreground, background, minimum = 4.5) {
  const ratio = contrast(foreground, background);
  return { name, ratio: Number(ratio.toFixed(2)), minimum, pass: ratio >= minimum };
}

const results = Object.entries(palettes).flatMap(([mode, palette]) => [
  result(`${mode} text.primary / page`, palette.primary, palette.page, 7),
  result(`${mode} text.primary / surface`, palette.primary, palette.surface, 7),
  result(`${mode} text.secondary / page`, palette.secondary, palette.page),
  result(`${mode} text.secondary / surface`, palette.secondary, palette.surface),
  result(`${mode} primary button text / primary button bg`, palette.actionText, palette.action),
  result(`${mode} secondary button text / bg`, palette.primary, palette.surface),
  ...palette.status.map((color, index) => result(`${mode} status.${index + 1} / surface`, color, palette.surface)),
  ...palette.evidence.map((color, index) => result(`${mode} evidence.${index + 1} / surface`, color, palette.surface)),
]);

console.log("PfotenTechnik 33.0.0 Contrast Audit");
for (const item of results) console.log(`${item.pass ? "PASS" : "FAIL"} ${item.ratio.toFixed(2)}:1 (min ${item.minimum}:1) — ${item.name}`);
const failed = results.filter((item) => !item.pass);
if (failed.length) process.exitCode = 1;
else console.log(`Alle ${results.length} semantischen Kombinationen erfüllen WCAG AA.`);
