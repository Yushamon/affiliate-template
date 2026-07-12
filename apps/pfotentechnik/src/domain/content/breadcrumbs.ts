import type {
  ComparisonEntry,
  ManufacturerEntry,
  PageEntry,
  ProductEntry
} from "./registry";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

const home: BreadcrumbItem = {
  label: "Startseite",
  href: "/"
};

const normalizePath = (value: string) => {
  const path = value.startsWith("/")
    ? value
    : `/${value}`;

  return path === "/" || path.endsWith("/")
    ? path
    : `${path}/`;
};

export const getProductBreadcrumbs = (
  entry: ProductEntry
): BreadcrumbItem[] => [
  home,
  {
    label: entry.data.category.label,
    href: normalizePath(
      entry.data.category.path ??
      "/smarte-futterautomaten/"
    )
  },
  {
    label: entry.data.manufacturer.name,
    href: normalizePath(
      `/hersteller/${entry.data.manufacturer.slug}`
    )
  },
  {
    label: entry.data.title
  }
];

export const getManufacturerBreadcrumbs = (
  entry: ManufacturerEntry
): BreadcrumbItem[] => [
  home,
  {
    label: "Hersteller",
    href: "/hersteller/"
  },
  {
    label: entry.data.name
  }
];

export const getComparisonBreadcrumbs = (
  entry: ComparisonEntry
): BreadcrumbItem[] => [
  home,
  {
    label: "Vergleiche",
    href: "/vergleiche/"
  },
  {
    label: entry.data.title
  }
];

export const getPageBreadcrumbs = (
  entry: PageEntry
): BreadcrumbItem[] => {
  const sections =
    entry.data.hub?.sections.map(
      (section) => section.toLowerCase()
    ) ?? [];

  const isComparison =
    sections.includes("vergleiche");

  return [
    home,
    {
      label: isComparison
        ? "Vergleiche"
        : "Wissen",
      href: isComparison
        ? "/vergleiche/"
        : "/wissen/"
    },
    {
      label: entry.data.title
    }
  ];
};
