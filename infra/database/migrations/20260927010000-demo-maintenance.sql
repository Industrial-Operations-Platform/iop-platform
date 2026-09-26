-- Up Migration
-- Installation-only marker; runtime has no usage, read or mutation privileges.
CREATE SCHEMA iop_demo AUTHORIZATION iop_migrator;
REVOKE ALL ON SCHEMA iop_demo FROM PUBLIC;
CREATE TABLE iop_demo.installation (
 singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton), dataset_id uuid NOT NULL,
 organization_id text NOT NULL,site_id text NOT NULL,source_id text NOT NULL,
 schema_revision text NOT NULL,
 FOREIGN KEY(organization_id,site_id) REFERENCES platform_core.sites(organization_id,site_id)
);
REVOKE ALL ON iop_demo.installation FROM PUBLIC;
-- The trusted offline command uses this read only for bounded counts/bytes. Payloads
-- are never returned. Deletion always requires the separate complete target selectors.
CREATE POLICY reset_batch_metadata ON integrations.import_batches FOR SELECT TO iop_migrator
 USING (current_setting('iop.reset_metadata',true)='on');
CREATE POLICY reset_batch_delete ON integrations.import_batches FOR DELETE TO iop_migrator
 USING (organization_id=current_setting('iop.reset_organization_id',true)
   AND site_id=current_setting('iop.reset_site_id',true) AND source_id=current_setting('iop.reset_source_id',true));
CREATE POLICY reset_claim ON integrations.import_date_claims TO iop_migrator
 USING (organization_id=current_setting('iop.reset_organization_id',true)
   AND site_id=current_setting('iop.reset_site_id',true) AND source_id=current_setting('iop.reset_source_id',true))
 WITH CHECK(false);
CREATE POLICY reset_publication ON oip.publications TO iop_migrator
 USING (organization_id=current_setting('iop.reset_organization_id',true)
   AND site_id=current_setting('iop.reset_site_id',true) AND source_id=current_setting('iop.reset_source_id',true))
 WITH CHECK(false);
CREATE POLICY reset_fact ON oip.facts TO iop_migrator
 USING (organization_id=current_setting('iop.reset_organization_id',true)
   AND site_id=current_setting('iop.reset_site_id',true) AND source_id=current_setting('iop.reset_source_id',true))
 WITH CHECK(false);
CREATE POLICY reset_quota ON integrations.import_quota TO iop_migrator
 USING(current_setting('iop.reset_metadata',true)='on')
 WITH CHECK(current_setting('iop.reset_metadata',true)='on');
