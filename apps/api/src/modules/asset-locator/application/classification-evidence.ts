/** Original source observations are provisional evidence, never physical identity decisions. */
export interface ClassificationSourceEvidence {
  sourceId: string;
  area: string;
  code: string;
  origin: 'reviewed-mapping' | 'exact-alias';
  mappingId: string;
  mappingRevision: number;
  total: number;
  evidence: {
    importId: string;
    sourceRecordNumber: number;
    reportingDate: string;
    message: string;
  }[];
}
export interface ClassificationEvidence {
  assetId: string;
  coverage: 'available' | 'unmapped' | 'limited';
  totalSources: number;
  sources: ClassificationSourceEvidence[];
}
export type ClassificationEvidenceSource = (actor: string, assetId: string) => Promise<ClassificationEvidence>;
