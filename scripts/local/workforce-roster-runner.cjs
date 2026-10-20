/** Site data is supplied separately; no customer names or credentials belong here. */
function prepareRoster(board, input) {
  if (!input || !Array.isArray(input.teams) || !Array.isArray(input.remainderTeamIds))
    throw new Error("Provide explicit teams and remainderTeamIds.");
  const config = structuredClone(board.settings);
  config.technicalLevels ??= [];
  for (const level of input.technicalLevels ?? [])
    if (!config.technicalLevels.some((existing) => existing.id === level.id)) config.technicalLevels.push(level);
  const membership = new Map();
  for (const team of input.teams) {
    if (!board.people.some((person) => person.id === team.leaderId && ["team-leader", "administrator"].includes(person.profile)))
      throw new Error("A configured leader is not an active scoped coordinator.");
    const existing = config.teams.find((item) => item.id === team.id);
    if (existing && existing.leaderId !== team.leaderId) throw new Error("A target team already belongs to another leader.");
    if (!existing) config.teams.push({ id: team.id, label: team.label, leaderId: team.leaderId });
    for (const member of team.members ?? []) {
      if (membership.has(member.userId)) throw new Error("A person appears in multiple primary teams.");
      if (!board.people.some((person) => person.id === member.userId)) throw new Error("A requested member has no active scoped account.");
      membership.set(member.userId, team.id);
    }
  }
  if (input.remainderTeamIds.some((id) => !input.teams.some((team) => team.id === id)))
    throw new Error("Remainder teams must be explicitly configured.");
  const workers = board.records.filter((record) => record.kind === "worker" && !record.deleted);
  const targetTeams = new Set(input.teams.map((team) => team.id));
  // A retained seed gives a repeatable provisional distribution; an ordinary read never writes.
  const rank = (id) => [...String(input.seed ?? "roster") + id].reduce((value, char) => Math.imul(value ^ char.charCodeAt(0), 16777619) >>> 0, 2166136261);
  const remainder = board.people.filter((person) => !["administrator", "team-leader"].includes(person.profile) && !membership.has(person.id))
    .sort((a, b) => rank(a.id) - rank(b.id) || a.id.localeCompare(b.id));
  for (const person of remainder) {
    const prior = workers.find((record) => record.id === person.id);
    if (prior && targetTeams.has(prior.data.teamId)) membership.set(person.id, prior.data.teamId);
  }
  const counts = new Map(input.remainderTeamIds.map((id) => [id, [...membership.values()].filter((team) => team === id).length]));
  for (const person of remainder.filter((person) => !membership.has(person.id))) {
    const team = [...counts].sort((a, b) => a[1] - b[1])[0]?.[0];
    if (!team) continue;
    membership.set(person.id, team);
    counts.set(team, counts.get(team) + 1);
  }
  return {
    config,
    workers: [...membership].flatMap(([userId, teamId]) => {
      const prior = workers.find((record) => record.id === userId);
      if (prior?.data.teamId === teamId) return [];
      return [{ kind: "worker", id: userId, expectedRevision: prior?.revision ?? 0, deleted: false,
        data: { ...(prior?.data ?? { userId, homeTargetId: "" }), teamId } }];
    }),
    pendingMembers: input.pendingMembers ?? [],
  };
}

// Serialized into the local API container by the explicit launcher.
async function run(input, apply, prepareRoster) {
  const { readFileSync } = require("node:fs");
  const { resolve } = require("node:path");
  const { Pool } = require("pg");
  const compiled = (path) => require(resolve("dist", path));
  const env = process.env;
  if (env.IOP_EXECUTION_MODE !== "local-container" || env.IOP_AUTHENTICATION !== "password" || env.IOP_DATABASE_HOST !== "database" || env.IOP_DATABASE_NAME !== "iop_local")
    throw new Error("Roster preparation is restricted to the local password-authenticated Docker installation.");
  const { loadConfiguration } = compiled("host/configuration");
  const local = loadConfiguration(env.IOP_CONFIG_FILE);
  const scope = { organizationId: local.organization.id, siteId: local.site.id };
  if (input.organizationId !== scope.organizationId || input.siteId !== scope.siteId) throw new Error("Roster scope does not match this installation.");
  const actor = JSON.parse(readFileSync(env.IOP_LOCAL_IDENTITY_FILE, "utf8")).users[0].id;
  const pool = new Pool({ host: env.IOP_DATABASE_HOST, port: Number(env.IOP_DATABASE_PORT), database: "iop_local", user: "iop_runtime", password: env.IOP_RUNTIME_PASSWORD,
    max: 2, connectionTimeoutMillis: 5000, statement_timeout: 30000, application_name: "iop-workforce-roster", options: "-c search_path=pg_catalog -c lock_timeout=5000" });
  try {
    const { evaluateSiteAccess } = compiled("modules/users-rbac");
    const { workforcePeople, sitePersonNames } = compiled("modules/users-rbac/adapters/postgres/site-people");
    const { siteMaterialAudit } = compiled("modules/audit/adapters/postgres/site-material");
    const { Workforce } = compiled("modules/workforce/application/workforce");
    const { PgWorkforce } = compiled("modules/workforce/adapters/postgres/store");
    const { IntlSiteClock } = compiled("modules/workforce/adapters/time/site-clock");
    const { ManualScheduleDecoder } = compiled("modules/integrations/adapters/schedule/decoder");
    const app = new Workforce(new PgWorkforce(pool, scope, {
      audit: siteMaterialAudit,
      allowed: async (tx, userId, permission) => (await evaluateSiteAccess(tx, { ...scope, userId, permissions: [permission] })).allowed,
      people: (tx) => workforcePeople(tx, scope.organizationId, scope.siteId),
      names: (tx, ids) => sitePersonNames(tx, scope.organizationId, scope.siteId, ids),
    }), new ManualScheduleDecoder(), new IntlSiteClock(), { shifts: [], targets: [], teams: [] }, local.site.timeZone, () => new Date().toISOString());
    const day = new Intl.DateTimeFormat("en-CA", { timeZone: local.site.timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
    const board = await app.board(actor, day, day);
    const prepared = prepareRoster(board, input);
    const settingsChanged = JSON.stringify(prepared.config) !== JSON.stringify(board.settings);
    if (apply) {
      if (settingsChanged) await app.save(actor, { kind: "settings", id: "site", expectedRevision: board.records.find((record) => record.kind === "settings")?.revision ?? 0, deleted: false, data: prepared.config });
      for (const worker of prepared.workers) await app.save(actor, worker);
    }
    return { applied: apply, settingsChanged, workersChanged: prepared.workers.length, teams: input.teams.length, pendingMembers: prepared.pendingMembers };
  } finally { await pool.end(); }
}
module.exports = { prepareRoster, run };
