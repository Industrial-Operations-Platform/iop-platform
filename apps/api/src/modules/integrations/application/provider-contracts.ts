export interface IntegrationScope {organizationId: string; siteId: string; sourceId: string}
export interface ProviderAggregate {
  sourceRecordId: string; reportingDate: string; equipmentCode: string;
  message: string; frequency: number; alarmSeconds: number;
  sourceWindow: "unknown"; sourceKind: "aggregate";
}
export interface ProviderWorkOrder {
  externalId: string; title: string; state: "open" | "in-progress" | "completed" | "unknown";
  equipmentCode: string; outcome: string;
}
export interface VerifiedProviderIdentity {issuer: string; subject: string; tenantId: string}
export interface ReadOnlyAggregateTransport {
  read(scope: IntegrationScope): Promise<readonly Record<string, unknown>[]>;
}
export interface ReadOnlyWorkOrderTransport {
  read(scope: IntegrationScope): Promise<readonly Record<string, unknown>[]>;
}
/** Adapter must verify signature, issuer, audience, expiry and tenant before returning claims. */
export interface VerifiedIdentityTransport {verify(token: string): Promise<VerifiedProviderIdentity>}
