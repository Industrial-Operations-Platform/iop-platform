-- Up Migration
-- IOP-165: local credentials and scoped administration; no runtime DELETE/DDL.
CREATE SCHEMA authentication AUTHORIZATION iop_migrator;
REVOKE ALL ON SCHEMA authentication FROM PUBLIC;
GRANT USAGE ON SCHEMA authentication TO iop_runtime;
ALTER TABLE users_rbac.site_role_assignments ADD COLUMN is_active boolean NOT NULL DEFAULT true;
GRANT SELECT (is_active), UPDATE (is_active) ON users_rbac.site_role_assignments TO iop_runtime;

CREATE TABLE users_rbac.profiles (
 organization_id text NOT NULL, user_id text NOT NULL, site_id text NOT NULL,
 display_name text NOT NULL CHECK (length(display_name) BETWEEN 1 AND 100),
 profile text NOT NULL CHECK (profile IN ('administrator','technician','task-force','team-leader')),
 PRIMARY KEY (organization_id,user_id),
 FOREIGN KEY (organization_id,user_id) REFERENCES users_rbac.organization_memberships,
 FOREIGN KEY (organization_id,site_id) REFERENCES platform_core.sites(organization_id,site_id)
);
CREATE TABLE users_rbac.organization_role_assignments (
 organization_id text NOT NULL, user_id text NOT NULL,
 role_id text NOT NULL CHECK (role_id='organization-access-admin'), is_active boolean NOT NULL,
 PRIMARY KEY (organization_id,user_id,role_id),
 FOREIGN KEY (organization_id,user_id) REFERENCES users_rbac.organization_memberships
);
CREATE TABLE authentication.credentials (
 organization_id text NOT NULL, user_id text NOT NULL UNIQUE,
 username text NOT NULL CHECK (username ~ '^[a-z0-9][a-z0-9._-]{2,63}$'),
 password_hash text NOT NULL, must_change boolean NOT NULL DEFAULT true,
 version integer NOT NULL DEFAULT 1 CHECK (version>0),
 failures integer NOT NULL DEFAULT 0 CHECK (failures>=0), blocked_until bigint NOT NULL DEFAULT 0,
 PRIMARY KEY (organization_id,user_id), UNIQUE (organization_id,username),
 FOREIGN KEY (organization_id,user_id) REFERENCES users_rbac.organization_memberships
);
CREATE TABLE authentication.sessions (
 digest text PRIMARY KEY CHECK (digest ~ '^[a-f0-9]{64}$'), organization_id text NOT NULL,
 user_id text NOT NULL, credential_version integer NOT NULL, expires_at bigint NOT NULL,
 revoked boolean NOT NULL DEFAULT false,
 FOREIGN KEY (organization_id,user_id) REFERENCES authentication.credentials
);
CREATE TABLE authentication.login_budget (
 organization_id text PRIMARY KEY REFERENCES platform_core.organizations,
 window_start bigint NOT NULL, attempts integer NOT NULL CHECK (attempts>=0)
);
CREATE TABLE users_rbac.access_audit (
 id text PRIMARY KEY, organization_id text NOT NULL REFERENCES platform_core.organizations,
 actor_id text NOT NULL, subject_id text NOT NULL, action text NOT NULL,
 detail jsonb NOT NULL, recorded_at timestamptz NOT NULL DEFAULT clock_timestamp()
);

REVOKE ALL ON users_rbac.profiles FROM PUBLIC;
ALTER TABLE users_rbac.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE users_rbac.profiles FORCE ROW LEVEL SECURITY;
CREATE POLICY access_scope ON users_rbac.profiles TO iop_runtime, iop_migrator
 USING (organization_id = current_setting('iop.access_organization_id',true))
 WITH CHECK (organization_id = current_setting('iop.access_organization_id',true));
GRANT SELECT (organization_id,user_id,site_id,display_name,profile), INSERT (organization_id,user_id,site_id,display_name,profile) ON users_rbac.profiles TO iop_runtime;
GRANT UPDATE (profile) ON users_rbac.profiles TO iop_runtime;

REVOKE ALL ON users_rbac.organization_role_assignments FROM PUBLIC;
ALTER TABLE users_rbac.organization_role_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE users_rbac.organization_role_assignments FORCE ROW LEVEL SECURITY;
CREATE POLICY access_scope ON users_rbac.organization_role_assignments TO iop_runtime, iop_migrator
 USING (organization_id = current_setting('iop.access_organization_id',true))
 WITH CHECK (organization_id = current_setting('iop.access_organization_id',true));
GRANT SELECT (organization_id,user_id,role_id,is_active), INSERT (organization_id,user_id,role_id,is_active) ON users_rbac.organization_role_assignments TO iop_runtime;
GRANT UPDATE (is_active) ON users_rbac.organization_role_assignments TO iop_runtime;

REVOKE ALL ON authentication.credentials FROM PUBLIC;
ALTER TABLE authentication.credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE authentication.credentials FORCE ROW LEVEL SECURITY;
CREATE POLICY access_scope ON authentication.credentials TO iop_runtime, iop_migrator
 USING (organization_id = current_setting('iop.access_organization_id',true))
 WITH CHECK (organization_id = current_setting('iop.access_organization_id',true));
GRANT SELECT (organization_id,user_id,username,password_hash,must_change,version,failures,blocked_until), INSERT (organization_id,user_id,username,password_hash,must_change,version,failures,blocked_until) ON authentication.credentials TO iop_runtime;
GRANT UPDATE (password_hash,must_change,version,failures,blocked_until) ON authentication.credentials TO iop_runtime;

REVOKE ALL ON authentication.sessions FROM PUBLIC;
ALTER TABLE authentication.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE authentication.sessions FORCE ROW LEVEL SECURITY;
CREATE POLICY access_scope ON authentication.sessions TO iop_runtime, iop_migrator
 USING (organization_id = current_setting('iop.access_organization_id',true))
 WITH CHECK (organization_id = current_setting('iop.access_organization_id',true));
GRANT SELECT (digest,organization_id,user_id,credential_version,expires_at,revoked), INSERT (digest,organization_id,user_id,credential_version,expires_at,revoked) ON authentication.sessions TO iop_runtime;
GRANT UPDATE (revoked) ON authentication.sessions TO iop_runtime;

REVOKE ALL ON authentication.login_budget FROM PUBLIC;
ALTER TABLE authentication.login_budget ENABLE ROW LEVEL SECURITY;
ALTER TABLE authentication.login_budget FORCE ROW LEVEL SECURITY;
CREATE POLICY access_scope ON authentication.login_budget TO iop_runtime, iop_migrator
 USING (organization_id = current_setting('iop.access_organization_id',true))
 WITH CHECK (organization_id = current_setting('iop.access_organization_id',true));
GRANT SELECT (organization_id,window_start,attempts), INSERT (organization_id,window_start,attempts) ON authentication.login_budget TO iop_runtime;
GRANT UPDATE (window_start,attempts) ON authentication.login_budget TO iop_runtime;

REVOKE ALL ON users_rbac.access_audit FROM PUBLIC;
ALTER TABLE users_rbac.access_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE users_rbac.access_audit FORCE ROW LEVEL SECURITY;
CREATE POLICY access_scope ON users_rbac.access_audit TO iop_runtime, iop_migrator
 USING (organization_id = current_setting('iop.access_organization_id',true))
 WITH CHECK (organization_id = current_setting('iop.access_organization_id',true));
GRANT SELECT (id,organization_id,actor_id,subject_id,action,detail,recorded_at), INSERT (id,organization_id,actor_id,subject_id,action,detail) ON users_rbac.access_audit TO iop_runtime;

GRANT INSERT (user_id,is_active) ON users_rbac.users TO iop_runtime;
CREATE POLICY access_users_read ON users_rbac.users FOR SELECT TO iop_runtime, iop_migrator
 USING (user_id IN (SELECT user_id FROM users_rbac.organization_memberships
 WHERE organization_id=current_setting('iop.access_organization_id',true)));
CREATE POLICY access_users_insert ON users_rbac.users FOR INSERT TO iop_runtime
 WITH CHECK (user_id=current_setting('iop.access_new_user_id',true)
 AND current_setting('iop.access_write',true)='1');
GRANT INSERT (organization_id,user_id,is_active), UPDATE (is_active) ON users_rbac.organization_memberships TO iop_runtime;
CREATE POLICY access_membership ON users_rbac.organization_memberships TO iop_runtime, iop_migrator
 USING (organization_id=current_setting('iop.access_organization_id',true))
 WITH CHECK (organization_id=current_setting('iop.access_organization_id',true)
 AND current_setting('iop.access_write',true)='1');
GRANT INSERT (organization_id,user_id,site_id,role_id) ON users_rbac.site_role_assignments TO iop_runtime;
CREATE POLICY access_site_roles ON users_rbac.site_role_assignments TO iop_runtime, iop_migrator
 USING (organization_id=current_setting('iop.access_organization_id',true)
 AND site_id=current_setting('iop.access_site_id',true))
 WITH CHECK (organization_id=current_setting('iop.access_organization_id',true)
 AND site_id=current_setting('iop.access_site_id',true) AND current_setting('iop.access_write',true)='1');
CREATE POLICY access_site_lookup ON platform_core.sites FOR SELECT TO iop_runtime, iop_migrator
 USING (organization_id=current_setting('iop.access_organization_id',true)
 AND site_id=current_setting('iop.access_site_id',true));
