const { createHash } = require("node:crypto");

const examples = [
  {
    category: "safety",
    title: "Protective guard awaiting inspection",
    condition: "blocked",
    issue: true,
    highlight: true,
  },
  {
    category: "information",
    title: "Access route changed during maintenance",
    highlight: true,
  },
  {
    category: "successes",
    title: "Conveyor returned to service",
    condition: "repaired",
    issue: true,
    states: ["in-progress", "resolved"],
  },
  {
    category: "people",
    title: "New colleague completed the area introduction",
  },
  {
    category: "performance",
    title: "Intermittent sensor stops under investigation",
    condition: "inspection-needed",
    issue: true,
    states: ["in-progress"],
  },
  {
    category: "problems",
    title: "Drive vibration requires a bearing check",
    condition: "damaged",
    issue: true,
  },
  {
    category: "problems",
    title: "Replacement part still awaiting delivery",
    age: 7,
    condition: "damaged",
    issue: true,
    states: ["in-progress"],
    overdue: true,
  },
  {
    category: "safety",
    title: "Inspection checklist updated after guard repair",
    age: 14,
    condition: "repaired",
    issue: true,
    states: ["in-progress", "resolved"],
  },
  {
    category: "performance",
    title: "Repeated stop after an earlier repair",
    age: 30,
    condition: "inspection-needed",
    issue: true,
    states: ["in-progress", "resolved", "open"],
    overdue: true,
  },
  {
    category: "successes",
    title: "Worn guide replaced and run test completed",
    age: 60,
    condition: "restored",
    issue: true,
    states: ["in-progress", "resolved"],
  },
  {
    category: "information",
    title: "Inspection notes available for the next shift",
    age: 90,
  },
  {
    category: "people",
    title: "Cross-department support during planned maintenance",
    age: 1,
  },
];

function dayOffset(day, offset) {
  return new Date(Date.parse(day + "T12:00:00Z") + offset * 86400000)
    .toISOString()
    .slice(0, 10);
}

function buildScenarios({ today, people, coordinator, departments, restrictedCategoryIds = ["information"] }) {
  if (!people.length || !departments.length || departments.length > 20)
    throw new Error("Demo requires 1–20 departments and active contributors.");
  return departments.flatMap((department, departmentIndex) =>
    examples.map((example, index) => {
      const author = restrictedCategoryIds.includes(example.category)
        ? people.find((person) => person.id === coordinator)
        : people[(departmentIndex + index) % people.length];
      if (!author) throw new Error("Restricted demo categories require an active coordinator.");
      const responsible = people[(departmentIndex + index + 1) % people.length];
      const date = dayOffset(today, -(example.age ?? 0));
      const equipment =
        department.equipment[index % department.equipment.length];
      const content = {
        date,
        categoryId: example.category,
        summary: `[DEMO] ${example.title}`,
        details: `Synthetic training example for ${department.label}. No actual equipment condition or work is asserted. Use this entry to explore the journal, meeting overview and immutable follow-up history.`,
        departmentId: department.id,
        areaId: example.condition
          ? (equipment?.areaId ?? department.areaId)
          : "",
        equipmentCode: example.condition ? (equipment?.code ?? "") : "",
        equipmentNamespace: "site-equipment",
        condition: example.condition ?? "",
        externalReference: example.issue
          ? `DEMO-ULTIMO-${departmentIndex + 1}-${index + 1}`
          : "",
        challenge: example.issue ? example.title : "",
        cause: example.issue
          ? "Demonstration: suspected wear; initial cause requires confirmation."
          : "",
        measure: example.issue
          ? "Inspect the reported component, document findings and record the outcome."
          : "",
        dueDate: example.issue ? dayOffset(date, example.overdue ? 2 : 1) : "",
        feedbackDueDate: example.issue
          ? dayOffset(date, example.overdue ? 1 : 2)
          : "",
        discuss: ["safety", "performance", "problems"].includes(
          example.category,
        ),
      };
      const changes = (example.states ?? []).map((state, step) => ({
        actor: responsible.id,
        date: example.age ? dayOffset(date, step + 1) : date,
        action: "follow-up",
        state,
        note: `[DEMO] ${
          state === "resolved"
            ? "Repair completed and functional test passed. Issue closed for this training scenario."
            : state === "open"
              ? "The symptom returned during the next shift. Reopened for further investigation; previous resolution retained."
              : example.overdue
                ? "Inspection completed. Replacement part requested; delivery and feedback are overdue."
                : "Inspection started. Responsibility accepted and findings recorded for the next shift."
        }`,
      }));
      if (example.highlight)
        changes.push({
          actor: coordinator,
          date,
          action: "highlight",
          highlighted: true,
          note: "[DEMO] Selected for the Start summary during the training walkthrough.",
        });
      const key =
        "iop173-" +
        createHash("sha256")
          .update(`${department.id}/${index}`)
          .digest("hex")
          .slice(0, 32);
      return {
        key,
        actor: author.id,
        content,
        issue: !!example.issue,
        responsibleId: example.issue ? responsible.id : "",
        changes,
      };
    }),
  );
}

// Existing application use cases own every write, state rule and permission check.
async function applyScenario(app, scenario, setDate) {
  const { actor, changes, ...request } = scenario;
  setDate(request.content.date, 0);
  let entry = await app.create(actor, request);
  const history = await app.history(actor, entry.id);
  const revisions = [...history.revisions].reverse();
  // Never replay over a user's later edits. Resume only an untouched fixture prefix.
  const prefixMatches =
    !history.nextBefore &&
    revisions.slice(1).every((revision, index) => {
      const expected = changes[index];
      return (
        expected &&
        revision.action === expected.action &&
        revision.note === expected.note &&
        revision.actorId === expected.actor &&
        (expected.state === undefined ||
          revision.entry.issueState === expected.state) &&
        (expected.highlighted === undefined ||
          revision.entry.highlighted === expected.highlighted)
      );
    });
  if (!prefixMatches) return { id: entry.id, result: "preserved" };
  let applied = 0;
  for (let index = entry.revision - 1; index < changes.length; index++) {
    const { actor: updateActor, date, ...change } = changes[index];
    setDate(date, index + 1);
    entry = await app.change(updateActor, {
      id: entry.id,
      expectedRevision: entry.revision,
      ...change,
    });
    applied++;
  }
  return { id: entry.id, result: applied ? "updated" : "unchanged" };
}

module.exports = { buildScenarios, applyScenario, dayOffset };
