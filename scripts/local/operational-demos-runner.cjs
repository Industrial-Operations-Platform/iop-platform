const prefix = "iop217-";
const marker = "[DEMO] ";
const weekStart = "2026-10-19", weekEnd = "2026-10-25";
const dayAfter = (day, offset = 1) => new Date(Date.parse(day + "T12:00:00Z") + offset * 86400000).toISOString().slice(0, 10);
const stable = value => JSON.stringify(value, (_, item) => item && typeof item === "object" && !Array.isArray(item)
  ? Object.fromEntries(Object.keys(item).sort().map(key => [key, item[key]])) : item);
const same = (a, b) => stable(a) === stable(b);

/** Missing days only; current schedules, absences, assignments and configuration are authoritative. */
function prepareWeek(board, clock, identity) {
  const records = board.records.filter(record => !record.deleted);
  const retained = board.records;
  const schedules = [], assignments = [];
  const people = board.people.slice().sort((a, b) => a.id.localeCompare(b.id));
  if (!people.length || !board.settings.shifts.length || !board.settings.targets.length)
    throw new Error("Operational demos require existing active users, configured shifts and targets.");
  const allSchedules = records.filter(record => record.kind === "schedule").map(record => record.data);
  for (const [index, person] of people.entries()) {
    const missing = [];
    for (let offset = 0; offset < 7; offset++) {
      const date = dayAfter(weekStart, offset);
      // Logical deletion is an explicit retained user decision, not an unknown day.
      if (retained.some(record => record.kind === "schedule" && record.id === `${person.id}_${date}`)) continue;
      const candidates = board.settings.shifts.filter(shift => shift.days.includes(new Date(date).getUTCDay()));
      const ordered = candidates.slice(index % Math.max(candidates.length, 1)).concat(candidates.slice(0, index % Math.max(candidates.length, 1)));
      const shift = offset < 5 ? ordered.find(item => {
        const interval = clock.interval(date, item.start, item.end, board.timeZone);
        return !allSchedules.some(s => s.userId === person.id && s.startsAt && interval.startsAt < s.endsAt && s.startsAt < interval.endsAt);
      }) : undefined;
      const row = { date, status: shift ? "work" : "off", start: shift?.start ?? "", end: shift?.end ?? "", expectedRevision: 0 };
      missing.push(row);
      allSchedules.push({ ...row, userId: person.id, ...(shift ? clock.interval(date, row.start, row.end, board.timeZone) : { startsAt: "", endsAt: "" }) });
    }
    if (missing.length) schedules.push({ userId: person.id, weekStart, days: missing });
    for (const schedule of allSchedules.filter(s => s.userId === person.id && s.date >= weekStart && s.date <= weekEnd && ["work", "maintenance"].includes(s.status))) {
      if (retained.some(r => r.kind === "assignment" && r.data.userId === person.id && r.data.date === schedule.date)) continue;
      const shift = board.settings.shifts.find(s => s.days.includes(new Date(schedule.date).getUTCDay()) && (() => {
        const interval = clock.interval(schedule.date, s.start, s.end, board.timeZone);
        return interval.startsAt >= schedule.startsAt && interval.endsAt <= schedule.endsAt;
      })());
      if (!shift) continue;
      const interval = clock.interval(schedule.date, shift.start, shift.end, board.timeZone);
      if (records.some(r => r.kind === "assignment" && r.data.userId === person.id && interval.startsAt < r.data.endsAt && r.data.startsAt < interval.endsAt)) continue;
      const worker = records.find(r => r.kind === "worker" && r.id === person.id);
      const target = board.settings.targets.find(t => t.id === worker?.data.homeTargetId) ?? board.settings.targets[index % board.settings.targets.length];
      const duty = person.profile === "team-leader" ? "leader" : "zone";
      assignments.push({ kind: "assignment", id: identity(`${person.id}/${schedule.date}`), revision: 1, deleted: false,
        data: { userId: person.id, date: schedule.date, shiftId: shift.id, targetId: duty === "zone" ? target.id : "", duty, phone: "",
          start: shift.start, end: shift.end, ...interval, shiftLabel: shift.label, targetLabel: duty === "zone" ? target.label : "", phoneLabel: "" } });
    }
  }
  return { people: people.map(p => ({ id: p.id, profile: p.profile })), schedules, assignments };
}

function improvementScenarios({ locationId, assetId, issueId, ownerId, comparison }) {
  return ["planned", "in-progress", "blocked", "implemented", "evaluated", "cancelled"].map(status => {
    const data = { title: marker + ({ planned: "Plan a guide inspection", "in-progress": "Investigate repeated stops", blocked: "Await a replacement guide", implemented: "Complete a guide adjustment", evaluated: "Review observed alarm frequency", cancelled: "Cancel a duplicate proposal" })[status],
      hypothesis: "Fictional training proposal: inspect guide alignment. Existing analytical observations are used only to demonstrate comparison; no intervention or causal improvement is asserted.",
      locationId, assetId, issueId, ownerId, dueDate: weekEnd, status: "planned", implementedDate: "",
      target: { objective: "Training target: reduce reported frequency per observed reporting date by 20%; no achieved improvement is asserted.", metric: "frequency", reductionPercent: 20 },
      result: "", blockedReason: "", cancellationReason: "" };
    const steps = [], path = status === "planned" ? [] : status === "cancelled" ? ["cancelled"] : status === "blocked" ? ["in-progress", "blocked"] : status === "in-progress" ? [status] : ["in-progress", "implemented", ...(status === "evaluated" ? ["evaluated"] : [])];
    let next = data;
    for (const state of path) {
      next = { ...next, status: state, implementedDate: ["implemented", "evaluated"].includes(state) ? weekStart : "",
        blockedReason: state === "blocked" ? marker + "Fictional replacement part awaiting delivery." : "",
        cancellationReason: state === "cancelled" ? marker + "Duplicate training proposal; no actual work cancelled." : "",
        result: state === "evaluated" ? marker + "Training review completed. Comparison describes source observations and does not establish causality." : "" };
      steps.push({ type: "save", data: next, reason: marker + `Training transition to ${state}.` });
    }
    if (status === "evaluated") {
      steps.push({ type: "evidence", id: prefix + "note", kind: "note", note: marker + "Fictional inspection note for the training walkthrough.", externalReference: "DEMO-INSPECTION", supersedesId: "" });
      steps.push({ type: "evidence", id: prefix + "result", kind: "result", note: marker + "Fictional adjustment result; no actual equipment change is asserted.", externalReference: "DEMO-RESULT", supersedesId: "" });
      steps.push({ type: "evidence", id: prefix + "correction", kind: "result", note: marker + "Correction: this result is synthetic training evidence. Retain the original note as history.", externalReference: "DEMO-CORRECTION", supersedesId: prefix + "result" });
      steps.push({ type: "comparison", id: prefix + "comparison", selection: comparison,
        note: marker + "Real retained source observations, selected for a fictional training exercise. Coverage is shown explicitly; this comparison does not establish an intervention effect." });
    }
    return { id: prefix + status, data, reason: marker + "Create a fictional Improvement Tracking scenario.", steps };
  });
}

function withAsset(scenario, assetId) {
  return { ...scenario, data: { ...scenario.data, assetId }, steps: scenario.steps.map(step => step.type === "save" ? { ...step, data: { ...step.data, assetId } } : step) };
}

/** Resume only the untouched planned history prefix; later user edits are preserved. */
async function resumeImprovement(app, actor, scenario) {
  let action = await app.save(actor, { id: scenario.id, expectedRevision: 0, reason: scenario.reason, data: scenario.data });
  const history = await app.history(actor, scenario.id, 0, 100), revisions = history.revisions.slice().reverse();
  if (history.nextBefore || revisions.length > scenario.steps.length + 1) return { id: action.id, result: "preserved" };
  let expectedData = scenario.data;
  for (let index = 0; index < revisions.length; index++) {
    const revision = revisions[index], step = scenario.steps[index - 1];
    if (step?.type === "save") expectedData = step.data;
    const reason = index === 0 ? scenario.reason : step?.type === "save" ? step.reason : step?.type === "comparison" ? step.note : step?.supersedesId ? "Evidence correction added." : "Evidence added.";
    if (revision.actorId !== actor || !same(revision.action.data, expectedData) || revision.reason !== reason ||
      (index > 0 && (revision.referenceId !== (step.type === "save" ? "" : step.id)))) return { id: action.id, result: "preserved" };
  }
  let changed = 0;
  for (const step of scenario.steps.slice(revisions.length - 1)) {
    if (step.type === "save") action = await app.save(actor, { id: action.id, expectedRevision: action.revision, reason: step.reason, data: step.data });
    else if (step.type === "evidence") { const { type, ...input } = step; action = (await app.addEvidence(actor, { ...input, actionId: action.id, expectedRevision: action.revision })).action; }
    else { const { type, ...input } = step; await app.compare(actor, { actionId: action.id, expectedRevision: action.revision, selection: input.selection });
      action = (await app.saveComparison(actor, { ...input, actionId: action.id, expectedRevision: action.revision })).action; }
    changed++;
  }
  return { id: action.id, status: action.data.status, result: changed ? "completed" : "unchanged" };
}

async function resumeFormal(app, actor, acknowledgementActor, scenario) {
  let record = await app.save(actor, { key: scenario.key, id: "", expectedRevision: 0, note: marker + "Create a fictional formal transfer.", content: scenario.content });
  const history = await app.history(actor, record.id), revisions = history.revisions.slice().reverse();
  const steps = [
    { action: "publish", actor, event: "published", note: marker + "Reviewed the selected report snapshots for training." },
    { action: "close", actor, event: "closed", note: marker + "Fictional transfer completed; pending reports are retained without resolving live journal issues." },
    { action: "acknowledge", actor: acknowledgementActor, event: "acknowledged", note: marker + "Incoming manager reviewed this fictional closed transfer and its retained evidence." },
  ].slice(0, { draft: 0, open: 1, closed: 2, acknowledged: 3 }[scenario.state]);
  if (history.nextBefore || revisions.length > steps.length + 1 || revisions.slice(1).some((revision, index) =>
    revision.action !== steps[index]?.event || revision.actorId !== steps[index]?.actor || revision.note !== steps[index]?.note))
    return { id: record.id, result: "preserved" };
  let changed = 0;
  for (const step of steps.slice(revisions.length - 1)) { record = await app.transition(step.actor, { id: record.id, expectedRevision: record.revision, action: step.action, note: step.note }); changed++; }
  return { id: record.id, state: record.state, acknowledgements: record.acknowledgements.length, result: changed ? "completed" : "unchanged" };
}

async function run(options) {
  const { resolve } = require("node:path"), { Pool } = require("pg"), { createHash } = require("node:crypto");
  const compiled = path => require(resolve("dist", path)), env = process.env;
  if (env.IOP_EXECUTION_MODE !== "local-container" || env.IOP_AUTHENTICATION !== "password" || env.IOP_DATABASE_HOST !== "database" || env.IOP_DATABASE_NAME !== "iop_local")
    throw new Error("Operational demos require the local password-authenticated Docker installation.");
  const { PlatformRuntime, readLocalIdentityConfiguration } = compiled("host/runtime"), { accessTransaction } = compiled("persistence/access-transaction"),
    { startupAdministrator } = compiled("modules/users-rbac/adapters/postgres/administration"), { runSiteOperation } = compiled("persistence/site-operation"),
    { IntlSiteClock } = compiled("modules/workforce/adapters/time/site-clock"), { projectShifts } = compiled("modules/workforce/domain/shift-reference"),
    { hitlisteReadModel } = compiled("modules/oip/adapters/postgres/read-model"),
    { workforcePeople } = compiled("modules/users-rbac/adapters/postgres/site-people");
  const config = readLocalIdentityConfiguration(env);
  if (!config) throw new Error("Local configuration is unavailable.");
  const pool = new Pool({ host: "database", port: Number(env.IOP_DATABASE_PORT), database: "iop_local", user: "iop_runtime", password: env.IOP_RUNTIME_PASSWORD,
    max: 2, connectionTimeoutMillis: 5000, statement_timeout: 30000, application_name: "iop-operational-demos", options: "-c search_path=pg_catalog -c lock_timeout=5000" });
  try {
    const runtime = new PlatformRuntime(pool, config), scope = { organizationId: runtime.source.organizationId, siteId: runtime.source.siteId, sourceId: runtime.source.sourceId };
    const actor = await accessTransaction(pool, scope, tx => startupAdministrator(tx, scope));
    if (!actor) throw new Error("A current scoped Administrator is required.");
    const digest = value => createHash("sha256").update(JSON.stringify(value)).digest("hex"), identity = value => prefix + digest(value).slice(0, 40);
    const retainedBoard = async (from, to) => {
      const board = await runtime.workforce.board(actor, from, to);
      const deleted = await runSiteOperation(pool, { ...scope, userId: actor, permissions: ["workforce.read"] }, async tx =>
        (await tx.query("SELECT snapshot FROM workforce.records WHERE organization_id=$1 AND site_id=$2 AND kind IN ('schedule','assignment') AND business_date BETWEEN $3::date AND $4::date AND snapshot->>'deleted'='true' ORDER BY kind,id",
          [scope.organizationId, scope.siteId, from, to])).rows.map(row => row.snapshot));
      return { ...board, records: [...board.records, ...deleted] };
    };
    const inspect = async manifest => runSiteOperation(pool, { ...scope, userId: actor, permissions: ["workforce.read", "improvement.read", "handover.records.manage", "analytics.read", "assets.read"] }, async tx => {
      const rows = async (table, columns, order) => (await tx.query(`SELECT ${columns} FROM ${table} WHERE organization_id=$1 AND site_id=$2 ORDER BY ${order}`, [scope.organizationId, scope.siteId])).rows;
      const workforce = await rows("workforce.records", "kind,id,snapshot", "kind,id"), workRevisions = await rows("workforce.revisions", "kind,id,revision,snapshot", "kind,id,revision");
      const scheduleIds = new Set((manifest?.week.schedules ?? []).flatMap(week => week.days.map(day => `${week.userId}_${day.date}`))),
        assignmentIds = new Set((manifest?.week.assignments ?? []).map(record => record.id));
      const ownedWork = row => row.kind === "schedule" ? scheduleIds.has(row.id) : row.kind === "assignment" && assignmentIds.has(row.id);
      const improvements = await rows("improvement.actions", "id,snapshot", "id"), improvementRevisions = await rows("improvement.revisions", "action_id,revision,snapshot", "action_id,revision"),
        evidence = await rows("improvement.evidence", "id,action_id,snapshot", "id"), comparisons = await rows("improvement.comparisons", "id,action_id,snapshot", "id");
      const formal = await rows("shift_handover.records", "id,request_key,snapshot", "id"), formalRevisions = await rows("shift_handover.record_revisions", "record_id,revision,snapshot", "record_id,revision");
      const ownFormalIds = new Set(formal.filter(row => row.request_key.startsWith(prefix)).map(row => row.id));
      const assets = await rows("assets.records", "id,request_key,snapshot", "id"), assetRevisions = await rows("assets.revisions", "asset_id,revision,snapshot", "asset_id,revision"),
        aliases = await rows("assets.aliases", "asset_id,alias_key,active", "asset_id,alias_key");
      const ownAssetIds = new Set(assets.filter(row => row.request_key.startsWith(prefix)).map(row => row.id));
      const analytic = (await tx.query("SELECT count(*)::integer AS records,coalesce(sum(haufigkeit),0)::text AS frequency,coalesce(sum(dauer_sekunden),0)::text AS seconds FROM analytics.fact_hitliste WHERE organization_id=$1 AND site_id=$2 AND source_id=$3", Object.values(scope))).rows[0];
      const publications = (await tx.query("SELECT import_id,reporting_date::text FROM oip.publications WHERE organization_id=$1 AND site_id=$2 AND source_id=$3 ORDER BY import_id", Object.values(scope))).rows;
      const journal = await rows("shift_handover.entries", "id,snapshot", "id"), journalRevisions = await rows("shift_handover.revisions", "entry_id,revision,snapshot", "entry_id,revision");
      const originalDigest = digest([workforce.filter(row => !ownedWork(row)), workRevisions.filter(row => !ownedWork(row)), improvements.filter(row => !row.id.startsWith(prefix)),
        improvementRevisions.filter(row => !row.action_id.startsWith(prefix)), evidence.filter(row => !row.action_id.startsWith(prefix)), comparisons.filter(row => !row.action_id.startsWith(prefix)),
        formal.filter(row => !ownFormalIds.has(row.id)), formalRevisions.filter(row => !ownFormalIds.has(row.record_id)),
        assets.filter(row => !ownAssetIds.has(row.id)), assetRevisions.filter(row => !ownAssetIds.has(row.asset_id)), aliases.filter(row => !ownAssetIds.has(row.asset_id)), journal, journalRevisions, analytic, publications]);
      const people = await workforcePeople(tx, scope.organizationId, scope.siteId), activeIds = new Set(people.map(person => person.id));
      const schedules = workforce.filter(row => row.kind === "schedule" && !row.snapshot.deleted && row.snapshot.data.date >= weekStart && row.snapshot.data.date <= weekEnd && activeIds.has(row.snapshot.data.userId));
      const assigned = workforce.filter(row => row.kind === "assignment" && !row.snapshot.deleted && row.snapshot.data.date >= weekStart && row.snapshot.data.date <= weekEnd && activeIds.has(row.snapshot.data.userId));
      const working = schedules.filter(row => ["work", "maintenance"].includes(row.snapshot.data.status));
      const hasAssignment = schedule => assigned.some(row => row.snapshot.data.userId === schedule.userId && row.snapshot.data.date === schedule.date);
      const usersWithoutAssignments = people.filter(person => !assigned.some(row => row.snapshot.data.userId === person.id)).map(person => person.id);
      return { originalDigest, analytics: analytic, publications: publications.length, activeUsers: people.length,
        activeUsersMatchManifest: same(people.map(person => person.id).sort(), (manifest?.week.people ?? []).map(person => person.id).sort()),
        scheduledUsers: new Set(schedules.map(row => row.snapshot.data.userId)).size, weeklySchedules: schedules.length,
        fullyScheduledUsers: people.filter(person => schedules.filter(row => row.snapshot.data.userId === person.id).length === 7).length,
        assignedUsers: new Set(assigned.map(row => row.snapshot.data.userId)).size, workingUserDays: working.length,
        assignedWorkingUserDays: working.filter(row => hasAssignment(row.snapshot.data)).length,
        unassignedWorkingUserDays: working.filter(row => !hasAssignment(row.snapshot.data)).length,
        usersWithoutAssignments: usersWithoutAssignments.length, usersWithoutAssignmentIds: usersWithoutAssignments,
        workingUsersWithoutAssignments: usersWithoutAssignments.filter(id => working.some(row => row.snapshot.data.userId === id)).length,
        retainedDeletedWeeklySchedules: workforce.filter(row => row.kind === "schedule" && row.snapshot.deleted && row.snapshot.data.date >= weekStart && row.snapshot.data.date <= weekEnd && activeIds.has(row.snapshot.data.userId)).length,
        retainedDeletedWeeklyAssignments: workforce.filter(row => row.kind === "assignment" && row.snapshot.deleted && row.snapshot.data.date >= weekStart && row.snapshot.data.date <= weekEnd && activeIds.has(row.snapshot.data.userId)).length,
        demoAssignments: workforce.filter(row => row.kind === "assignment" && assignmentIds.has(row.id)).length,
        demoAssets: assets.filter(row => ownAssetIds.has(row.id)).map(row => ({ id: row.id, code: row.snapshot.content.code, name: row.snapshot.content.name, status: row.snapshot.content.status, aliases: row.snapshot.content.aliases.length })),
        improvements: improvements.filter(row => row.id.startsWith(prefix)).map(row => ({ id: row.id, status: row.snapshot.data.status, revision: row.snapshot.revision, assetId: row.snapshot.data.assetId, assetName: row.snapshot.assetName, issueId: row.snapshot.data.issueId })),
        evidence: evidence.filter(row => row.action_id.startsWith(prefix)).length, comparisons: comparisons.filter(row => row.action_id.startsWith(prefix)).map(row => row.snapshot.comparison),
        formal: formal.filter(row => ownFormalIds.has(row.id)).map(row => ({ id: row.id, state: row.snapshot.state, acknowledgements: row.snapshot.acknowledgements.length, revision: row.snapshot.revision })) };
    });
    let manifest = options.manifest;
    if (options.action === "prepare") {
      const board = await retainedBoard(dayAfter(weekStart, -1), dayAfter(weekEnd)), clock = new IntlSiteClock();
      const week = prepareWeek(board, clock, identity), catalog = await runtime.improvements.catalog(actor), formalContext = await runtime.formalHandover.context(actor);
      const other = board.people.find(person => person.id !== actor && ["administrator", "team-leader", "task-force"].includes(person.profile));
      if (!other) throw new Error("Formal acknowledgement demo requires a second existing active manager.");
      await runtime.formalHandover.context(other.id);
      const comparison = await runSiteOperation(pool, { ...scope, userId: actor, permissions: ["analytics.read"] }, async tx => {
        const row = (await tx.query(`WITH ready AS (${hitlisteReadModel}) SELECT values->>'sector' AS sector,min(reporting_date)::text AS first,max(reporting_date)::text AS last
          FROM ready WHERE extract(isodow FROM reporting_date)<>7 AND coalesce(values->>'sector','')<>'' GROUP BY values->>'sector'
          HAVING count(DISTINCT reporting_date)>1 ORDER BY count(DISTINCT reporting_date) DESC,values->>'sector' LIMIT 1`, Object.values(scope))).rows[0];
        if (!row) throw new Error("Comparison demo requires actual published analytical coverage on two eligible dates.");
        return { before: { from: row.first, toExclusive: dayAfter(row.first) }, after: { from: row.last, toExclusive: dayAfter(row.last) }, scope: "selection", filters: { sector: row.sector, area: "", equipment: "", message: "" } };
      });
      const shifts = projectShifts([...board.records.filter(record => record.kind === "assignment"), ...week.assignments]).map(({ key, ...shift }) => ({ ...shift, id: createHash("sha256").update(key).digest("hex").slice(0, 48) }));
      const existing = await runtime.formalHandover.query(actor, { from: weekStart, to: weekEnd, departmentId: "", areaId: "", cursor: "" });
      if (existing.nextCursor) throw new Error("Existing formal record set exceeds the local preparation bound.");
      const choices = shifts.filter(shift => !existing.records.some(record => record.shift.id === shift.id && record.content.areaId === "") && formalContext.locations.some(location => location.id === shift.targetId && location.role === "department"));
      const today = new Intl.DateTimeFormat("en-CA", { timeZone: board.timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
      const preferToday = (a, b) => Number(b.date === today) - Number(a.date === today) || a.startsAt.localeCompare(b.startsAt) || a.id.localeCompare(b.id);
      const past = choices.filter(shift => shift.startsAt <= new Date().toISOString()).sort(preferToday);
      if (past.length < 2 || choices.length < 4) throw new Error("Demo needs four unoccupied zone shift references, including two already started shifts.");
      const selected = [past[0], past[1], ...choices.filter(shift => !past.slice(0, 2).some(prior => prior.id === shift.id)).sort(preferToday).slice(0, 2)];
      const formal = [];
      for (const [index, state] of ["acknowledged", "closed", "open", "draft"].entries()) {
        const shift = selected[index], candidates = await runtime.formalHandover.candidates(actor, { departmentId: shift.targetId, areaId: "", through: shift.date });
        if (["acknowledged", "closed"].includes(state) && candidates.total > 100) throw new Error("Formal demo department exceeds the pending report capacity; prepare a narrower configured exercise.");
        formal.push({ key: prefix + "formal-" + state, state, content: { shiftId: shift.id, shiftDate: shift.date, departmentId: shift.targetId, areaId: "",
          title: marker + `Formal transfer: ${state}`, summary: "Fictional training transfer using actual planned Workforce intervals. Report evidence remains attributed and live issue states remain unchanged.",
          entryIds: candidates.entries.filter(entry => entry.content.summary.startsWith(marker)).slice(0, 3).map(entry => entry.id) } });
      }
      const issue = (await runtime.improvements.issues(actor, { search: marker })).issues[0];
      // Catalogs intentionally show only initial choices; search the owning application's full lookup.
      const demoAssets = await runtime.assets.query(actor, { search: "DEMO-194-", status: "", locationId: "", cursor: "" });
      const asset = demoAssets.assets.find(asset => /^DEMO-194-\d{2}-[12]$/.test(asset.content.code) && asset.content.status !== "retired");
      const syntheticAsset = asset ? { existingId: asset.id } : { request: { key: prefix + "asset", id: "", expectedRevision: 0,
        note: marker + "Register one fictional training reference; no real equipment identity or validation is asserted.", content: {
          code: "DEMO-IOP-217-GUIDE", name: "DEMO-IOP-217-GUIDE", type: "Training reference", locationId: formal[0].content.departmentId,
          status: "unverified", validationNote: "", description: marker + "Fictional guide reference for Improvement Tracking training. This record does not identify or certify physical equipment. No analytical, survey or journal identity is inferred.", aliases: [], locationDetails: "" } } };
      manifest = { version: 1, scope, week, actor, acknowledgementActor: other.id, formal, asset: syntheticAsset,
        improvements: improvementScenarios({ locationId: catalog.locations.find(location => location.id === formal[0].content.departmentId)?.id ?? catalog.locations[0].id,
          assetId: asset?.id ?? "", issueId: issue?.id ?? "", ownerId: catalog.people.find(person => person.id === other.id)?.id ?? actor, comparison }) };
      manifest.baseline = await inspect(manifest);
      if (manifest.baseline.improvements.length || manifest.baseline.formal.length || manifest.baseline.demoAssets.length) throw new Error("Operational demos already exist; restore the retained private manifest before rerunning.");
      return manifest;
    }
    if (!manifest || manifest.version !== 1 || !same(manifest.scope, scope) || manifest.actor !== actor || !Array.isArray(manifest.week?.people) || manifest.week.people.length > 200 ||
      manifest.week.people.some(person => typeof person.id !== "string") || manifest.improvements?.length !== 6 || manifest.formal?.length !== 4 ||
      manifest.improvements.some(scenario => !scenario.id.startsWith(prefix) || !scenario.data.title.startsWith(marker)) ||
      (!manifest.asset?.existingId && (manifest.asset?.request?.key !== prefix + "asset" || manifest.asset.request.content.code !== "DEMO-IOP-217-GUIDE" || manifest.asset.request.content.status !== "unverified" || manifest.asset.request.content.aliases.length)) ||
      manifest.formal.some(scenario => !scenario.key.startsWith(prefix) || !scenario.content.title.startsWith(marker)) ||
      manifest.week.assignments.some(record => !record.id.startsWith(prefix) || record.data.date < weekStart || record.data.date > weekEnd) ||
      manifest.week.schedules.some(week => week.weekStart !== weekStart || week.days.some(day => day.expectedRevision !== 0 || day.date < weekStart || day.date > weekEnd)))
      throw new Error("Operational demo manifest does not match this installation.");
    const before = await inspect(manifest);
    if (options.action === "preview") return { weekStart, weekEnd, activeUsers: manifest.week.people.length, missingSchedules: manifest.week.schedules.reduce((count, week) => count + week.days.length, 0),
      missingAssignments: manifest.week.assignments.length, improvementStates: manifest.improvements.map(action => action.steps.filter(step => step.type === "save").at(-1)?.data.status ?? "planned"),
      formalStates: manifest.formal.map(record => record.state), comparison: manifest.improvements.find(action => action.id === prefix + "evaluated").steps.at(-1).selection, writes: false,
      asset: manifest.asset.existingId ? { existingId: manifest.asset.existingId } : { registration: manifest.asset.request.content.code, status: "unverified", aliases: 0 },
      existingUnchanged: before.originalDigest === manifest.baseline.originalDigest };
    if (options.action === "inspect") return { ...before, existingUnchanged: before.originalDigest === manifest.baseline.originalDigest };
    if (options.action !== "apply") throw new Error("Unknown operational demo action.");
    const currentBoard = await runtime.workforce.board(actor, weekStart, weekEnd);
    if (!same(currentBoard.people.map(person => person.id).sort(), manifest.week.people.map(person => person.id).sort())) throw new Error("Active users changed after preview; inspect the retained manifest before replanning.");
    let schedulesChanged = 0, assignmentsChanged = 0;
    for (const planned of manifest.week.schedules) {
      const board = await retainedBoard(weekStart, weekEnd);
      const missing = planned.days.filter(day => !board.records.some(record => record.kind === "schedule" && record.id === `${planned.userId}_${day.date}`));
      if (missing.length) schedulesChanged += (await runtime.workforce.saveWeek(actor, { ...planned, days: missing })).changed;
    }
    for (const planned of manifest.week.assignments) {
      const board = await retainedBoard(planned.data.date, planned.data.date);
      if (board.records.some(record => record.kind === "assignment" && (record.id === planned.id || record.data.userId === planned.data.userId))) continue;
      await runtime.workforce.save(actor, { kind: "assignment", id: planned.id, expectedRevision: 0, deleted: false, data: planned.data }); assignmentsChanged++;
    }
    const assetId = manifest.asset.existingId ?? (await runtime.assets.save(actor, manifest.asset.request)).id;
    const improvementResults = [];
    for (const scenario of manifest.improvements) improvementResults.push(await resumeImprovement(runtime.improvements, actor, withAsset(scenario, assetId)));
    const formalResults = [];
    for (const scenario of manifest.formal) formalResults.push(await resumeFormal(runtime.formalHandover, actor, manifest.acknowledgementActor, scenario));
    const after = await inspect(manifest);
    if (after.originalDigest !== before.originalDigest) throw new Error("Existing records changed during the demo; inspect concurrent activity.");
    return { ...after, existingUnchanged: after.originalDigest === manifest.baseline.originalDigest, schedulesChanged, assignmentsChanged, improvementResults, formalResults };
  } finally { await pool.end(); }
}
module.exports = { prefix, weekStart, weekEnd, dayAfter, prepareWeek, improvementScenarios, withAsset, resumeImprovement, resumeFormal, run };
