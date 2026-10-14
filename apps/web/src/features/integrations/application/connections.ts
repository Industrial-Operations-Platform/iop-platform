import type {Connection,ConnectionConfiguration,ConnectionReadiness,IntegrationKind} from '../domain/models';
export interface ConnectionGateway {
  query():Promise<{connections:ConnectionReadiness[]}>;
  save(expectedRevision:number,configuration:ConnectionConfiguration):Promise<ConnectionReadiness>;
  history(kind:IntegrationKind):Promise<{revisions:Connection[]}>;
}
export class ConnectionsApplication {
  constructor(private readonly gateway:ConnectionGateway) {}
  query() {return this.gateway.query();}
  save(connection:Connection) {return this.gateway.save(connection.revision,connection.configuration);}
  history(kind:IntegrationKind) {return this.gateway.history(kind);}
}
