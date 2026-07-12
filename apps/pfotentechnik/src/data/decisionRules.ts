// Temporärer Kompatibilitäts-Reexport während der Legacy-Bereinigung.
// Neue Domain-Verbraucher importieren aus domain/productDecision.
export {
  decisionRules,
  type DecisionRuleMap,
  type ProductDecisionRule
} from "../domain/productDecision/rules";
