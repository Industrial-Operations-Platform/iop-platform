-- Up Migration
-- ADR-0029: trusted offline native-demo reset of exact source derivations only.
-- Existing forced RLS remains enabled. No runtime grants or business/Audit cleanup.
CREATE POLICY reset_canonical_link_read ON oip.canonical_asset_links FOR SELECT TO iop_migrator
 USING(organization_id=current_setting('iop.reset_organization_id',true)
  AND site_id=current_setting('iop.reset_site_id',true)
  AND source_id=current_setting('iop.reset_source_id',true));
CREATE POLICY reset_canonical_link_delete ON oip.canonical_asset_links FOR DELETE TO iop_migrator
 USING(organization_id=current_setting('iop.reset_organization_id',true)
  AND site_id=current_setting('iop.reset_site_id',true)
  AND source_id=current_setting('iop.reset_source_id',true));
CREATE POLICY reset_canonical_history_read ON oip.canonical_asset_link_history FOR SELECT TO iop_migrator
 USING(organization_id=current_setting('iop.reset_organization_id',true)
  AND site_id=current_setting('iop.reset_site_id',true)
  AND source_id=current_setting('iop.reset_source_id',true));
CREATE POLICY reset_canonical_history_delete ON oip.canonical_asset_link_history FOR DELETE TO iop_migrator
 USING(organization_id=current_setting('iop.reset_organization_id',true)
  AND site_id=current_setting('iop.reset_site_id',true)
  AND source_id=current_setting('iop.reset_source_id',true));
