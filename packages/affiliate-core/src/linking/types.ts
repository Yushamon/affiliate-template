export type LinkPriority = "low" | "normal" | "high";

export type InternalLinkGroup =
  | "hub"
  | "knowledge"
  | "comparison"
  | "product"
  | "manufacturer";

export type InternalLinkIntent =
  | "informational"
  | "comparison"
  | "buying-guide"
  | "how-to"
  | "troubleshooting"
  | "product"
  | "manufacturer";

export interface InternalLinkDefinition {
  /** Stabiler, eindeutiger Schlüssel. */
  id: string;

  /**
   * Erlaubte, tatsächlich anklickbare Ankertexte.
   * Neue Aufrufer sollen dieses Feld verwenden.
   */
  anchorAliases?: string[];

  /**
   * Legacy-Alias für anchorAliases. Wird nur aus Gründen der
   * Rückwärtskompatibilität gelesen und nicht semantisch erweitert.
   */
  keywords?: string[];

  /** Begriffe, die nur Kontextsignale sind und nie selbst verlinkt werden. */
  contextTerms?: string[];

  /** Begriffe, die die lokale Nutzerintention beschreiben. */
  intentTerms?: string[];

  /** Themen, denen das Linkziel zugeordnet ist. */
  topics?: string[];

  /** Anker, für die dieses Ziel der exklusive Eigentümer ist. */
  exclusiveAnchors?: string[];

  /** Zielseite. */
  href: string;

  /** Priorität nach Ownership, Spezifität, Intent und Kontext. */
  priority?: LinkPriority;

  /** Maximale Vorkommen dieser Definition im gemeinsamen Seitenbudget. */
  maxOccurrences?: number;

  /** Optionaler Linktitel. */
  title?: string;

  /** Funnel-Gruppe. */
  group?: InternalLinkGroup;

  /** Legacy-Kontextfeld. Neue Aufrufer sollen contextTerms verwenden. */
  contexts?: string[];

  /** Verhindert Links innerhalb bereits verlinkter Bereiche. */
  preventNestedLinks?: boolean;
}

export type InternalLinkDictionary = Record<string, InternalLinkDefinition>;
