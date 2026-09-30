// Explicit local fixture provisioning. Read the chosen test password from stdin, never source control.
const { readFileSync } = require("node:fs");
const { Client } = require("pg");
const { randomUUID } = require("node:crypto");
const {
  provisioningConfiguration,
} = require("../../infra/database/dist/configuration");
const { startPlatformRuntime } = require("../../apps/api/dist/host/runtime");
const {
  NodePasswords,
} = require("../../apps/api/dist/modules/authentication/adapters/node-crypto");
async function main() {
  const input = JSON.parse(readFileSync(0, "utf8"));
  if (
    typeof input.password !== "string" ||
    input.password.length < 15 ||
    input.password.length > 128
  )
    throw new Error(
      "Provide a test password of 15–128 characters through stdin.",
    );
  const runtime = await startPlatformRuntime(process.env);
  if (!runtime?.access)
    throw new Error("Password-enabled local platform required.");
  try {
    const actor = runtime.startupActor,
      org = runtime.source.organizationId,
      site = runtime.source.siteId;
    const today = new Intl.DateTimeFormat("en-CA", {
      timeZone: runtime.source.siteTimeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
    const year = Number(today.slice(0, 4)),
      month = Number(today.slice(5, 7));
    const from = `${today.slice(0, 7)}-01`,
      to = new Date(Date.UTC(year, month + 1, 0)).toISOString().slice(0, 10);
    let users = await runtime.access.users.list(actor);
    const ensure = async (username, name, profile) => {
      let user = users.find((u) => u.username === username);
      if (!user) {
        user = (
          await runtime.access.users.create(actor, { username, name, profile })
        ).user;
        users.push(user);
      }
      if (!user.active || user.profile !== profile)
        throw new Error(
          "Existing fixture account has a different profile or is disabled.",
        );
      return user;
    };
    let board = await runtime.workforce.board(actor, from, to);
    if (!board.settings.targets.length)
      throw new Error(
        "Configure site departments before provisioning workforce fixtures.",
      );
    const leaders = [];
    for (let i = 0; i < 3; i++)
      leaders.push(
        await ensure(
          `m6.leader.${i + 1}`,
          `Demo Leader ${i + 1}`,
          "team-leader",
        ),
      );
    const technicians = [];
    for (const [index, target] of board.settings.targets.entries())
      for (let i = 0; i < 2; i++)
        technicians.push({
          user: await ensure(
            `m6.tech.${index + 1}.${i + 1}`,
            `Demo ${target.label} ${i + 1}`,
            "technician",
          ),
          target,
          shift: i === 0 ? "early" : "late",
        });
    const settingsRecord = board.records.find((r) => r.kind === "settings"),
      config = structuredClone(board.settings);
    if (!config.teams.some((t) => t.id === "m6-demo-team"))
      config.teams.push({
        id: "m6-demo-team",
        label: "Demo operations",
        leaderId: leaders[0].id,
      });
    if (JSON.stringify(config) !== JSON.stringify(board.settings))
      await runtime.workforce.save(actor, {
        kind: "settings",
        id: "site",
        expectedRevision: settingsRecord?.revision ?? 0,
        deleted: false,
        data: config,
      });
    const floating = await ensure("m6.springer", "Demo Springer", "technician");
    const participants = [
      { user: floating, target: null, shift: "early" },
      ...technicians,
      ...leaders.map((user, index) => ({
        user,
        target: null,
        shift: ["early", "middle", "late"][index],
      })),
    ];
    let schedules = 0,
      assignments = 0;
    for (const person of participants) {
      const lines = ["userId,date,status,start,end"],
        plans = [];
      for (
        let time = Date.parse(from);
        time <= Date.parse(to);
        time += 86400000
      ) {
        const date = new Date(time).toISOString().slice(0, 10),
          day = new Date(time).getUTCDay();
        const shiftId = day === 6 && person.target ? "middle" : person.shift;
        const shift = config.shifts.find((s) => s.id === shiftId);
        if (!shift)
          throw new Error(
            "Demo requires early, middle and late shift definitions.",
          );
        const demonstrationAbsences = [
          "compensation",
          "training",
          "vacation",
          "accident",
          "sick",
        ];
        const absenceIndex = technicians.findIndex(
          (t) => t.user.id === person.user.id,
        );
        const specialDay =
          Number(date.slice(8)) === 15 &&
          day !== 0 &&
          absenceIndex >= 0 &&
          absenceIndex < demonstrationAbsences.length;
        const status =
          day === 0
            ? "off"
            : specialDay
              ? demonstrationAbsences[absenceIndex]
              : "work";
        lines.push(
          [
            person.user.id,
            date,
            status,
            ["work", "training"].includes(status) ? shift.start : "",
            ["work", "training"].includes(status) ? shift.end : "",
          ].join(","),
        );
        if (status === "work") plans.push({ date, shift });
      }
      const scheduleInput = {
        format: "csv",
        userId: "",
        text: lines.join("\n"),
      };
      // Preserve existing imported/manual user plans on repeat runs: only fill unknown days.
      const existing = new Set(
        board.records
          .filter(
            (r) => r.kind === "schedule" && r.data.userId === person.user.id,
          )
          .map((r) => r.data.date),
      );
      scheduleInput.text = [
        lines[0],
        ...lines.slice(1).filter((line) => !existing.has(line.split(",")[1])),
      ].join("\n");
      if (scheduleInput.text !== lines[0]) {
        const preview = await runtime.workforce.preview(actor, scheduleInput);
        schedules += (
          await runtime.workforce.import(actor, scheduleInput, preview)
        ).changed;
      }
      const worker = board.records.find(
        (r) => r.kind === "worker" && r.id === person.user.id,
      );
      if (!worker)
        await runtime.workforce.save(actor, {
          kind: "worker",
          id: person.user.id,
          expectedRevision: 0,
          deleted: false,
          data: {
            userId: person.user.id,
            teamId: "m6-demo-team",
            homeTargetId: person.target?.id ?? "",
          },
        });
      for (const { date, shift } of plans) {
        if (
          board.records.some(
            (r) =>
              r.kind === "assignment" &&
              r.data.userId === person.user.id &&
              r.data.date === date,
          )
        )
          continue;
        const data = {
          userId: person.user.id,
          date,
          shiftId: shift.id,
          targetId: person.target?.id ?? "",
          duty: person.target
            ? "zone"
            : person.user.profile === "team-leader"
              ? "leader"
              : "floating",
          phone:
            person.target && person.shift === "early" ? person.target.id : "",
          start: shift.start,
          end: shift.end,
          startsAt: "",
          endsAt: "",
        };
        await runtime.workforce.save(actor, {
          kind: "assignment",
          id: randomUUID(),
          expectedRevision: 0,
          deleted: false,
          data,
        });
        assignments++;
      }
    }
    // The owner explicitly requests the same private test password for every local account.
    const client = new Client(provisioningConfiguration(process.env).bootstrap);
    await client.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        "SELECT pg_advisory_xact_lock(hashtext('iop-access'),hashtext($1))",
        [org],
      );
      const hash = await new NodePasswords().hash(input.password);
      await client.query(
        "UPDATE authentication.credentials SET password_hash=$2,must_change=false,version=version+1,failures=0,blocked_until=0 WHERE organization_id=$1",
        [org, hash],
      );
      await client.query(
        "UPDATE authentication.sessions SET revoked=true WHERE organization_id=$1",
        [org],
      );
      await client.query(
        "INSERT INTO users_rbac.access_audit(id,organization_id,actor_id,subject_id,action,detail) VALUES($1,$2,$3,$3,$4,$5)",
        [
          randomUUID(),
          org,
          actor,
          "demo.passwords_configured",
          JSON.stringify({
            siteId: site,
            reason: "Explicit owner request for local testing",
          }),
        ],
      );
      await client.query("COMMIT");
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      await client.end();
    }
    console.log(
      JSON.stringify(
        {
          from,
          to,
          technicians: technicians.length,
          leaders: leaders.length,
          schedules,
          assignments,
          accounts: users.map((u) => ({
            username: u.username,
            name: u.name,
            profile: u.profile,
          })),
        },
        null,
        2,
      ),
    );
  } finally {
    await runtime.close();
  }
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
