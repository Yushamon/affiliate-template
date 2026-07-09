export interface DecisionRule {
  /**
   * Eindeutiger Schlüssel.
   * Beispiele:
   * welpen
   * familie
   * unter100
   */
  id: string;

  /**
   * Anzeigename.
   */
  title: string;

  /**
   * Optionaler Beschreibungstext.
   */
  description?: string;

  /**
   * Gewichtung einzelner Bewertungskriterien.
   *
   * Beispiel:
   * {
   *   preisleistung: 3,
   *   app: 2,
   *   reinigung: 1
   * }
   */
  weights: Record<string, number>;

  /**
   * Optionale erforderliche Use Cases.
   * Produkte müssen mindestens einen dieser Use Cases besitzen.
   */
  requiredUseCases?: string[];

  /**
   * Optionale auszuschließende Use Cases.
   */
  excludedUseCases?: string[];

  /**
   * Maximale Anzahl empfohlener Produkte.
   */
  limit?: number;
}

export type DecisionRuleMap = Record<string, DecisionRule>;