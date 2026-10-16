# Advisor data coverage — Data normalization 01

As of: 2026-10-05. Products: 103.

All product Markdown records, including inactive. Product fields take precedence over existing structured fountain research. No automatic prose interpretation or schema defaults.

Known / all products for each field. Category totals count product-field observations, not unique products. Explicit false and documented empty dishwasher-safe parts count as known. Partial or conditional capabilities count as unknown, never known.

Percentage = known critical product-field observations / applicable critical observations. NOT_APPLICABLE is excluded from that denominator; UNKNOWN and MISSING_SCHEMA_DATA remain in it. Critical criteria stay unchanged from Phase A. READY requires all products resolved; PARTIAL requires at least one fully resolved product.

UNKNOWN is an explicit unresolved or conditional fact, not a quality error. MISSING_SCHEMA_DATA is absent typed data, not proof that manufacturer research is missing. Installation coverage means some documented installation facts; its subfields show the remaining limits. Litter minimumPetWeight is the automatic-mode boundary; a generic operational minimum never substitutes for it.

| Category | Products | Known | Unknown | N/A | Missing schema data | Readiness |
|---|---:|---:|---:|---:|---:|---:|
| feeder | 38 | 103 | 34 | 0 | 395 | 46% |
| fountain | 24 | 171 | 113 | 2 | 170 | 95% |
| gps | 12 | 82 | 8 | 3 | 51 | 94% |
| catFlap | 10 | 91 | 6 | 0 | 123 | 75% |
| litterBox | 11 | 47 | 18 | 0 | 78 | 59% |
| camera | 8 | 40 | 25 | 2 | 45 | 65% |

## feeder: PARTIAL

Products: 38. Critical fields: animal, foodType, access.

| Field | KNOWN | Coverage | UNKNOWN | NOT_APPLICABLE | MISSING_SCHEMA_DATA | Source |
|---|---:|---:|---:|---:|---:|---|
| animal | 38 | 100% | 0 | 0 | 0 | gps.animal OR comparisonFilters.animal |
| petSize | 34 | 89% | 4 | 0 | 0 | comparisonFilters.petSize |
| foodType | 11 | 29% | 20 | 0 | 7 | comparisonFilters.foodType |
| access | 4 | 11% | 0 | 0 | 34 | comparisonFilters.access |
| app | 4 | 11% | 0 | 0 | 34 | comparisonFilters.app OR comparisonData.fountain.app |
| camera | 3 | 8% | 0 | 0 | 35 | comparisonFilters.camera OR comparisonData.feeder.camera |
| backupPower | 3 | 8% | 0 | 0 | 35 | comparisonFilters.backupPower |
| offlineSchedule | 0 | 0% | 0 | 0 | 38 | failureModes.internetOutage.functions.localSchedule |
| multiPet | 3 | 8% | 1 | 0 | 34 | multiPet.sharedUse |
| failureModes.powerOutage | 1 | 3% | 2 | 0 | 35 | failureModes.powerOutage.status |
| failureModes.wifiOutage | 1 | 3% | 2 | 0 | 35 | failureModes.wifiOutage.status |
| failureModes.internetOutage | 1 | 3% | 2 | 0 | 35 | failureModes.internetOutage.status |
| failureModes.cloudOutage | 0 | 0% | 3 | 0 | 35 | failureModes.cloudOutage.status |
| failureModes.mechanicalBlock | 0 | 0% | 0 | 0 | 38 | failureModes.mechanicalBlock.status |

## fountain: PARTIAL

Products: 24. Critical fields: animal, capacity, material, filter, power.

| Field | KNOWN | Coverage | UNKNOWN | NOT_APPLICABLE | MISSING_SCHEMA_DATA | Source |
|---|---:|---:|---:|---:|---:|---|
| animal | 24 | 100% | 0 | 0 | 0 | gps.animal OR comparisonFilters.animal |
| capacity | 23 | 96% | 0 | 0 | 1 | comparisonData.fountain.capacityLiters |
| material | 22 | 92% | 0 | 0 | 2 | comparisonData.fountain.material |
| filter | 24 | 100% | 0 | 0 | 0 | research/fountain-cost-35.0b.json: data.consumablePolicy.filterPresent |
| filterRequired | 6 | 25% | 17 | 1 | 0 | 35.0B: primary filter required (no main filter = notApplicable) |
| filterCost | 15 | 63% | 8 | 1 | 0 | 35.0B: existing primary-filter cost calculation; 30-day price validity |
| power | 21 | 88% | 3 | 0 | 0 | comparisonData.fountain.powerType (product first; existing 35.0B research fallback) |
| battery | 1 | 4% | 0 | 0 | 23 | comparisonData.fountain.battery |
| batteryRuntime | 9 | 38% | 15 | 0 | 0 | comparisonData.fountain.batteryRuntime (product first; existing 35.0B research fallback) |
| offline | 0 | 0% | 0 | 0 | 24 | failureModes.powerOutage.status |
| dishwasher | 13 | 54% | 11 | 0 | 0 | comparisonData.fountain.dishwasherSafeParts (product first; existing 35.0B research fallback) |
| failureModes.powerOutage | 0 | 0% | 0 | 0 | 24 | failureModes.powerOutage.status |
| failureModes.wifiOutage | 0 | 0% | 0 | 0 | 24 | failureModes.wifiOutage.status |
| failureModes.internetOutage | 0 | 0% | 0 | 0 | 24 | failureModes.internetOutage.status |
| failureModes.cloudOutage | 0 | 0% | 0 | 0 | 24 | failureModes.cloudOutage.status |
| failureModes.mechanicalBlock | 0 | 0% | 0 | 0 | 24 | failureModes.mechanicalBlock.status |
| lowWaterShutdown | 8 | 33% | 16 | 0 | 0 | comparisonData.fountain.lowWaterShutdown (product first; existing 35.0B research fallback) |
| waterLevelVisible | 2 | 8% | 22 | 0 | 0 | comparisonData.fountain.waterLevelVisible (product first; existing 35.0B research fallback) |
| pumpRemovable | 3 | 13% | 21 | 0 | 0 | comparisonData.fountain.pumpRemovable (product first; existing 35.0B research fallback) |

## gps: PARTIAL

Products: 12. Critical fields: animal, minimumPetWeight, deviceWeight, subscription, battery, liveTracking, virtualFence.

| Field | KNOWN | Coverage | UNKNOWN | NOT_APPLICABLE | MISSING_SCHEMA_DATA | Source |
|---|---:|---:|---:|---:|---:|---|
| animal | 12 | 100% | 0 | 0 | 0 | gps.animal OR comparisonFilters.animal |
| minimumPetWeight | 7 | 58% | 2 | 0 | 3 | gps.minimumPetWeightKg |
| deviceWeight | 12 | 100% | 0 | 0 | 0 | gps.deviceWeightGrams |
| subscription | 12 | 100% | 0 | 0 | 0 | gps.subscriptionRequired |
| battery | 12 | 100% | 0 | 0 | 0 | gps.batteryMaxDays |
| liveTracking | 12 | 100% | 0 | 0 | 0 | gps.liveTracking |
| virtualFence | 12 | 100% | 0 | 0 | 0 | gps.virtualFence |
| failureModes.powerOutage | 0 | 0% | 0 | 3 | 9 | failureModes.powerOutage.status |
| failureModes.wifiOutage | 0 | 0% | 3 | 0 | 9 | failureModes.wifiOutage.status |
| failureModes.internetOutage | 3 | 25% | 0 | 0 | 9 | failureModes.internetOutage.status |
| failureModes.cloudOutage | 0 | 0% | 3 | 0 | 9 | failureModes.cloudOutage.status |
| failureModes.mechanicalBlock | 0 | 0% | 0 | 0 | 12 | failureModes.mechanicalBlock.status |

## catFlap: PARTIAL

Products: 10. Critical fields: animal, microchip, individualAccess, installation.

| Field | KNOWN | Coverage | UNKNOWN | NOT_APPLICABLE | MISSING_SCHEMA_DATA | Source |
|---|---:|---:|---:|---:|---:|---|
| animal | 10 | 100% | 0 | 0 | 0 | gps.animal OR comparisonFilters.animal |
| microchip | 9 | 90% | 0 | 0 | 1 | multiPet.identificationMethods OR comparisonFilters.access |
| individualAccess | 3 | 30% | 3 | 0 | 4 | multiPet.individualAccess |
| multiPet | 6 | 60% | 0 | 0 | 4 | multiPet.sharedUse |
| preyDetection | 1 | 10% | 0 | 0 | 9 | comparisonData.custom.preyDetection |
| installation | 8 | 80% | 0 | 0 | 2 | comparisonData.catFlap.installation: at least one documented subfield; partial record does not prove all installation types |
| failureModes.powerOutage | 0 | 0% | 1 | 0 | 9 | failureModes.powerOutage.status |
| failureModes.wifiOutage | 1 | 10% | 0 | 0 | 9 | failureModes.wifiOutage.status |
| failureModes.internetOutage | 1 | 10% | 0 | 0 | 9 | failureModes.internetOutage.status |
| failureModes.cloudOutage | 0 | 0% | 1 | 0 | 9 | failureModes.cloudOutage.status |
| failureModes.mechanicalBlock | 0 | 0% | 1 | 0 | 9 | failureModes.mechanicalBlock.status |
| installation.doorSupported | 7 | 70% | 0 | 0 | 3 | comparisonData.catFlap.installation.doorSupported |
| installation.wallSupported | 6 | 60% | 0 | 0 | 4 | comparisonData.catFlap.installation.wallSupported |
| installation.glassSupported | 6 | 60% | 0 | 0 | 4 | comparisonData.catFlap.installation.glassSupported |
| installation.metalDoorSupported | 0 | 0% | 0 | 0 | 10 | comparisonData.catFlap.installation.metalDoorSupported |
| installation.cutoutWidthMm | 6 | 60% | 0 | 0 | 4 | comparisonData.catFlap.installation.cutoutWidthMm |
| installation.cutoutHeightMm | 6 | 60% | 0 | 0 | 4 | comparisonData.catFlap.installation.cutoutHeightMm |
| installation.roundCutoutDiameterMm | 5 | 50% | 0 | 0 | 5 | comparisonData.catFlap.installation.roundCutoutDiameterMm |
| installation.passageWidthMm | 7 | 70% | 0 | 0 | 3 | comparisonData.catFlap.installation.passageWidthMm |
| installation.passageHeightMm | 7 | 70% | 0 | 0 | 3 | comparisonData.catFlap.installation.passageHeightMm |
| installation.tunnelDepthMm | 2 | 20% | 0 | 0 | 8 | comparisonData.catFlap.installation.tunnelDepthMm |
| installation.adapterRequired | 0 | 0% | 0 | 0 | 10 | comparisonData.catFlap.installation.adapterRequired |

## litterBox: NOT_READY

Products: 11. Critical fields: animal, minimumPetWeight, litterCompatibility, multiPet.

| Field | KNOWN | Coverage | UNKNOWN | NOT_APPLICABLE | MISSING_SCHEMA_DATA | Source |
|---|---:|---:|---:|---:|---:|---|
| animal | 11 | 100% | 0 | 0 | 0 | gps.animal OR comparisonFilters.animal |
| minimumPetWeight | 5 | 45% | 0 | 0 | 6 | sensorLimits.automaticModeMinimumWeightKg |
| litterCompatibility | 1 | 9% | 10 | 0 | 0 | litterCompatibility.status (complete / partial / unknown) |
| multiPet | 9 | 82% | 2 | 0 | 0 | multiPet.sharedUse |
| identification | 9 | 82% | 2 | 0 | 0 | multiPet.identificationMethods |
| app | 3 | 27% | 0 | 0 | 8 | comparisonFilters.app OR comparisonData.fountain.app |
| failureModes.powerOutage | 0 | 0% | 0 | 0 | 11 | failureModes.powerOutage.status |
| failureModes.wifiOutage | 0 | 0% | 0 | 0 | 11 | failureModes.wifiOutage.status |
| failureModes.internetOutage | 0 | 0% | 0 | 0 | 11 | failureModes.internetOutage.status |
| failureModes.cloudOutage | 0 | 0% | 0 | 0 | 11 | failureModes.cloudOutage.status |
| failureModes.mechanicalBlock | 0 | 0% | 1 | 0 | 10 | failureModes.mechanicalBlock.status |
| minimumOperationalWeight | 4 | 36% | 0 | 0 | 7 | sensorLimits.minimumOperationalWeightKg |
| belowMinimumBehavior | 5 | 45% | 3 | 0 | 3 | sensorLimits.belowMinimumBehavior |

## camera: PARTIAL

Products: 8. Critical fields: animal, localStorage, cloud, subscription, detection, nightVision.

| Field | KNOWN | Coverage | UNKNOWN | NOT_APPLICABLE | MISSING_SCHEMA_DATA | Source |
|---|---:|---:|---:|---:|---:|---|
| animal | 8 | 100% | 0 | 0 | 0 | gps.animal OR comparisonFilters.animal |
| localStorage | 4 | 50% | 3 | 0 | 1 | comparisonData.camera.localStorage |
| cloud | 7 | 88% | 0 | 0 | 1 | comparisonData.camera.cloud |
| subscription | 7 | 88% | 1 | 0 | 0 | subscription.requiredForCoreFunction (status must be documented) |
| detection | 2 | 25% | 5 | 0 | 1 | comparisonData.camera.detection |
| nightVision | 3 | 38% | 4 | 0 | 1 | comparisonData.camera.nightVision |
| failureModes.powerOutage | 0 | 0% | 3 | 0 | 5 | failureModes.powerOutage.status |
| failureModes.wifiOutage | 0 | 0% | 3 | 0 | 5 | failureModes.wifiOutage.status |
| failureModes.internetOutage | 0 | 0% | 3 | 0 | 5 | failureModes.internetOutage.status |
| failureModes.cloudOutage | 0 | 0% | 3 | 0 | 5 | failureModes.cloudOutage.status |
| failureModes.mechanicalBlock | 0 | 0% | 0 | 0 | 8 | failureModes.mechanicalBlock.status |
| localStorageTypes | 3 | 38% | 0 | 1 | 4 | comparisonData.camera.localStorageTypes |
| maxLocalStorageGb | 1 | 13% | 0 | 1 | 6 | comparisonData.camera.maxLocalStorageGb |
| detectionTypes | 5 | 63% | 0 | 0 | 3 | comparisonData.camera.detectionTypes |

## Remaining limits

No Phase-B recommendation module is implemented. Unknown GPS minimum weights remain eligible for later advice with an explicit fit limitation. Conditional installation requirements, generic night-vision claims and unspecified processing locations are not hard compatibility facts. Product sources retain their existing dates; normalization is not renewed manufacturer verification. Feeder records are unchanged; existing typed camera booleans are included.
