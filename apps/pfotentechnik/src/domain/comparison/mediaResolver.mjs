/**
 * Generic comparison media resolution.
 *
 * Content collections emit image metadata in a few compatible shapes
 * (plain strings, Astro metadata, and nested metadata after serialization).
 * Keep the priority in one place so an automatically selected product never
 * needs a slug-specific media branch in a renderer.
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

/**
 * Product media has one semantic priority everywhere it is rendered as a
 * compact decision image.  The resolver deliberately returns the original
 * metadata object: Astro consumers can then keep its verified asset contract
 * instead of reconstructing a raw `src`/`srcset` pair downstream.
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
