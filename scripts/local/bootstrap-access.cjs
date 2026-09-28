// Explicit operator bootstrap/recovery. The one-time secret is issued only to this terminal.
const { readFileSync } = require("node:fs");
const { randomBytes, randomUUID } = require("node:crypto");
const { Client } = require("pg");
const {
  provisioningConfiguration,
} = require("../../infra/database/dist/configuration");
const {
  NodePasswords,
} = require("../../apps/api/dist/modules/authentication/adapters/node-crypto");
async function main() {
  const reset = process.argv.slice(2).join(" ") === "--reset";
  if (process.argv.length > 2 && !reset)
    throw new Error("Use local:admin [--reset].");
  const local = JSON.parse(readFileSync(process.env.IOP_CONFIG_FILE, "utf8"));
  const initial = JSON.parse(
    readFileSync(process.env.IOP_LOCAL_IDENTITY_FILE, "utf8"),
  ).users[0];
  const org = local.organization.id,
    site = local.site.id,
    user = initial.id;
  const configs = provisioningConfiguration(process.env);
  const inspect = new Client(configs.bootstrap);
  await inspect.connect();
  try {
    const identity = await inspect.query(
      "SELECT is_active FROM users_rbac.users WHERE user_id=$1",
      [user],
    );
    if (identity.rows[0]?.is_active !== true)
      throw new Error("Bootstrap requires an active platform identity.");
    const sites = await inspect.query(
      "SELECT site_id FROM users_rbac.site_role_assignments WHERE user_id=$1",
      [user],
    );
    if (sites.rows.some((row) => row.site_id !== site))
      throw new Error(
        "Bootstrap requires an identity assigned only to this local site.",
      );
    const memberships = await inspect.query(
      "SELECT organization_id FROM users_rbac.organization_memberships WHERE user_id=$1",
      [user],
    );
    if (
      memberships.rows.length !== 1 ||
      memberships.rows[0].organization_id !== org
    )
      throw new Error(
        "Bootstrap requires an identity exclusively owned by this organization.",
      );
  } finally {
    await inspect.end();
  }
  const client = new Client(configs.migrator);
  await client.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      "SELECT pg_advisory_xact_lock(hashtext('iop-access'),hashtext($1))",
      [org],
    );
    await client.query(
      "SELECT set_config('iop.access_organization_id',$1,true),set_config('iop.access_site_id',$2,true),set_config('iop.access_write','1',true)",
      [org, site],
    );
    const existing = await client.query(
      "SELECT username FROM authentication.credentials WHERE organization_id=$1 AND user_id=$2",
      [org, user],
    );
    if (existing.rowCount && !reset)
      throw new Error(
        "Administrator login already exists. Use --reset only for explicit operator recovery.",
      );
    const secret = randomBytes(24).toString("base64url");
    const hash = await new NodePasswords().hash(secret);
    await client.query(
      `INSERT INTO authentication.credentials(organization_id,user_id,username,password_hash)
      VALUES($1,$2,'admin',$3) ON CONFLICT(organization_id,user_id) DO UPDATE
      SET password_hash=$3,must_change=true,version=authentication.credentials.version+1,failures=0,blocked_until=0`,
      [org, user, hash],
    );
    await client.query(
      `INSERT INTO users_rbac.profiles(organization_id,user_id,site_id,display_name,profile)
      VALUES($1,$2,$3,$4,'administrator') ON CONFLICT(organization_id,user_id) DO UPDATE SET profile='administrator'`,
      [org, user, site, initial.name],
    );
    await client.query(
      `INSERT INTO users_rbac.organization_role_assignments(organization_id,user_id,role_id,is_active)
      VALUES($1,$2,'organization-access-admin',true) ON CONFLICT(organization_id,user_id,role_id) DO UPDATE SET is_active=true`,
      [org, user],
    );
    await client.query(
      "UPDATE users_rbac.organization_memberships SET is_active=true WHERE organization_id=$1 AND user_id=$2",
      [org, user],
    );
    await client.query(
      "UPDATE users_rbac.site_role_assignments SET is_active=true WHERE organization_id=$1 AND user_id=$2 AND site_id=$3",
      [org, user, site],
    );
    await client.query(
      "UPDATE authentication.sessions SET revoked=true WHERE organization_id=$1 AND user_id=$2",
      [org, user],
    );
    await client.query(
      `INSERT INTO users_rbac.access_audit(id,organization_id,actor_id,subject_id,action,detail)
      VALUES($1,$2,'local-operator',$3,$4,$5)`,
      [
        randomUUID(),
        org,
        user,
        reset ? "administrator.recovered" : "administrator.bootstrapped",
        JSON.stringify({
          reason: "Explicit local operator command",
          siteId: site,
        }),
      ],
    );
    await client.query("COMMIT");
    process.stdout.write(
      `Username: ${existing.rows[0]?.username ?? "admin"}\nInitial password (shown once): ${secret}\nChange this password at first sign-in.\n`,
    );
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    await client.end();
  }
}
main().catch((error) => {
  console.error(
    error.constructor === Error
      ? error.message
      : "Administrator bootstrap failed; existing access was preserved.",
  );
  process.exitCode = 1;
});
