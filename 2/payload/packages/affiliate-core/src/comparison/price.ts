import type { PriceAssessment, PriceState } from "./model";

export type PriceDisplay = {
  label: string;
  amountLabel?: string;
  assessment?: PriceAssessment;
  assessmentLabel?: string;
  rangeLabel?: string;
  comparisonText?: string;
  sourceLabel?: string;
  meta?: string;
  url?: string;
  rel?: string;
  target?: "_blank" | "_self";
};

export function formatPrice(
  amount: number,
  currency: string,
  locale = "de-DE"
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: Number.isInteger(amount) ? 0 : 2
  }).format(amount);
}

const assessmentLabels: Record<PriceAssessment, string> = {
  cheap: "günstig",
  fair: "fair",
  expensive: "eher teuer",
  unknown: "noch offen"
};

const snapshotDisplay = (price: Extract<PriceState, { kind: "live" | "value-only" }>) => {
  const snapshot = price.snapshot;
  const date = snapshot.fetchedAt
    ? new Intl.DateTimeFormat("de-DE", { dateStyle: "short" }).format(new Date(snapshot.fetchedAt))
    : null;

  return {
    amountLabel: `ca. ${formatPrice(snapshot.amount, snapshot.currency)}`,
    assessment: snapshot.assessment ?? "unknown",
    assessmentLabel:
      snapshot.assessmentLabel ??
      assessmentLabels[snapshot.assessment ?? "unknown"],
    rangeLabel: snapshot.rangeLabel,
    comparisonText: snapshot.comparisonText,
    sourceLabel: snapshot.sourceLabel,
    meta: date ? `Preisstand: ${date}` : undefined
  };
};

export function getPriceDisplay(price: PriceState): PriceDisplay {
  if (price.kind === "live") {
    return {
      label: price.link.label || "Preis prüfen",
      ...snapshotDisplay(price),
      url: price.link.url,
      rel: price.link.rel ?? "sponsored nofollow noopener",
      target: price.link.target ?? "_blank"
    };
  }

  if (price.kind === "value-only") {
    return {
      label: "Produktdetails ansehen",
      ...snapshotDisplay(price)
    };
  }

  if (price.kind === "link-only") {
    return {
      label: price.link.label,
      url: price.link.url,
      rel: price.link.rel ?? "sponsored nofollow noopener",
      target: price.link.target ?? "_blank"
    };
  }

  return {
    label: "Produktdetails ansehen"
  };
}
