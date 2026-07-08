export const projectImages = {
  default: {
    hero: "/images/default/hero.webp",
    guide: "/images/default/guide.webp",
    comparison: "/images/default/comparison.webp",
    decision: "/images/default/decision.webp",
    calculator: "/images/default/calculator.webp",
    faq: "/images/default/faq.webp",
    product: "/images/default/product.webp",
    manufacturer: "/images/default/manufacturer.webp",
    feature: "/images/default/feature.webp",
    inline: "/images/default/inline.webp"
  },

  balkonspeicher: {
    hero: "/images/balkonspeicher/hero.webp",
    guide: "/images/balkonspeicher/guide.webp",
    comparison: "/images/balkonspeicher/comparison.webp",
    decision: "/images/balkonspeicher/decision.webp",
    calculator: "/images/balkonspeicher/calculator.webp",
    faq: "/images/balkonspeicher/faq.webp",
    product: "/images/balkonspeicher/product.webp",
    manufacturer: "/images/balkonspeicher/manufacturer.webp",
    feature: "/images/balkonspeicher/feature.webp",
    inline: "/images/balkonspeicher/inline.webp"
  }
} as const;

export const DEFAULT_PROJECT = "balkonspeicher";

export type ProjectKey = keyof typeof projectImages;

export type ProjectImageKey =
  keyof typeof projectImages.default;

export function getProjectImage(
  project: string = DEFAULT_PROJECT,
  key: ProjectImageKey = "hero"
) {
  const images = projectImages[project as ProjectKey] ?? projectImages.default;

  return images[key] ?? projectImages.default[key];
}
