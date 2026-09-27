/** Trusted, frozen source configuration; the host must verify it against the seeded site. */
export interface ImportSource {
  readonly organizationId: string;
  readonly siteId: string;
  readonly sourceId: string;
  readonly siteTimeZone: string;
  readonly adapterRevision: string;
  readonly profileRevision: string;
  readonly mappingRevision: string;
}
export interface Inspection {
  readonly dataRecordCount: number | null;
  readonly inspectedValidCount: number;
  readonly inspectedInvalidCount: number;
  readonly inspectionComplete: boolean;
  readonly unclassifiedCount: number;
  readonly repeatedCount: number;
  readonly diagnostics: readonly Diagnostic[];
  readonly diagnosticsTruncated: boolean;
}
export const reasons = {
  "invalid-encoding": "The input encoding is invalid.",
  "invalid-header": "The input header is invalid.",
  "invalid-record": "A source record is invalid.",
  "invalid-value": "A source value is invalid.",
  "limit-exceeded": "A processing limit was exceeded.",
};
export interface Diagnostic {
  readonly code: keyof typeof reasons;
  readonly line?: number;
  readonly field?:
    | "frequency"
    | "duration"
    | "area"
    | "equipment"
    | "message"
    | "type"
    | "group";
}
export interface BatchStatus extends Inspection {
  readonly importId: string;
  readonly rawId: string;
  readonly sourceId: string;
  readonly reportingDate: string;
  readonly originalFilename: string;
  readonly sha256: string;
  readonly byteLength: number;
  readonly outcome: "received" | "succeeded" | "rejected" | "failed";
  readonly admittedRecordCount: number | null;
  readonly rejectedRecordCount: number | null;
  readonly reasonCode: string | null;
}
export class ImportBatchError extends Error {
  constructor(
    readonly code:
      | "invalid-input"
      | "capacity"
      | "not-found"
      | "terminal"
      | "duplicate-date"
      | "incomplete"
      | "inconsistent"
      | "integrity",
  ) {
    super(`Import operation failed: ${code}.`);
  }
}
/** An unavailable acknowledgement never means that receipt/publication rolled back. */
export class ImportOutcomeUnknownError extends Error {
  constructor(readonly importId: string) {
    super(
      "Import outcome is unknown; reconcile this identity before retrying.",
    );
  }
}

export class ImportBusyError extends Error {
  constructor() {
    super("An import is already active.");
  }
}
