import { t } from "../../../../localization/i18n";
import type { Status } from "../../domain/models";
const labels: Record<Status, string> = {
  planned: "Planned",
  "in-progress": "In progress",
  blocked: "Blocked",
  implemented: "Implemented",
  evaluated: "Evaluated",
  cancelled: "Cancelled"
};
export const statusLabel = (status: Status) => t(labels[status]);
