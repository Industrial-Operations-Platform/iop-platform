import { createHash } from "node:crypto";
import { ImportWorkflow } from "../../modules/integrations/application/import-workflow";
import {
  ImportBatches,
  type ImportSource,
} from "../../modules/integrations/adapters/postgres/import-batches";
import {
  validateCsv,
  parseCsvReportingDate,
} from "../../modules/integrations/adapters/csv/csv-adapter";
import { SourceMappings } from "../../modules/integrations/adapters/csv/source-mappings";
import { OipReceiver } from "../../modules/oip/adapters/postgres/receiver";

/** Existing durable adapters retain their pinned transactions and current authorization. */
export function createImportWorkflow(
  batches: ImportBatches,
  receiver: OipReceiver,
  mappings: SourceMappings,
  source: ImportSource,
) {
  return new ImportWorkflow({
    now: () => Date.now(),
    validateFilename: (filename) => {
      parseCsvReportingDate(filename);
    },
    receive: (actor, filename, bytes) =>
      batches.receive(actor, filename, Buffer.from(bytes)),
    prepare: (filename, bytes) => {
      const inspected = validateCsv(filename, Buffer.from(bytes));
      if (inspected.status === "invalid")
        return {
          inspection: { ...inspected.inspection, unclassifiedCount: 0 },
          publication: null,
        };
      const classified = mappings.classify(source, inspected.prepared);
      return {
        inspection: {
          ...inspected.inspection,
          unclassifiedCount: classified.unclassifiedCount,
        },
        publication: {
          classified,
          prepared: inspected.prepared,
          inputSha256: createHash("sha256").update(bytes).digest("hex"),
        },
      };
    },
    reject: async (actor, id, inspection) => {
      await batches.reject(actor, id, inspection);
    },
    publish: async (actor, id, inspection, publication, deadline) => {
      await batches.publish(
        actor,
        id,
        inspection,
        receiver,
        publication,
        deadline,
      );
    },
    review: (actor, id) => batches.review(actor, id),
    reconcile: async (actor, id) => {
      await batches.reconcile(actor, id, receiver);
    },
  });
}
