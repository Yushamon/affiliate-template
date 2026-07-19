export default {
  include: ["src/content/pages"],
  thresholds: {
    maxFaqItems: 20,
    maxConsecutiveListItems: 10,
    maxListBlocks: 10,
    maxChecklistBlocks: 4,
    maxParagraphWords: 150,
    minDescriptionLength: 90,
    maxDescriptionLength: 180,
    minTitleLength: 25,
    maxTitleLength: 72
  },
  medicalTerms: [
    "tierarzt",
    "tierärzt",
    "notfall",
    "dehydrat",
    "vergiftung",
    "krankheit",
    "symptom",
    "diagnose",
    "medikament",
    "durchfall",
    "erbrechen",
    "blut",
    "atemnot",
    "kollaps"
  ],
  sourceSignals: [
    "http://",
    "https://",
    "quellen",
    "fachquellen",
    "wsava",
    "aaha",
    "merck",
    "msd",
    "cornell",
    "vca"
  ],
  checklistSignals: ["checkliste", "checks", "prüfliste", "kontrollliste"],
  ignoredRules: []
};
