import { ActionIcon, Select } from "./components";
import { setAppearance, type AppearancePreference } from "./appearance";
import { useAppearance } from "./useAppearance";
import { t } from "../localization/i18n";

export function AppearanceControl() {
  const { preference } = useAppearance();
  return (
    <label className="iop-account-select-row">
      <ActionIcon name="appearance" />
      <span>{t("Appearance")}</span>
      <Select
        aria-label={t("Appearance")}
        value={preference}
        onChange={(event) =>
          setAppearance(event.target.value as AppearancePreference)
        }
      >
        <option value="light">{t("Light")}</option>
        <option value="dark">{t("Dark")}</option>
        <option value="system">{t("System")}</option>
      </Select>
    </label>
  );
}
