-- Up Migration
-- IOP-194: scoped current maintenance records and immutable local change evidence.
CREATE SCHEMA maintenance AUTHORIZATION iop_migrator;
REVOKE ALL ON SCHEMA maintenance FROM PUBLIC;
GRANT USAGE ON SCHEMA maintenance TO iop_runtime;
CREATE TABLE maintenance.records (
 organization_id text NOT NULL, site_id text NOT NULL, id text NOT NULL,
 revision integer NOT NULL CHECK(revision>0),
 status text NOT NULL CHECK(status IN ('open','in-progress','blocked','done')),
 priority_id text NOT NULL, location_id text NOT NULL, asset_id text,
 assignee_id text, team_id text NOT NULL, due_date date, author_id text NOT NULL,
 updated_at timestamptz(3) NOT NULL,
 snapshot jsonb NOT NULL CHECK(octet_length(snapshot::text)<=65536),
 PRIMARY KEY(organization_id,site_id,id),
 FOREIGN KEY(organization_id,site_id) REFERENCES platform_core.sites(organization_id,site_id),
 FOREIGN KEY(organization_id,site_id,author_id) REFERENCES users_rbac.profiles(organization_id,site_id,user_id),
 FOREIGN KEY(organization_id,site_id,assignee_id) REFERENCES users_rbac.profiles(organization_id,site_id,user_id)
);
CREATE TABLE maintenance.revisions (
 organization_id text NOT NULL, site_id text NOT NULL, id text NOT NULL,
 revision integer NOT NULL CHECK(revision>0), asset_id text, actor_id text NOT NULL,
 at timestamptz(3) NOT NULL, snapshot jsonb NOT NULL CHECK(octet_length(snapshot::text)<=131072),
 PRIMARY KEY(organization_id,site_id,id,revision),
 FOREIGN KEY(organization_id,site_id,id) REFERENCES maintenance.records(organization_id,site_id,id),
 FOREIGN KEY(organization_id,site_id,actor_id) REFERENCES users_rbac.profiles(organization_id,site_id,user_id)
);
CREATE TABLE maintenance.settings (
 organization_id text NOT NULL, site_id text NOT NULL, revision integer NOT NULL CHECK(revision>0),
 snapshot jsonb NOT NULL CHECK(octet_length(snapshot::text)<=16384),
 PRIMARY KEY(organization_id,site_id),
 FOREIGN KEY(organization_id,site_id) REFERENCES platform_core.sites(organization_id,site_id)
);
CREATE TABLE maintenance.settings_revisions (
 organization_id text NOT NULL, site_id text NOT NULL, revision integer NOT NULL CHECK(revision>0),
 actor_id text NOT NULL, at timestamptz(3) NOT NULL, snapshot jsonb NOT NULL CHECK(octet_length(snapshot::text)<=16384),
 PRIMARY KEY(organization_id,site_id,revision),
 FOREIGN KEY(organization_id,site_id) REFERENCES maintenance.settings(organization_id,site_id),
 FOREIGN KEY(organization_id,site_id,actor_id) REFERENCES users_rbac.profiles(organization_id,site_id,user_id)
);
CREATE INDEX maintenance_board ON maintenance.records(organization_id,site_id,updated_at DESC,id DESC);
CREATE INDEX maintenance_asset_history ON maintenance.revisions(organization_id,site_id,asset_id,at DESC);
DO $$ DECLARE t text; BEGIN FOREACH t IN ARRAY ARRAY['records','revisions','settings','settings_revisions'] LOOP
 EXECUTE format('ALTER TABLE maintenance.%I ENABLE ROW LEVEL SECURITY',t);
 EXECUTE format('ALTER TABLE maintenance.%I FORCE ROW LEVEL SECURITY',t);
 EXECUTE format('CREATE POLICY site_scope ON maintenance.%I TO iop_runtime USING (organization_id=current_setting(''iop.organization_id'',true) AND site_id=current_setting(''iop.site_id'',true)) WITH CHECK (organization_id=current_setting(''iop.organization_id'',true) AND site_id=current_setting(''iop.site_id'',true))',t);
 END LOOP; END $$;
GRANT SELECT(organization_id,site_id,id,revision,status,priority_id,location_id,asset_id,assignee_id,team_id,due_date,updated_at,snapshot,author_id), INSERT(organization_id,site_id,id,revision,status,priority_id,location_id,asset_id,assignee_id,team_id,due_date,updated_at,snapshot,author_id) ON maintenance.records TO iop_runtime;
GRANT UPDATE(revision,status,priority_id,location_id,asset_id,assignee_id,team_id,due_date,updated_at,snapshot) ON maintenance.records TO iop_runtime;
GRANT SELECT(organization_id,site_id,id,revision,asset_id,actor_id,at,snapshot), INSERT(organization_id,site_id,id,revision,asset_id,actor_id,at,snapshot) ON maintenance.revisions TO iop_runtime;
GRANT SELECT(organization_id,site_id,revision,snapshot), INSERT(organization_id,site_id,revision,snapshot), UPDATE(revision,snapshot) ON maintenance.settings TO iop_runtime;
GRANT SELECT(organization_id,site_id,revision,actor_id,at,snapshot), INSERT(organization_id,site_id,revision,actor_id,at,snapshot) ON maintenance.settings_revisions TO iop_runtime;
