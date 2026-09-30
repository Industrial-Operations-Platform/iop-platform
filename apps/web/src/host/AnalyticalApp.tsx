import { WorkforceApplication } from "../features/workforce/application/workforce";
import { HttpWorkforceGateway } from "../features/workforce/adapters/http/gateway";
import { HandoverApplication } from "../features/shift-handover/application/handover";
import { HttpHandoverGateway } from "../features/shift-handover/adapters/http/gateway";
import { AccessApplication } from "../features/access/application/access";
import { HttpAccessGateway } from "../features/access/adapters/http/gateway";
import { AnalysisWorkspace } from "../features/analysis/application/workspace";
import { HttpAnalysisGateway } from "../features/analysis/adapters/http/gateway";
import { WorkspaceApp } from "./WorkspaceApp";

const workforce = new WorkforceApplication(new HttpWorkforceGateway(), () =>
  crypto.randomUUID(),
);
const access = new AccessApplication(new HttpAccessGateway());
const application = new AnalysisWorkspace(new HttpAnalysisGateway());
const handover = new HandoverApplication(new HttpHandoverGateway(), () =>
  crypto.randomUUID(),
);
export function AnalyticalApp() {
  return (
    <WorkspaceApp
      application={application}
      access={access}
      handover={handover}
      workforce={workforce}
    />
  );
}
