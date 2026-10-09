import type { Choice, Content } from "../domain/models";

/** Draft selection only; the server owns the persisted category and validation. */
export function selectDraftCategory(content: Content, categoryId: string, categories: Choice[]): Content {
  const category = categories.find((choice) => choice.id === categoryId);
  return {
    ...content,
    categoryId,
    equipmentCode: "",
    condition: "",
    resolutions: [],
    displayUntil: category?.workflow === "information" ? content.date : undefined,
  };
}

export function selectDraftCondition(content: Content, condition: Content["condition"], categories: Choice[]): Content {
  const technical = categories.find((category) => category.id === content.categoryId)?.workflow?.startsWith("technical-");
  const category = technical ? categories.find((choice) =>
    choice.workflow === (condition === "blocked" ? "technical-blocked" : "technical-problem")) : undefined;
  return { ...content, condition, categoryId: category?.id ?? content.categoryId };
}
