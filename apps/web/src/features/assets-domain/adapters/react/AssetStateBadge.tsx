import { Badge } from "../../../../design/components";
import { t } from "../../../../localization/i18n";

const stateLabels: Record<string, string> = {
  pending: "Pending",
  validated: "Validated",
  unverified: "Unverified",
  retired: "Retired",
  approved: "Approved",
  rejected: "Rejected",
  mapped: "Mapped",
  ambiguous: "Ambiguous",
  unmapped: "Unmapped",
};
export function assetStateLabel(state: string) {
  return t(stateLabels[state] ?? state);
}
/** Source and registry states retain their meaning while sharing presentation. */
export function AssetStateBadge({ state }: { state: string }) {
  return <Badge tone={state === "validated" || state === "approved" || state === "mapped" ? "success" : state === "rejected" || state === "ambiguous" ? "warning" : "neutral"}>{assetStateLabel(state)}</Badge>;
}
