-- Up Migration
CREATE TABLE oip.reporting_profiles (
 organization_id text COLLATE "C" NOT NULL,
 site_id text COLLATE "C" NOT NULL,
 source_id text COLLATE "C" NOT NULL,
 version uuid NOT NULL,
 config jsonb NOT NULL CHECK (jsonb_typeof(config)='object'),
 PRIMARY KEY(organization_id,site_id,source_id),
 FOREIGN KEY(organization_id,site_id) REFERENCES platform_core.sites(organization_id,site_id)
);
ALTER TABLE oip.reporting_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE oip.reporting_profiles FORCE ROW LEVEL SECURITY;
CREATE POLICY reporting_scope ON oip.reporting_profiles TO iop_runtime
 USING (organization_id=current_setting('iop.organization_id',true) AND site_id=current_setting('iop.site_id',true) AND coalesce(current_setting('iop.user_id',true),'')<>'')
 WITH CHECK (organization_id=current_setting('iop.organization_id',true) AND site_id=current_setting('iop.site_id',true) AND coalesce(current_setting('iop.user_id',true),'')<>'');
REVOKE ALL ON oip.reporting_profiles FROM PUBLIC;
GRANT SELECT(organization_id,site_id,source_id,version,config), INSERT(organization_id,site_id,source_id,version,config), UPDATE(version,config)
 ON oip.reporting_profiles TO iop_runtime;
