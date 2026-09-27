import { AnalysisWorkspace } from "./features/analysis/application/workspace";
import { HttpAnalysisGateway } from "./features/analysis/adapters/http/gateway";
import { WorkspaceApp } from "./features/analysis/adapters/react/Workspace";

const application = new AnalysisWorkspace(new HttpAnalysisGateway());
export function AnalyticalApp() {
  return <WorkspaceApp application={application} />;
}
