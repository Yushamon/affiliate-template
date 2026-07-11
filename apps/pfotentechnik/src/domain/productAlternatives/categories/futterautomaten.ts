import {
  products,
  type ProductKey
} from "@app/data/products";

import {
  getWeightedProductScore
} from "@app/data/productScoring";

import {
  DEFAULT_PROJECT,
  getProjectImage
} from "@app/data/projectImages";

import {
  stripLeadingIcon
} from "@affiliate-core/utils/content";

import {
  getProductHeroImage
} from "@affiliate-core/utils/productImages";

import type {
  AlternativeRecommendation
} from "@affiliate-core/components/product/alternativeRecommendation.types";

type ProductFeature = {
  kind: string;
  icon: string;
  headline: string;
  reason: string;
  difference: string;
  terms: string[];
};

const features: ProductFeature[] = [
  {
    kind: "wet-food",
    icon: "🥣",
    headline:
      "Wenn du überwiegend Nassfutter fütterst",
    reason:
      "Dieses Modell ist auf frische oder gekühlte Mahlzeiten ausgelegt.",
    difference:
      "Anders als klassische Trockenfutterautomaten unterstützt dieses Modell die sichere Aufbewahrung von Nassfutter.",
    terms: [
      "nassfutter",
      "wet food",
      "wetfood",
      "gekühlt",
      "kühlung"
    ]
  },
  {
    kind: "access-control",
    icon: "🔐",
    headline:
      "Wenn mehrere Tiere getrennt gefüttert werden sollen",
    reason:
      "Dieses Modell schützt einzelne Portionen vor anderen Tieren im Haushalt.",
    difference:
      "RFID oder Mikrochip ermöglichen einen kontrollierten Zugang zum Futter.",
    terms: [
      "rfid",
      "mikrochip",
      "microchip",
      "zugangskontrolle",
      "futterneid"
    ]
  },
  {
    kind: "camera",
    icon: "📷",
    headline:
      "Wenn du dein Tier aus der Ferne sehen möchtest",
    reason:
      "Dieses Modell bietet zusätzliche Kontrolle durch eine integrierte Kamera.",
    difference:
      "Mahlzeiten und Verhalten lassen sich per Video überprüfen.",
    terms: [
      "kamera",
      "camera",
      "video",
      "livebild",
      "live bild"
    ]
  },
  {
    kind: "app",
    icon: "📱",
    headline:
      "Wenn dir App-Steuerung besonders wichtig ist",
    reason:
      "Dieses Modell eignet sich für flexible Zeitpläne und Steuerung aus der Ferne.",
    difference:
      "Portionen, Zeitpläne und Statusmeldungen lassen sich über das Smartphone verwalten.",
    terms: [
      "app",
      "wlan",
      "wifi",
      "wi-fi",
      "smartphone"
    ]
  },
  {
    kind: "multi-pet",
    icon: "🐾",
    headline:
      "Wenn du mehrere Tiere versorgen möchtest",
    reason:
      "Dieses Modell ist stärker auf Mehrtierhaushalte ausgerichtet.",
    difference:
      "Die Fütterung lässt sich besser auf mehrere Tiere oder getrennte Portionen abstimmen.",
    terms: [
      "mehrere tiere",
      "mehrere katzen",
      "mehrkatzen",
      "mehrtier",
      "zwei näpfe",
      "dual"
    ]
  },
  {
    kind: "compact",
    icon: "↘",
    headline:
      "Wenn du möglichst wenig Stellfläche hast",
    reason:
      "Dieses Modell eignet sich besser für kleinere Wohnbereiche.",
    difference:
      "Die Bauform ist stärker auf Platzersparnis als auf maximale Kapazität ausgelegt.",
    terms: [
      "kompakt",
      "platzsparend",
      "kleine wohnung"
    ]
  },
  {
    kind: "value",
    icon: "💰",
    headline:
      "Wenn dir Preis-Leistung wichtiger ist",
    reason:
      "Dieses Modell konzentriert sich auf die wichtigsten Funktionen ohne unnötige Extras.",
    difference:
      "Du erhältst eine solide Grundausstattung und verzichtest auf einzelne Premiumfunktionen.",
    terms: [
      "preis-leistung",
      "preisleistung",
      "günstig",
      "budget",
      "einsteiger"
    ]
  }
];

const normalizeText = (
  value: unknown
) =>
  String(value ?? "")
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const getArrayText = (
  value: unknown
) =>
  Array.isArray(value)
    ? value
        .map((item) =>
          stripLeadingIcon(
            String(item)
          )
        )
        .join(" ")
    : "";

const getSpecsText = (
  value: unknown
) => {
  if (!Array.isArray(value)) {
    return "";
  }

  return value
    .map((spec) => {
      if (
        !spec ||
        typeof spec !== "object"
      ) {
        return "";
      }

      const record =
        spec as Record<
          string,
          unknown
        >;

      return [
        record.label,
        record.value
      ]
        .filter(Boolean)
        .join(" ");
    })
    .join(" ");
};

const getProductText = (
  productKey: ProductKey
) => {
  const product =
    products[productKey];

  return normalizeText(
    [
      product.name,
      product.category,
      product.useCase,
      product.recommendation,
      product.review?.summary,
      product.review?.verdict,
      getArrayText(
        product.bestFor
      ),
      getArrayText(
        product.notFor
      ),
      getArrayText(
        product.pros
      ),
      getArrayText(
        product.cons
      ),
      getSpecsText(
        product.specs
      )
    ]
      .filter(Boolean)
      .join(" ")
  );
};

const hasFeature = (
  text: string,
  feature: ProductFeature
) =>
  feature.terms.some((term) =>
    text.includes(
      normalizeText(term)
    )
  );

const cleanTags = (
  productKey: ProductKey
) => {
  const product =
    products[productKey];

  if (
    !Array.isArray(
      product.bestFor
    )
  ) {
    return [];
  }

  const ignored =
    new Set([
      "katze",
      "katzen",
      "hund",
      "hunde",
      "haustier",
      "haustiere",
      "haushalt",
      "haushalte"
    ]);

  return product.bestFor
    .map((item) =>
      stripLeadingIcon(
        String(item)
      )
        .replace(
          /^[✓✔☑•]+\s*/,
          ""
        )
        .trim()
    )
    .filter(Boolean)
    .filter(
      (item) =>
        !ignored.has(
          normalizeText(item)
        )
    )
    .slice(0, 3);
};

export const getFutterautomatenAlternatives =
  (
    currentProductKey: ProductKey,
    limit = 3
  ): AlternativeRecommendation[] => {
    const currentProduct =
      products[currentProductKey];

    if (!currentProduct) {
      return [];
    }

    const currentText =
      getProductText(
        currentProductKey
      );

    const candidateKeys =
      (
        Object.keys(
          products
        ) as ProductKey[]
      )
        .filter((candidateKey) => {
          const candidate =
            products[candidateKey];

          return (
            candidateKey !==
              currentProductKey &&
            candidate.category ===
              currentProduct.category
          );
        })
        .sort(
          (a, b) =>
            getWeightedProductScore(b) -
            getWeightedProductScore(a)
        );

    const recommendations: AlternativeRecommendation[] =
      [];

    const usedKinds =
      new Set<string>();

    for (
      const candidateKey
      of candidateKeys
    ) {
      if (
        recommendations.length >=
        limit
      ) {
        break;
      }

      const candidate =
        products[candidateKey];

      const candidateText =
        getProductText(
          candidateKey
        );

      const feature =
        features.find(
          (item) =>
            hasFeature(
              candidateText,
              item
            ) &&
            !hasFeature(
              currentText,
              item
            ) &&
            !usedKinds.has(
              item.kind
            )
        );

      if (!feature) {
        continue;
      }

      recommendations.push({
        productKey:
          candidateKey,

        name:
          candidate.name,

        url:
          candidate.productUrl,

        image:
          getProductHeroImage(
            candidate,
            getProjectImage(
              DEFAULT_PROJECT,
              "product"
            ),
            candidateKey
          ),

        score:
          getWeightedProductScore(
            candidateKey
          ),

        rating:
          candidate.rating,

        icon:
          feature.icon,

        headline:
          feature.headline,

        reason:
          feature.reason,

        difference:
          feature.difference,

        tags:
          cleanTags(
            candidateKey
          )
      });

      usedKinds.add(
        feature.kind
      );
    }

    return recommendations;
  };