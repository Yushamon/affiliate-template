import type { ImageMetadata } from "astro";

export type HomeImage = {
  src: ImageMetadata | string;
  alt?: string;
};

export type HomeLink = {
  label: string;
  href: string;
};

export type HomeEditorialCard = {
  href: string;
  label: string;
  title: string;
  text: string;
  image?: HomeImage;
  meta?: string;
  action: string;
};

export type HomeCategoryCard = {
  code: string;
  title: string;
  text: string;
  href: string;
  count: number;
  image?: HomeImage;
};

export type HomeProductCard = {
  href: string;
  title: string;
  manufacturer: string;
  image: HomeImage;
};

export type HomeUseCase = {
  title: string;
  text: string;
  href: string;
  icon: "bowl" | "drop" | "location" | "door" | "camera" | "litter";
};

export type HomeDecisionCard = {
  href: string;
  label: string;
  title: string;
  text: string;
  image?: HomeImage;
  itemCount: number;
  updatedLabel?: string;
};

export type HomepageModel = {
  hero: {
    eyebrow: string;
    title: string;
    text: string;
    image: HomeImage;
    primaryAction: HomeLink;
    secondaryAction: HomeLink;
    signals: string[];
    stats: Array<{
      value: string;
      label: string;
    }>;
  };
  decisionComparisons: HomeDecisionCard[];
  categories: HomeCategoryCard[];
  guides: HomeEditorialCard[];
  products: HomeProductCard[];
  methods: Array<{
    number: string;
    title: string;
    text: string;
  }>;
  methodologyAction: HomeLink;
  useCases: HomeUseCase[];
};
