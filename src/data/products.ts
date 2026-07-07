import type { Product } from "./product-data/types";

import ecoflowStreamUltra from "./product-data/ecoflow-stream-ultra";
import ankerSolixSolarbank3Pro from "./product-data/anker-solix-solarbank-3-pro";
import zendureSolarflow from "./product-data/zendure-solarflow";
import solakonOne from "./product-data/solakon-one";

export const products = {
  "ecoflow-stream-ultra": ecoflowStreamUltra,
  "anker-solix-solarbank-3-pro": ankerSolixSolarbank3Pro,
  "zendure-solarflow": zendureSolarflow,
  "solakon-one": solakonOne
} satisfies Record<string, Product>;

export type ProductKey = keyof typeof products;

export function getProductsByTag(
  tag: string,
  limit = 4
) {
  return Object.entries(products)
    .filter(([, product]) =>
      product.recommendationTags.includes(tag)
    )
    .sort(
      ([, a], [, b]) =>
        a.priority - b.priority
    )
    .slice(0, limit)
    .map(([key, product]) => ({
      key: key as ProductKey,
      product
    }));
}

export function getProductsByManufacturer(
  manufacturer: Product["manufacturer"]
) {
  return Object.entries(products)
    .filter(([, product]) =>
      product.manufacturer === manufacturer
    )
    .sort(
      ([, a], [, b]) =>
        a.priority - b.priority
    )
    .map(([key, product]) => ({
      key: key as ProductKey,
      product
    }));
}