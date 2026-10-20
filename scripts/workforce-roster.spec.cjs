const { prepareRoster } = require("./local/workforce-roster-runner.cjs");
const board = {
  people: [{ id: "lead", profile: "team-leader" }, { id: "other-lead", profile: "team-leader" }, { id: "tech", profile: "technician" }, { id: "force", profile: "task-force" }],
  settings: { shifts: [], targets: [], teams: [{ id: "old", label: "Retained", leaderId: "lead" }] },
  records: [{ kind: "worker", id: "tech", revision: 3, deleted: false, data: { userId: "tech", teamId: "old", homeTargetId: "home", technicalLevelId: "level" } }],
};
const input = { teams: [{ id: "primary", label: "Primary", leaderId: "lead", members: [{ userId: "tech" }] }, { id: "remaining", label: "Remaining", leaderId: "other-lead" }], remainderTeamIds: ["remaining"], seed: "test", pendingMembers: [{ name: "Unlinked person", teamId: "primary" }] };
test("explicit roster preparation preserves profiles, home locations and unrelated configuration", () => {
  const result = prepareRoster(board, input);
  expect(result.config.teams[0]).toEqual(board.settings.teams[0]);
  expect(result.workers.find((worker) => worker.id === "tech")).toMatchObject({ expectedRevision: 3, data: { teamId: "primary", homeTargetId: "home", technicalLevelId: "level" } });
  expect(result.workers.find((worker) => worker.id === "force").data.teamId).toBe("remaining");
  expect(result.workers).toHaveLength(2);
  expect(result.pendingMembers).toEqual(input.pendingMembers);
  expect(board.settings.teams).toHaveLength(1);
});
test("reruns preserve editable established primary groups and reject missing or duplicate identities", () => {
  const prepared = prepareRoster(board, input);
  const current = { ...board, settings: prepared.config, records: prepared.workers.map((worker) => ({ ...worker, revision: worker.expectedRevision + 1 })) };
  expect(prepareRoster(current, input).workers).toEqual([]);
  expect(() => prepareRoster(board, { ...input, teams: [{ ...input.teams[0], members: [{ userId: "missing" }] }] })).toThrow("no active scoped account");
  expect(() => prepareRoster(board, { ...input, teams: [{ ...input.teams[0], members: [{ userId: "tech" }, { userId: "tech" }] }] })).toThrow("multiple primary teams");
});
