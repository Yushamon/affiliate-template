import type { AdvisorAnswers } from "./types";

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
