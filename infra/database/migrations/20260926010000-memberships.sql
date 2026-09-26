-- Up Migration
-- Users/RBAC owns memberships and explicit site grants; bootstrap opens no runtime access.
CREATE TABLE users_rbac.organization_memberships (
  organization_id text COLLATE "C" NOT NULL
    REFERENCES platform_core.organizations (organization_id) ON DELETE RESTRICT,
  user_id text COLLATE "C" NOT NULL
    REFERENCES users_rbac.users (user_id) ON DELETE RESTRICT,
  is_active boolean NOT NULL,
  PRIMARY KEY (organization_id, user_id)
);
CREATE TABLE users_rbac.site_role_assignments (
  organization_id text COLLATE "C" NOT NULL,
  user_id text COLLATE "C" NOT NULL,
  site_id text COLLATE "C" NOT NULL,
  role_id text COLLATE "C" NOT NULL
    CHECK (role_id IN ('site-operator', 'analytics-reader')),
  PRIMARY KEY (organization_id, user_id, site_id, role_id),
  FOREIGN KEY (organization_id, user_id)
    REFERENCES users_rbac.organization_memberships (organization_id, user_id) ON DELETE RESTRICT,
  FOREIGN KEY (organization_id, site_id)
    REFERENCES platform_core.sites (organization_id, site_id) ON DELETE RESTRICT
);
REVOKE ALL ON users_rbac.organization_memberships, users_rbac.site_role_assignments FROM PUBLIC;
ALTER TABLE users_rbac.organization_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE users_rbac.organization_memberships FORCE ROW LEVEL SECURITY;
ALTER TABLE users_rbac.site_role_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE users_rbac.site_role_assignments FORCE ROW LEVEL SECURITY;

CREATE POLICY membership_seed_read ON users_rbac.organization_memberships
  FOR SELECT TO iop_migrator
  USING (organization_id = current_setting('iop.seed_organization_id', true)
    AND user_id = current_setting('iop.seed_user_id', true));
CREATE POLICY membership_seed_insert ON users_rbac.organization_memberships
  FOR INSERT TO iop_migrator
  WITH CHECK (organization_id = current_setting('iop.seed_organization_id', true)
    AND user_id = current_setting('iop.seed_user_id', true));
CREATE POLICY site_role_seed_read ON users_rbac.site_role_assignments
  FOR SELECT TO iop_migrator
  USING (organization_id = current_setting('iop.seed_organization_id', true)
    AND user_id = current_setting('iop.seed_user_id', true)
    AND site_id = current_setting('iop.seed_site_id', true));
CREATE POLICY site_role_seed_insert ON users_rbac.site_role_assignments
  FOR INSERT TO iop_migrator
  WITH CHECK (organization_id = current_setting('iop.seed_organization_id', true)
    AND user_id = current_setting('iop.seed_user_id', true)
    AND site_id = current_setting('iop.seed_site_id', true));
-- No runtime grants, PUBLIC policies or ordinary UPDATE/DELETE policies.
