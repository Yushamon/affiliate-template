export const SUBSCRIPTION_PRICE_STALE_DAYS = 120;

export type SubscriptionStatus =
  | "required-subscription"
  | "required-prepaid"
  | "optional-subscription"
  | "no-subscription"
  | "service-included"
  | "unknown";

export type SubscriptionPlan = {
  name: string;
  billingPeriod: "monthly" | "annual" | "term";
  commitmentMonths: number;
  billingMode: "recurring" | "upfront" | "prepaid";
  price: number | null;
  currency?: string;
  effectiveMonthlyPrice?: number | null;
  autoRenew: boolean | null;
  featured?: boolean;
  notes?: string;
};

export type SubscriptionData = {
  status: SubscriptionStatus;
  requiredForCoreFunction: boolean | null;
  serviceType: string;
  serviceModel: string;
  provider: string;
  includedServiceMonths?: number;
  researchedAt: Date | string;
  checkedAt?: Date | string;
  source: string;
  freeFunctions?: string[];
  paidFunctions?: string[];
  additionalCostNote?: string;
  plans?: SubscriptionPlan[];
};

const money = (value: number, currency = "EUR") => new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency,
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
}).format(value);

const dateValue = (value: Date | string | undefined): number | null => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.valueOf()) ? null : date.valueOf();
};

export const isSubscriptionEvidenceStale = (
  subscription: SubscriptionData,
  now: Date | string = new Date(),
  staleDays = SUBSCRIPTION_PRICE_STALE_DAYS
): boolean => {
  const researched = dateValue(subscription.checkedAt ?? subscription.researchedAt);
  const current = dateValue(now);
  if (researched === null || current === null) return true;
  return current - researched > staleDays * 86_400_000;
};

const planCostForMonths = (plan: SubscriptionPlan, months: number): number | null => {
  if (!(typeof plan.price === "number" && plan.price > 0)) return null;
  if (plan.billingPeriod === "monthly") return plan.price * months;
  const periodMonths = plan.billingPeriod === "annual" ? 12 : plan.commitmentMonths;
  return plan.price * Math.ceil(months / periodMonths);
};

const paymentLabel = (plan: SubscriptionPlan): string => {
  if (plan.billingPeriod === "monthly") return `${money(plan.price ?? 0, plan.currency)} / Monat`;
  if (plan.billingPeriod === "annual") return `${money(plan.price ?? 0, plan.currency)} / Jahr`;
  return `${money(plan.price ?? 0, plan.currency)} für ${plan.commitmentMonths} Monate`;
};

const billingLabel = (plan: SubscriptionPlan): string => {
  if (plan.billingMode === "prepaid") return `${plan.commitmentMonths} Monate im Voraus · keine automatische Verlängerung`;
  if (plan.billingPeriod === "annual") return "jährliche Zahlung";
  if (plan.billingPeriod === "term") return `${plan.commitmentMonths} Monate im Voraus`;
  return plan.autoRenew === false ? "keine automatische Verlängerung" : "monatliche Zahlung";
};

const statusCopy = (subscription: SubscriptionData) => {
  switch (subscription.status) {
    case "required-subscription": return { symbol: "↻", label: subscription.serviceModel === "subscription-or-prepaid" ? "Abo oder Prepaid-Service erforderlich" : "Abo erforderlich", tone: "required" };
    case "required-prepaid": return { symbol: "↻", label: "Prepaid-Service erforderlich", tone: "required" };
    case "optional-subscription": return { symbol: "○", label: "Optionales Abo", tone: "optional" };
    case "no-subscription": return { symbol: "✓", label: "Kein verpflichtendes Abo", tone: "none" };
    case "service-included": return { symbol: "✓", label: "Service zunächst enthalten", tone: "included" };
    default: return { symbol: "!", label: "Zusatzkosten noch nicht geklärt", tone: "unknown" };
  }
};

export const buildSubscriptionCostModel = ({
  subscription,
  devicePrice,
  deviceCurrency = "EUR",
  now = new Date()
}: {
  subscription?: SubscriptionData | null;
  devicePrice?: number | null;
  deviceCurrency?: string;
  now?: Date | string;
}) => {
  if (!subscription) return null;
  const status = statusCopy(subscription);
  const stale = isSubscriptionEvidenceStale(subscription, now);
  const plans = subscription.plans ?? [];
  const featuredPlan = plans.find((plan) => plan.featured) ?? plans.find((plan) => typeof plan.price === "number") ?? plans[0] ?? null;
  const planPriceCurrent = Boolean(featuredPlan && typeof featuredPlan.price === "number" && !stale);
  const requiresPayment = ["required-subscription", "required-prepaid"].includes(subscription.status);
  const optional = subscription.status === "optional-subscription";
  const noSubscription = subscription.status === "no-subscription";
  const serviceIncluded = subscription.status === "service-included";
  const runningCostLabel = noSubscription
    ? "Keine verpflichtenden digitalen Servicekosten"
    : serviceIncluded
      ? `${subscription.includedServiceMonths ?? 0} Monate enthalten`
      : planPriceCurrent && featuredPlan
        ? paymentLabel(featuredPlan)
        : requiresPayment
          ? "Zusatzkosten erforderlich – aktuellen Tarif prüfen"
          : optional
            ? "Preis des optionalen Dienstes aktuell prüfen"
            : "Kostenstatus aktuell prüfen";
  const activeMonths = (months: number) => Math.max(0, months - (subscription.includedServiceMonths ?? 0));
  const total = (months: number) => {
    if (!(typeof devicePrice === "number" && devicePrice > 0)) return null;
    if (noSubscription) return devicePrice;
    if (!(planPriceCurrent && featuredPlan)) return null;
    const service = planCostForMonths(featuredPlan, activeMonths(months));
    return service === null ? null : devicePrice + service;
  };
  const tco12 = total(12);
  const tco24 = total(24);

  return {
    ...status,
    status: subscription.status,
    provider: subscription.provider,
    serviceType: subscription.serviceType,
    serviceModel: subscription.serviceModel,
    requiredForCoreFunction: subscription.requiredForCoreFunction,
    researchedAt: subscription.researchedAt,
    source: subscription.source,
    stale,
    requiresPayment,
    optional,
    runningCostLabel,
    billingLabel: planPriceCurrent && featuredPlan ? billingLabel(featuredPlan) : null,
    featuredPlan: featuredPlan ? {
      ...featuredPlan,
      current: planPriceCurrent,
      paymentLabel: planPriceCurrent ? paymentLabel(featuredPlan) : "Preis aktuell prüfen",
      billingLabel: planPriceCurrent ? billingLabel(featuredPlan) : null,
      monthlyEquivalentLabel: planPriceCurrent && featuredPlan.effectiveMonthlyPrice
        ? `entspricht ${money(featuredPlan.effectiveMonthlyPrice, featuredPlan.currency)} / Monat`
        : null
    } : null,
    plans: plans.map((plan) => ({
      ...plan,
      current: typeof plan.price === "number" && !stale,
      paymentLabel: typeof plan.price === "number" && !stale ? paymentLabel(plan) : "Preis aktuell prüfen",
      billingLabel: typeof plan.price === "number" && !stale ? billingLabel(plan) : null,
      monthlyEquivalentLabel: typeof plan.price === "number" && !stale && plan.effectiveMonthlyPrice
        ? `entspricht ${money(plan.effectiveMonthlyPrice, plan.currency)} / Monat`
        : null
    })),
    freeFunctions: subscription.freeFunctions ?? [],
    paidFunctions: subscription.paidFunctions ?? [],
    additionalCostNote: subscription.additionalCostNote,
    devicePriceKnown: typeof devicePrice === "number" && devicePrice > 0,
    devicePriceLabel: typeof devicePrice === "number" && devicePrice > 0 ? money(devicePrice, deviceCurrency) : "Preis beim Händler prüfen",
    totals: {
      months12: tco12 === null ? null : { value: tco12, label: money(tco12, deviceCurrency) },
      months24: tco24 === null ? null : { value: tco24, label: money(tco24, deviceCurrency) }
    },
    totalScenarioLabel: optional ? "mit optionalem Dienst" : "mit dem gezeigten Tarif",
    totalDisclaimer: "Rechenbeispiel auf Basis der aktuell recherchierten Tarife; künftige Tarifänderungen sind nicht eingerechnet."
  };
};

export const formatSubscriptionComparison = (subscription: SubscriptionData | undefined, devicePrice?: number | null, now: Date | string = new Date()): string | undefined => {
  const model = buildSubscriptionCostModel({ subscription, devicePrice, now });
  if (!model) return undefined;
  const total = model.totals.months24;
  if (total) return `${model.label} · ${model.runningCostLabel} · 2 Jahre ${total.label} ${model.totalScenarioLabel}`;
  return `${model.label} · ${model.runningCostLabel}`;
};

export type SubscriptionCostModel = ReturnType<typeof buildSubscriptionCostModel>;
