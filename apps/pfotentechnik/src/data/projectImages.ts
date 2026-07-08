const defaultImages = {
  hero: "/images/project/pfotentechnik/hero.webp",
  feature: "/images/project/pfotentechnik/feature.webp",
  inline: "/images/project/pfotentechnik/inline.webp",
  comparison: "/images/project/pfotentechnik/comparison.webp",
  guide: "/images/project/pfotentechnik/guide.webp",
  faq: "/images/project/pfotentechnik/faq.webp",
  product: "/images/project/pfotentechnik/product.webp",
  category: "/images/project/pfotentechnik/category.webp",
  decision: "/images/project/pfotentechnik/feature.webp",
  calculator: "/images/project/pfotentechnik/inline.webp",
  manufacturer: "/images/project/pfotentechnik/category.webp",
  feederHero: "/images/project/pfotentechnik/feeder-hero.webp",
  feederComparison: "/images/project/pfotentechnik/feeder-comparison.webp",
  feederWetFood: "/images/project/pfotentechnik/feeder-wet-food.webp"
} as const;

export const DEFAULT_PROJECT = "pfotentechnik";

export const projectImages = {
  default: defaultImages,
  pfotentechnik: defaultImages
} as const;

export type ProjectKey = keyof typeof projectImages;
export type ProjectImageKey = keyof typeof defaultImages;

export function getProjectImage(
  project: string = DEFAULT_PROJECT,
  key: ProjectImageKey = "hero"
) {
  const images = projectImages[project as ProjectKey] ?? projectImages.default;

  return images[key] ?? projectImages.default[key];
}
