export type ProductCoverage = {
  repositoryProducts: number;
  decisionRolesCovered: number;
  decisionRolesTotal: number;
  decisionProductSlugs: string[];
  confirmedAGaps: string[];
  bBacklog: string[];
  source: "editorial-static";
  validatedAt: string;
};

type EditorialCoverage = Omit<ProductCoverage, "repositoryProducts" | "decisionRolesCovered" | "decisionRolesTotal" | "source">;

// Redaktionell validierte Markt-Coverage, keine SERP-, Volumen- oder Scraping-Metrik.
export const PRODUCT_COVERAGE: Record<string, EditorialCoverage> = {
  futterautomaten: {
    decisionProductSlugs: [
      "petlibro-granary-wifi-feeder", "petkit-fresh-element-solo", "xiaomi-smart-pet-food-feeder-2",
      "cat-mate-c500", "surefeed-microchip-pet-feeder-connect", "oneisall-5l-automatic-cat-feeder",
      "oneisall-2-in-1-feeder-water", "petlibro-air-wifi-feeder",
    ],
    confirmedAGaps: [],
    bBacklog: [],
    validatedAt: "2026-08-16",
  },
  katzentoiletten: {
    decisionProductSlugs: [
      "neakasa-m1-lite", "devoko-90l-automatisches-katzenklo", "petlibro-luma-smart-litter-box",
      "petkit-purobot-max-pro-2", "petkit-purobot-max-3", "petsnowy-snow-plus", "petkit-puramax-2",
      "litter-robot-4", "litter-robot-5-pro",
    ],
    confirmedAGaps: [],
    bBacklog: ["MOVA LR10 Prime", "Furbulous Box", "CATLINK", "PetSafe SmartSpin"],
    validatedAt: "2026-08-16",
  },
  "gps-tracker": {
    decisionProductSlugs: [
      "tractive-dog-6", "weenect-xs", "paj-pet-finder-4g-mini", "tractive-dog-6-xl", "weenect-xt",
      "garmin-alpha-t-20", "enabot-rola-pettracker", "invoxia-biotracker-2026", "prothelis-area-pets", "pawfit-3",
    ],
    confirmedAGaps: [],
    bBacklog: ["Lildog"],
    validatedAt: "2026-08-16",
  },
  katzenklappen: {
    decisionProductSlugs: [
      "sureflap-mikrochip-katzenklappe", "sureflap-dualscan-mikrochip-katzenklappe",
      "sureflap-mikrochip-katzenklappe-connect", "petsafe-mikrochip-katzenklappe",
      "petsafe-petporte-smart-flap", "onlycat-mikrochip-katzenklappe", "petwalk-medium-tiertuer",
      "cat-mate-elite-355w",
    ],
    confirmedAGaps: [],
    bBacklog: ["Ferplast Swing Microchip"],
    validatedAt: "2026-08-16",
  },
  trinkbrunnen: {
    decisionProductSlugs: [
      "petkit-eversweet-solo-2-fountain", "oneisall-3-2l-cordless-fountain", "petlibro-dockstream-2-smart",
      "petlibro-dockstream-2-smart-cordless", "petkit-eversweet-max-2-uvc", "petkit-eversweet-ultra",
      "petlibro-stainless-steel-fountain", "cat-mate-335-pet-fountain", "petkit-eversweet-3-pro-uvc",
      "catit-pixi-smart-trinkbrunnen", "petsafe-streamside-trinkbrunnen",
    ],
    confirmedAGaps: [],
    bBacklog: ["AstroPet Poseidon"],
    validatedAt: "2026-08-16",
  },
  haustierkameras: {
    decisionProductSlugs: [
      "petlibro-scout-smart-camera", "furbo-mini-360", "enabot-rola-mini", "pettec-cam-360", "reolink-e1-zoom",
    ],
    confirmedAGaps: [],
    bBacklog: ["Petcube Cam"],
    validatedAt: "2026-08-16",
  },
};

export function buildProductCoverage(clusterId: string, repositoryProducts: number): ProductCoverage | undefined {
  const coverage = PRODUCT_COVERAGE[clusterId];
  if (!coverage) return undefined;
  return {
    ...coverage,
    repositoryProducts,
    decisionRolesCovered: coverage.decisionProductSlugs.length,
    decisionRolesTotal: coverage.decisionProductSlugs.length + coverage.confirmedAGaps.length,
    source: "editorial-static",
  };
}
