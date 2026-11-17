// Preserve the existing experiment's premium-model assignment while Commerce
// freshness is repaired. Only an assignment is frozen here, never price data.
// Evidence: research/product-integration-35.8/baseline.json, this route's links.
export const experimentAlternativeAssignments=Object.freeze({
 'oneisall-3-2l-cordless-fountain':Object.freeze({premium:null,'two-cats':'oneisall-3-5l-cordless-fountain'}),
 'xiaomi-smart-pet-fountain-2':Object.freeze({premium:'oneisall-3-2l-cordless-fountain'}),
 'oneisall-3-5l-cordless-fountain':Object.freeze({premium:'oneisall-3-2l-cordless-fountain'})
});
