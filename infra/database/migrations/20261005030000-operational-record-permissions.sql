-- Up Migration
-- IOP-194: explicit operational permissions for active, already granted profiles.
ALTER TABLE users_rbac.site_role_assignments DROP CONSTRAINT site_role_assignments_role_id_check;
ALTER TABLE users_rbac.site_role_assignments ADD CHECK (role_id IN (
 'site-operator','analytics-reader','handover-contributor','handover-coordinator',
 'workforce-reader','workforce-planner','workforce-administrator',
 'maintenance-contributor','maintenance-coordinator','maintenance-administrator',
 'assets-reader','assets-administrator'));

CREATE POLICY operational_record_migration ON users_rbac.profiles TO iop_migrator USING (true);
CREATE POLICY operational_record_migration ON users_rbac.organization_memberships TO iop_migrator USING (true);
CREATE POLICY operational_record_migration ON users_rbac.users TO iop_migrator USING (true);
CREATE POLICY operational_record_migration ON users_rbac.site_role_assignments TO iop_migrator USING (true) WITH CHECK (true);
INSERT INTO users_rbac.site_role_assignments(organization_id,user_id,site_id,role_id,is_active)
 SELECT p.organization_id,p.user_id,p.site_id,r.role_id,true
 FROM users_rbac.profiles p
 JOIN users_rbac.organization_memberships m USING(organization_id,user_id)
 JOIN users_rbac.users u USING(user_id)
 CROSS JOIN (VALUES ('maintenance-contributor'),('maintenance-coordinator'),
   ('maintenance-administrator'),('assets-reader'),('assets-administrator')) r(role_id)
 WHERE m.is_active AND u.is_active
 AND EXISTS (SELECT 1 FROM users_rbac.site_role_assignments a
   WHERE a.organization_id=p.organization_id AND a.site_id=p.site_id
   AND a.user_id=p.user_id AND a.is_active)
 AND (r.role_id IN ('maintenance-contributor','assets-reader')
   OR r.role_id='maintenance-coordinator' AND p.profile IN ('administrator','team-leader')
   OR r.role_id IN ('maintenance-administrator','assets-administrator') AND p.profile='administrator')
 ON CONFLICT DO NOTHING;
DROP POLICY operational_record_migration ON users_rbac.profiles;
DROP POLICY operational_record_migration ON users_rbac.organization_memberships;
DROP POLICY operational_record_migration ON users_rbac.users;
DROP POLICY operational_record_migration ON users_rbac.site_role_assignments;
