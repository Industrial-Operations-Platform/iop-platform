import {ConnectionError, connectionText} from "../../domain/connections";
import type {IntegrationScope, ProviderAggregate, ProviderWorkOrder, ReadOnlyAggregateTransport,
  ReadOnlyWorkOrderTransport, VerifiedIdentityTransport, VerifiedProviderIdentity} from "../../application/provider-contracts";
function scope(input: IntegrationScope) {
  for (const field of [input.organizationId, input.siteId, input.sourceId])
    if (!/^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/.test(field)) throw new ConnectionError("invalid_integration");
}
function date(input: unknown): string {
  const value = connectionText(input, 10);
  if (!/^(?!0000)\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(value)) ||
    new Date(value + "T00:00:00.000Z").toISOString().slice(0, 10) !== value)
    throw new ConnectionError("invalid_integration");
  return value;
}
function total(input: unknown): number {
  if (typeof input !== "number" || !Number.isSafeInteger(input) || input < 0)
    throw new ConnectionError("invalid_integration");
  return input;
}
export class WinccReadOnlyAdapter {
  constructor(private readonly transport?: ReadOnlyAggregateTransport) {}
  async read(input: IntegrationScope): Promise<ProviderAggregate[]> {
    scope(input);
    if (!this.transport) throw new ConnectionError("integration_unconfigured");
    const rows = await this.transport.read({...input});
    if (rows.length > 10000) throw new ConnectionError("invalid_integration");
    return rows.map(row => ({sourceRecordId: connectionText(row.sourceRecordId, 160), reportingDate: date(row.reportingDate),
      equipmentCode: connectionText(row.equipmentCode, 160), message: connectionText(row.message, 2000),
      frequency: total(row.frequency), alarmSeconds: total(row.alarmSeconds), sourceWindow: "unknown", sourceKind: "aggregate"}));
  }
}
export class UltimoReadOnlyAdapter {
  constructor(private readonly transport?: ReadOnlyWorkOrderTransport,
    private readonly stateMappings: Readonly<Record<string, ProviderWorkOrder["state"]>> = {}) {}
  async read(input: IntegrationScope): Promise<ProviderWorkOrder[]> {
    scope(input);
    if (!this.transport) throw new ConnectionError("integration_unconfigured");
    const rows = await this.transport.read({...input});
    if (rows.length > 10000) throw new ConnectionError("invalid_integration");
    return rows.map(row => ({externalId: connectionText(row.externalId, 160), title: connectionText(row.title, 2000),
      state: this.stateMappings[connectionText(row.state, 100)] ?? "unknown", equipmentCode: connectionText(row.equipmentCode, 160),
      outcome: connectionText(row.outcome, 4000)}));
  }
}
export class EntraIdentityAdapter {
  constructor(private readonly transport?: VerifiedIdentityTransport, private readonly approvedTenant = "", private readonly approvedIssuer = "") {}
  async verify(token: string): Promise<VerifiedProviderIdentity> {
    if (typeof token !== "string" || !token || token.length > 16384) throw new ConnectionError("invalid_integration");
    if (!this.transport || !this.approvedTenant || !this.approvedIssuer) throw new ConnectionError("integration_unconfigured");
    const claims = await this.transport.verify(token);
    if (claims.tenantId !== this.approvedTenant || claims.issuer !== this.approvedIssuer || !connectionText(claims.subject, 200))
      throw new ConnectionError("integration_denied");
    return {issuer: claims.issuer, tenantId: claims.tenantId, subject: claims.subject};
  }
}
