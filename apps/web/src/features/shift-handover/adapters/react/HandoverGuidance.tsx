import { t } from "../../../../localization/i18n";

export function HandoverGuidance() {
  return <p className="iop-metric-description">{t("Journal tracks current reports and unresolved issues. Closed shift records retain immutable transfer evidence and receiving acknowledgements; closing a transfer does not resolve journal issues.")}</p>;
}
