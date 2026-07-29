import { getImage } from "astro:assets";

type ImageOptions = Parameters<typeof getImage>[0];
type ImageResult = Awaited<ReturnType<typeof getImage>>;

const objectCache = new WeakMap<object, Map<string, Promise<ImageResult>>>();
const stringCache = new Map<string, Promise<ImageResult>>();

const transformKey = (options: ImageOptions): string => {
  const { src: _src, ...transform } = options;
  return JSON.stringify(transform);
};

export const getCachedImage = (options: ImageOptions): Promise<ImageResult> => {
  if (!import.meta.env.PROD) return getImage(options);

  const key = transformKey(options);
  if (typeof options.src === "object" && options.src !== null) {
    let transforms = objectCache.get(options.src);
    if (!transforms) {
      transforms = new Map();
      objectCache.set(options.src, transforms);
    }
    const cached = transforms.get(key);
    if (cached) return cached;
    const created = getImage(options);
    transforms.set(key, created);
    return created;
  }

  const stringKey = `${String(options.src)}\u0000${key}`;
  const cached = stringCache.get(stringKey);
  if (cached) return cached;
  const created = getImage(options);
  stringCache.set(stringKey, created);
  return created;
};
