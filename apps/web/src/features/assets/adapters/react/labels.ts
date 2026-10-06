import { t } from "../../../../localization/i18n";
import type {
  AssetStatus,
  SourceKind,
  SourceCoverage,
} from "../../domain/models";
export function assetStatusLabel(status: AssetStatus) {
  return t(
    { unverified: "Unverified", validated: "Validated", retired: "Retired" }[
      status
    ],
  );
}
export function sourceLabel(kind: SourceKind) {
  return t(
    {
      maintenance: "Maintenance",
      handover: "Shift Handover",
      analytics: "Event evidence",
    }[kind],
  );
}
export function coverageLabel(status: SourceCoverage["status"]) {
  return t(
    {
      available: "Available",
      "not-authorized": "Not authorized",
      unmapped: "No source alias",
      unavailable: "Unavailable",
    }[status],
  );
}
