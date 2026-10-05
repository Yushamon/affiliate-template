import type { AdvisorAnswers, DecisionAnswers } from "./types";

const separator = ",";

export const serializeAdvisorAnswers = (
  answers: AdvisorAnswers
) => {
  const params = new URLSearchParams();
  params.set("pet", answers.pet);
  params.set("count", answers.petCount);
  params.set("food", answers.food);
  params.set("budget", answers.budget);
  params.set("style", answers.decisionStyle);

  if (answers.priorities.length > 0) {
    params.set(
      "features",
      answers.priorities.join(separator)
    );
  }

  return params;
};

export const parseAdvisorAnswers = (
  params: URLSearchParams
): AdvisorAnswers | null => {
  const pet = params.get("pet");
  const petCount = params.get("count");
  const food = params.get("food");
  const budget = params.get("budget");
  const decisionStyle = params.get("style");
  const priorities = (params.get("features") ?? "")
    .split(separator)
    .filter(Boolean);

  if (
    !["cat", "dog"].includes(pet ?? "") ||
    !["one", "multiple"].includes(petCount ?? "") ||
    !["dry", "wet", "mixed"].includes(food ?? "") ||
    !["budget", "midrange", "premium", "open"].includes(
      budget ?? ""
    ) ||
    !["best-match", "safe-choice"].includes(
      decisionStyle ?? ""
    )
  ) {
    return null;
  }

  return {
    pet: pet as AdvisorAnswers["pet"],
    petCount: petCount as AdvisorAnswers["petCount"],
    food: food as AdvisorAnswers["food"],
    budget: budget as AdvisorAnswers["budget"],
    decisionStyle:
      decisionStyle as AdvisorAnswers["decisionStyle"],
    priorities: priorities.filter((priority) =>
      [
        "camera",
        "app",
        "offline",
        "backup",
        "microchip",
        "simple"
      ].includes(priority)
    ) as AdvisorAnswers["priorities"]
  };
};


export const serializeDecisionAnswers = (answers: DecisionAnswers) => {
  const params = new URLSearchParams();
  params.set('world', answers.category);
  params.set('pet', answers.pet);
  if (answers.category === 'gps') {
    params.set('weight', String(answers.weight));
    params.set('subscription', answers.subscription!);
  } else {
    params.set('material', answers.material!);
    params.set('cordless', answers.cordless!);
  }
  if (answers.priorities.length) params.set('features', [...new Set(answers.priorities)].join(separator));
  return params;
};
export const parseDecisionAnswers = (params: URLSearchParams): DecisionAnswers | null => {
  const category = params.get('world'), pet = params.get('pet');
  if (!['gps', 'fountain'].includes(category ?? '') || !['cat', 'dog', ...(category === 'fountain' ? ['multiple'] : [])].includes(pet ?? '')) return null;
  const allowed = category === 'gps' ? ['battery','light','live','fence','activity'] : ['cleaning','costs','cordless','capacity'];
  const priorities = [...new Set((params.get('features') ?? '').split(separator).filter(p => allowed.includes(p)))];
  if (category === 'gps') {
    const weight = Number(params.get('weight')), subscription = params.get('subscription');
    if (!Number.isFinite(weight) || weight <= 0 || !['yes','no','any'].includes(subscription ?? '')) return null;
    return { category, pet: pet as 'cat' | 'dog', weight, subscription: subscription as DecisionAnswers['subscription'], priorities };
  }
  const material = params.get('material'), cordless = params.get('cordless');
  if (!['steel','plastic','any'].includes(material ?? '') || !['yes','no','any'].includes(cordless ?? '')) return null;
  return { category: 'fountain', pet: pet as DecisionAnswers['pet'], material: material as DecisionAnswers['material'], cordless: cordless as DecisionAnswers['cordless'], priorities };
};
