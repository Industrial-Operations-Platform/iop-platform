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
    <section aria-label="Administration overview">
      <PageHeading
        eyebrow="Platform administration"
        title="Administration"
        description="Manage platform access, source data and reporting settings."
      />
      <div className="analysis-home-grid">
        {canAdminister && (
          <Panel>
            <h2>Users & profiles</h2>
            <p>Create accounts, assign profiles and manage platform access.</p>
            <Button onClick={openUsers}>Manage users</Button>
          </Panel>
        )}
        {canImport && (
          <>
            <Panel>
              <h2>Imports & source data</h2>
              <p>
                Add daily files and review their saved history and source rows.
              </p>
              <Actions>
                <Button onClick={() => openTool("imports")}>
                  Import files
                </Button>
                <Button variant="secondary" onClick={() => openTool("files")}>
                  Files & source rows
                </Button>
              </Actions>
            </Panel>
            <Panel>
              <h2>Reporting settings</h2>
              <p>Maintain historical preparation rules and KPI goals.</p>
              <Actions>
                <Button onClick={() => openTool("preparation")}>
                  Data preparation
                </Button>
                <Button variant="secondary" onClick={() => openTool("kpis")}>
                  KPI settings & goals
                </Button>
              </Actions>
            </Panel>
          </>
        )}
      </div>
    </section>
  );
}
