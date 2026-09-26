-- Up Migration
-- ADR-0026: candidate lookup is separate from authorized business context.
GRANT USAGE ON SCHEMA users_rbac, platform_core TO iop_runtime;

GRANT SELECT (user_id, is_active) ON users_rbac.users TO iop_runtime;
CREATE POLICY authorization_lookup_read ON users_rbac.users
  FOR SELECT TO iop_runtime
  USING (coalesce(current_setting('iop.lookup_user_id', true), '') <> ''
    AND coalesce(current_setting('iop.lookup_organization_id', true), '') <> ''
    AND coalesce(current_setting('iop.lookup_site_id', true), '') <> ''
    AND user_id = current_setting('iop.lookup_user_id', true));

GRANT SELECT (organization_id, user_id, is_active) ON users_rbac.organization_memberships TO iop_runtime;
CREATE POLICY authorization_lookup_read ON users_rbac.organization_memberships
  FOR SELECT TO iop_runtime
  USING (coalesce(current_setting('iop.lookup_user_id', true), '') <> ''
    AND coalesce(current_setting('iop.lookup_organization_id', true), '') <> ''
    AND coalesce(current_setting('iop.lookup_site_id', true), '') <> ''
    AND organization_id = current_setting('iop.lookup_organization_id', true) AND user_id = current_setting('iop.lookup_user_id', true));

GRANT SELECT (organization_id, user_id, site_id, role_id) ON users_rbac.site_role_assignments TO iop_runtime;
CREATE POLICY authorization_lookup_read ON users_rbac.site_role_assignments
  FOR SELECT TO iop_runtime
  USING (coalesce(current_setting('iop.lookup_user_id', true), '') <> ''
    AND coalesce(current_setting('iop.lookup_organization_id', true), '') <> ''
    AND coalesce(current_setting('iop.lookup_site_id', true), '') <> ''
    AND organization_id = current_setting('iop.lookup_organization_id', true) AND user_id = current_setting('iop.lookup_user_id', true) AND site_id = current_setting('iop.lookup_site_id', true));

GRANT SELECT (organization_id, site_id) ON platform_core.sites TO iop_runtime;
CREATE POLICY authorization_lookup_read ON platform_core.sites
  FOR SELECT TO iop_runtime
  USING (coalesce(current_setting('iop.lookup_user_id', true), '') <> ''
    AND coalesce(current_setting('iop.lookup_organization_id', true), '') <> ''
    AND coalesce(current_setting('iop.lookup_site_id', true), '') <> ''
    AND organization_id = current_setting('iop.lookup_organization_id', true) AND site_id = current_setting('iop.lookup_site_id', true));
