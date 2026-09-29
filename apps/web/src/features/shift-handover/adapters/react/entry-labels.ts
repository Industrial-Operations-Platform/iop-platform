import type { Entry } from "../../domain/models";
export const issueLabel = (state: Entry["issueState"]) =>
  ({
    none: "Information",
    open: "Open",
    "in-progress": "In progress",
    resolved: "Resolved",
  })[state];
