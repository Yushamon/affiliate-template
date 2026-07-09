export interface ProductImageSet {
  hero?: string;
  thumbnail?: string;
  comparison?: string;
  gallery?: string[];
}

export interface ProductWithImages {
  image?: string;
  images?: ProductImageSet;
}

const firstImage = (...candidates: Array<string | undefined>) =>
  candidates.find((candidate) => candidate?.trim()) ?? "";

export function getProductThumbnail(
  product: ProductWithImages,
  fallback: string
) {
  return firstImage(
    product.images?.thumbnail,
    product.images?.comparison,
    product.image,
    fallback
  );
}

export function getProductHeroImage(
  product: ProductWithImages,
  fallback: string
) {
  return firstImage(
    product.images?.hero,
    product.images?.thumbnail,
    product.image,
    fallback
  );
}

export function getProductComparisonImage(
  product: ProductWithImages,
  fallback: string
) {
  return firstImage(
    product.images?.comparison,
    product.images?.thumbnail,
    product.image,
    fallback
  );
}
