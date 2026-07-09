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

export interface ResolvedProductImage {
  src: string;
  fallbacks: string[];
}

type ProductImageVariant = "hero" | "thumbnail" | "comparison";

const normalizeImage = (candidate?: string) => candidate?.trim() || undefined;

const getConfiguredImage = (candidate: string | undefined, fallback: string) => {
  const normalizedCandidate = normalizeImage(candidate);

  return normalizedCandidate === normalizeImage(fallback)
    ? undefined
    : normalizedCandidate;
};

const normalizeProductKey = (productKey?: string) => {
  const normalizedKey = productKey?.trim();

  return normalizedKey && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalizedKey)
    ? normalizedKey
    : undefined;
};

const getAutomaticProductImage = (
  productKey: string | undefined,
  variant: ProductImageVariant
) => {
  const normalizedKey = normalizeProductKey(productKey);

  return normalizedKey
    ? `/images/products/${normalizedKey}/${variant}.webp`
    : undefined;
};

const resolveImage = (
  ...candidates: Array<string | undefined>
): ResolvedProductImage => {
  const uniqueCandidates = Array.from(
    new Set(candidates.map(normalizeImage).filter((candidate): candidate is string => Boolean(candidate)))
  );

  return {
    src: uniqueCandidates[0] ?? "",
    fallbacks: uniqueCandidates.slice(1)
  };
};

export function getProductThumbnail(
  product: ProductWithImages,
  fallback: string,
  productKey?: string
): ResolvedProductImage {
  return resolveImage(
    getConfiguredImage(product.images?.thumbnail, fallback),
    getAutomaticProductImage(productKey, "thumbnail"),
    product.image,
    fallback
  );
}

export function getProductHeroImage(
  product: ProductWithImages,
  fallback: string,
  productKey?: string
): ResolvedProductImage {
  return resolveImage(
    getConfiguredImage(product.images?.hero, fallback),
    getAutomaticProductImage(productKey, "hero"),
    product.image,
    fallback
  );
}

export function getProductComparisonImage(
  product: ProductWithImages,
  fallback: string,
  productKey?: string
): ResolvedProductImage {
  return resolveImage(
    getConfiguredImage(product.images?.comparison, fallback),
    getAutomaticProductImage(productKey, "comparison"),
    product.image,
    fallback
  );
}

export function getProductGallery(
  product: ProductWithImages,
  productKey?: string
): string[] {
  const configuredGallery = product.images?.gallery
    ?.map(normalizeImage)
    .filter((image): image is string => Boolean(image));

  if (configuredGallery?.length) {
    return Array.from(new Set(configuredGallery));
  }

  const normalizedKey = normalizeProductKey(productKey);

  return normalizedKey
    ? [1, 2, 3].map(
        (index) => `/images/products/${normalizedKey}/gallery-${index}.webp`
      )
    : [];
}
