-- Up Migration
-- IOP-194: explicit owner-requested operational responsibilities and completion dates.
ALTER TABLE maintenance.records ADD COLUMN completed_at timestamptz(3);
CREATE POLICY maintenance_scope_migration ON maintenance.records TO iop_migrator USING (true) WITH CHECK (true);
CREATE POLICY maintenance_scope_migration ON maintenance.revisions TO iop_migrator USING (true);
UPDATE maintenance.records r SET completed_at=coalesce((
  SELECT v.at FROM maintenance.revisions v
  WHERE (v.organization_id,v.site_id,v.id)=(r.organization_id,r.site_id,r.id)
    AND v.snapshot->'record'->'data'->>'status'='done'
    AND v.snapshot->>'action' IN ('created','status-changed')
  ORDER BY v.revision DESC LIMIT 1
),r.updated_at) WHERE r.status='done';
DROP POLICY maintenance_scope_migration ON maintenance.records;
DROP POLICY maintenance_scope_migration ON maintenance.revisions;
GRANT SELECT(completed_at), INSERT(completed_at), UPDATE(completed_at) ON maintenance.records TO iop_runtime;
CREATE INDEX maintenance_completed ON maintenance.records(organization_id,site_id,completed_at DESC) WHERE status='done';

CREATE POLICY maintenance_scope_migration ON users_rbac.profiles TO iop_migrator USING (true);
CREATE POLICY maintenance_scope_migration ON users_rbac.organization_memberships TO iop_migrator USING (true);
CREATE POLICY maintenance_scope_migration ON users_rbac.users TO iop_migrator USING (true);
CREATE POLICY maintenance_scope_migration ON users_rbac.site_role_assignments TO iop_migrator USING (true) WITH CHECK (true);
-- Restrictions apply even to older bundles; no membership or revoked grant is restored.
UPDATE users_rbac.site_role_assignments a SET is_active=false
FROM users_rbac.profiles p
WHERE (a.organization_id,a.site_id,a.user_id)=(p.organization_id,p.site_id,p.user_id)
AND (a.role_id='maintenance-coordinator' AND p.profile<>'team-leader'
  OR a.role_id IN ('assets-reader','assets-administrator') AND p.profile NOT IN ('team-leader','task-force'));
INSERT INTO users_rbac.site_role_assignments(organization_id,user_id,site_id,role_id,is_active)
SELECT p.organization_id,p.user_id,p.site_id,r.role_id,true
FROM users_rbac.profiles p JOIN users_rbac.organization_memberships m USING(organization_id,user_id)
JOIN users_rbac.users u USING(user_id)
CROSS JOIN (VALUES ('assets-reader'),('assets-administrator'),('maintenance-coordinator')) r(role_id)
WHERE m.is_active AND u.is_active
AND (r.role_id IN ('assets-reader','assets-administrator') AND p.profile IN ('team-leader','task-force')
  OR r.role_id='maintenance-coordinator' AND p.profile='team-leader')
AND EXISTS(SELECT 1 FROM users_rbac.site_role_assignments a
  WHERE (a.organization_id,a.site_id,a.user_id)=(p.organization_id,p.site_id,p.user_id) AND a.is_active)
ON CONFLICT DO NOTHING;
DROP POLICY maintenance_scope_migration ON users_rbac.profiles;
DROP POLICY maintenance_scope_migration ON users_rbac.organization_memberships;
DROP POLICY maintenance_scope_migration ON users_rbac.users;
DROP POLICY maintenance_scope_migration ON users_rbac.site_role_assignments;
