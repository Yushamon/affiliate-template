import type { PriceState } from "./model";

export type PriceDisplay = {
  label: string;
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
    maximumFractionDigits: 2
  }).format(amount);
}

export function getPriceDisplay(price: PriceState): PriceDisplay {
  if (price.kind === "live") {
    const date = new Intl.DateTimeFormat("de-DE", {
      dateStyle: "short",
      timeStyle: "short"
    }).format(new Date(price.snapshot.fetchedAt));

    return {
      label: `${formatPrice(
        price.snapshot.amount,
        price.snapshot.currency
      )} ansehen`,
      meta: `Preisstand: ${date}`,
      url: price.link.url,
      rel: price.link.rel ?? "sponsored nofollow noopener",
      target: price.link.target ?? "_blank"
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
