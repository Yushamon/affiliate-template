import {
  defineCollection,
  type ImageFunction
} from "astro:content";

import {
  glob
} from "astro/loaders";

import { z } from "astro/zod";

import {
  baseContentSchema
} from "./base";

import {
  faqSchema,
  createImageSchema
} from "./shared";

const productManufacturerSchema =
  z.object({
    key: z.string(),
    name: z.string(),
    slug: z.string(),
    href: z.string().optional()
  });

const productCategorySchema =
  z.object({
    key: z.string(),
    label: z.string(),
    path: z.string().optional()
  });

const createProductImagesSchema = (image: ImageFunction) => {
  const imageSchema = createImageSchema(image);

  return z.object({
    hero: imageSchema,

    thumbnail:
      imageSchema.optional(),

    comparison:
      imageSchema.optional(),

    gallery: z
      .array(imageSchema)
      .default([])
  });
};

const productAffiliateSchema =
  z.object({
    provider: z
      .string()
      .optional(),

    label: z
      .string()
      .default(
        "Aktuellen Preis prüfen"
      ),

    url: z.string(),

    rel: z
      .string()
      .default(
        "sponsored nofollow noopener"
      ),

    target: z
      .enum([
        "_blank",
        "_self"
      ])
      .default("_blank")
  });

const productConversionSchema =
  z.object({
    badge: z
      .enum([
        "testsieger",
        "top-empfehlung",
        "preis-leistungs-tipp",
        "premium-tipp",
        "spezialempfehlung",
        "none"
      ])
      .default("none"),

    primaryCtaLabel: z
      .string()
      .optional(),

    secondaryCtaLabel: z
      .string()
      .default(
        "Preis und Verfügbarkeit prüfen"
      ),

    showSecondaryCta: z
      .boolean()
      .default(true)
  })
  .optional();



const productPriceSourceSchema =
  z.object({
    id: z.string(),
    label: z.string(),
    type: z
      .enum([
        "merchant",
        "affiliate",
        "editorial",
        "manual",
        "unknown"
      ])
      .default("unknown"),
    url: z.string().url().optional()
  });

const productPriceRangeSchema =
  z.object({
    min: z.number().nonnegative(),
    max: z.number().nonnegative(),
    sampleSize: z.number().int().nonnegative(),
    generatedAt: z.coerce.date().optional(),
    source: z.literal("category-engine").default("category-engine")
  });

const productPriceSchema =
  z.object({
    current: z.number().positive().nullable().default(null),
    currency: z.string().length(3).default("EUR"),
    status: z
      .enum([
        "cheap",
        "fair",
        "expensive",
        "unknown"
      ])
      .default("unknown"),
    range: productPriceRangeSchema.optional(),
    comparisonText: z.string().optional(),
    checkedAt: z.coerce.date().optional(),
    affiliateUrl: z.string().url().optional(),
    source: productPriceSourceSchema.optional()
  })
  .default({
    current: null,
    currency: "EUR",
    status: "unknown"
  });

const productPriceStateSchema = z.enum([
  "available",
  "unknown",
  "removed",
  "stale"
]);

const productAvailabilitySchema = z.enum([
  "available",
  "temporarily-unavailable",
  "out-of-stock",
  "discontinued",
  "unknown"
]);

const productRecommendationStatusSchema = z.enum([
  "recommended",
  "limited",
  "archived"
]);

const productEditorialStatusSchema = z.enum([
  "complete",
  "recommended",
  "required",
  "archived"
]);

const productMaintenanceStatusSchema = z.enum([
  "complete",
  "recommended",
  "required",
  "archived"
]);

const productEditorialSchema =
  z.object({
    assessmentType: z
      .enum([
        "hands-on-test",
        "editorial-review",
        "data-review"
      ])
      .default("editorial-review"),

    evidence: z
      .array(
        z.enum([
          "hands-on-testing",
          "manufacturer-documentation",
          "technical-specifications",
          "comparative-analysis",
          "user-feedback"
        ])
      )
      .default([
        "manufacturer-documentation",
        "technical-specifications",
        "comparative-analysis"
      ]),

    testedHandsOn: z
      .boolean()
      .default(false),

    lastVerifiedAt: z
      .coerce
      .date()
      .optional(),

    note: z
      .string()
      .optional()
  })
  .optional();

const productExternalRatingSchema = z.object({
  value: z.number().nonnegative(),
  scale: z.number().positive()
});

const productProfessionalReviewSchema = z.object({
  publisher: z.string().min(1),
  title: z.string().optional(),
  url: z.string().url(),
  publishedAt: z.coerce.date().optional(),
  checkedAt: z.coerce.date(),
  methodology: z.enum(["hands-on","lab-test","editorial-review","unknown"]).default("unknown"),
  rating: productExternalRatingSchema.optional(),
  positives: z.array(z.string()).default([]),
  negatives: z.array(z.string()).default([]),
  findings: z.array(z.string()).default([])
});

const productUserReviewSourceSchema = z.object({
  platform: z.string().min(1),
  url: z.string().url(),
  checkedAt: z.coerce.date(),
  rating: z.number().nonnegative().optional(),
  scale: z.number().positive().default(5),
  reviewCount: z.number().int().nonnegative().optional(),
  recurringPositives: z.array(z.string()).default([]),
  recurringCriticism: z.array(z.string()).default([])
});

const productEvidenceConsensusItemSchema = z.object({
  finding: z.string().min(1),
  sourceCount: z.number().int().positive(),
  confidence: z.enum(["high","medium","low"]).default("medium"),
  assessment: z.string().optional()
});

const productExternalEvidenceSchema = z.object({
  professionalReviews: z.array(productProfessionalReviewSchema).default([]),
  userReviews: z.array(productUserReviewSourceSchema).default([]),
  consensus: z.object({
    strengths: z.array(productEvidenceConsensusItemSchema).default([]),
    weaknesses: z.array(productEvidenceConsensusItemSchema).default([]),
    editorialAssessment: z.string().optional()
  }).default({ strengths: [], weaknesses: [] }),
  note: z.string().optional()
}).optional();

const productDecisionSchema =
  z.object({
    bestFor: z
      .array(z.string())
      .default([]),

    attention: z
      .array(z.string())
      .default([])
  });

const productReviewSchema =
  z.object({
    summary: z.string(),
    verdict: z.string()
  });

const productExperienceSchema =
  z.object({
    summary: z.string(),

    positives: z
      .array(z.string())
      .default([]),

    criticism: z
      .array(z.string())
      .default([]),

    support: z
      .string()
      .optional(),

    methodology: z
      .string()
      .optional(),

    maintenance: z
      .string()
      .optional(),

    reliability: z
      .string()
      .optional()
  });

const productSpecSchema =
  z.object({
    label: z.string(),

    value: z.union([
      z.string(),
      z.number(),
      z.boolean()
    ])
  });

const decisionDepthStatusSchema = z.enum([
  "supported",
  "conditional",
  "unavailable",
  "unknown",
  "notApplicable"
]);

const productHealthCapabilitiesSchema = z.object({
  activity: decisionDepthStatusSchema,
  sleep: decisionDepthStatusSchema,
  restingHeartRate: decisionDepthStatusSchema,
  restingRespiratoryRate: decisionDepthStatusSchema,
  scratching: decisionDepthStatusSchema,
  barking: decisionDepthStatusSchema,
  otherBehavior: z.array(z.string().min(1)).default([]),
  healthAlerts: decisionDepthStatusSchema,
  baselineDaysRequired: z.number().int().nonnegative().optional(),
  medicalDeviceStatus: z.enum(["notMedicalDevice", "wellnessOnly", "unknown"]),
  sourceUrl: z.string().url().optional(),
  sourceType: z.enum(["manufacturer", "manual", "support"]).optional(),
  verifiedAt: z.coerce.date().optional()
}).superRefine((value, context) => {
  const claimed = [value.activity, value.sleep, value.restingHeartRate, value.restingRespiratoryRate,
    value.scratching, value.barking, value.healthAlerts].some((status) => !["unknown", "notApplicable"].includes(status));
  if (claimed && (!value.sourceUrl || !value.sourceType || !value.verifiedAt)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Belegte Gesundheitsfunktionen benötigen sourceUrl, sourceType und verifiedAt."
    });
  }
}).optional();

const productGpsSchema =
  z.object({
    animal: z.array(z.enum(["dog", "cat"])).min(1),
    minimumPetWeightKg: z.number().nonnegative().optional(),
    maximumPetWeightKg: z.number().positive().optional(),
    deviceWeightGrams: z.number().positive().optional(),
    totalWeightGrams: z.number().positive().optional(),
    weightBasis: z.enum(["device", "including-collar", "system"]).default("device"),
    subscriptionRequired: z.boolean(),
    includedServiceMonths: z.number().int().nonnegative().default(0),
    transmission: z.enum(["lte", "vhf", "bluetooth", "other"]),
    batteryMaxDays: z.number().positive().optional(),
    batteryCondition: z.string().optional(),
    waterproofRating: z.string().optional(),
    liveTracking: z.boolean().default(false),
    virtualFence: z.boolean().default(false),
    activityTracking: z.boolean().default(false),
    healthCapabilities: productHealthCapabilitiesSchema,
    attachmentType: z.enum([
      "clip",
      "collar",
      "safety-collar",
      "collar-attachment",
      "harness",
      "other"
    ]).optional()
  })
  .optional();

const productFailureModeStatusSchema = z.enum([
  "supported",
  "partial",
  "unavailable",
  "unknown",
  "notApplicable"
]);

const productFailureFunctionSchema = z.object({
  localRecording: productFailureModeStatusSchema.optional(),
  detection: productFailureModeStatusSchema.optional(),
  playback: productFailureModeStatusSchema.optional(),
  remoteAccess: productFailureModeStatusSchema.optional(),
  notifications: productFailureModeStatusSchema.optional(),
  lanAccess: productFailureModeStatusSchema.optional(),
  localSchedule: productFailureModeStatusSchema.optional(),
  cooling: productFailureModeStatusSchema.optional()
}).optional();

const productFailureModeSchema = z
  .object({
    status: productFailureModeStatusSchema,
    behavior: z.string().min(1),
    sourceUrl: z.string().url().optional(),
    sourceType: z.enum(["manufacturer", "manual", "support"]).optional(),
    verifiedAt: z.coerce.date().optional(),
    functions: productFailureFunctionSchema
  })
  .superRefine((value, context) => {
    const sourcedClaim = !["unknown", "notApplicable"].includes(value.status);
    if (sourcedClaim && (!value.sourceUrl || !value.sourceType || !value.verifiedAt)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Belegte Failure-Mode-Claims benötigen sourceUrl, sourceType und verifiedAt."
      });
    }
  });

const productFailureModesSchema = z
  .object({
    powerOutage: productFailureModeSchema.optional(),
    wifiOutage: productFailureModeSchema.optional(),
    internetOutage: productFailureModeSchema.optional(),
    cloudOutage: productFailureModeSchema.optional(),
    mechanicalBlock: productFailureModeSchema.optional()
  })
  .optional();

const decisionClaimStatusSchema = z.enum([
  "supported",
  "conditional",
  "notSupported",
  "unknown",
  "notApplicable"
]);

const litterCompatibilityEntrySchema = z.object({
  status: decisionClaimStatusSchema,
  condition: z.string().min(1).optional()
});

const productLitterCompatibilitySchema = z.object({
  bentoniteClumping: litterCompatibilityEntrySchema.optional(),
  tofu: litterCompatibilityEntrySchema.optional(),
  plantBased: litterCompatibilityEntrySchema.optional(),
  woodPellets: litterCompatibilityEntrySchema.optional(),
  crystal: litterCompatibilityEntrySchema.optional(),
  nonClumping: litterCompatibilityEntrySchema.optional(),
  evidenceSourceUrls: z.array(z.string().url()).default([])
}).optional();

const multiPetCapabilityStatusSchema = z.enum([
  "supported",
  "partial",
  "unavailable",
  "unknown",
  "notApplicable"
]);

const productMultiPetSchema = z.object({
  sharedUse: multiPetCapabilityStatusSchema,
  identificationMethods: z.array(z.enum([
    "microchip",
    "rfidTag",
    "weight",
    "cameraAi",
    "other",
    "none",
    "unknown"
  ])).min(1),
  individualProfiles: multiPetCapabilityStatusSchema.optional(),
  individualAccess: multiPetCapabilityStatusSchema.optional(),
  individualFeeding: multiPetCapabilityStatusSchema.optional(),
  individualUsageData: multiPetCapabilityStatusSchema.optional(),
  identitiesStored: z.number().int().positive().optional(),
  identifiesPresence: multiPetCapabilityStatusSchema.optional(),
  identifiesIndividual: multiPetCapabilityStatusSchema.optional(),
  controlsAccess: multiPetCapabilityStatusSchema.optional(),
  attributesUsage: multiPetCapabilityStatusSchema.optional(),
  attributesHealthData: multiPetCapabilityStatusSchema.optional(),
  individualRules: multiPetCapabilityStatusSchema.optional(),
  individualSchedules: multiPetCapabilityStatusSchema.optional(),
  similarPetLimitation: z.object({
    status: z.enum(["documented", "noneDocumented", "unknown"]),
    description: z.string().min(1)
  }).optional(),
  evidenceSourceUrls: z.array(z.string().url()).default([])
}).superRefine((value, context) => {
  const identifies = value.identificationMethods.some((method) =>
    !["none", "unknown"].includes(method)
  );
  if (!identifies && [value.individualAccess, value.individualFeeding, value.individualUsageData]
    .some((status) => status === "supported")) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Individuelle Multi-Pet-Funktionen benötigen eine belegte Identifikationsmethode."
    });
  }
}).optional();

const productDecisionDepthClaimSchema = z.object({
  status: decisionDepthStatusSchema,
  detail: z.string().min(1),
  sourceUrl: z.string().url().optional(),
  sourceType: z.enum(["manufacturer", "manual", "support"]).optional(),
  verifiedAt: z.coerce.date().optional()
}).superRefine((value, context) => {
  if (!["unknown", "notApplicable"].includes(value.status)
    && (!value.sourceUrl || !value.sourceType || !value.verifiedAt)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Belegte Decision-Depth-Claims benötigen sourceUrl, sourceType und verifiedAt."
    });
  }
});

const productDispensingPrecisionSchema = z.object({
  status: z.enum(["documented", "partial", "unknown", "notApplicable"]),
  portionUnit: z.enum(["portion", "milliliter", "cup", "unknown"]),
  nominalPortionGrams: z.number().positive().optional(),
  nominalPortionMilliliters: z.number().positive().optional(),
  minimumPortionsPerDispense: z.number().int().positive().optional(),
  maximumPortionsPerDispense: z.number().int().positive().optional(),
  portionIsApproximate: z.boolean().optional(),
  kibbleDependency: productDecisionDepthClaimSchema.optional(),
  fillLevelDependency: productDecisionDepthClaimSchema.optional(),
  integratedScale: productDecisionDepthClaimSchema.optional(),
  calibrationSupported: productDecisionDepthClaimSchema.optional(),
  dualBowlDistribution: z.object({
    mechanism: z.enum(["mechanicalSplit", "independentOutput", "unknown"]),
    adjustableSplitRatio: productDecisionDepthClaimSchema,
    individualPortioning: productDecisionDepthClaimSchema
  }).optional(),
  sourceUrl: z.string().url().optional(),
  sourceType: z.enum(["manufacturer", "manual", "support"]).optional(),
  verifiedAt: z.coerce.date().optional()
}).superRefine((value, context) => {
  if (["documented", "partial"].includes(value.status)
    && (!value.sourceUrl || !value.sourceType || !value.verifiedAt)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Belegte Portionierdaten benötigen sourceUrl, sourceType und verifiedAt."
    });
  }
}).optional();

const productRepairabilitySchema = z.object({
  parts: z.array(z.object({
    type: z.enum(["pump", "motor", "door", "frame", "lock", "seal", "liner", "filter", "base", "other"]),
    status: decisionDepthStatusSchema,
    officialPart: z.boolean().optional(),
    partNumber: z.string().min(1).optional(),
    replaceableWithoutTools: z.boolean().optional(),
    detail: z.string().min(1),
    sourceUrl: z.string().url().optional(),
    sourceType: z.enum(["manufacturer", "manual", "support"]).optional(),
    verifiedAt: z.coerce.date().optional()
  }).superRefine((value, context) => {
    if (!["unknown", "notApplicable"].includes(value.status)
      && (!value.sourceUrl || !value.sourceType || !value.verifiedAt)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Belegte Ersatzteilangaben benötigen sourceUrl, sourceType und verifiedAt."
      });
    }
  })).min(1),
  warrantyNote: z.string().min(1).optional()
}).optional();

const productDataPortabilitySchema = z.object({
  history: productDecisionDepthClaimSchema.optional(),
  historyRetentionDays: z.number().positive().optional(),
  export: productDecisionDepthClaimSchema.optional(),
  exportFormats: z.array(z.string().min(1)).default([]),
  localDownload: productDecisionDepthClaimSchema.optional(),
  cloudRetention: productDecisionDepthClaimSchema.optional(),
  postSubscriptionAccess: productDecisionDepthClaimSchema.optional(),
  deviceMigration: productDecisionDepthClaimSchema.optional(),
  sharedAccess: productDecisionDepthClaimSchema.optional(),
  maximumUsers: z.number().int().positive().optional(),
  simultaneousStreams: z.number().int().positive().optional()
}).optional();

const productSensorLimitsSchema = z.object({
  minimumOperationalWeightKg: z.number().nonnegative().optional(),
  automaticModeMinimumWeightKg: z.number().nonnegative().optional(),
  baselineDaysRequired: z.number().int().nonnegative().optional(),
  calibrationRequirement: productDecisionDepthClaimSchema.optional(),
  environmentDependency: productDecisionDepthClaimSchema.optional(),
  identificationLimitation: productDecisionDepthClaimSchema.optional(),
  belowMinimumBehavior: z.enum(["manualOnly", "automationDisabled", "unknown", "notApplicable"]).optional(),
  sourceUrl: z.string().url().optional(),
  sourceType: z.enum(["manufacturer", "manual", "support"]).optional(),
  verifiedAt: z.coerce.date().optional()
}).superRefine((value, context) => {
  const hasNumericClaim = value.minimumOperationalWeightKg != null
    || value.automaticModeMinimumWeightKg != null
    || value.baselineDaysRequired != null;
  if (hasNumericClaim && (!value.sourceUrl || !value.sourceType || !value.verifiedAt)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Numerische Sensorgrenzen benötigen sourceUrl, sourceType und verifiedAt."
    });
  }
}).optional();

const productLifecycleDependencySchema = z.object({
  profilePersistence: productDecisionDepthClaimSchema.optional(),
  settingsPersistence: productDecisionDepthClaimSchema.optional(),
  subscriptionTransfer: productDecisionDepthClaimSchema.optional(),
  serviceEndFallback: productDecisionDepthClaimSchema.optional()
}).optional();

const comparisonPrimitiveSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.null()
]);

const comparisonValueSchema: z.ZodType<unknown> = z.lazy(() =>
  z.union([
    comparisonPrimitiveSchema,
    z.array(comparisonPrimitiveSchema),
    z.record(z.string(), comparisonValueSchema)
  ])
);

const comparisonRecordSchema =
  z.record(
    z.string(),
    comparisonValueSchema
  );

const productComparisonDataSchema = z
  .object({
    version: z.literal(1).optional(),
    general: comparisonRecordSchema.optional(),
    feeder: comparisonRecordSchema.optional(),
    fountain: comparisonRecordSchema.optional(),
    gps: comparisonRecordSchema.optional(),
    editorial: comparisonRecordSchema.optional(),
    custom: comparisonRecordSchema.optional()
  })
  .catchall(comparisonValueSchema)
  .optional();

const productComparisonFiltersSchema =
  z.object({
    animal: z
      .array(z.enum(["dog", "cat"]))
      .default([]),

    petSize: z
      .array(z.enum(["small", "medium", "large"]))
      .default([]),

    foodType: z
      .array(
        z.enum([
          "dry",
          "wet"
        ])
      )
      .default([]),

    app: z
      .boolean()
      .optional(),

    camera: z
      .boolean()
      .optional(),

    access: z
      .enum([
        "open",
        "microchip"
      ])
      .optional(),

    backupPower: z
      .boolean()
      .optional(),

    reservoirLiters: z.number().positive().optional(),
    portionGrams: z.number().positive().optional(),
    portionMl: z.number().positive().optional(),
    maxPortionsPerMeal: z.number().int().positive().optional(),
    maxMealGrams: z.number().positive().optional(),
    maxMealMl: z.number().positive().optional(),
    kibbleMaxMm: z.number().positive().optional(),
    manufacturerSizeClaim: z.enum(["large","all-dogs","small-medium","small","max-40cm","cats-small-pets","unknown"]).default("unknown"),
    largeDogFit: z.enum(["technical-fit","conditional","limited","unknown"]).default("unknown"),
    largeDogFitReason: z.string().optional(),

    priceTier: z
      .enum([
        "budget",
        "midrange",
        "premium"
      ])
      .optional()
  })
  .optional()
  .default({
    animal: [],
    petSize: [],
    foodType: []
  });

export const createProductContentSchema = (image: ImageFunction) =>
  baseContentSchema.extend({
    type: z
      .literal("product")
      .default("product"),

    layout: z
      .literal("product")
      .default("product"),

    testStatus: z.enum([
      "hands-on",
      "editorial-review",
      "manufacturer-data",
      "long-term-test",
      "not-tested"
    ]),

    productStatus: z.enum([
      "active",
      "discontinued",
      "legacy",
      "unknown"
    ]),

    recommendation:
      z.string(),

    manufacturer:
      productManufacturerSchema,

    category:
      productCategorySchema,

    productUrl:
      z.string()
      .optional(),

    images:
      createProductImagesSchema(image),

    affiliate:
      productAffiliateSchema
        .optional(),

    conversion:
      productConversionSchema,

    price:
      productPriceSchema,

    priceAutomation: z.enum(["automatic", "editorial"]).default("automatic"),


    priceState: productPriceStateSchema.default("unknown"),
    priceUpdated: z.coerce.date().optional(),
    priceAvailable: z.boolean().default(false),
    affiliateAvailable: z.boolean().default(false),
    availability: productAvailabilitySchema.default("unknown"),
    availabilityReason: z.string().max(500).optional(),
    availabilityUpdated: z.coerce.date().optional(),
    editorialStatus: productEditorialStatusSchema.default("complete"),
    recommendationStatus: productRecommendationStatusSchema.default("limited"),
    maintenanceStatus: productMaintenanceStatusSchema.default("required"),

    editorial:
      productEditorialSchema,
    externalEvidence:
      productExternalEvidenceSchema,
    rating: z
      .number()
      .min(0)
      .max(5),

    score: z
      .number()
      .min(0)
      .max(100)
      .optional(),

    ratings: z
      .record(
        z.string(),
        z
          .number()
          .min(0)
          .max(5)
      )
      .default({}),

    decision:
      productDecisionSchema,

    review:
      productReviewSchema,

    strengths: z
      .array(z.string())
      .default([]),

    weaknesses: z
      .array(z.string())
      .default([]),

    experience:
      productExperienceSchema
        .optional(),

    alternatives: z
      .array(z.string())
      .default([]),

    comparisons: z
      .array(z.string())
      .default([]),

    specs: z
      .array(
        productSpecSchema
      )
      .default([]),

    faq: z
      .array(faqSchema)
      .default([]),

    priceCategory: z
      .enum([
        "budget",
        "midrange",
        "premium"
      ])
      .optional(),

    useCase: z
      .string()
      .optional(),

    capacity: z
      .string()
      .optional(),

    expandable: z
      .union([
        z.string(),
        z.boolean()
      ])
      .optional(),

    features: z
      .array(z.string())
      .default([]),

    gps: productGpsSchema,

    failureModes: productFailureModesSchema,

    litterCompatibility: productLitterCompatibilitySchema,

    multiPet: productMultiPetSchema,

    dispensingPrecision: productDispensingPrecisionSchema,

    repairability: productRepairabilitySchema,

    dataPortability: productDataPortabilitySchema,

    sensorLimits: productSensorLimitsSchema,

    lifecycleDependency: productLifecycleDependencySchema,

    comparisonData:
      productComparisonDataSchema,

    comparisonFilters:
      productComparisonFiltersSchema
  });

export const productsCollection =
  defineCollection({
    loader: glob({
      pattern:
        "**/*.{md,mdx}",

      base:
        "./src/content/products"
    }),

    schema: ({ image }) =>
      createProductContentSchema(image)
  });

export type ProductContentData =
  z.infer<
    ReturnType<typeof createProductContentSchema>
  >;
