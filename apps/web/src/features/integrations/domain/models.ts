export type IntegrationKind = 'wincc'|'ultimo'|'entra';
export interface ConnectionConfiguration {
  kind:IntegrationKind; label:string; enabled:boolean; endpoint:string;
  contractVersion:string; credentialReference:string; tenantId:string; clientId:string;
}
export interface Connection {
  configuration:ConnectionConfiguration; revision:number; updatedAt:string; updatedBy:string;
}
export interface ConnectionReadiness extends Connection {
  status:'disabled'|'configuration-pending'|'transport-pending';
  adapter:'contract-ready'; missingInputs:string[]; lastSuccessfulConnection:null;
}
