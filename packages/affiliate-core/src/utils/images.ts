interface ImageFallbackOptions<Key extends string> {
  image?: string;
  imageKey?: Key | null;
  getFallback: (key: Key) => string;
}

export const resolveImage = <Key extends string>({
  image,
  imageKey,
  getFallback
}: ImageFallbackOptions<Key>) =>
  image ?? (imageKey ? getFallback(imageKey) : null);
