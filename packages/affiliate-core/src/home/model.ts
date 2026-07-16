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
  recommendation: string;
  rating: number;
  image: HomeImage;
  badge?: string;
};

export type HomeUseCase = {
  title: string;
  text: string;
  href: string;
  icon: "clock" | "cats" | "wet" | "dog" | "cat" | "travel";
};

export type HomeFaqItem = {
  question: string;
  answer: string;
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
  decisionLinks: HomeLink[];
  decisionComparisons: HomeDecisionCard[];
  categories: HomeCategoryCard[];
  comparisons: HomeEditorialCard[];
  guides: HomeEditorialCard[];
  products: HomeProductCard[];
  recentlyUpdated: HomeEditorialCard[];
  methods: Array<{
    number: string;
    title: string;
    text: string;
  }>;
  methodologyAction: HomeLink;
  useCases: HomeUseCase[];
  faq: HomeFaqItem[];
  topicGroups: Array<{
    title: string;
    links: HomeLink[];
  }>;
};
