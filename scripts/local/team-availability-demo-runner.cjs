const weekStart = "2026-10-19", weekEnd = "2026-10-25";
const stable = value => JSON.stringify(value, (_, item) => item && typeof item === "object" && !Array.isArray(item)
  ? Object.fromEntries(Object.keys(item).sort().map(key => [key, item[key]])) : item);
const same = (a, b) => stable(a) === stable(b);
const snapshot = record => record && structuredClone({ kind: record.kind, id: record.id, revision: record.revision, deleted: !!record.deleted, data: record.data });
const finalSchedule = change => ({ ...change.before, revision: change.before.revision + 1, data: change.after });
const removedAssignment = change => ({ ...change.assignment, revision: change.assignment.revision + 1, deleted: true });

/** Only the earlier exercise's exact, untouched synthetic days qualify. */
function prepareChanges(board, original, groups, clock, formal) {
  if (groups.teams?.length !== 4 || new Set(groups.teams.map(team => team.id)).size !== 4)
    throw new Error("The exercise requires four explicit existing primary teams.");
  const changes = [], teams = [];
  for (const [index, requested] of groups.teams.entries()) {
    const team = board.settings.teams.find(team => team.id === requested.id && team.leaderId === requested.leaderId);
    if (!team || !board.people.some(person => person.id === team.leaderId && person.profile === "team-leader"))
      throw new Error("An explicit primary team or active Team Leader is unavailable.");
    teams.push(structuredClone(team));
    const members = board.records.filter(record => record.kind === "worker" && !record.deleted && record.data.teamId === team.id &&
      board.people.some(person => person.id === record.id && !["administrator", "team-leader"].includes(person.profile)))
      .sort((a, b) => a.id.localeCompare(b.id));
    const eligible = members.filter(member => ["2026-10-21", "2026-10-22"].every(date => {
      const day = original.week.schedules.find(week => week.userId === member.id)?.days.find(day => day.date === date);
      const schedule = board.records.find(record => record.kind === "schedule" && record.id === `${member.id}_${date}`);
      const assignments = board.records.filter(record => record.kind === "assignment" && record.data.userId === member.id && record.data.date === date);
      const owned = original.week.assignments.find(record => record.data.userId === member.id && record.data.date === date);
      if (!day || day.expectedRevision !== 0 || day.status !== "work" || !schedule || schedule.deleted || schedule.revision !== 1 || assignments.length !== 1 ||
        !owned?.id.startsWith("iop217-") || owned.revision !== 1 || !same(snapshot(assignments[0]), snapshot(owned))) return false;
      const expected = { userId: member.id, date, status: day.status, start: day.start, end: day.end,
        ...clock.interval(date, day.start, day.end, board.timeZone), source: "manual" };
      return same(schedule.data, expected);
    }));
    if (eligible.length < 2) throw new Error("A primary team needs two untouched IOP-217 synthetic workers; existing decisions are preserved.");
    for (const [member, date, status] of [[eligible[0], "2026-10-21", "vacation"], [eligible[1], "2026-10-21", "sick"],
      [eligible[0], "2026-10-22", ["training", "compensation", "accident", "maintenance"][index]]]) {
      if (formal.some(record => record.shift.date === date)) throw new Error("A demo date already has a Formal Handover binding.");
      const before = snapshot(board.records.find(record => record.kind === "schedule" && record.id === `${member.id}_${date}`));
      const assignment = snapshot(board.records.find(record => record.kind === "assignment" && record.data.userId === member.id && record.data.date === date));
      const working = ["training", "maintenance"].includes(status);
      changes.push({ teamId: team.id, userId: member.id, date, status, member: snapshot(member), before,
        after: { ...before.data, status, ...(working ? {} : { start: "", end: "", startsAt: "", endsAt: "" }) },
        assignment, removeAssignment: status !== "maintenance" });
    }
  }
  return { teams, changes };
}

function validChanges(manifest, original, clock, timeZone) {
  try {
    if (manifest.teams.length !== 4 || new Set(manifest.teams.map(team => team.id)).size !== 4 || manifest.changes.length !== 12 ||
      new Set(manifest.changes.map(change => change.before.id)).size !== 12) return false;
    return manifest.teams.every((team, index) => {
      const changes = manifest.changes.filter(change => change.teamId === team.id), vacation = changes.find(change => change.status === "vacation"), sick = changes.find(change => change.status === "sick");
      if (changes.length !== 3 || !vacation || !sick || vacation.userId === sick.userId || vacation.date !== "2026-10-21" || sick.date !== "2026-10-21" ||
        !changes.some(change => change.status === ["training", "compensation", "accident", "maintenance"][index] && change.date === "2026-10-22" && change.userId === vacation.userId)) return false;
      return changes.every(change => {
        const day = original.week.schedules.find(week => week.userId === change.userId)?.days.find(day => day.date === change.date);
        const owned = original.week.assignments.find(record => record.data.userId === change.userId && record.data.date === change.date);
        if (!day || day.status !== "work" || day.expectedRevision !== 0 || !owned?.id.startsWith("iop217-") || owned.revision !== 1 || owned.deleted ||
          change.member.kind !== "worker" || change.member.id !== change.userId || change.member.deleted || change.member.data.userId !== change.userId || change.member.data.teamId !== team.id) return false;
        const data = { userId: change.userId, date: change.date, status: "work", start: day.start, end: day.end, ...clock.interval(change.date, day.start, day.end, timeZone), source: "manual" };
        const working = ["training", "maintenance"].includes(change.status);
        return same(change.before, { kind: "schedule", id: `${change.userId}_${change.date}`, revision: 1, deleted: false, data }) &&
          same(change.assignment, snapshot(owned)) && change.removeAssignment === (change.status !== "maintenance") &&
          same(change.after, { ...data, status: change.status, ...(working ? {} : { start: "", end: "", startsAt: "", endsAt: "" }) });
      });
    });
  } catch { return false; }
}

/** Later edits, extra duties and different history are authoritative, never replayed. */
function changeState(board, change, histories, formal, actor, team) {
  const preserved = reason => ({ state: "preserved", reason });
  const currentTeam = board.settings.teams.find(item => item.id === change.teamId);
  if (!same(currentTeam, team) || !board.people.some(person => person.id === team.leaderId && person.profile === "team-leader") ||
    !board.people.some(person => person.id === change.userId && !["administrator", "team-leader"].includes(person.profile)) ||
    !same(snapshot(board.records.find(record => record.kind === "worker" && record.id === change.userId)), change.member))
    return preserved("Team membership or directory changed.");
  const schedule = snapshot(board.records.find(record => record.kind === "schedule" && record.id === change.before.id));
  const assigned = board.records.filter(record => record.kind === "assignment" && record.data.userId === change.userId && record.data.date === change.date);
  if (assigned.length !== 1 || assigned[0].id !== change.assignment.id) return preserved("The day's duties changed.");
  const assignment = snapshot(assigned[0]);
  const initial = same(schedule, change.before), completed = same(schedule, finalSchedule(change));
  const active = same(assignment, change.assignment), removed = change.removeAssignment && same(assignment, removedAssignment(change));
  if ((!initial && !completed) || (!active && !removed) || (completed && change.removeAssignment && !removed))
    return preserved("Availability or assignment was edited.");
  const expectedHistory = (kind, before, after, action) => {
    const actual = histories[`${kind}/${before.id}`] ?? [];
    const expected = after ? [before, after] : [before];
    return actual.length === expected.length && actual.every(revision => {
      const index = revision.record.revision - 1;
      return revision.actorId === actor && revision.action === (index ? action : "saved") && same(snapshot(revision.record), expected[index]);
    });
  };
  if (!expectedHistory("schedule", change.before, completed ? finalSchedule(change) : null, "saved") ||
    !expectedHistory("assignment", change.assignment, removed ? removedAssignment(change) : null, "deleted"))
    return preserved("The retained history differs from this exercise.");
  if (completed) return { state: "completed" };
  if (formal.some(record => record.shift.date === change.date || record.shift.assignments.some(item => item.id === change.assignment.id)))
    return preserved("A Formal Handover now binds this day or duty.");
  return { state: removed ? "resumable" : "pending" };
}

async function applyChange(app, actor, change, readState) {
  let state = await readState();
  if (!["pending", "resumable"].includes(state.state)) return { ...state, schedulesChanged: 0, assignmentsRemoved: 0 };
  let assignmentsRemoved = 0;
  if (change.removeAssignment && state.state === "pending") {
    await app.save(actor, { kind: "assignment", id: change.assignment.id, expectedRevision: change.assignment.revision,
      deleted: true, data: change.assignment.data });
    assignmentsRemoved++;
    state = await readState();
    if (state.state !== "resumable") return { ...state, schedulesChanged: 0, assignmentsRemoved };
  }
  const result = await app.saveWeek(actor, { userId: change.userId, weekStart, days: [{ date: change.date, status: change.status,
    start: change.after.start, end: change.after.end, expectedRevision: change.before.revision }] });
  return { state: "completed", schedulesChanged: result.changed, assignmentsRemoved };
}

async function run(options) {
  const { resolve } = require("node:path"), { Pool } = require("pg"), { createHash } = require("node:crypto"), env = process.env;
  const compiled = path => require(resolve("dist", path));
  if (env.IOP_EXECUTION_MODE !== "local-container" || env.IOP_AUTHENTICATION !== "password" || env.IOP_DATABASE_HOST !== "database" || env.IOP_DATABASE_NAME !== "iop_local")
    throw new Error("Team availability demos require the local password-authenticated Docker installation.");
  const { PlatformRuntime, readLocalIdentityConfiguration } = compiled("host/runtime"), { accessTransaction } = compiled("persistence/access-transaction"),
    { startupAdministrator } = compiled("modules/users-rbac/adapters/postgres/administration"), { runSiteOperation } = compiled("persistence/site-operation"),
    { IntlSiteClock } = compiled("modules/workforce/adapters/time/site-clock");
  const config = readLocalIdentityConfiguration(env);
  if (!config) throw new Error("Local configuration is unavailable.");
  const pool = new Pool({ host: "database", port: Number(env.IOP_DATABASE_PORT), database: "iop_local", user: "iop_runtime", password: env.IOP_RUNTIME_PASSWORD,
    max: 2, connectionTimeoutMillis: 5000, statement_timeout: 30000, application_name: "iop-team-availability-demo", options: "-c search_path=pg_catalog -c lock_timeout=5000" });
  try {
    const runtime = new PlatformRuntime(pool, config), scope = { organizationId: runtime.source.organizationId, siteId: runtime.source.siteId, sourceId: runtime.source.sourceId };
    const actor = await accessTransaction(pool, scope, tx => startupAdministrator(tx, scope));
    if (!actor) throw new Error("A current scoped Administrator is required.");
    const digest = value => createHash("sha256").update(stable(value)).digest("hex");
    const original = options.original;
    if (original?.version !== 1 || original.actor !== actor || !same(original.scope, scope) || !Array.isArray(original.week?.schedules) || !Array.isArray(original.week?.assignments))
      throw new Error("Retain the original scoped IOP-217 operational demo manifest.");
    const load = async manifest => {
      const board = await runtime.workforce.board(actor, weekStart, weekEnd);
      const retained = await runSiteOperation(pool, { ...scope, userId: actor, permissions: ["workforce.read", "handover.records.manage"] }, async tx => {
        const rows = async (table, columns, order) => (await tx.query(`SELECT ${columns} FROM ${table} WHERE organization_id=$1 AND site_id=$2 ORDER BY ${order}`,
          [scope.organizationId, scope.siteId])).rows;
        const records = await rows("workforce.records", "kind,id,snapshot", "kind,id"), revisions = await rows("workforce.revisions", "kind,id,revision,snapshot", "kind,id,revision");
        const formal = await rows("shift_handover.records", "id,snapshot", "id"), formalHistory = await rows("shift_handover.record_revisions", "record_id,revision,snapshot", "record_id,revision");
        const own = new Set((manifest?.changes ?? []).flatMap(change => [`schedule/${change.before.id}`, ...(change.removeAssignment ? [`assignment/${change.assignment.id}`] : [])]));
        return { records, revisions, formal: formal.map(row => row.snapshot), formalDigest: digest([formal, formalHistory]),
          unownedDigest: digest([records.filter(row => !own.has(`${row.kind}/${row.id}`)), revisions.filter(row => !own.has(`${row.kind}/${row.id}`)), formal, formalHistory]) };
      });
      board.records = retained.records.filter(row => ["worker", "settings"].includes(row.kind) || row.snapshot.data.date >= weekStart && row.snapshot.data.date <= weekEnd).map(row => row.snapshot);
      const histories = Object.fromEntries((manifest?.changes ?? []).flatMap(change => [change.before, change.assignment]).map(record =>
        [`${record.kind}/${record.id}`, retained.revisions.filter(row => row.kind === record.kind && row.id === record.id).map(row => row.snapshot)]));
      return { board, histories, ...retained };
    };
    if (options.action === "prepare") {
      if (options.groups?.organizationId !== scope.organizationId || options.groups?.siteId !== scope.siteId)
        throw new Error("Primary group scope does not match this installation.");
      const current = await load(null), prepared = prepareChanges(current.board, original, options.groups, new IntlSiteClock(), current.formal);
      const manifest = { version: 1, scope, actor, weekStart, weekEnd, originalDigest: digest(original), ...prepared };
      const baseline = await load(manifest);
      for (const change of manifest.changes) if (changeState(baseline.board, change, baseline.histories, baseline.formal, actor, manifest.teams.find(team => team.id === change.teamId)).state !== "pending")
        throw new Error("Synthetic availability history changed; no application records were written.");
      return { ...manifest, baseline: { unownedDigest: baseline.unownedDigest, formalDigest: baseline.formalDigest } };
    }
    const manifest = options.manifest;
    if (manifest?.version !== 1 || !same(manifest.scope, scope) || manifest.actor !== actor || manifest.weekStart !== weekStart || manifest.weekEnd !== weekEnd ||
      manifest.originalDigest !== digest(original) || !validChanges(manifest, original, new IntlSiteClock(), runtime.source.siteTimeZone))
      throw new Error("Team availability manifest does not match this exercise.");
    const describe = current => manifest.changes.map(change => ({ teamId: change.teamId, userId: change.userId,
      name: current.board.people.find(person => person.id === change.userId)?.name ?? "", date: change.date, status: change.status,
      ...changeState(current.board, change, current.histories, current.formal, actor, manifest.teams.find(team => team.id === change.teamId)) }));
    const before = await load(manifest), changes = describe(before), results = [];
    if (options.action === "apply") {
      // Check every frozen row before the first write; recheck each sequence before mutation.
      for (const [index, change] of manifest.changes.entries()) {
        if (changes[index].state === "preserved") { results.push({ ...changes[index], schedulesChanged: 0, assignmentsRemoved: 0 }); continue; }
        const result = await applyChange(runtime.workforce, actor, change, async () => {
          const current = await load(manifest);
          return changeState(current.board, change, current.histories, current.formal, actor, manifest.teams.find(team => team.id === change.teamId));
        });
        results.push({ teamId: change.teamId, userId: change.userId, date: change.date, status: change.status, ...result });
      }
    } else if (!["preview", "inspect"].includes(options.action)) throw new Error("Unknown team availability demo action.");
    const after = options.action === "apply" ? await load(manifest) : before;
    if (after.unownedDigest !== before.unownedDigest || after.formalDigest !== before.formalDigest)
      throw new Error("Unrelated Workforce or Formal Handover records changed during application; inspect concurrent activity.");
    return { weekStart, weekEnd, writes: options.action === "apply", teams: manifest.teams.map(team => ({ id: team.id, label: team.label, leaderId: team.leaderId,
      members: after.board.records.filter(record => record.kind === "worker" && !record.deleted && record.data.teamId === team.id).length })),
      changes: describe(after), plannedScheduleChanges: 12, plannedAssignmentRemovals: manifest.changes.filter(change => change.removeAssignment).length,
      schedulesChanged: results.reduce((sum, result) => sum + result.schedulesChanged, 0), assignmentsRemoved: results.reduce((sum, result) => sum + result.assignmentsRemoved, 0),
      existingUnchanged: after.unownedDigest === manifest.baseline.unownedDigest, formalUnchanged: after.formalDigest === manifest.baseline.formalDigest, results };
  } finally { await pool.end(); }
}

module.exports = { weekStart, weekEnd, same, snapshot, finalSchedule, removedAssignment, prepareChanges, validChanges, changeState, applyChange, run };
