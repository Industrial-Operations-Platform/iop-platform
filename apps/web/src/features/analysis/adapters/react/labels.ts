import { t } from "../../../../localization/i18n";
import type { Dimension } from "../../domain/models";
export const labels: Record<Dimension, string> = {
  get sector() { return t("Sector / Halle"); },
  get area() { return t("Bereich"); },
  get equipment() { return t("Betriebsmittelkennzeichen"); },
  get message() { return t("Meldetext"); },
  get type() { return t("Typ"); },
  get messageGroup() { return t("Meldegruppe"); },
  get frequency() { return t("Häufigkeit"); },
  get duration() { return t("Dauer (minutes)"); },
};
