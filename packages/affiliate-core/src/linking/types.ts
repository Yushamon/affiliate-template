export type LinkPriority =
  | "low"
  | "normal"
  | "high";

export interface InternalLinkDefinition {

  /**
   * Eindeutiger Schlüssel.
   */
  id: string;

  /**
   * Wörter oder Wortgruppen,
   * die automatisch erkannt werden.
   */
  keywords: string[];

  /**
   * Zielseite.
   */
  href: string;

  /**
   * Priorität,
   * falls mehrere Links passen.
   */
  priority?: LinkPriority;

  /**
   * Maximale Anzahl automatischer Links
   * pro Seite.
   *
   * Standard:
   * 1
   */
  maxOccurrences?: number;

  /**
   * Optionaler Titel
   * für spätere Tooltips.
   */
  title?: string;

  /**
   * Linkgruppe.
   *
   * Beispiele:
   *
   * product
   *
   * manufacturer
   *
   * decision
   *
   * knowledge
   */
  group?: string;

  /**
   * Verhindert,
   * dass innerhalb
   * bereits verlinkter Bereiche
   * erneut ersetzt wird.
   */
  preventNestedLinks?: boolean;
}

export type InternalLinkDictionary =
  Record<string, InternalLinkDefinition>;