import {
  sourceRowsRequest,
  messageCursor,
} from "../src/modules/oip/domain/source-rows";
import { DataExplorer } from "../src/modules/oip/application/data-explorer";
import type { DataExplorerRepository } from "../src/modules/oip/application/ports";
const query = {
  importId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  page: 1,
  sort: [],
};
test("source rows accept bounded whitelisted sorting and reject ambiguous criteria before persistence", () => {
  expect(
    sourceRowsRequest({
      ...query,
      sort: [{ field: "message", direction: "asc" }],
    }),
  ).toMatchObject({ page: 1 });
  for (const patch of [
    { importId: "unknown" },
    { page: 0 },
    { page: 1.5 },
    { sort: [{ field: "message; DROP TABLE", direction: "asc" }] },
    {
      sort: [
        { field: "area", direction: "asc" },
        { field: "area", direction: "desc" },
      ],
    },
    { sort: [{ field: "area", direction: "asc NULLS FIRST" }] },
    { unexpected: true },
  ]) {
    expect(() => sourceRowsRequest({ ...query, ...patch })).toThrow(
      "invalid_selection",
    );
  }
  expect(messageCursor({})).toBeNull();
  expect(messageCursor({ after: "Müll, L5/6" })).toBe("Müll, L5/6");
  expect(() => messageCursor({ after: ["x"] })).toThrow("invalid_selection");
});
test("file paging refuses stale preparation revisions", async () => {
  const sourceRows = jest
    .fn()
    .mockResolvedValue({ revision: "a1." + "b".repeat(43) });
  const service = new DataExplorer({
    sourceRows,
  } as unknown as DataExplorerRepository);
  await expect(
    service.sourceRows("admin", { ...query, revision: "a1." + "a".repeat(43) }),
  ).rejects.toThrow("analytics_revision_changed");
  expect(sourceRows).toHaveBeenCalledTimes(1);
});
