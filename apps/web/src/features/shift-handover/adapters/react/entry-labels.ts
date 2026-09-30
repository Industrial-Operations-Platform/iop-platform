import { t } from "../../../../localization/i18n";
import type { Entry } from "../../domain/models";
export const issueLabel = (state: Entry["issueState"]) =>
  t(
    {
      none: "Information",
      open: "Open",
      "in-progress": "In progress",
      resolved: "Resolved",
    }[state],
  );

export const issueTone = (state: Entry["issueState"]) =>
  state === "resolved" ? "success" : state === "none" ? "neutral" : "info";
