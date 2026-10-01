import type { Selection } from "../domain/models";
export type MatrixColumn =
  | "date"
  | "reference"
  | "due"
  | "responsible"
  | "status";
export function clearMatrixFilter(
  selection: Selection,
  column: MatrixColumn,
): Selection {
  const cleared = {
    date: { from: "", to: "" },
    reference: { externalReference: undefined },
    due: { dueFrom: undefined, dueTo: undefined },
    responsible: { responsibleId: undefined },
    status: { state: "" as const, condition: undefined },
  }[column];
  return { ...selection, ...cleared, cursor: "" };
}
export function matrixFilterActive(
  selection: Selection,
  column: MatrixColumn,
): boolean {
  switch (column) {
    case "date":
      return !!(selection.from || selection.to);
    case "reference":
      return !!selection.externalReference;
    case "due":
      return !!(selection.dueFrom || selection.dueTo);
    case "responsible":
      return selection.responsibleId !== undefined;
    case "status":
      return !!(selection.state || selection.condition);
  }
}
