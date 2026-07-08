export type ManufacturerKey =
  | "ecoflow"
  | "anker"
  | "zendure"
  | "solakon"
  | "growatt"
  | "marstek"
  | "hoymiles";

export interface Product {
  name: string;
  manufacturer: ManufacturerKey;
  manufacturerLabel: string;
  brand: string;
  category: string;

  capacity: string;
  expandable: string;
  solarInput?: string;
  batteryType?: string;
  app?: string;
  emergencyPower?: string;
  warranty?: string;

  useCase: string;
  recommendation: string;

  productUrl: string;
  affiliateUrl?: string;
  amazonUrl?: string;
  asin?: string;
  merchantLinks?: {
    amazon?: {
      asin?: string;
      url?: string;
      searchQuery?: string;
    };
  };
  image: string;

  rating: number;
  badge: string;

  recommendationTags: string[];
  priority: number;

  highlights: string[];

  verdict: string;
  pros: string[];
  cons: string[];
  bestFor: string[];
  notFor: string[];

  ourOpinion: string;

  ratingCategories: {
    installation: number;
    app: number;
    flexibility: number;
    pricePerformance: number;
    expandability: number;
  };
}
