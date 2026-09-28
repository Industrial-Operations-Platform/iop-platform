import {
  HandoverApplication,
  type Gateway,
} from "../src/features/shift-handover/application/handover";
import {
  emptySelection,
  type CreateEntry,
} from "../src/features/shift-handover/domain/models";
test("a publication retry retains the request key after an uncertain response", async () => {
  const create = jest
    .fn()
    .mockRejectedValueOnce(new Error("Disconnected"))
    .mockResolvedValue({ id: "saved" });
  const gateway = { create } as unknown as Gateway,
    ids = jest.fn(() => "stable-key");
  const app = new HandoverApplication(gateway, ids),
    input = {
      content: { summary: "Observation" },
      issue: false,
      responsibleId: "",
    } as Omit<CreateEntry, "key">;
  await expect(app.publish(input)).rejects.toThrow("Disconnected");
  await expect(app.publish(input)).resolves.toEqual({ id: "saved" });
  expect(create.mock.calls[0][0].key).toBe(create.mock.calls[1][0].key);
  expect(ids).toHaveBeenCalledTimes(1);
});
test("meeting selection retains earlier open issues and preserves department filters", async () => {
  const list = jest
    .fn()
    .mockResolvedValue({ entries: [], total: 0, nextCursor: "" });
  const app = new HandoverApplication(
    { list } as unknown as Gateway,
    () => "key",
  );
  await app.meeting({
    ...emptySelection,
    from: "2026-09-29",
    to: "2026-09-29",
    departmentId: "dept",
  });
  expect(list.mock.calls[1][0]).toMatchObject({
    from: "",
    to: "",
    state: "pending",
    departmentId: "dept",
  });
});
