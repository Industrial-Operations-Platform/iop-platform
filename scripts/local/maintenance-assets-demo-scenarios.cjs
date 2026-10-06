const { isDeepStrictEqual } = require("node:util");
const prefix = "iop194-demo-";
const day = (date, offset) =>
  new Date(Date.parse(`${date}T12:00:00Z`) + offset * 86400000)
    .toISOString()
    .slice(0, 10);

function build({ today, actor, people, teams, priorities, departments }) {
  if (!departments.length || !people.length || !priorities.length)
    throw new Error(
      "Demo data needs configured departments, people and priorities.",
    );
  const assets = departments.flatMap((location, index) =>
    [0, 1].map((variant) => ({
      key: `${prefix}asset-${index}-${variant}`,
      content: {
        code: `DEMO-194-${String(index + 1).padStart(2, "0")}-${variant + 1}`,
        name: `[DEMO] ${variant ? "Spare drive" : "Inspection conveyor"} — ${location.label}`,
        type: variant ? "Drive" : "Conveyor",
        locationId: location.id,
        status: "unverified",
        validationNote: "",
        description:
          "Fictional training asset. This record does not identify or certify physical equipment. No analytical or handover source identity is inferred.",
        aliases: [],
      },
      changes: variant
        ? [
            {
              status: "retired",
              validationNote: "",
              note: "[DEMO] Spare archived after replacement; linked maintenance remains available.",
            },
          ]
        : index % 2
          ? []
          : [
              {
                status: "validated",
                validationNote:
                  "[DEMO] Simulated validation for interface exploration only; no physical inspection performed.",
                note: "[DEMO] Demonstrate validation and attributed asset history.",
              },
            ],
    })),
  );
  const examples = [
    ["Inspect protective guard", "open", -3],
    ["Investigate drive vibration", "in-progress", 0],
    ["Replace worn bearing", "blocked", -1],
    ["Clean and test sensor", "done", -2],
    ["Repeat inspection after recurrence", "open", 2],
    ["Review area checklist", "open", 7],
  ];
  const records = departments.flatMap((location, index) =>
    examples.map(([title, status, offset], variant) => {
      const data = {
        title: `[DEMO] ${title} — ${location.label}`,
        details:
          "Fictional maintenance exercise. Explore assignments, priorities, due dates, workflow and revision history. No work has been performed on physical equipment.",
        locationId: location.id,
        assetId: "",
        priorityId: priorities[(index + variant) % priorities.length].id,
        assigneeId:
          variant === 5 ? "" : people[(index + variant) % people.length].id,
        teamId:
          teams.length && variant % 2 === 0
            ? teams[index % teams.length].id
            : "",
        status: "open",
        dueDate: day(today, offset),
        outcome: "",
        blockedReason: "",
        externalReference: `${prefix}exercise-${index}-${variant}`,
      };
      const changes = [];
      if (status !== "open" || variant === 4)
        changes.push({
          status: "in-progress",
          reason: "[DEMO] Inspection started by the assigned technician.",
        });
      if (status === "blocked")
        changes.push({
          status,
          blockedReason:
            "[DEMO] Awaiting a fictional replacement bearing delivery.",
          reason: "[DEMO] Work paused pending material.",
        });
      if (status === "done" || variant === 4)
        changes.push({
          status: "done",
          outcome:
            "[DEMO] Simulated replacement and functional test completed; no physical work performed.",
          reason: "[DEMO] Document the simulated repair outcome.",
        });
      if (variant === 4)
        changes.push({
          status: "open",
          outcome: "",
          reason: "[DEMO] Reopened after a simulated recurring fault.",
        });
      if (variant === 1 && people.length > 1)
        changes.push({
          assigneeId: people[(index + variant + 1) % people.length].id,
          reason: "[DEMO] Coordinator reassigned the investigation.",
        });
      return {
        id: `${prefix}work-${index}-${variant}`,
        actor,
        assetKey:
          variant === 5 ? "" : assets[index * 2 + (variant === 3 ? 1 : 0)].key,
        data,
        changes,
      };
    }),
  );
  return { assets, records };
}

// Verify a retained prefix before resuming; later owner revisions always win.
async function resume(current, expected, history, snapshot, save) {
  const revisions =
    current.revision > 1 ? await history() : [snapshot(current, null)];
  for (
    let index = 0;
    index < Math.min(current.revision, expected.length);
    index++
  ) {
    const actual = revisions.find(
      (revision) => revision.revision === index + 1,
    );
    if (
      !actual ||
      !isDeepStrictEqual(actual.content, expected[index].content) ||
      (actual.note !== null && actual.note !== expected[index].note)
    )
      throw new Error(
        "Demo history diverged; preserve owner changes and inspect the record before resuming.",
      );
  }
  while (current.revision < expected.length)
    current = await save(current, expected[current.revision]);
  return current;
}
async function apply(apps, manifest) {
  const { assets, maintenance } = apps;
  const actor = manifest.actor;
  const known = new Map();
  for (const scenario of manifest.assets) {
    const asset = await assets.save(actor, {
      key: scenario.key,
      id: "",
      expectedRevision: 0,
      note: "[DEMO] Create fictional training asset.",
      content: scenario.content,
    });
    known.set(scenario.key, asset);
  }
  for (const scenario of manifest.records) {
    const data = {
      ...scenario.data,
      assetId: known.get(scenario.assetKey)?.id ?? "",
    };
    let content = data;
    const expected = [{ content, note: "[DEMO] Create maintenance exercise." }];
    for (const { reason, ...change } of scenario.changes) {
      content = { ...content, ...change };
      expected.push({ content, note: reason });
    }
    const record = await maintenance.save(scenario.actor, {
      id: scenario.id,
      expectedRevision: 0,
      data,
      reason: expected[0].note,
    });
    await resume(
      record,
      expected,
      async () =>
        (await maintenance.history(actor, scenario.id)).revisions.map(
          (revision) => ({
            revision: revision.record.revision,
            content: revision.record.data,
            note: revision.reason,
          }),
        ),
      (current, note) => ({
        revision: current.revision,
        content: current.data,
        note,
      }),
      (current, next) =>
        maintenance.save(actor, {
          id: current.id,
          expectedRevision: current.revision,
          data: next.content,
          reason: next.note,
        }),
    );
  }
  // Archive only after creating linked maintenance exercises.
  for (const scenario of manifest.assets) {
    let content = scenario.content;
    const expected = [
      { content, note: "[DEMO] Create fictional training asset." },
    ];
    for (const { note, ...change } of scenario.changes) {
      content = { ...content, ...change };
      expected.push({ content, note });
    }
    const asset = known.get(scenario.key);
    await resume(
      asset,
      expected,
      async () =>
        (await assets.history(actor, asset.id, 0)).revisions.map(
          (revision) => ({
            revision: revision.asset.revision,
            content: revision.asset.content,
            note: revision.note,
          }),
        ),
      (current, note) => ({
        revision: current.revision,
        content: current.content,
        note,
      }),
      (current, next) =>
        assets.save(actor, {
          id: current.id,
          key: "",
          expectedRevision: current.revision,
          content: next.content,
          note: next.note,
        }),
    );
  }
}
module.exports = { prefix, build, apply, resume };
