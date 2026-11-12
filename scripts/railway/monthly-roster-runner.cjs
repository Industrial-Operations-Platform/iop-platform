/** Remote composition only: reuse the running installation's scoped application ports. */
function pinnedWorkforcePort(tx, actor) {
  return { run: async (userId, permission, work) => {
    if (userId !== actor || !["workforce.read", "workforce.plan", "workforce.administer"].includes(permission) ||
        (permission === "workforce.plan" && !tx.canPlan) || (permission === "workforce.administer" && !tx.canAdminister))
      throw new Error("Evaluation authorization changed.");
    return work(tx);
  } };
}
async function runMonthlyRoster(input, expected, apply, prepareMonthlyRoster, pinnedWorkforcePort) {
  const { resolve } = require("node:path");
  const { createHash } = require("node:crypto");
  const { Pool } = require("pg");
  const compiled = path => require(resolve("apps/api/dist", path));
  const env = process.env;
  if (env.IOP_EXECUTION_MODE !== "railway" || env.IOP_AUTHENTICATION !== "password" || env.IOP_DATABASE_NAME !== "iop_local")
    throw new Error("Monthly evaluation is restricted to the configured Railway development installation.");
  const local = JSON.parse(env.IOP_SCOPE_JSON);
  const identity = JSON.parse(env.IOP_USERS_JSON);
  const scope = { organizationId: local.organization.id, siteId: local.site.id };
  if (input.organizationId !== scope.organizationId || input.siteId !== scope.siteId)
    throw new Error("The explicit evaluation scope differs from the running installation.");
  const actor = identity.users[0].id;
  const { evaluateSiteAccess } = compiled("modules/users-rbac");
  const { workforcePeople, sitePersonNames } = compiled("modules/users-rbac/adapters/postgres/site-people");
  const { siteMaterialAudit } = compiled("modules/audit/adapters/postgres/site-material");
  const { Workforce } = compiled("modules/workforce/application/workforce");
  const { PgWorkforce } = compiled("modules/workforce/adapters/postgres/store");
  const { IntlSiteClock } = compiled("modules/workforce/adapters/time/site-clock");
  const { ManualScheduleDecoder } = compiled("modules/integrations/adapters/schedule/decoder");
  const pool = new Pool({ host: env.IOP_DATABASE_HOST, port: Number(env.IOP_DATABASE_PORT), database: "iop_local",
    user: "iop_runtime", password: env.IOP_RUNTIME_PASSWORD, max: 2, connectionTimeoutMillis: 5000,
    statement_timeout: 30000, application_name: "iop-monthly-evaluation", options: "-c search_path=pg_catalog -c lock_timeout=5000" });
  const allowed = async (tx, userId, permission) => (await evaluateSiteAccess(tx, { ...scope, userId, permissions: [permission] })).allowed;
  const store = new PgWorkforce(pool, scope, {
    audit: siteMaterialAudit, allowed,
    people: tx => workforcePeople(tx, scope.organizationId, scope.siteId),
    names: (tx, ids) => sitePersonNames(tx, scope.organizationId, scope.siteId, ids),
  });
  const clock = new IntlSiteClock();
  const defaults = { shifts: [], targets: [], teams: [] };
  const compose = port => new Workforce(port, new ManualScheduleDecoder(), clock, defaults, local.site.timeZone, () => new Date().toISOString());
  const stable = value => JSON.stringify(value, (_, entry) => entry && typeof entry === "object" && !Array.isArray(entry)
    ? Object.fromEntries(Object.entries(entry).sort(([a], [b]) => a.localeCompare(b))) : entry);
  const digest = value => createHash("sha256").update(stable(value)).digest("hex");
  const read = async () => {
    const from = input.month + "-01";
    const to = new Date(Date.UTC(Number(input.month.slice(0, 4)), Number(input.month.slice(5, 7)), 0)).toISOString().slice(0, 10);
    const previous = new Date(Date.parse(from) - 86400000).toISOString().slice(0, 10);
    const next = new Date(Date.parse(to) + 86400000).toISOString().slice(0, 10);
    return store.run(actor, "workforce.plan", async tx => {
      if (!tx.canAdminister) throw new Error("An active scoped Administrator must run the evaluation.");
      const records = await tx.records(previous, next);
      const settings = (await tx.get("settings", "site"))?.data;
      if (!settings) throw new Error("Configure Workforce before generating evaluation schedules.");
      const board = { timeZone: local.site.timeZone, people: await tx.people(), settings, records };
      return { board, plan: prepareMonthlyRoster(board, input, clock) };
    });
  };
  try {
    const prepared = await read();
    const fingerprint = digest(prepared.board);
    const planFingerprint = digest(prepared.plan);
    if (apply && (!expected || expected.fingerprint !== fingerprint || expected.planFingerprint !== planFingerprint))
      throw new Error("The month changed since preview; repreview before applying.");
    let schedulesAdded = 0, assignmentsAdded = 0, schedulesConverted = 0, assignmentsConverted = 0;
    if (apply) for (const week of prepared.plan.weeks) {
      await store.run(actor, "workforce.administer", async tx => {
        const settings = (await tx.get("settings", "site"))?.data;
        if (digest(settings) !== digest(prepared.board.settings) || digest(await tx.people()) !== digest(prepared.board.people))
          throw new Error("Configuration or active people changed; repreview the remaining evaluation.");
        for (const day of week.days) {
          if (await tx.get("schedule", `${week.userId}_${day.date}`))
            throw new Error("A retained day appeared; repreview before continuing.");
          if ((await tx.records(day.date, day.date)).some(record => record.kind === "assignment" && record.data.userId === week.userId))
            throw new Error("A duty appeared on a proposed day; repreview before continuing.");
        }
        const app = compose(pinnedWorkforcePort(tx, actor));
        const result = await app.saveWeek(actor, { userId: week.userId, weekStart: week.weekStart, days: week.days });
        for (const assignment of week.assignments) await app.save(actor, assignment);
        schedulesAdded += result.changed;
        assignmentsAdded += week.assignments.length;
      });
    }
    if (apply && prepared.plan.conversions.length) {
      const changes = prepared.plan.conversions;
      await store.run(actor, "workforce.administer", async tx => {
        if (digest((await tx.get("settings", "site"))?.data) !== digest(prepared.board.settings) ||
            digest(await tx.people()) !== digest(prepared.board.people))
          throw new Error("Shift configuration or people changed; repreview the conversions.");
        const app = compose(pinnedWorkforcePort(tx, actor));
        for (const change of changes) {
          if (stable(await tx.get("schedule", change.before.id)) !== stable(change.before))
            throw new Error("A planned day changed. Repreview its conversion.");
          const duties = (await tx.records(change.day.date, change.day.date)).filter(record =>
            record.kind === "assignment" && record.data.userId === change.userId);
          if (digest(duties) !== digest(change.duties))
            throw new Error("Planned duties changed. Repreview their conversion.");
          for (const duty of change.duties) await app.save(actor, {
            kind: "assignment", id: duty.id, expectedRevision: duty.revision, deleted: true, data: duty.data,
          });
        }
        const weeks = new Map();
        for (const change of changes) {
          const key = change.userId + "/" + change.weekStart;
          if (!weeks.has(key)) weeks.set(key, { userId: change.userId, weekStart: change.weekStart, days: [] });
          weeks.get(key).days.push(change.day);
        }
        for (const week of weeks.values()) await app.saveWeek(actor, week);
        for (const change of changes) for (const assignment of change.assignments) await app.save(actor, assignment);
        schedulesConverted += changes.length;
        assignmentsConverted += changes.reduce((sum, change) => sum + change.assignments.length, 0);
      });
    }
    const final = await read();
    const changed = new Set(apply ? prepared.plan.conversions.flatMap(change => ["schedule/" + change.before.id, ...change.duties.map(duty => "assignment/" + duty.id)]) : []);
    const preserved = prepared.board.records.filter(before => !changed.has(before.kind + "/" + before.id))
      .every(before => stable(final.board.records.find(after => after.kind === before.kind && after.id === before.id)) === stable(before));
    if (!preserved) throw new Error("A retained snapshot changed; inspect private evidence before continuing.");
    if (apply) for (const change of prepared.plan.conversions) {
      const schedule = final.board.records.find(record => record.kind === "schedule" && record.id === change.before.id);
      if (schedule?.revision !== change.before.revision + 1 || schedule.data.start !== change.day.start || schedule.data.end !== change.day.end)
        throw new Error("Converted schedule verification failed.");
      for (const previous of change.duties) {
        const duty = final.board.records.find(record => record.kind === "assignment" && record.id === previous.id);
        const expected = change.assignments.find(assignment => assignment.id === previous.id);
        if (!duty || duty.deleted || duty.revision !== previous.revision + 2 || duty.data.shiftId !== expected.data.shiftId ||
            duty.data.start !== expected.data.start || duty.data.end !== expected.data.end ||
            duty.data.targetId !== previous.data.targetId || duty.data.phone !== previous.data.phone || duty.data.duty !== previous.data.duty)
          throw new Error("Converted duty preservation verification failed.");
      }
    }
    const metrics = final.plan.people.map(person => {
      const rows = final.board.records.filter(record => record.kind === "schedule" && !record.deleted && record.data.userId === person.id && record.data.date >= final.plan.from && record.data.date <= final.plan.to);
      const working = rows.filter(record => ["work", "training", "maintenance"].includes(record.data.status));
      return { ...person, scheduledDays: rows.length, workingDays: working.length,
        saturdays: working.filter(record => new Date(record.data.date).getUTCDay() === 6).length,
        sundays: working.filter(record => new Date(record.data.date).getUTCDay() === 0).length,
        shifts: prepared.board.settings.shifts.map(shift => ({ id: shift.id, count: working.filter(record => record.data.start === shift.start && record.data.end === shift.end).length })) };
    });
    return { applied: apply, fingerprint, planFingerprint, plan: prepared.plan, schedulesAdded, assignmentsAdded,
      schedulesConverted, assignmentsConverted, preserved, remainingConversions: final.plan.conversions.length,
      remainingDays: final.plan.weeks.reduce((sum, week) => sum + week.days.length, 0), metrics };
  } finally { await pool.end(); }
}
module.exports = { runMonthlyRoster, pinnedWorkforcePort };
