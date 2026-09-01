import type { ImageMetadata } from "astro";

export type CategoryMedia = {
  src: ImageMetadata | string;
  alt?: string;
};

export type CategoryRequirement = {
  label: string;
  question: string;
  consequence: string;
};

export type CategoryDecisionPath = {
  label: string;
  title: string;
  text: string;
  href: string;
  cta: string;
};

export type CategoryComparison = {
  title: string;
  question: string;
  text: string;
  href: string;
  itemCount: number;
};

export type CategoryProduct = {
  slug: string;
  role: string;
  title: string;
  manufacturer: string;
  reason: string;
  suitability?: string;
  href: string;
  score: number;
  price?: string;
  image?: CategoryMedia;
};

export type CategoryGuide = {
  title: string;
  text: string;
  href: string;
};

export type CategoryEvidenceSection = {
  title: string;
  paragraphs: string[];
};

export type CategoryExperienceModel = {
  slug: string;
  eyebrow: string;
  title: string;
  orientation: string;
  cue: string;
  heroImage?: CategoryMedia;
  heroAlt: string;
  requirements: CategoryRequirement[];
  paths: CategoryDecisionPath[];
  comparisons: CategoryComparison[];
  products: CategoryProduct[];
  guides: CategoryGuide[];
  evidenceIntro: string;
  evidenceSections: CategoryEvidenceSection[];
  closing: {
    title: string;
    text: string;
    href: string;
    label: string;
  };
};
