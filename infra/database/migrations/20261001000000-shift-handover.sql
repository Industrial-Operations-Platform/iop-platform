-- Up Migration
-- ADR-0036: durable site journal, immutable revisions and explicit operational grants.
ALTER TABLE users_rbac.site_role_assignments DROP CONSTRAINT site_role_assignments_role_id_check;
ALTER TABLE users_rbac.site_role_assignments ADD CHECK (role_id IN
 ('site-operator','analytics-reader','handover-contributor','handover-coordinator'));

-- Migration-only visibility is removed within this transaction; existing disabled grants stay disabled.
CREATE POLICY handover_migration ON users_rbac.profiles TO iop_migrator USING (true);
CREATE POLICY handover_migration ON users_rbac.organization_memberships TO iop_migrator USING (true);
CREATE POLICY handover_migration ON users_rbac.users TO iop_migrator USING (true);
CREATE POLICY handover_migration ON users_rbac.site_role_assignments TO iop_migrator USING (true) WITH CHECK (true);
INSERT INTO users_rbac.site_role_assignments(organization_id,user_id,site_id,role_id,is_active)
 SELECT p.organization_id,p.user_id,p.site_id,r.role_id,true
 FROM users_rbac.profiles p JOIN users_rbac.organization_memberships m USING(organization_id,user_id)
 JOIN users_rbac.users u USING(user_id)
 CROSS JOIN (VALUES ('handover-contributor'),('handover-coordinator')) r(role_id)
 WHERE m.is_active AND u.is_active
 AND EXISTS (SELECT 1 FROM users_rbac.site_role_assignments a WHERE a.organization_id=p.organization_id
 AND a.user_id=p.user_id AND a.site_id=p.site_id AND a.is_active)
 AND (r.role_id='handover-contributor' OR p.profile IN ('administrator','team-leader'))
 ON CONFLICT DO NOTHING;
DROP POLICY handover_migration ON users_rbac.profiles;
DROP POLICY handover_migration ON users_rbac.organization_memberships;
DROP POLICY handover_migration ON users_rbac.users;
DROP POLICY handover_migration ON users_rbac.site_role_assignments;

-- Narrow site directory for responsibility and retained author names. No credential/profile grant changes.
CREATE POLICY handover_people ON users_rbac.profiles FOR SELECT TO iop_runtime
 USING (organization_id=current_setting('iop.organization_id',true) AND site_id=current_setting('iop.site_id',true));
CREATE POLICY handover_memberships ON users_rbac.organization_memberships FOR SELECT TO iop_runtime
 USING (organization_id=current_setting('iop.organization_id',true));
CREATE POLICY handover_users ON users_rbac.users FOR SELECT TO iop_runtime
 USING (user_id IN (SELECT user_id FROM users_rbac.profiles WHERE
 organization_id=current_setting('iop.organization_id',true) AND site_id=current_setting('iop.site_id',true)));

ALTER TABLE users_rbac.profiles ADD CONSTRAINT profiles_site_user UNIQUE(organization_id,site_id,user_id);

CREATE SCHEMA shift_handover AUTHORIZATION iop_migrator;
REVOKE ALL ON SCHEMA shift_handover FROM PUBLIC;
GRANT USAGE ON SCHEMA shift_handover TO iop_runtime;
CREATE TABLE shift_handover.equipment_references (
 organization_id text NOT NULL, site_id text NOT NULL, id text NOT NULL,
 namespace text NOT NULL CHECK (length(namespace) BETWEEN 1 AND 64),
 code text NOT NULL CHECK (length(code) BETWEEN 1 AND 160),
 department_id text NOT NULL CHECK (length(department_id) BETWEEN 1 AND 64),
 area_id text NOT NULL CHECK (length(area_id)<=64),
 PRIMARY KEY (organization_id,site_id,id),
 UNIQUE (organization_id,site_id,namespace,code,department_id,area_id),
 FOREIGN KEY (organization_id,site_id) REFERENCES platform_core.sites(organization_id,site_id)
);
CREATE TABLE shift_handover.entries (
 organization_id text NOT NULL, site_id text NOT NULL, id text NOT NULL,
 author_id text NOT NULL, responsible_id text, equipment_id text,
 occurrence_date date NOT NULL, created_at timestamptz(3) NOT NULL,
 revision integer NOT NULL CHECK (revision>0), snapshot jsonb NOT NULL CHECK (octet_length(snapshot::text)<=65536),
 request_key text NOT NULL CHECK (length(request_key) BETWEEN 1 AND 64),
 fingerprint text NOT NULL CHECK (length(fingerprint)<=65536),
 PRIMARY KEY (organization_id,site_id,id), UNIQUE(organization_id,site_id,author_id,request_key),
 FOREIGN KEY (organization_id,site_id) REFERENCES platform_core.sites(organization_id,site_id),
 FOREIGN KEY (organization_id,site_id,author_id) REFERENCES users_rbac.profiles(organization_id,site_id,user_id),
 FOREIGN KEY (organization_id,site_id,responsible_id) REFERENCES users_rbac.profiles(organization_id,site_id,user_id),
 FOREIGN KEY (organization_id,site_id,equipment_id) REFERENCES shift_handover.equipment_references(organization_id,site_id,id)
);
CREATE TABLE shift_handover.revisions (
 organization_id text NOT NULL, site_id text NOT NULL, entry_id text NOT NULL,
 revision integer NOT NULL CHECK (revision>0), actor_id text NOT NULL,
 recorded_at timestamptz(3) NOT NULL, snapshot jsonb NOT NULL CHECK (octet_length(snapshot::text)<=131072),
 PRIMARY KEY(organization_id,site_id,entry_id,revision),
 FOREIGN KEY(organization_id,site_id,entry_id) REFERENCES shift_handover.entries(organization_id,site_id,id),
 FOREIGN KEY(organization_id,actor_id) REFERENCES users_rbac.organization_memberships(organization_id,user_id)
);
CREATE INDEX handover_date ON shift_handover.entries(organization_id,site_id,occurrence_date DESC,id DESC);
CREATE INDEX handover_equipment ON shift_handover.entries(organization_id,site_id,equipment_id);

DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['equipment_references','entries','revisions'] LOOP
  EXECUTE format('ALTER TABLE shift_handover.%I ENABLE ROW LEVEL SECURITY',t);
  EXECUTE format('ALTER TABLE shift_handover.%I FORCE ROW LEVEL SECURITY',t);
  EXECUTE format('REVOKE ALL ON shift_handover.%I FROM PUBLIC',t);
  EXECUTE format('CREATE POLICY site_scope ON shift_handover.%I TO iop_runtime USING
    (organization_id=current_setting(''iop.organization_id'',true) AND site_id=current_setting(''iop.site_id'',true))
    WITH CHECK (organization_id=current_setting(''iop.organization_id'',true) AND site_id=current_setting(''iop.site_id'',true))',t);
 END LOOP;
END $$;
GRANT SELECT (organization_id,site_id,id,namespace,code,department_id,area_id),
 INSERT (organization_id,site_id,id,namespace,code,department_id,area_id) ON shift_handover.equipment_references TO iop_runtime;
GRANT SELECT (organization_id,site_id,id,author_id,responsible_id,equipment_id,occurrence_date,created_at,revision,snapshot,request_key,fingerprint),
 INSERT (organization_id,site_id,id,author_id,responsible_id,equipment_id,occurrence_date,created_at,revision,snapshot,request_key,fingerprint),
 UPDATE (responsible_id,equipment_id,occurrence_date,revision,snapshot) ON shift_handover.entries TO iop_runtime;
GRANT SELECT (organization_id,site_id,entry_id,revision,actor_id,recorded_at,snapshot),
 INSERT (organization_id,site_id,entry_id,revision,actor_id,recorded_at,snapshot) ON shift_handover.revisions TO iop_runtime;
