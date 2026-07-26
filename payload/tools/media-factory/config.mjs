export const CONFIG = {
  version: "2.1.0-free",
  appRoot: "apps/pfotentechnik",
  quality: 84,
  variants: {
    hero: { width: 1600, height: 1000, scene: "Premium bright studio hero, three-quarter front view, soft commercial lighting, clean light background, subtle shadow." },
    thumbnail: { width: 720, height: 720, scene: "Compact isolated catalog thumbnail, centered product, very light background, maximum shape recognition." },
    comparison: { width: 900, height: 720, scene: "Neutral comparison-card image, centered product, consistent scale, no props." },
    "gallery-1": { width: 1400, height: 1000, scene: "Close product view emphasizing body, controls, materials and construction." },
    "gallery-2": { width: 1400, height: 1000, scene: "Realistic premium home-use context, device fully visible and correctly scaled." },
    "gallery-3": { width: 1400, height: 1000, scene: "Functional detail view showing the most important differentiating hardware feature." }
  },
  sourceWeights: { user: 100, manufacturer: 96, amazon: 90, existing: 82, generated: 75 },
  outputCandidates: ["public/images/products", "src/assets/images/products", "src/assets/products"]
};
