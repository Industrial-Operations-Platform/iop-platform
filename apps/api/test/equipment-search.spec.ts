import { DataExplorer } from "../src/modules/oip/application/data-explorer";
import type { DataExplorerRepository } from "../src/modules/oip/application/ports";
import { PgDataExplorer } from "../src/modules/oip/adapters/postgres/data-explorer";
import type { PgReportingProfiles } from "../src/modules/oip/adapters/postgres/reporting-profiles";

test("equipment search rejects invalid criteria before persistence and preserves literal code fragments", async () => {
  const equipment = jest.fn().mockResolvedValue({ values: [], more: false });
  const application = new DataExplorer({ equipment } as unknown as DataExplorerRepository);
  for (const input of [null, [], {}, { search: "" }, { search: " " }, { search: ["X"] },
    { search: "x", extra: true }, { search: "x".repeat(201) }, { search: "x\n" }])
    expect(() => application.equipment("reader", input)).toThrow("invalid_selection");
  expect(equipment).not.toHaveBeenCalled();
  await expect(application.equipment("reader", { search: " =Müll_%' " })).resolves.toEqual({ values: [], more: false });
  expect(equipment).toHaveBeenCalledWith("reader", "=Müll_%'");
});

test("equipment lookup runs in the authorized reporting scope and bounds returned tuples", async () => {
  const rows = Array.from({ length: 21 }, (_, index) => ({ code: `=S${index}`, sector: "Hall", area: "Area" }));
  const query = jest.fn().mockResolvedValue({ rows });
  const run = jest.fn(async (_actor, _write, operation) => operation({ query }));
  const repository = new PgDataExplorer({ run, source: { organizationId: "org", siteId: "site", sourceId: "source" } } as unknown as PgReportingProfiles);
  expect(await repository.equipment("reader", "_%'")).toEqual({ values: rows.slice(0, 20), more: true });
  expect(run).toHaveBeenCalledWith("reader", false, expect.any(Function));
  expect(query.mock.calls[1][1]).toEqual(["org", "site", "source", "_%'"]);
  expect(query.mock.calls[1][0]).toContain("LIMIT 21");
  run.mockRejectedValueOnce(new Error("denied"));
  await expect(repository.equipment("unauthorized", "x")).rejects.toThrow("denied");
});
