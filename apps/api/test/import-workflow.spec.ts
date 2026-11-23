import {
  ImportWorkflow,
  type ImportGateway,
} from "../src/modules/integrations/application/import-workflow";
import {
  ImportOutcomeUnknownError,
  type BatchStatus,
  type Inspection,
} from "../src/modules/integrations/domain/imports";

test("unknown publication acknowledgement reconciles without replaying original input", async () => {
  const status = { importId: "receipt", outcome: "succeeded" } as BatchStatus;
  const gateway: ImportGateway<string> = {
    now: () => 100,
    validateFilename: () => {},
    receive: jest.fn(async () => "receipt"),
    prepare: () => ({ inspection: {} as Inspection, publication: "prepared" }),
    reject: jest.fn(),
    publish: jest.fn(async () => {
      throw new ImportOutcomeUnknownError("receipt");
    }),
    review: jest.fn(async () => status),
    reconcile: jest.fn(async () => {}),
  };
  const useCase = new ImportWorkflow(gateway);
  expect(await useCase.submit("actor", "daily.csv", new Uint8Array())).toBe(
    status,
  );
  expect(gateway.receive).toHaveBeenCalledTimes(1);
  expect(gateway.publish).toHaveBeenCalledTimes(1);
  expect(gateway.reconcile).toHaveBeenCalledWith("actor", "receipt");
  expect(useCase.isBusy).toBe(false);
});

test("replacement confirmation is persisted with the new receipt and invalid input never publishes", async () => {
  const gateway: ImportGateway<string> = {
    now: () => 100,
    validateFilename: jest.fn(),
    receive: jest.fn(async () => "replacement"),
    prepare: () => ({ inspection: {} as Inspection, publication: null }),
    reject: jest.fn(), publish: jest.fn(),
    review: jest.fn(async () => ({ importId: "replacement", outcome: "rejected" }) as BatchStatus),
    reconcile: jest.fn(),
  };
  const useCase = new ImportWorkflow(gateway);
  const bytes = new Uint8Array([1]);
  expect((await useCase.submit("actor", "daily.csv", bytes, "confirmed-prior")).outcome).toBe("rejected");
  expect(gateway.receive).toHaveBeenCalledWith("actor", "daily.csv", bytes, "confirmed-prior");
  expect(gateway.reject).toHaveBeenCalledWith("actor", "replacement", expect.anything());
  expect(gateway.publish).not.toHaveBeenCalled();
});
