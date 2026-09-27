import { CSV_LIMITS, type PreparedCsv, type CsvSourceRecord } from './csv-adapter';
import type { ImportSource } from '../../domain/imports';

export interface SourceMappingConfiguration {
  readonly organizationId: string;
  readonly siteId: string;
  readonly sourceId: string;
  readonly mappingRevision: string;
  readonly sectors: readonly { readonly sectorKey: string; readonly label: string }[];
  readonly areas: readonly { readonly sourceArea: string; readonly sectorKey: string }[];
}
export type ClassifiedCsvRecord = CsvSourceRecord & (
  | { readonly classificationStatus: 'mapped'; readonly sectorKey: string }
  | { readonly classificationStatus: 'unclassified'; readonly sectorKey: null }
);
export interface ClassifiedCsv extends Omit<PreparedCsv, 'records'> {
  readonly mapping: SourceMappingConfiguration;
  readonly records: readonly ClassifiedCsvRecord[];
  readonly unclassifiedCount: number;
}
export class SourceMappingError extends Error {
  constructor(readonly code: 'invalid-configuration' | 'duplicate-area' | 'scope-mismatch' |
    'revision-mismatch' | 'invalid-area') {
    super(`Source mapping failed: ${code}.`);
    this.name = 'SourceMappingError';
  }
}
const trim = (value: string): string => value.replace(/^[ \t]+|[ \t]+$/g, '');
const id = (value: unknown): value is string => typeof value === 'string' && /^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/.test(value);
const object = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value);
const text = (value: unknown): value is string => typeof value === 'string' &&
  value.length <= CSV_LIMITS.fieldCodeUnits && trim(value).length > 0 && !/[\0\r\n]/.test(value);
function invalid(): never { throw new SourceMappingError('invalid-configuration'); }

/** Pure configuration snapshot, not a source registry, scope authority or admission service. */
export class SourceMappings {
  readonly configuration: SourceMappingConfiguration;
  readonly #byArea = new Map<string, string>();

  constructor(input: unknown) {
    if (!object(input) || !id(input.organizationId) || !id(input.siteId) ||
      !id(input.sourceId) || !id(input.mappingRevision) || !Array.isArray(input.sectors) ||
      !Array.isArray(input.areas) || input.sectors.length > CSV_LIMITS.records ||
      input.areas.length > CSV_LIMITS.records) invalid();
    const sectorKeys = new Set<string>();
    const sectors = input.sectors.map((sector: unknown) => {
      if (!object(sector) || !id(sector.sectorKey) || !text(sector.label) || sectorKeys.has(sector.sectorKey)) invalid();
      sectorKeys.add(sector.sectorKey);
      return Object.freeze({ sectorKey: sector.sectorKey, label: sector.label });
    });
    const areas = input.areas.map((area: unknown) => {
      if (!object(area) || !text(area.sourceArea) || !id(area.sectorKey) || !sectorKeys.has(area.sectorKey)) invalid();
      const sourceArea = trim(area.sourceArea);
      if (this.#byArea.has(sourceArea)) throw new SourceMappingError('duplicate-area');
      this.#byArea.set(sourceArea, area.sectorKey);
      return Object.freeze({ sourceArea, sectorKey: area.sectorKey });
    });
    this.configuration = Object.freeze({ organizationId: input.organizationId,
      siteId: input.siteId, sourceId: input.sourceId, mappingRevision: input.mappingRevision,
      sectors: Object.freeze(sectors), areas: Object.freeze(areas) });
    Object.freeze(this);
  }

  /** Caller supplies adapter-validated records and a trusted frozen receipt source. */
  classify(source: ImportSource, prepared: PreparedCsv): ClassifiedCsv {
    const config = this.configuration;
    if (!source || source.organizationId !== config.organizationId || source.siteId !== config.siteId ||
      source.sourceId !== config.sourceId) throw new SourceMappingError('scope-mismatch');
    if (source.mappingRevision !== config.mappingRevision) throw new SourceMappingError('revision-mismatch');
    let unclassifiedCount = 0;
    const records = prepared.records.map((record): ClassifiedCsvRecord => {
      if (!text(record.sourceArea)) throw new SourceMappingError('invalid-area');
      const sectorKey = this.#byArea.get(trim(record.sourceArea));
      if (sectorKey === undefined) {
        unclassifiedCount++;
        return Object.freeze({ ...record, classificationStatus: 'unclassified', sectorKey: null });
      }
      return Object.freeze({ ...record, classificationStatus: 'mapped', sectorKey });
    });
    return Object.freeze({ ...prepared, mapping: config, records: Object.freeze(records), unclassifiedCount });
  }
}
