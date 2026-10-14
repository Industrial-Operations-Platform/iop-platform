-- Up Migration
-- IOP-203: explicitly delegated advanced functions, never revived revoked grants.
ALTER TABLE users_rbac.site_role_assignments DROP CONSTRAINT site_role_assignments_role_id_check;
ALTER TABLE users_rbac.site_role_assignments ADD CHECK (role_id IN (
 'site-operator','analytics-reader','handover-contributor','handover-coordinator',
 'workforce-reader','workforce-planner','workforce-administrator',
 'maintenance-contributor','maintenance-coordinator','maintenance-administrator',
 'assets-reader','assets-administrator','handover-record-manager',
 'improvement-contributor','improvement-coordinator','locator-reader','locator-manager',
 'integration-reader','integration-manager'));

CREATE POLICY platform_completion_migration ON users_rbac.profiles TO iop_migrator USING (true);
CREATE POLICY platform_completion_migration ON users_rbac.organization_memberships TO iop_migrator USING (true);
CREATE POLICY platform_completion_migration ON users_rbac.users TO iop_migrator USING (true);
CREATE POLICY platform_completion_migration ON users_rbac.site_role_assignments TO iop_migrator USING (true) WITH CHECK (true);
INSERT INTO users_rbac.site_role_assignments(organization_id,user_id,site_id,role_id,is_active)
 SELECT p.organization_id,p.user_id,p.site_id,r.role_id,true
 FROM users_rbac.profiles p
 JOIN users_rbac.organization_memberships m USING(organization_id,user_id)
 JOIN users_rbac.users u USING(user_id)
 CROSS JOIN (VALUES ('handover-record-manager'),('improvement-contributor'),
 ('improvement-coordinator'),('locator-reader'),('locator-manager'),
 ('integration-reader'),('integration-manager')) r(role_id)
 WHERE p.profile IN ('administrator','team-leader','task-force')
 AND m.is_active AND u.is_active
 AND EXISTS (SELECT 1 FROM users_rbac.site_role_assignments a
   WHERE a.organization_id=p.organization_id AND a.site_id=p.site_id
   AND a.user_id=p.user_id AND a.is_active)
 AND (r.role_id<>'integration-manager' OR p.profile='administrator')
 ON CONFLICT DO NOTHING;
DROP POLICY platform_completion_migration ON users_rbac.profiles;
DROP POLICY platform_completion_migration ON users_rbac.organization_memberships;
DROP POLICY platform_completion_migration ON users_rbac.users;
DROP POLICY platform_completion_migration ON users_rbac.site_role_assignments;
