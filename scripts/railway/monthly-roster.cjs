const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { railway, root } = require("./cli.cjs");
const { readTarget, validateTarget } = require("./configure.cjs");
const { validateDevelopmentDeployment } = require("./deploy.cjs");
const { prepareMonthlyRoster } = require("./monthly-roster-plan.cjs");
const { runMonthlyRoster, pinnedWorkforcePort } = require("./monthly-roster-runner.cjs");

function main(args = process.argv.slice(2)) {
  const [flag, month, action = "--preview", conversion, balanceWeek] = args;
  const balance = conversion === "--balance-technicians-week";
  if (flag !== "--month" || !/^\d{4}-(0[1-9]|1[0-2])$/.test(month ?? "") || args.length > (balance ? 5 : 4) ||
      ![undefined, "--convert-task-force", "--balance-technicians-week"].includes(conversion) ||
      (balance && !/^\d{4}-\d{2}-\d{2}$/.test(balanceWeek ?? "")) || !["--preview", "--apply"].includes(action))
    throw new Error("Use node scripts/railway/monthly-roster.cjs --month YYYY-MM --preview|--apply [--convert-task-force | --balance-technicians-week YYYY-MM-DD].");
  const target = readTarget(); validateTarget(target);
  const status = JSON.parse(railway(["status", "--project", target.project, "--environment", target.environment, "--json"], { stdio: "pipe", encoding: "utf8" }).stdout);
  validateDevelopmentDeployment("develop", status, target);
  if (!target.sshIdentity || !fs.existsSync(target.sshIdentity)) throw new Error("Configure the existing private Railway SSH identity.");
  const variables = JSON.parse(fs.readFileSync(path.join(root, ".railway/app.variables.json"), "utf8"));
  const scope = JSON.parse(variables.IOP_SCOPE_JSON);
  const input = {
    month,
    organizationId: scope.organization.id,
    siteId: scope.site.id,
    convertTaskForce: conversion === "--convert-task-force",
    ...(balance ? { balanceTechnicianWeek: balanceWeek } : {}),
  };
  const directory = path.join(root, ".railway/monthly-rosters", month);
  const pointer = path.join(directory, "preview.json");
  const destination = { project: target.project, environment: target.environment, service: target.service };
  const expected = action === "--apply" ? JSON.parse(fs.readFileSync(pointer, "utf8")) : null;
  if (expected && (JSON.stringify(expected.input) !== JSON.stringify(input) || JSON.stringify(expected.destination) !== JSON.stringify(destination)))
    throw new Error("The retained preview belongs to another month or Railway installation.");
  const source = `(${runMonthlyRoster.toString()})(${JSON.stringify(input)},${JSON.stringify(expected && { fingerprint: expected.fingerprint, planFingerprint: expected.planFingerprint })},${action === "--apply"},${prepareMonthlyRoster.toString()},${pinnedWorkforcePort.toString()}).then(value=>console.log(JSON.stringify(value))).catch(error=>{console.error(error.message);process.exitCode=1;});`;
  const result = railway(["ssh", "--project", target.project, "--environment", target.environment, "--service", target.service,
    "--identity-file", target.sshIdentity, "--", "node", "-"], { input: source, stdio: "pipe", encoding: "utf8", maxBuffer: 8 * 1024 * 1024, timeout: 180000 });
  const report = JSON.parse(result.stdout.trim());
  fs.mkdirSync(directory, { recursive: true, mode: 0o700 });
  const evidence = { at: new Date().toISOString(), input, destination, sourceHash: crypto.createHash("sha256").update(source).digest("hex"), ...report };
  const file = path.join(directory, `${action.slice(2)}-${evidence.at.replace(/[:.]/g, "-")}.json`);
  fs.writeFileSync(file, JSON.stringify(evidence, null, 2), { mode: 0o600, flag: "wx" });
  if (!report.applied) fs.writeFileSync(pointer, JSON.stringify(evidence, null, 2), { mode: 0o600 });
  console.log(JSON.stringify({ month, applied: report.applied, people: report.plan.people.length,
    proposedDays: report.plan.weeks.reduce((sum, week) => sum + week.days.length, 0),
    proposedAssignments: report.plan.weeks.reduce((sum, week) => sum + week.assignments.length, 0),
    proposedConversions: report.plan.conversions.length, schedulesConverted: report.schedulesConverted,
    assignmentsConverted: report.assignmentsConverted, remainingConversions: report.remainingConversions,
    schedulesAdded: report.schedulesAdded, assignmentsAdded: report.assignmentsAdded,
    remainingDays: report.remainingDays, preserved: report.preserved, evidence: file }, null, 2));
}
if (require.main === module) { try { main(); } catch (error) { console.error(error.message); process.exitCode = 1; } }
module.exports = { main };
