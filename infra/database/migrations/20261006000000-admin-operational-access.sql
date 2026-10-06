-- Up Migration
-- IOP-194: the owner explicitly restores Administrator operational responsibilities.
CREATE POLICY admin_operational_migration ON users_rbac.profiles TO iop_migrator USING (true);
CREATE POLICY admin_operational_migration ON users_rbac.organization_memberships TO iop_migrator USING (true);
CREATE POLICY admin_operational_migration ON users_rbac.users TO iop_migrator USING (true);
CREATE POLICY admin_operational_migration ON users_rbac.site_role_assignments TO iop_migrator USING (true) WITH CHECK (true);
-- Previous migration restrictions and earlier role-specific revocations have no retained
-- provenance. This authorized restoration intentionally reactivates these three roles
-- for active Administrators with existing site access; other revocations are preserved.
INSERT INTO users_rbac.site_role_assignments(organization_id,user_id,site_id,role_id,is_active)
SELECT p.organization_id,p.user_id,p.site_id,r.role_id,true
FROM users_rbac.profiles p JOIN users_rbac.organization_memberships m USING(organization_id,user_id)
JOIN users_rbac.users u USING(user_id)
CROSS JOIN (VALUES ('maintenance-coordinator'),('assets-reader'),('assets-administrator')) r(role_id)
WHERE p.profile='administrator' AND m.is_active AND u.is_active
AND EXISTS(SELECT 1 FROM users_rbac.site_role_assignments a
  WHERE (a.organization_id,a.site_id,a.user_id)=(p.organization_id,p.site_id,p.user_id) AND a.is_active)
ON CONFLICT(organization_id,user_id,site_id,role_id) DO UPDATE SET is_active=true;
DROP POLICY admin_operational_migration ON users_rbac.profiles;
DROP POLICY admin_operational_migration ON users_rbac.organization_memberships;
DROP POLICY admin_operational_migration ON users_rbac.users;
DROP POLICY admin_operational_migration ON users_rbac.site_role_assignments;
-- OIP-owned identifiers support bounded exact catalog validation without scanning
-- every retained alarm fact for each registration in a large equipment inventory.
CREATE INDEX hitliste_equipment_context ON analytics.fact_hitliste(organization_id,site_id,source_id,betriebsmittel_id,bereich_id,sektor_id);
CREATE INDEX hitliste_equipment_code ON analytics.betriebsmittel(organization_id,site_id,source_id,kennzeichen,bereich_id);
