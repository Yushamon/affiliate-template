/**
 * Canonical product-media resolution for every PfotenTechnik experience.
 *
 * Content collections emit image metadata in a few compatible shapes
 * (plain strings, Astro metadata, and nested metadata after serialization).
 * Priority and fallback semantics live here so page renderers never need
 * slug-specific media branches.
 */
const sourceOf = (value) => {
  if (typeof value === "string") return value.trim() || undefined;
  if (!value || typeof value !== "object") return undefined;
  const source = value.src;
  if (typeof source === "string") return source.trim() || undefined;
  if (source && typeof source === "object") return sourceOf(source);
  return undefined;
};

export const resolveMediaSource = (media) => sourceOf(media);

const imageMetadataOf = (media) => {
  if (!media || typeof media !== "object") return undefined;
  const candidate = media.src && typeof media.src === "object"
    ? media.src
    : media;
  return typeof candidate.src === "string" &&
    Number(candidate.width) > 0 &&
    Number(candidate.height) > 0
      ? candidate
      : undefined;
};

export const isResolvedProductImage = (media) => Boolean(imageMetadataOf(media));

/**
 * Hero media must be backed by verified Astro image metadata. Raw strings can
 * look plausible while still producing a missing production asset.
 */
export const resolveProductHeroMedia = (images) => {
  const candidates = [
    { role: "hero", media: images?.hero },
    ...(Array.isArray(images?.gallery) ? images.gallery : images?.gallery ? [images.gallery] : [])
      .map((media) => ({ role: "gallery", media })),
    { role: "comparison", media: images?.comparison },
    { role: "thumbnail", media: images?.thumbnail }
  ];

  for (const candidate of candidates) {
    if (!isResolvedProductImage(candidate.media)) continue;
    return {
      ...candidate,
      fallback: candidate.role !== "hero"
    };
  }

  return undefined;
};

/**
 * Compact product media has one priority across Product, Comparison, Category,
 * Manufacturer, Guide and Homepage consumers.
 */
export const resolveProductMedia = (images) => {
  for (const key of ["comparison", "thumbnail", "hero"]) {
    const media = images?.[key];
    if (sourceOf(media)) return media;
  }

  const gallery = Array.isArray(images?.gallery)
    ? images.gallery
    : images?.gallery
      ? [images.gallery]
      : [];

  return gallery.find((media) => sourceOf(media));
};

export const resolveComparisonProductImage = resolveProductMedia;
