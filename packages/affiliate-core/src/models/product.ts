export interface ProductSpec {
  label: string;
  value: string;
}

export interface ProductRanking {
  overall: number;
  beginner: number;
  premium: number;
  retrofit: number;
  value: number;
}

export interface AffiliateProduct {
  name: string;
  brand: string;
  manufacturer: string;
  category: string;
  badge: string;
  recommendation: string;
  image: string;
  productUrl: string;
  affiliateUrl: string;
  rating: number;
  highlights: string[];
  specs: ProductSpec[];
  useCases: string[];
  ranking?: ProductRanking;
}
