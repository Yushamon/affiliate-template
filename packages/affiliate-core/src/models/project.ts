export interface ProjectLink {
  label: string;
  href: string;
}

export interface ProjectConfig {
  projectName: string;
  domain: string;
  niche: string;
  productTypeLabel: string;
  audienceLabel: string;
  description: string;
  affiliate?: {
    amazon?: {
      trackingId?: string;
    };
  };
  defaultOgImage?: string;
  categoryPath?: string;
  decisionUseCases?: Array<{
    label: string;
    tag: string;
    fallbackTitle?: string;
  }>;
  trust?: {
    intro: string;
    reviewBasis: string[];
    exclusions: string[];
  };
  headerLinks: ProjectLink[];
  footer: {
    description: string;
    columns: Array<{
      title: string;
      links: ProjectLink[];
    }>;
    transparency: string;
  };
}
