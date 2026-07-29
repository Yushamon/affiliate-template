import { loadSeoDashboard } from "../loadDashboard";
import { buildSeoAdvisor } from "./index";
import { loadAdvisorContent } from "./loadContent";
import { loadProductIntelligence } from "./productIntelligence";

const loadSeoAdvisorDataUncached = async () => {
  const payload = loadSeoDashboard();
  const [{ documents, graph }, productIntelligence] = await Promise.all([
    loadAdvisorContent(),
    loadProductIntelligence(),
  ]);
  const results = Object.fromEntries(
    Object.entries(payload.ranges).map(([key, range]) => [
      key,
      buildSeoAdvisor({ payload, range, documents, graph }),
    ]),
  );

  return {
    payload,
    results,
    productIntelligence,
  };
};

let seoAdvisorDataPromise: ReturnType<typeof loadSeoAdvisorDataUncached> | undefined;

export const loadSeoAdvisorData = () => {
  seoAdvisorDataPromise ??= loadSeoAdvisorDataUncached();
  return seoAdvisorDataPromise;
};
