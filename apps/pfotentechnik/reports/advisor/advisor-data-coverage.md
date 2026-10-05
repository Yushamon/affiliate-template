# Advisor data coverage — Phase A

As of: 2026-10-05. Products: 103.

All product Markdown records, including inactive; no prose extraction, schema defaults, or marketing heuristics. Supplemental structured fountain research joined by exact slug; not yet a category recommendation module.

known / all products; explicit false counts as known. partial, unknown and notApplicable are separate. No inference from comparisonData.custom strings, specs, decision or decisionJourney prose.

READY = all products have resolved critical fields. PARTIAL = at least one product has all critical fields known/notApplicable/partial. NOT_READY = none does. Critical fields are declared per category before calculation; operational safety and individual fit still require Phase-B validation.

supported=SUPPORTED, unavailable=UNSUPPORTED, partial=PARTIAL, unknown=UNKNOWN, notApplicable=NOT_APPLICABLE; reuse product capability type, no second enum.

## feeder: PARTIAL

Products: 38. Critical fields: animal, foodType, access.

| Field | Known | Coverage | Partial | Unknown | N/A | Structured source |
|---|---:|---:|---:|---:|---:|---|
| animal | 38 | 100% | 0 | 0 | 0 | Advisor common.animals (explicit product fields only) |
| petSize | 34 | 89% | 0 | 4 | 0 | Advisor common.petSizes (explicit product fields only) |
| foodType | 11 | 29% | 0 | 27 | 0 | Advisor common.foodTypes (explicit product fields only) |
| access | 4 | 11% | 0 | 34 | 0 | comparisonFilters.access |
| app | 4 | 11% | 0 | 34 | 0 | Advisor common.app (explicit product fields only) |
| camera | 3 | 8% | 0 | 35 | 0 | Advisor common.camera (explicit product fields only) |
| backupPower | 3 | 8% | 0 | 35 | 0 | Advisor common.backupPower (explicit product fields only) |
| offlineSchedule | 0 | 0% | 0 | 38 | 0 | Advisor common.offlineSchedule (explicit product fields only) |
| multiPet | 3 | 8% | 1 | 34 | 0 | Advisor common.multiPet.sharedUse (explicit product fields only) |
| failureModes.powerOutage | 1 | 3% | 2 | 35 | 0 | failureModes.powerOutage.status |
| failureModes.wifiOutage | 1 | 3% | 0 | 37 | 0 | failureModes.wifiOutage.status |
| failureModes.internetOutage | 1 | 3% | 0 | 37 | 0 | failureModes.internetOutage.status |
| failureModes.cloudOutage | 0 | 0% | 0 | 38 | 0 | failureModes.cloudOutage.status |
| failureModes.mechanicalBlock | 0 | 0% | 0 | 38 | 0 | failureModes.mechanicalBlock.status |

Animal data covers all models; food type and access are documented only for a subset, and function-specific offline schedules are missing. Phase B: constrain a pilot to documented food/access combinations and surface other gaps.

## fountain: NOT_READY

Products: 24. Critical fields: animal, capacity, material, filter, power.

| Field | Known | Coverage | Partial | Unknown | N/A | Structured source |
|---|---:|---:|---:|---:|---:|---|
| animal | 24 | 100% | 0 | 0 | 0 | Advisor common.animals (explicit product fields only) |
| capacity | 2 | 8% | 0 | 22 | 0 | comparisonData.fountain.capacityLiters |
| material | 2 | 8% | 0 | 22 | 0 | comparisonData.fountain.material |
| filter | 24 | 100% | 0 | 0 | 0 | research/fountain-cost-35.0b.json: data.consumablePolicy.filterPresent |
| filterRequired | 6 | 25% | 0 | 17 | 1 | 35.0B: primary filter required (no main filter = notApplicable) |
| filterCost | 15 | 63% | 0 | 8 | 1 | 35.0B: existing primary-filter cost calculation; 30-day price validity |
| power | 6 | 25% | 0 | 18 | 0 | research/fountain-cost-35.0b.json: data.comparisonData.fountain.powerType |
| battery | 1 | 4% | 0 | 23 | 0 | comparisonData.fountain.battery |
| batteryRuntime | 0 | 0% | 0 | 24 | 0 | research/fountain-cost-35.0b.json: data.comparisonData.fountain.batteryRuntime |
| offline | 0 | 0% | 0 | 24 | 0 | failureModes.powerOutage.status |
| dishwasher | 1 | 4% | 0 | 23 | 0 | research/fountain-cost-35.0b.json: data.comparisonData.fountain.dishwasherSafeParts OR comparisonData.fountain.dishwasherSafe (boolean) |
| failureModes.powerOutage | 0 | 0% | 0 | 24 | 0 | failureModes.powerOutage.status |
| failureModes.wifiOutage | 0 | 0% | 0 | 24 | 0 | failureModes.wifiOutage.status |
| failureModes.internetOutage | 0 | 0% | 0 | 24 | 0 | failureModes.internetOutage.status |
| failureModes.cloudOutage | 0 | 0% | 0 | 24 | 0 | failureModes.cloudOutage.status |
| failureModes.mechanicalBlock | 0 | 0% | 0 | 24 | 0 | failureModes.mechanicalBlock.status |

Structured filter presence covers all models and primary-filter costs cover a subset; capacity, material and power do not yet overlap sufficiently. Phase B: connect the existing fountain research and fill those structural gaps first.

## gps: PARTIAL

Products: 12. Critical fields: animal, minimumPetWeight, deviceWeight, subscription, battery, liveTracking, virtualFence.

| Field | Known | Coverage | Partial | Unknown | N/A | Structured source |
|---|---:|---:|---:|---:|---:|---|
| animal | 12 | 100% | 0 | 0 | 0 | Advisor common.animals (explicit product fields only) |
| minimumPetWeight | 7 | 58% | 0 | 5 | 0 | gps.minimumPetWeightKg |
| deviceWeight | 12 | 100% | 0 | 0 | 0 | gps.deviceWeightGrams |
| subscription | 12 | 100% | 0 | 0 | 0 | gps.subscriptionRequired |
| battery | 12 | 100% | 0 | 0 | 0 | gps.batteryMaxDays |
| liveTracking | 12 | 100% | 0 | 0 | 0 | gps.liveTracking |
| virtualFence | 12 | 100% | 0 | 0 | 0 | gps.virtualFence |
| failureModes.powerOutage | 0 | 0% | 0 | 9 | 3 | failureModes.powerOutage.status |
| failureModes.wifiOutage | 0 | 0% | 0 | 12 | 0 | failureModes.wifiOutage.status |
| failureModes.internetOutage | 3 | 25% | 0 | 9 | 0 | failureModes.internetOutage.status |
| failureModes.cloudOutage | 0 | 0% | 0 | 12 | 0 | failureModes.cloudOutage.status |
| failureModes.mechanicalBlock | 0 | 0% | 0 | 12 | 0 | failureModes.mechanicalBlock.status |

Animal, weight, subscription, battery, live tracking and virtual fence are broadly structured; minimum animal weight is incomplete. Phase B: a restricted pilot can use documented weight limits and distinguish unverified fit.

## catFlap: NOT_READY

Products: 10. Critical fields: animal, microchip, individualAccess, installation.

| Field | Known | Coverage | Partial | Unknown | N/A | Structured source |
|---|---:|---:|---:|---:|---:|---|
| animal | 10 | 100% | 0 | 0 | 0 | Advisor common.animals (explicit product fields only) |
| microchip | 9 | 90% | 0 | 1 | 0 | multiPet.identificationMethods OR comparisonFilters.access |
| individualAccess | 3 | 30% | 3 | 4 | 0 | multiPet.individualAccess |
| multiPet | 6 | 60% | 0 | 4 | 0 | multiPet.sharedUse |
| preyDetection | 1 | 10% | 0 | 9 | 0 | comparisonData.custom.preyDetection |
| installation | 0 | 0% | 0 | 10 | 0 | No typed installation compatibility field; descriptive custom/spec strings excluded |
| failureModes.powerOutage | 0 | 0% | 1 | 9 | 0 | failureModes.powerOutage.status |
| failureModes.wifiOutage | 1 | 10% | 0 | 9 | 0 | failureModes.wifiOutage.status |
| failureModes.internetOutage | 1 | 10% | 0 | 9 | 0 | failureModes.internetOutage.status |
| failureModes.cloudOutage | 0 | 0% | 0 | 10 | 0 | failureModes.cloudOutage.status |
| failureModes.mechanicalBlock | 0 | 0% | 0 | 10 | 0 | failureModes.mechanicalBlock.status |

Identification and some multi-pet capabilities are structured; installation compatibility is missing as a typed decision field. Phase B: establish installation and individual-access facts before hard recommendations.

## litterBox: PARTIAL

Products: 11. Critical fields: animal, minimumPetWeight, litterCompatibility, multiPet.

| Field | Known | Coverage | Partial | Unknown | N/A | Structured source |
|---|---:|---:|---:|---:|---:|---|
| animal | 11 | 100% | 0 | 0 | 0 | Advisor common.animals (explicit product fields only) |
| minimumPetWeight | 1 | 9% | 0 | 10 | 0 | sensorLimits.automaticModeMinimumWeightKg |
| litterCompatibility | 1 | 9% | 9 | 1 | 0 | litterCompatibility.status (complete / partial / unknown) |
| multiPet | 9 | 82% | 0 | 2 | 0 | multiPet.sharedUse |
| identification | 9 | 82% | 0 | 2 | 0 | multiPet.identificationMethods |
| app | 3 | 27% | 0 | 8 | 0 | Advisor common.app (explicit product fields only) |
| failureModes.powerOutage | 0 | 0% | 0 | 11 | 0 | failureModes.powerOutage.status |
| failureModes.wifiOutage | 0 | 0% | 0 | 11 | 0 | failureModes.wifiOutage.status |
| failureModes.internetOutage | 0 | 0% | 0 | 11 | 0 | failureModes.internetOutage.status |
| failureModes.cloudOutage | 0 | 0% | 0 | 11 | 0 | failureModes.cloudOutage.status |
| failureModes.mechanicalBlock | 0 | 0% | 1 | 10 | 0 | failureModes.mechanicalBlock.status |

Litter compatibility and shared use are mostly documented; automatic-mode minimum weight is structured for only one model. Phase B: limit any pilot to verified safety/weight and litter combinations.

## camera: NOT_READY

Products: 8. Critical fields: animal, localStorage, cloud, subscription, detection, nightVision.

| Field | Known | Coverage | Partial | Unknown | N/A | Structured source |
|---|---:|---:|---:|---:|---:|---|
| animal | 8 | 100% | 0 | 0 | 0 | Advisor common.animals (explicit product fields only) |
| localStorage | 0 | 0% | 0 | 8 | 0 | No typed camera localStorage field; descriptive custom/spec strings excluded |
| cloud | 0 | 0% | 0 | 8 | 0 | No typed camera cloud field; descriptive custom/spec strings excluded |
| subscription | 7 | 88% | 0 | 1 | 0 | subscription.requiredForCoreFunction (status must be documented) |
| detection | 0 | 0% | 0 | 8 | 0 | No typed camera detection field; descriptive custom/spec strings excluded |
| nightVision | 0 | 0% | 0 | 8 | 0 | No typed camera nightVision field; descriptive custom/spec strings excluded |
| failureModes.powerOutage | 0 | 0% | 0 | 8 | 0 | failureModes.powerOutage.status |
| failureModes.wifiOutage | 0 | 0% | 0 | 8 | 0 | failureModes.wifiOutage.status |
| failureModes.internetOutage | 0 | 0% | 1 | 7 | 0 | failureModes.internetOutage.status |
| failureModes.cloudOutage | 0 | 0% | 0 | 8 | 0 | failureModes.cloudOutage.status |
| failureModes.mechanicalBlock | 0 | 0% | 0 | 8 | 0 | failureModes.mechanicalBlock.status |

Subscription data covers most models; storage, cloud dependency, detection and night vision remain mostly descriptive. Phase B: normalize these documented claims before implementing selection.

## other: NOT_READY

Products: 0. Critical fields: animal.

| Field | Known | Coverage | Partial | Unknown | N/A | Structured source |
|---|---:|---:|---:|---:|---:|---|
| animal | 0 | 0% | 0 | 0 | 0 | Advisor common.animals (explicit product fields only) |
| failureModes.powerOutage | 0 | 0% | 0 | 0 | 0 | failureModes.powerOutage.status |
| failureModes.wifiOutage | 0 | 0% | 0 | 0 | 0 | failureModes.wifiOutage.status |
| failureModes.internetOutage | 0 | 0% | 0 | 0 | 0 | failureModes.internetOutage.status |
| failureModes.cloudOutage | 0 | 0% | 0 | 0 | 0 | failureModes.cloudOutage.status |
| failureModes.mechanicalBlock | 0 | 0% | 0 | 0 | 0 | failureModes.mechanicalBlock.status |

No products outside the six worlds currently exist.

## Phase-B gate

No additional category recommendation engine is implemented. READY means data coverage only, not medical, safety or product suitability certification. Unknown and partial rows need explicit cautions or a limited pilot. Camera storage/detection prose and cat-flap installation prose must be structured before those modules can make hard decisions. Fountain research already exists separately; wire it into its future module without duplicating the source.

## Ownership and legacy consolidation

PetAdvisor and src/domain/advisor are the sole engine. The old FeederAdvisor was mounted only at /berater/futterautomat/. Its wet-food, camera, access, multiple-pet and app/local preferences are covered by PetAdvisor; its portion/large-dog branch did not use product evidence. Portion size, bowl fit, stability, cooling and local programming remain explicit checks rather than unsupported eligibility claims. /futterautomat-berater/ had its own canonical and an internal category link; both slash variants now use the existing public/_redirects HTTP 301 mechanism. The category link points directly to the new owner.

Existing recommendation tests retain their assertions; fixtures now declare structured animal/access facts instead of relying on prose. The existing redirect-count assertion changes from 68 to 70 because both legacy advisor URL variants are covered. The feeder UI currently selects 31 eligible records; seven archived recommendations remain included in this all-product coverage audit, but are not offered as recommendations.
