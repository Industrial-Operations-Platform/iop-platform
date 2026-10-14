import { Improvements, type Transaction, type Store, type SaveAction } from "../src/modules/improvement-tracking/application/improvement";
import { ImprovementError, statuses, type Action, type Revision, type Evidence, type SavedComparison, type Measurement, type ComparisonSelection } from "../src/modules/improvement-tracking/domain/improvement";
export const input: SaveAction = {
  id: "improvement-1",
  expectedRevision: 0,
  reason: "",
  data: {
    title: "Reduce repeated drive alarms",
    hypothesis: "Inspect and adjust the guide.",
    locationId: "area",
    assetId: "asset",
    issueId: "issue",
    ownerId: "leader",
    dueDate: "2026-11-01",
    status: "planned",
    implementedDate: "",
    target: {
      objective: "Reduce reported frequency by 20% per observed reporting date.",
      metric: "frequency",
      reductionPercent: 20
    },
    result: "",
    blockedReason: "",
    cancellationReason: ""
  }
};
export const selection: ComparisonSelection = {
  before: {
    from: "2026-10-01",
    toExclusive: "2026-10-03"
  },
  after: {
    from: "2026-10-08",
    toExclusive: "2026-10-10"
  },
  scope: "asset",
  filters: {
    sector: "",
    area: "",
    equipment: "",
    message: ""
  }
};
export function measurement(s = selection): Measurement {
  return {
    sourceId: "source",
    siteTimeZone: "UTC",
    publicationRevision: "revision",
    profileVersion: "profile",
    selection: s,
    aliases: [{
      code: "S-001",
      sector: "Warehouse",
      area: "A1"
    }],
    mapped: true,
    before: {
      ...s.before,
      eligibleDates: [s.before.from, "2026-10-02"],
      admittedDates: [s.before.from, "2026-10-02"],
      missingDates: [],
      excludedDates: [],
      frequency: 10,
      alarmSeconds: 600,
      records: 2
    },
    after: {
      ...s.after,
      eligibleDates: [s.after.from, "2026-10-09"],
      admittedDates: [s.after.from, "2026-10-09"],
      missingDates: [],
      excludedDates: [],
      frequency: 6,
      alarmSeconds: 360,
      records: 2
    }
  };
}
export function fixture() {
  const actions = new Map<string, Action>(),
    revisions: Revision[] = [],
    evidence = new Map<string, Evidence>(),
    comparisons = new Map<string, SavedComparison>();
  let failSave = false,
    denied = false;
  let measure = measurement();
  let tick = 0;
  const people = [{
    id: "admin",
    name: "Administrator"
  }, {
    id: "leader",
    name: "Team Leader"
  }, {
    id: "taskforce",
    name: "Task Force"
  }, {
    id: "contributor",
    name: "Contributor"
  }];
  const names = new Map(people.map(p => [p.id, p.name]));
  const asset = {
    id: "asset",
    name: "Drive",
    code: "S-001",
    status: "validated",
    aliases: [{
      namespace: "analytics",
      sourceId: "source",
      code: "S-001",
      sector: "Warehouse",
      area: "A1"
    }]
  };
  const issue = {
    id: "issue",
    title: "Drive alarm",
    state: "open",
    revision: 1,
    equipmentCode: "S-001",
    area: "A1"
  };
  const store: Store = {
    run: async (actor, permission, work) => {
      if (denied || !names.has(actor)) throw new ImprovementError("improvement_denied");
      const staged = structuredClone(actions),
        history: Revision[] = [],
        notes = structuredClone(evidence),
        results = structuredClone(comparisons);
      const tx: Transaction = {
        canContribute: true,
        canCoordinate: actor !== "contributor",
        people: async () => people,
        names: async ids => new Map(ids.filter(id => names.has(id)).map(id => [id, names.get(id)!])),
        assets: async () => [asset],
        asset: async id => id === "asset" ? asset : null,
        issues: async () => ({
          issues: [issue],
          nextCursor: ""
        }),
        issue: async id => id === "issue" ? issue : null,
        get: async id => staged.get(id) ?? null,
        creation: async id => revisions.find(r => r.action.id === id && r.action.revision === 1) ?? null,
        save: async (a, r) => {
          if (failSave) throw new Error("Synthetic storage failure");
          staged.set(a.id, structuredClone(a));
          history.push(structuredClone(r));
        },
        query: async s => {
          const all = [...staged.values()],
            matching = all.filter(a => (!s.status || a.data.status === s.status) && (!s.ownerId || a.data.ownerId === s.ownerId));
          return {
            actions: matching,
            total: matching.length,
            statusCounts: Object.fromEntries(statuses.map(status => [status, all.filter(a => a.data.status === status).length])) as Record<typeof statuses[number], number>,
            nextCursor: ""
          };
        },
        history: async (id, before, limit) => ({
          revisions: revisions.filter(r => r.action.id === id && (!before || r.action.revision < before)).reverse().slice(0, limit),
          nextBefore: 0
        }),
        evidence: async id => notes.get(id) ?? null,
        correctionExists: async id => [...notes.values()].some(e => e.supersedesId === id),
        addEvidence: async e => {
          notes.set(e.id, structuredClone(e));
        },
        evidencePage: async id => ({
          evidence: [...notes.values()].filter(e => e.actionId === id),
          nextCursor: ""
        }),
        comparison: async id => results.get(id) ?? null,
        addComparison: async c => {
          results.set(c.id, structuredClone(c));
        },
        comparisonPage: async id => ({
          comparisons: [...results.values()].filter(c => c.actionId === id),
          nextCursor: ""
        }),
        measure: async s => ({
          ...structuredClone(measure),
          selection: structuredClone(s)
        })
      };
      const result = await work(tx);
      actions.clear();
      staged.forEach((v, k) => actions.set(k, v));
      revisions.push(...history);
      evidence.clear();
      notes.forEach((v, k) => evidence.set(k, v));
      comparisons.clear();
      results.forEach((v, k) => comparisons.set(k, v));
      return result;
    }
  };
  return {
    app: new Improvements(store, [{
      id: "area",
      parentId: "",
      label: "Drive line"
    }], () => new Date(Date.parse("2026-10-14T12:00:00.000Z") + tick++).toISOString()),
    actions,
    revisions,
    evidence,
    comparisons,
    setFailure: (v: boolean) => {
      failSave = v;
    },
    setDenied: (v: boolean) => {
      denied = v;
    },
    setMeasurement: (v: Measurement) => {
      measure = v;
    }
  };
}
