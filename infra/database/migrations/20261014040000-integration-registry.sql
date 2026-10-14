-- Up Migration
CREATE TABLE integrations.connections (
 organization_id text NOT NULL, site_id text NOT NULL,
 kind text NOT NULL CHECK(kind IN ('wincc','ultimo','entra')),
 revision integer NOT NULL CHECK(revision>0), snapshot jsonb NOT NULL CHECK(octet_length(snapshot::text)<=8192),
 PRIMARY KEY(organization_id,site_id,kind),
 FOREIGN KEY(organization_id,site_id) REFERENCES platform_core.sites(organization_id,site_id)
);
CREATE TABLE integrations.connection_revisions (
 organization_id text NOT NULL, site_id text NOT NULL, kind text NOT NULL,
 revision integer NOT NULL CHECK(revision>0), snapshot jsonb NOT NULL CHECK(octet_length(snapshot::text)<=8192),
 PRIMARY KEY(organization_id,site_id,kind,revision),
 FOREIGN KEY(organization_id,site_id,kind) REFERENCES integrations.connections(organization_id,site_id,kind)
);
DO $$ DECLARE t text; BEGIN FOREACH t IN ARRAY ARRAY['connections','connection_revisions'] LOOP
 EXECUTE format('ALTER TABLE integrations.%I ENABLE ROW LEVEL SECURITY',t);
 EXECUTE format('ALTER TABLE integrations.%I FORCE ROW LEVEL SECURITY',t);
 EXECUTE format('CREATE POLICY site_scope ON integrations.%I TO iop_runtime USING (organization_id=current_setting(''iop.organization_id'',true) AND site_id=current_setting(''iop.site_id'',true)) WITH CHECK (organization_id=current_setting(''iop.organization_id'',true) AND site_id=current_setting(''iop.site_id'',true))',t);
 END LOOP; END $$;
GRANT SELECT(organization_id,site_id,kind,revision,snapshot), INSERT(organization_id,site_id,kind,revision,snapshot) ON integrations.connections TO iop_runtime;
GRANT UPDATE(revision,snapshot) ON integrations.connections TO iop_runtime;
GRANT SELECT(organization_id,site_id,kind,revision,snapshot), INSERT(organization_id,site_id,kind,revision,snapshot) ON integrations.connection_revisions TO iop_runtime;
