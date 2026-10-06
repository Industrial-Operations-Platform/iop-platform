import { t } from "../../../../localization/i18n";
import type { Status } from "../../domain/models";
export function statusLabel(status: Status) {
  return t(
    {
      open: "Open",
      "in-progress": "In progress",
      blocked: "Blocked",
      done: "Done",
    }[status],
  );
}
export function statusTone(
  status: Status,
): "neutral" | "info" | "attention" | "success" {
  return {
    open: "neutral",
    "in-progress": "info",
    blocked: "attention",
    done: "success",
  }[status] as "neutral" | "info" | "attention" | "success";
}
