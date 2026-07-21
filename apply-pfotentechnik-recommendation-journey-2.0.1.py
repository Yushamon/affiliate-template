#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime
import json
import re
import shutil
import sys

APP = Path("apps/pfotentechnik")
FILES = {
    "page_schema": APP / "src/content/schema/page.ts",
    "product_schema": APP / "src/content/schema/product.ts",
    "route": APP / "src/pages/[slug].astro",
    "viewmodel": APP / "src/domain/comparison/buildComparisonViewModel.ts",
    "explorer": Path("packages/affiliate-core/src/components/comparison/ComparisonExplorer.astro"),
    "target": APP / "src/content/pages/futterautomat-fuer-grosse-hunde.md",
}

PRODUCTS = {
    "xiaomi-smart-pet-food-feeder-2": (["cat", "dog"], ["small", "medium"]),
    "petlibro-granary-wifi-feeder": (["cat", "dog"], ["small", "medium"]),
    "petlibro-granary-camera-feeder": (["cat", "dog"], ["small", "medium"]),
}

def fail(message):
    print("FEHLER:", message, file=sys.stderr)
    raise SystemExit(1)

def find_root(start):
    for candidate in [start, *start.parents]:
        if (candidate / APP).is_dir() and (candidate / "package.json").exists():
            return candidate
    fail("Repository-Root nicht gefunden.")

def replace_once(text, old, new, label):
    count = text.count(old)
    if count != 1:
        fail(f"{label}: Stelle {count}x gefunden.")
    return text.replace(old, new, 1)

root = find_root(Path.cwd().resolve())
backup_root = root / (".recommendation-journey-2.0.1-backup-" + datetime.now().strftime("%Y-%m-%dT%H-%M-%S"))
changed = []

def save(relative, original, updated):
    if original == updated:
        return
    src = root / relative
    dst = backup_root / relative
    dst.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(src, dst)
    src.write_text(updated, encoding="utf-8")
    changed.append(str(relative))

# Product schema
path = root / FILES["product_schema"]
text = path.read_text(encoding="utf-8")
original = text
if "    petSize: z" not in text:
    old = 'const productComparisonFiltersSchema =\n  z.object({\n    foodType: z\n'
    new = '''const productComparisonFiltersSchema =
  z.object({
    animal: z
      .array(z.enum(["dog", "cat"]))
      .default([]),

    petSize: z
      .array(z.enum(["small", "medium", "large"]))
      .default([]),

    foodType: z
'''
    text = replace_once(text, old, new, "Produkt-Schema")
if "    animal: []," not in text:
    text = replace_once(
        text,
        '  .default({\n    foodType: []\n  });',
        '  .default({\n    animal: [],\n    petSize: [],\n    foodType: []\n  });',
        "Produktfilter-Defaults",
    )
save(FILES["product_schema"], original, text)

# Page schema
path = root / FILES["page_schema"]
text = path.read_text(encoding="utf-8")
original = text
if "    recommendationJourney: z" not in text:
    block = '''    recommendationJourney: z
      .object({
        mode: z.enum(["filtered", "off"]).default("filtered"),
        animal: z.enum(["dog", "cat"]).optional(),
        petSize: z.enum(["small", "medium", "large"]).optional(),
        comparisonHref: z.string(),
        comparisonLabel: z.string().default("Passende Modelle vergleichen"),
        emptyTitle: z.string().default("Aktuell keine uneingeschränkte Top-Empfehlung"),
        emptyText: z.string().default(
          "Im gepflegten Datenbestand ist derzeit kein Modell eindeutig für diesen Anwendungsfall dokumentiert."
        )
      })
      .optional(),

'''
    text = replace_once(text, "    comparisonRecommendation: z\n", block + "    comparisonRecommendation: z\n", "Seiten-Schema")
save(FILES["page_schema"], original, text)

# Product data
for slug, (animals, sizes) in PRODUCTS.items():
    relative = APP / "src/content/products" / f"{slug}.md"
    path = root / relative
    if not path.exists():
        fail(f"Produkt fehlt: {relative}")
    text = path.read_text(encoding="utf-8")
    original = text
    animal_line = "  animal: [" + ", ".join(json.dumps(v) for v in animals) + "]\n"
    size_line = "  petSize: [" + ", ".join(json.dumps(v) for v in sizes) + "]\n"
    match = re.search(r"(?ms)^comparisonFilters:\n(?P<body>(?:  .*\n)+)", text)
    if match:
        additions = ""
        body = match.group("body")
        if "  animal:" not in body:
            additions += animal_line
        if "  petSize:" not in body:
            additions += size_line
        if additions:
            pos = match.start("body")
            text = text[:pos] + additions + text[pos:]
    else:
        marker = re.search(r"(?m)^faq:", text)
        if not marker:
            fail(f"Kein Einfügepunkt in {slug}")
        text = text[:marker.start()] + "comparisonFilters:\n" + animal_line + size_line + text[marker.start():]
    save(relative, original, text)

# Comparison view model
path = root / FILES["viewmodel"]
text = path.read_text(encoding="utf-8")
original = text
if 'addValue(values, "tiergroesse"' not in text:
    addition = '''  (source?.animal ?? []).forEach((animal) => {
    addValue(values, "tier", animal === "dog" ? "hund" : "katze");
  });

  (source?.petSize ?? []).forEach((size) => {
    addValue(
      values,
      "tiergroesse",
      size === "small" ? "klein" : size === "medium" ? "mittel" : "gross"
    );
  });

'''
    text = replace_once(text, "  const foodTypes = source?.foodType ?? [];\n\n", "  const foodTypes = source?.foodType ?? [];\n\n" + addition, "Strukturierte Filter")

if "const hasUsefulFilterCoverage" not in text:
    coverage = '''  const hasUsefulFilterCoverage = (key: string) => {
    const productsWithValue = items.filter((item) => {
      const values = filterValuesBySlug.get(item.slug)?.[key] ?? [];
      return values.length > 0;
    }).length;

    return productsWithValue >= 2 &&
      productsWithValue / Math.max(items.length, 1) >= 0.5;
  };

'''
    text = replace_once(text, "  const isGpsComparison = items.length > 0 && items.every((item) =>\n", coverage + "  const isGpsComparison = items.length > 0 && items.every((item) =>\n", "Filter-Coverage")

if 'key: "tiergroesse"' not in text:
    filters = '''    ...(hasUsefulFilterCoverage("tier")
      ? [{
          key: "tier",
          label: "Tier",
          options: [
            { value: "hund", label: "Hund" },
            { value: "katze", label: "Katze" }
          ]
        }]
      : []),
    ...(hasUsefulFilterCoverage("tiergroesse")
      ? [{
          key: "tiergroesse",
          label: "Tiergröße",
          options: [
            { value: "klein", label: "Klein" },
            { value: "mittel", label: "Mittel" },
            { value: "gross", label: "Groß" }
          ]
        }]
      : []),
'''
    text = replace_once(text, '    {\n      key: "futterart",\n', filters + '    {\n      key: "futterart",\n', "Filterdefinitionen")
save(FILES["viewmodel"], original, text)

# URL preselection
path = root / FILES["explorer"]
text = path.read_text(encoding="utf-8")
original = text
if "const applyUrlFilters = () =>" not in text:
    code = '''      const applyUrlFilters = () => {
        const params = new URLSearchParams(window.location.search);

        inputs.forEach((input) => {
          if (!(input instanceof HTMLInputElement)) return;
          const key = input.dataset.filterKey;
          if (!key) return;

          const values = [
            ...params.getAll(`filter-${key}`),
            ...params.getAll(key)
          ]
            .flatMap((value) => value.split(","))
            .map((value) => value.trim())
            .filter(Boolean);

          if (values.includes(input.value)) input.checked = true;
        });
      };

'''
    text = replace_once(text, "      const applyState = () => {\n", code + "      const applyState = () => {\n", "URL-Filter")
    text = replace_once(text, "      applyState();\n    });", "      applyUrlFilters();\n      applyState();\n    });", "URL-Initialisierung")
save(FILES["explorer"], original, text)

# Page route
path = root / FILES["route"]
text = path.read_text(encoding="utf-8")
original = text
if "const recommendationJourney = page.data.recommendationJourney;" not in text:
    logic = '''const recommendationJourney = page.data.recommendationJourney;

const matchesRecommendationJourney = (product: (typeof products)[number]) => {
  if (!recommendationJourney || recommendationJourney.mode === "off") return true;
  const filters = product.data.comparisonFilters;
  const animalMatches = recommendationJourney.animal
    ? (filters?.animal ?? []).includes(recommendationJourney.animal)
    : true;
  const sizeMatches = recommendationJourney.petSize
    ? (filters?.petSize ?? []).includes(recommendationJourney.petSize)
    : true;
  return animalMatches && sizeMatches;
};

const journeyProducts = comparisonProductEntries
  .filter(matchesRecommendationJourney)
  .sort((a, b) =>
    (b.data.score ?? toEditorialScore(b.data.rating, 5)) -
    (a.data.score ?? toEditorialScore(a.data.rating, 5))
  );

const journeyTopProduct = journeyProducts[0];

const journeyComparisonHref = recommendationJourney
  ? `${recommendationJourney.comparisonHref}${
      recommendationJourney.comparisonHref.includes("?") ? "&" : "?"
    }${[
      recommendationJourney.animal
        ? `filter-tier=${recommendationJourney.animal === "dog" ? "hund" : "katze"}`
        : "",
      recommendationJourney.petSize
        ? `filter-tiergroesse=${
            recommendationJourney.petSize === "small"
              ? "klein"
              : recommendationJourney.petSize === "medium"
                ? "mittel"
                : "gross"
          }`
        : ""
    ].filter(Boolean).join("&")}#direktvergleich`
  : undefined;

'''
    anchor = '''const comparisonProductEntries = comparisonProducts
  .map((slug) => productBySlug.get(slug))
  .filter((product): product is (typeof products)[number] => Boolean(product));
'''
    text = replace_once(text, anchor, anchor + "\n" + logic, "Journey-Logik")

if "recommendation-journey-state" not in text:
    render = '''    {
      recommendationJourney && (
        <section class="recommendation-journey-state">
          {
            journeyTopProduct ? (
              <>
                <div class="ranking-section-header">
                  <p class="ranking-eyebrow">Top-Empfehlung</p>
                  <h2>Die passendste dokumentierte Auswahl</h2>
                  <p>Dieses Modell erfüllt die hinterlegten Eignungsfilter.</p>
                </div>
                <a class="decision-product-card" href={`/produkt/${journeyTopProduct.data.slug}/`}>
                  <OptimizedImage
                    src={journeyTopProduct.data.images.thumbnail?.src ?? journeyTopProduct.data.images.hero.src}
                    alt={journeyTopProduct.data.images.thumbnail?.alt ?? journeyTopProduct.data.images.hero.alt}
                    width={480}
                    height={360}
                    layout="constrained"
                  />
                  <div>
                    <p>{journeyTopProduct.data.manufacturer.name} · {journeyTopProduct.data.score ?? toEditorialScore(journeyTopProduct.data.rating, 5)} Punkte</p>
                    <h3>{journeyTopProduct.data.title}</h3>
                    <p>{journeyTopProduct.data.recommendation}</p>
                    <strong>Produktdetails lesen</strong>
                  </div>
                </a>
              </>
            ) : (
              <div class="recommendation-journey-empty">
                <p class="ranking-eyebrow">Redaktionelle Einordnung</p>
                <h2>{recommendationJourney.emptyTitle}</h2>
                <p>{recommendationJourney.emptyText}</p>
              </div>
            )
          }
          {
            journeyComparisonHref && (
              <a class="recommendation-journey-comparison" href={journeyComparisonHref}>
                <span>{recommendationJourney.comparisonLabel}</span>
                <strong>Mit vorausgewählten Filtern öffnen →</strong>
              </a>
            )
          }
        </section>
      )
    }

'''
    text = replace_once(text, "    {\n      topDecisionRecommendation && topDecisionProduct && (\n", render + "    {\n      topDecisionRecommendation && topDecisionProduct && (\n", "Journey-Rendering")

text = text.replace("      comparisonProducts.length > 1 && (\n", "      !recommendationJourney && comparisonProducts.length > 1 && (\n")
text = text.replace(
    "      comparisonProductEntries.length > 0 && comparisonExperienceConfig && (\n",
    "      !recommendationJourney && comparisonProductEntries.length > 0 && comparisonExperienceConfig && (\n",
)

if ".recommendation-journey-state {" not in text:
    text += '''
<style>
  .recommendation-journey-state {
    display: grid;
    gap: 1.25rem;
    margin-block: 2.5rem;
    padding: clamp(1.25rem, 4vw, 2rem);
    border: 1px solid var(--pt-theme-border, #d9e2e7);
    border-radius: 1.5rem;
    background: var(--pt-theme-surface, #fff);
  }
  .recommendation-journey-empty { max-width: 62ch; }
  .recommendation-journey-comparison {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    align-items: center;
    padding: 1rem 1.1rem;
    border-radius: 1rem;
    background: var(--pt-theme-accent-soft, #eaf8f0);
    color: var(--pt-theme-text, #12342f);
    text-decoration: none;
  }
  .recommendation-journey-comparison strong {
    color: var(--pt-theme-accent, #238657);
  }
  @media (max-width: 640px) {
    .recommendation-journey-comparison {
      align-items: flex-start;
      flex-direction: column;
    }
  }
</style>
'''
save(FILES["route"], original, text)

# Activate only the large-dog page
path = root / FILES["target"]
text = path.read_text(encoding="utf-8")
original = text
if "recommendationJourney:" not in text:
    config = '''recommendationJourney:
  mode: "filtered"
  animal: "dog"
  petSize: "large"
  comparisonHref: "/vergleiche/beste-futterautomaten-fuer-hunde/"
  comparisonLabel: "Futterautomaten für große Hunde vergleichen"
  emptyTitle: "Aktuell keine uneingeschränkte Top-Empfehlung"
  emptyText: "Die derzeit eingeordneten Modelle sind überwiegend für Katzen sowie kleine bis mittelgroße Hunde dokumentiert. Für große Hunde müssen maximale Ausgabe, Krokettengröße, Napf und Standfestigkeit individuell geprüft werden."
'''
    text = replace_once(text, "comparisonRecommendation:\n", config + "comparisonRecommendation:\n", "Zielseite")
save(FILES["target"], original, text)

print("Recommendation Journey 2.0.1 erfolgreich angewendet.")
print("Backup:", backup_root)
print("Geänderte Dateien:", len(changed))
for item in changed:
    print("-", item)
print("\nJetzt ausführen:")
print("  npm run build:pfotentechnik")
print("  npm --workspace apps/pfotentechnik run audit:repository")
