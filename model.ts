import type { ImageMetadata } from "astro";

export type HomeImage = { src: ImageMetadata | string; alt?: string };
export type HomeLink = { label: string; href: string };
export type HomeCard = {
  href: string;
  label: string;
  title: string;
  text: string;
  image?: HomeImage;
  meta?: string;
  action: string;
};
export type HomeCategory = HomeCard & { code: string; count: number };
export type HomeProduct = {
  href: string;
  title: string;
  manufacturer: string;
  recommendation: string;
  rating: number;
  image: HomeImage;
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
    stats: Array<{ value: string; label: string }>;
  };
  categories: HomeCategory[];
  comparisons: HomeCard[];
  guides: HomeCard[];
  recentlyUpdated: HomeCard[];
  products: HomeProduct[];
  decisions: HomeLink[];
  methods: Array<{ number: string; title: string; text: string }>;
  methodologyAction: HomeLink;
  topicGroups: Array<{ title: string; links: HomeLink[] }>;
};
