import {createOperationalOverviewApplication} from "../features/operational-overview/adapters/http/gateway";
import {FormalHandoverApplication} from "../features/shift-handover/application/formal-records";
import {HttpFormalHandoverGateway} from "../features/shift-handover/adapters/http/formal-gateway";
import {ImprovementApplication} from "../features/improvement-tracking/application/improvement";
import {HttpImprovementGateway} from "../features/improvement-tracking/adapters/http/gateway";
import {createLocatorApplication} from "../features/asset-locator/adapters/http/gateway";
import {ConnectionsApplication} from "../features/integrations/application/connections";
import {HttpConnectionsGateway} from "../features/integrations/adapters/http/gateway";
import { WorkforceApplication } from "../features/workforce/application/workforce";
import { MaintenanceApplication } from "../features/maintenance/application/maintenance";
import { HttpMaintenanceGateway } from "../features/maintenance/adapters/http/gateway";
import { AssetsApplication } from "../features/assets/application/assets";
import { HttpAssetsGateway } from "../features/assets/adapters/http/gateway";
import { HttpWorkforceGateway } from "../features/workforce/adapters/http/gateway";
import { HandoverApplication } from "../features/shift-handover/application/handover";
import { HttpHandoverGateway } from "../features/shift-handover/adapters/http/gateway";
import { AccessApplication } from "../features/access/application/access";
import { HttpAccessGateway } from "../features/access/adapters/http/gateway";
import { AnalysisWorkspace } from "../features/analysis/application/workspace";
import { HttpAnalysisGateway } from "../features/analysis/adapters/http/gateway";
import { WorkspaceApp } from "./WorkspaceApp";

const formalHandover = new FormalHandoverApplication(new HttpFormalHandoverGateway(), () => crypto.randomUUID());
const improvements = new ImprovementApplication(new HttpImprovementGateway(), () => crypto.randomUUID(), async (search,cursor) => {
  const page = await assets.query({search,cursor,status:'current',locationId:''});
  return {assets:page.assets.map(asset=>({id:asset.id,code:asset.content.code,name:asset.content.name,status:asset.content.status})),nextCursor:page.nextCursor,total:page.total};
});
const overview = createOperationalOverviewApplication();
const locator = createLocatorApplication();
const connections = new ConnectionsApplication(new HttpConnectionsGateway());
const workforce = new WorkforceApplication(new HttpWorkforceGateway(), () =>
  crypto.randomUUID(),
);
const access = new AccessApplication(new HttpAccessGateway());
const maintenance = new MaintenanceApplication(
  new HttpMaintenanceGateway(),
  () => crypto.randomUUID(),
);
const assets = new AssetsApplication(new HttpAssetsGateway(), () =>
  crypto.randomUUID(),
);
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
      maintenance={maintenance}
      assets={assets}
      connections={connections}
      formalHandover={formalHandover}
      improvements={improvements}
      locator={locator}
      overview={overview}
    />
  );
}
