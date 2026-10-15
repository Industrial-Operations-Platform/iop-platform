-- Up Migration
-- IOP-211: revoke superseded managed writers without changing compact read authority.
CREATE POLICY administrator_assets_migration ON users_rbac.profiles TO iop_migrator USING (true);
CREATE POLICY administrator_assets_migration ON users_rbac.site_role_assignments TO iop_migrator USING (true) WITH CHECK (true);
UPDATE users_rbac.site_role_assignments a SET is_active=false
FROM users_rbac.profiles p
WHERE (a.organization_id,a.site_id,a.user_id)=(p.organization_id,p.site_id,p.user_id)
AND p.profile<>'administrator' AND a.is_active
AND a.role_id IN ('assets-administrator','locator-manager');
DROP POLICY administrator_assets_migration ON users_rbac.profiles;
DROP POLICY administrator_assets_migration ON users_rbac.site_role_assignments;
