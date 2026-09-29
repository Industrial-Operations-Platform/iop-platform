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

test("the board loads each category independently so busy categories cannot hide other sections", async () => {
  const list = jest.fn().mockImplementation(async (s) => ({
    entries: [],
    total: s.categoryId === "safety" ? 42 : 2,
    nextCursor: "",
  }));
  const gateway = {
    context: async () => ({
      categories: [
        { id: "safety", label: "Safety" },
        { id: "people", label: "People" },
      ],
    }),
    list,
  } as unknown as Gateway;
  const app = new HandoverApplication(gateway, () => "key");
  const result = await app.board({
    ...emptySelection,
    departmentId: "department",
  });
  expect(result.sections.map((section) => section.page.total)).toEqual([42, 2]);
  expect(list.mock.calls.every(([s]) => s.departmentId === "department")).toBe(
    true,
  );
  await app.list({ mine: true, cursor: "next" });
  expect(list).toHaveBeenLastCalledWith(
    expect.objectContaining({ mine: true, cursor: "next" }),
  );
});

test("daily overview covers the exact selected day and all departments and authors", async () => {
  const { meetingSelection } = await import(
    "../src/features/shift-handover/application/handover"
  );
  const selected = meetingSelection("2026-09-29", "selected-department", true);
  expect(selected).toEqual({
    ...emptySelection,
    from: "2026-09-29",
    to: "2026-09-29",
    departmentId: "",
  });
  expect(selected.mine).not.toBe(true);
  expect(
    meetingSelection("2026-09-28", "selected-department", false),
  ).toMatchObject({
    from: "2026-09-28",
    to: "2026-09-28",
    departmentId: "selected-department",
  });
});
