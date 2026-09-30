-- Up Migration
-- IOP-184: site-scoped M6 records and append-only revisions; no physical deletion.
ALTER TABLE users_rbac.site_role_assignments DROP CONSTRAINT site_role_assignments_role_id_check;
ALTER TABLE users_rbac.site_role_assignments ADD CHECK (role_id IN
 ('site-operator','analytics-reader','handover-contributor','handover-coordinator','workforce-reader','workforce-planner','workforce-administrator'));
CREATE POLICY workforce_migration ON users_rbac.profiles TO iop_migrator USING (true);
CREATE POLICY workforce_migration ON users_rbac.organization_memberships TO iop_migrator USING (true);
CREATE POLICY workforce_migration ON users_rbac.users TO iop_migrator USING (true);
CREATE POLICY workforce_migration ON users_rbac.site_role_assignments TO iop_migrator USING (true) WITH CHECK (true);
INSERT INTO users_rbac.site_role_assignments(organization_id,user_id,site_id,role_id,is_active)
 SELECT p.organization_id,p.user_id,p.site_id,r.role_id,true FROM users_rbac.profiles p
 JOIN users_rbac.organization_memberships m USING(organization_id,user_id) JOIN users_rbac.users u USING(user_id)
 CROSS JOIN (VALUES ('workforce-reader'),('workforce-planner'),('workforce-administrator')) r(role_id)
 WHERE m.is_active AND u.is_active AND EXISTS (SELECT 1 FROM users_rbac.site_role_assignments a WHERE a.organization_id=p.organization_id AND a.site_id=p.site_id AND a.user_id=p.user_id AND a.is_active)
 AND (r.role_id='workforce-reader' OR r.role_id='workforce-planner' AND p.profile IN ('administrator','team-leader') OR r.role_id='workforce-administrator' AND p.profile='administrator') ON CONFLICT DO NOTHING;
DROP POLICY workforce_migration ON users_rbac.profiles;
DROP POLICY workforce_migration ON users_rbac.organization_memberships;
DROP POLICY workforce_migration ON users_rbac.users;
DROP POLICY workforce_migration ON users_rbac.site_role_assignments;
CREATE SCHEMA workforce AUTHORIZATION iop_migrator;
REVOKE ALL ON SCHEMA workforce FROM PUBLIC;
GRANT USAGE ON SCHEMA workforce TO iop_runtime;
CREATE TABLE workforce.records (
 organization_id text NOT NULL, site_id text NOT NULL, kind text NOT NULL CHECK(kind IN ('settings','worker','schedule','assignment')),
 id text NOT NULL, business_date date, revision integer NOT NULL CHECK(revision>0), snapshot jsonb NOT NULL CHECK(octet_length(snapshot::text)<=131072),
 PRIMARY KEY(organization_id,site_id,kind,id), FOREIGN KEY(organization_id,site_id) REFERENCES platform_core.sites(organization_id,site_id)
);
CREATE TABLE workforce.revisions (
 organization_id text NOT NULL, site_id text NOT NULL, kind text NOT NULL, id text NOT NULL,
 revision integer NOT NULL CHECK(revision>0), snapshot jsonb NOT NULL CHECK(octet_length(snapshot::text)<=262144),
 PRIMARY KEY(organization_id,site_id,kind,id,revision), FOREIGN KEY(organization_id,site_id,kind,id) REFERENCES workforce.records(organization_id,site_id,kind,id)
);
CREATE INDEX workforce_date ON workforce.records(organization_id,site_id,business_date);
DO $$ DECLARE t text; BEGIN FOREACH t IN ARRAY ARRAY['records','revisions'] LOOP
 EXECUTE format('ALTER TABLE workforce.%I ENABLE ROW LEVEL SECURITY',t);
 EXECUTE format('ALTER TABLE workforce.%I FORCE ROW LEVEL SECURITY',t);
 EXECUTE format('CREATE POLICY site_scope ON workforce.%I TO iop_runtime USING (organization_id=current_setting(''iop.organization_id'',true) AND site_id=current_setting(''iop.site_id'',true)) WITH CHECK (organization_id=current_setting(''iop.organization_id'',true) AND site_id=current_setting(''iop.site_id'',true))',t);
 END LOOP; END $$;
GRANT SELECT(organization_id,site_id,kind,id,business_date,revision,snapshot), INSERT(organization_id,site_id,kind,id,business_date,revision,snapshot) ON workforce.records TO iop_runtime;
GRANT SELECT(organization_id,site_id,kind,id,revision,snapshot), INSERT(organization_id,site_id,kind,id,revision,snapshot) ON workforce.revisions TO iop_runtime;
GRANT UPDATE(business_date,revision,snapshot) ON workforce.records TO iop_runtime;
