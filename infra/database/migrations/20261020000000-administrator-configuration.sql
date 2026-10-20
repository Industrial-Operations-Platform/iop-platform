-- Up Migration
-- IOP-217: configuration belongs only to a current scoped Administrator.
-- Revoke obsolete assignments; never restore inactive or missing grants.
CREATE POLICY administrator_configuration_migration ON users_rbac.profiles
 TO iop_migrator USING (true);
CREATE POLICY administrator_configuration_migration ON users_rbac.site_role_assignments
 TO iop_migrator USING (true) WITH CHECK (true);
UPDATE users_rbac.site_role_assignments a SET is_active=false
 FROM users_rbac.profiles p
 WHERE (a.organization_id,a.site_id,a.user_id)=(p.organization_id,p.site_id,p.user_id)
 AND p.profile<>'administrator' AND a.is_active
 AND a.role_id IN ('assets-administrator','integration-reader','integration-manager',
   'locator-manager','workforce-administrator','maintenance-administrator',
   'site-operator','jobs-administrator');
DROP POLICY administrator_configuration_migration ON users_rbac.profiles;
DROP POLICY administrator_configuration_migration ON users_rbac.site_role_assignments;
