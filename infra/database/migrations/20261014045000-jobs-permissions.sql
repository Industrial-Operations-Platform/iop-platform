-- Up Migration
-- IOP-208: scoped jobs are explicitly operator-controlled; old revocations stay revoked.
ALTER TABLE users_rbac.site_role_assignments DROP CONSTRAINT site_role_assignments_role_id_check;
ALTER TABLE users_rbac.site_role_assignments ADD CHECK (role_id IN (
 'site-operator','analytics-reader','handover-contributor','handover-coordinator',
 'workforce-reader','workforce-planner','workforce-administrator',
 'maintenance-contributor','maintenance-coordinator','maintenance-administrator',
 'assets-reader','assets-administrator','handover-record-manager',
 'improvement-contributor','improvement-coordinator','locator-reader','locator-manager',
 'integration-reader','integration-manager','jobs-administrator'));
CREATE POLICY jobs_permission_migration ON users_rbac.profiles TO iop_migrator USING (true);
CREATE POLICY jobs_permission_migration ON users_rbac.organization_memberships TO iop_migrator USING (true);
CREATE POLICY jobs_permission_migration ON users_rbac.users TO iop_migrator USING (true);
CREATE POLICY jobs_permission_migration ON users_rbac.site_role_assignments TO iop_migrator USING (true) WITH CHECK (true);
INSERT INTO users_rbac.site_role_assignments(organization_id,user_id,site_id,role_id,is_active)
 SELECT p.organization_id,p.user_id,p.site_id,'jobs-administrator',true
 FROM users_rbac.profiles p JOIN users_rbac.organization_memberships m USING(organization_id,user_id)
 JOIN users_rbac.users u USING(user_id)
 WHERE p.profile='administrator' AND m.is_active AND u.is_active
 AND EXISTS (SELECT 1 FROM users_rbac.site_role_assignments a WHERE a.organization_id=p.organization_id
  AND a.site_id=p.site_id AND a.user_id=p.user_id AND a.is_active)
 ON CONFLICT DO NOTHING;
DROP POLICY jobs_permission_migration ON users_rbac.profiles;
DROP POLICY jobs_permission_migration ON users_rbac.organization_memberships;
DROP POLICY jobs_permission_migration ON users_rbac.users;
DROP POLICY jobs_permission_migration ON users_rbac.site_role_assignments;
