import { t } from "../localization/i18n";
import { Actions, Button, PageHeading, Panel } from "../design/components";

export type AdministrationTool = "imports" | "files" | "preparation" | "kpis";

export function AdministrationOverview({
  canImport,
  canAdminister,
  openTool,
  openUsers,
}: {
  canImport: boolean;
  canAdminister: boolean;
  openTool: (tool: AdministrationTool) => void;
  openUsers: () => void;
}) {
  return (
    <section aria-label={t("Administration overview")}>
      <PageHeading
        eyebrow={t("Platform administration")}
        title={t("Administration")}
        description={t(
          "Manage platform access, source data and reporting settings.",
        )}
      />
      <div className="analysis-home-grid">
        {canAdminister && (
          <Panel>
            <h2>{t("Users & profiles")}</h2>
            <p>
              {t(
                "Create accounts, assign profiles and manage platform access.",
              )}
            </p>
            <Button onClick={openUsers}>{t("Manage users")}</Button>
          </Panel>
        )}
        {canImport && (
          <>
            <Panel>
              <h2>{t("Imports & source data")}</h2>
              <p>
                {t(
                  "Add daily files and review their saved history and source rows. ",
                )}
              </p>
              <Actions>
                <Button onClick={() => openTool("imports")}>
                  {t("Import files ")}
                </Button>
                <Button variant="secondary" onClick={() => openTool("files")}>
                  {t("Files & source rows ")}
                </Button>
              </Actions>
            </Panel>
            <Panel>
              <h2>{t("Reporting settings")}</h2>
              <p>{t("Maintain historical preparation rules and KPI goals.")}</p>
              <Actions>
                <Button onClick={() => openTool("preparation")}>
                  {t("Data preparation ")}
                </Button>
                <Button variant="secondary" onClick={() => openTool("kpis")}>
                  {t("KPI settings & goals ")}
                </Button>
              </Actions>
            </Panel>
          </>
        )}
      </div>
    </section>
  );
}
