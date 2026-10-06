-- Up Migration
-- IOP-194: explicit stable assets and exact source aliases; revision snapshots remain immutable.
CREATE SCHEMA assets AUTHORIZATION iop_migrator;
REVOKE ALL ON SCHEMA assets FROM PUBLIC;
GRANT USAGE ON SCHEMA assets TO iop_runtime;
CREATE TABLE assets.records (
 organization_id text NOT NULL, site_id text NOT NULL, id text NOT NULL,
 code text NOT NULL CHECK(length(code) BETWEEN 1 AND 160), status text NOT NULL CHECK(status IN ('unverified','validated','retired')),
 location_id text NOT NULL, revision integer NOT NULL CHECK(revision>0), snapshot jsonb NOT NULL CHECK(octet_length(snapshot::text)<=131072),
 author_id text NOT NULL, created_at timestamptz(3) NOT NULL, request_key text NOT NULL, fingerprint text NOT NULL,
 PRIMARY KEY(organization_id,site_id,id), UNIQUE(organization_id,site_id,code), UNIQUE(organization_id,site_id,author_id,request_key),
 FOREIGN KEY(organization_id,site_id) REFERENCES platform_core.sites(organization_id,site_id),
 FOREIGN KEY(organization_id,site_id,author_id) REFERENCES users_rbac.profiles(organization_id,site_id,user_id)
);
CREATE TABLE assets.aliases (
 organization_id text NOT NULL, site_id text NOT NULL, asset_id text NOT NULL,
 alias_key text NOT NULL CHECK(length(alias_key) BETWEEN 1 AND 1000), active boolean NOT NULL,
 PRIMARY KEY(organization_id,site_id,asset_id,alias_key),
 FOREIGN KEY(organization_id,site_id,asset_id) REFERENCES assets.records(organization_id,site_id,id)
);
CREATE UNIQUE INDEX assets_exact_active_alias ON assets.aliases(organization_id,site_id,alias_key) WHERE active;
ALTER TABLE maintenance.records ADD FOREIGN KEY(organization_id,site_id,asset_id) REFERENCES assets.records(organization_id,site_id,id);
ALTER TABLE maintenance.revisions ADD FOREIGN KEY(organization_id,site_id,asset_id) REFERENCES assets.records(organization_id,site_id,id);
CREATE TABLE assets.revisions (
 organization_id text NOT NULL, site_id text NOT NULL, asset_id text NOT NULL,
 revision integer NOT NULL CHECK(revision>0), recorded_at timestamptz(3) NOT NULL, snapshot jsonb NOT NULL CHECK(octet_length(snapshot::text)<=262144),
 PRIMARY KEY(organization_id,site_id,asset_id,revision), FOREIGN KEY(organization_id,site_id,asset_id) REFERENCES assets.records(organization_id,site_id,id)
);
DO $$ DECLARE t text; BEGIN FOREACH t IN ARRAY ARRAY['records','aliases','revisions'] LOOP
 EXECUTE format('ALTER TABLE assets.%I ENABLE ROW LEVEL SECURITY',t);
 EXECUTE format('ALTER TABLE assets.%I FORCE ROW LEVEL SECURITY',t);
 EXECUTE format('CREATE POLICY site_scope ON assets.%I TO iop_runtime USING (organization_id=current_setting(''iop.organization_id'',true) AND site_id=current_setting(''iop.site_id'',true)) WITH CHECK (organization_id=current_setting(''iop.organization_id'',true) AND site_id=current_setting(''iop.site_id'',true))',t);
 END LOOP; END $$;
GRANT SELECT(organization_id,site_id,id,code,status,location_id,revision,snapshot,author_id,created_at,request_key,fingerprint), INSERT(organization_id,site_id,id,code,status,location_id,revision,snapshot,author_id,created_at,request_key,fingerprint) ON assets.records TO iop_runtime;
GRANT UPDATE(code,status,location_id,revision,snapshot) ON assets.records TO iop_runtime;
GRANT SELECT(organization_id,site_id,asset_id,alias_key,active), INSERT(organization_id,site_id,asset_id,alias_key,active) ON assets.aliases TO iop_runtime;
GRANT UPDATE(active) ON assets.aliases TO iop_runtime;
GRANT SELECT(organization_id,site_id,asset_id,revision,recorded_at,snapshot), INSERT(organization_id,site_id,asset_id,revision,recorded_at,snapshot) ON assets.revisions TO iop_runtime;
