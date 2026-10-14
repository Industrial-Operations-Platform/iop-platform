-- Up Migration
-- IOP-206: Locator owns versioned schematic scenes; Assets retains canonical identities.
CREATE SCHEMA asset_locator AUTHORIZATION iop_migrator;
REVOKE ALL ON SCHEMA asset_locator FROM PUBLIC;
GRANT USAGE ON SCHEMA asset_locator TO iop_runtime;
CREATE TABLE asset_locator.scenes (
 organization_id text NOT NULL, site_id text NOT NULL, id text NOT NULL,
 revision integer NOT NULL CHECK(revision>0), snapshot jsonb NOT NULL CHECK(octet_length(snapshot::text)<=1048576),
 PRIMARY KEY(organization_id,site_id,id),
 FOREIGN KEY(organization_id,site_id) REFERENCES platform_core.sites(organization_id,site_id)
);
CREATE TABLE asset_locator.revisions (
 organization_id text NOT NULL, site_id text NOT NULL, scene_id text NOT NULL,
 revision integer NOT NULL CHECK(revision>0), snapshot jsonb NOT NULL CHECK(octet_length(snapshot::text)<=1052672),
 PRIMARY KEY(organization_id,site_id,scene_id,revision),
 FOREIGN KEY(organization_id,site_id,scene_id) REFERENCES asset_locator.scenes(organization_id,site_id,id)
);
CREATE TABLE asset_locator.placements (
 organization_id text NOT NULL, site_id text NOT NULL, scene_id text NOT NULL,
 revision integer NOT NULL, component_id text NOT NULL, asset_id text NOT NULL, current boolean NOT NULL,
 PRIMARY KEY(organization_id,site_id,scene_id,revision,component_id),
 FOREIGN KEY(organization_id,site_id,scene_id,revision) REFERENCES asset_locator.revisions(organization_id,site_id,scene_id,revision),
 FOREIGN KEY(organization_id,site_id,asset_id) REFERENCES assets.records(organization_id,site_id,id)
);
CREATE INDEX locator_current_asset ON asset_locator.placements(organization_id,site_id,asset_id) WHERE current;
DO $$ DECLARE t text; BEGIN FOREACH t IN ARRAY ARRAY['scenes','revisions','placements'] LOOP
 EXECUTE format('ALTER TABLE asset_locator.%I ENABLE ROW LEVEL SECURITY',t);
 EXECUTE format('ALTER TABLE asset_locator.%I FORCE ROW LEVEL SECURITY',t);
 EXECUTE format('CREATE POLICY site_scope ON asset_locator.%I TO iop_runtime USING (organization_id=current_setting(''iop.organization_id'',true) AND site_id=current_setting(''iop.site_id'',true)) WITH CHECK (organization_id=current_setting(''iop.organization_id'',true) AND site_id=current_setting(''iop.site_id'',true))',t);
 END LOOP; END $$;
GRANT SELECT(organization_id,site_id,id,revision,snapshot),INSERT(organization_id,site_id,id,revision,snapshot) ON asset_locator.scenes TO iop_runtime;
GRANT UPDATE(revision,snapshot) ON asset_locator.scenes TO iop_runtime;
GRANT SELECT(organization_id,site_id,scene_id,revision,snapshot),INSERT(organization_id,site_id,scene_id,revision,snapshot) ON asset_locator.revisions TO iop_runtime;
GRANT SELECT(organization_id,site_id,scene_id,revision,component_id,asset_id,current),INSERT(organization_id,site_id,scene_id,revision,component_id,asset_id,current) ON asset_locator.placements TO iop_runtime;
GRANT UPDATE(current) ON asset_locator.placements TO iop_runtime;
