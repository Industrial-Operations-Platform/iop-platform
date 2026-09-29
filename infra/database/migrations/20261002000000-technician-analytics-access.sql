-- Up Migration
-- IOP-171: remove historical analytical grants from the Technician profile only.
CREATE POLICY technician_access_migration ON users_rbac.profiles TO iop_migrator USING (true);
CREATE POLICY technician_access_migration ON users_rbac.site_role_assignments TO iop_migrator USING (true) WITH CHECK (true);
UPDATE users_rbac.site_role_assignments a SET is_active=false
 FROM users_rbac.profiles p
 WHERE p.organization_id=a.organization_id AND p.user_id=a.user_id AND p.site_id=a.site_id
 AND p.profile='technician' AND a.role_id='analytics-reader' AND a.is_active;
DROP POLICY technician_access_migration ON users_rbac.profiles;
DROP POLICY technician_access_migration ON users_rbac.site_role_assignments;

-- Down Migration
-- Do not silently restore revoked grants. An authorized profile change can assign access.
