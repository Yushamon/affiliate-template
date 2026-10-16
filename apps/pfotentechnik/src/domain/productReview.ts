import { calculateProductScore } from "./productScore.ts";

/** A score alone is not evidence of a review or of a practical product test. */
export function assessProductReview(product: any) {
  const nonempty = (value: unknown) => typeof value === "string" && value.trim().length > 0;
  const score = calculateProductScore(product);
  const handsOn = ["hands-on", "long-term-test"].includes(product.testStatus)
    && product.editorial?.testedHandsOn === true;
  // Existing evidence reviews also document their source assessment in the
  // rendered consensus block; do not discard them for using that structure.
  const methodology = nonempty(product.experience?.methodology)
    || nonempty(product.externalEvidence?.consensus?.editorialAssessment);
  const verdict = nonempty(product.review?.verdict) || nonempty(product.review?.summary);
  const sourced = (product.evidenceSources ?? []).some((source: any) =>
    /^https?:\/\//.test(source.url ?? "") && nonempty(source.assertion))
    || (product.externalEvidence?.professionalReviews ?? []).some((source: any) =>
      /^https?:\/\//.test(source.url ?? "") && nonempty(source.publisher))
    || (product.externalEvidence?.userReviews ?? []).some((source: any) =>
      /^https?:\/\//.test(source.url ?? "") && nonempty(source.platform)
      && [...(source.recurringPositives ?? []), ...(source.recurringCriticism ?? [])].some(nonempty));
  const eligible = score.score !== null && score.score > 0 && score.criteriaCount > 0
    && methodology && verdict && (sourced || handsOn);
  return {
    eligible,
    handsOn,
    label: handsOn ? "Testbericht" : product.testStatus === "manufacturer-data" ? "Datencheck" : "Redaktionelle Einordnung",
    basis: handsOn ? "Eigener Praxistest mit redaktioneller Kriterienbewertung."
      : "Redaktionelle Eignungsbewertung anhand dokumentierter Quellen; kein eigener Praxistest.",
    reason: eligible ? "Kriterien, Methodik, Urteil und Quellen bzw. eigene Prüfung dokumentiert."
      : "Score allein genügt nicht: Kriterien, Methodik, Urteil oder Bewertungsbelege fehlen."
  };
}
