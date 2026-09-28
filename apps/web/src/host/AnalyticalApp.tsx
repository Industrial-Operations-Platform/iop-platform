import { AccessApplication } from "../features/access/application/access";
import { HttpAccessGateway } from "../features/access/adapters/http/gateway";
import { AnalysisWorkspace } from "../features/analysis/application/workspace";
import { HttpAnalysisGateway } from "../features/analysis/adapters/http/gateway";
import { WorkspaceApp } from "./WorkspaceApp";

const access = new AccessApplication(new HttpAccessGateway());
const application = new AnalysisWorkspace(new HttpAnalysisGateway());
export function AnalyticalApp() {
  return <WorkspaceApp application={application} access={access} />;
}
