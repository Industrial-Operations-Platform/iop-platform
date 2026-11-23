-- Up Migration
-- ADR-0040: explicit same-date replacement retains every original receipt/fact.
ALTER TABLE integrations.import_batches
  ADD COLUMN replaces_import_id uuid,
  ADD COLUMN superseded_by_import_id uuid,
  ADD CONSTRAINT replacement_prior FOREIGN KEY
    (organization_id,site_id,source_id,reporting_date,replaces_import_id)
    REFERENCES integrations.import_batches(organization_id,site_id,source_id,reporting_date,import_id),
  ADD CONSTRAINT replacement_next FOREIGN KEY
    (organization_id,site_id,source_id,reporting_date,superseded_by_import_id)
    REFERENCES integrations.import_batches(organization_id,site_id,source_id,reporting_date,import_id),
  ADD CONSTRAINT replacement_distinct CHECK
    (import_id IS DISTINCT FROM replaces_import_id AND import_id IS DISTINCT FROM superseded_by_import_id),
  ADD CONSTRAINT replacement_success CHECK (superseded_by_import_id IS NULL OR outcome='succeeded');
GRANT SELECT(replaces_import_id,superseded_by_import_id), INSERT(replaces_import_id),
  UPDATE(superseded_by_import_id) ON integrations.import_batches TO iop_runtime;
GRANT UPDATE(import_id) ON integrations.import_date_claims TO iop_runtime;

CREATE OR REPLACE FUNCTION integrations.guard_batch_transition() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path = pg_catalog AS $function$
BEGIN
  IF OLD.outcome='received' AND NEW.outcome<>'received'
    AND NEW.replaces_import_id IS NOT DISTINCT FROM OLD.replaces_import_id
    AND NEW.superseded_by_import_id IS NULL THEN
    RETURN NEW;
  END IF;
  IF OLD.outcome='succeeded' AND OLD.superseded_by_import_id IS NULL
    AND NEW.superseded_by_import_id IS NOT NULL
    AND (to_jsonb(NEW)-'superseded_by_import_id')=(to_jsonb(OLD)-'superseded_by_import_id')
    AND EXISTS(SELECT 1 FROM integrations.import_batches b
      JOIN integrations.import_date_claims c USING(organization_id,site_id,source_id,reporting_date,import_id)
      WHERE b.organization_id=OLD.organization_id AND b.site_id=OLD.site_id AND b.source_id=OLD.source_id
        AND b.import_id=NEW.superseded_by_import_id AND b.replaces_import_id=OLD.import_id
        AND b.outcome='succeeded') THEN
    RETURN NEW;
  END IF;
  RAISE EXCEPTION 'Import outcome transition is not permitted.' USING ERRCODE='23514';
END;
$function$;

CREATE FUNCTION integrations.guard_claim_replacement() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path = pg_catalog AS $function$
BEGIN
  IF (to_jsonb(NEW)-'import_id')<>(to_jsonb(OLD)-'import_id') OR
    NOT EXISTS(SELECT 1 FROM integrations.import_batches b
      JOIN integrations.import_batches prior ON
        (prior.organization_id,prior.site_id,prior.source_id,prior.reporting_date,prior.import_id)=
        (b.organization_id,b.site_id,b.source_id,b.reporting_date,b.replaces_import_id)
      WHERE b.organization_id=NEW.organization_id AND b.site_id=NEW.site_id AND b.source_id=NEW.source_id
        AND b.reporting_date=NEW.reporting_date AND b.import_id=NEW.import_id
        AND b.outcome='received' AND b.replaces_import_id=OLD.import_id
        AND prior.outcome='succeeded' AND prior.superseded_by_import_id IS NULL) THEN
    RAISE EXCEPTION 'Import date replacement is not permitted.' USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END;
$function$;
REVOKE ALL ON FUNCTION integrations.guard_claim_replacement() FROM PUBLIC;
CREATE TRIGGER claim_replacement BEFORE UPDATE ON integrations.import_date_claims
  FOR EACH ROW EXECUTE FUNCTION integrations.guard_claim_replacement();

CREATE TABLE oip.publication_supersessions (
  organization_id text COLLATE "C" NOT NULL,
  site_id text COLLATE "C" NOT NULL,
  source_id text COLLATE "C" NOT NULL,
  reporting_date date NOT NULL,
  replaced_import_id uuid NOT NULL,
  replacement_import_id uuid NOT NULL,
  superseded_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  superseded_by text NOT NULL CHECK(superseded_by ~ '^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$'),
  PRIMARY KEY(organization_id,site_id,source_id,replaced_import_id),
  UNIQUE(organization_id,site_id,source_id,replacement_import_id),
  CHECK(replaced_import_id<>replacement_import_id),
  FOREIGN KEY(organization_id,site_id,source_id,reporting_date,replaced_import_id)
    REFERENCES oip.publications(organization_id,site_id,source_id,reporting_date,import_id),
  FOREIGN KEY(organization_id,site_id,source_id,reporting_date,replacement_import_id)
    REFERENCES oip.publications(organization_id,site_id,source_id,reporting_date,import_id)
);
ALTER TABLE oip.publication_supersessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE oip.publication_supersessions FORCE ROW LEVEL SECURITY;
CREATE POLICY site_scope ON oip.publication_supersessions TO iop_runtime
  USING(organization_id=current_setting('iop.organization_id',true) AND site_id=current_setting('iop.site_id',true)
    AND coalesce(current_setting('iop.user_id',true),'')<>'')
  WITH CHECK(organization_id=current_setting('iop.organization_id',true) AND site_id=current_setting('iop.site_id',true)
    AND coalesce(current_setting('iop.user_id',true),'')<>'');
CREATE POLICY reset_scope ON oip.publication_supersessions TO iop_migrator
  USING(organization_id=current_setting('iop.reset_organization_id',true)
    AND site_id=current_setting('iop.reset_site_id',true) AND source_id=current_setting('iop.reset_source_id',true));
REVOKE ALL ON oip.publication_supersessions FROM PUBLIC;
GRANT SELECT(organization_id,site_id,source_id,reporting_date,replaced_import_id,replacement_import_id,superseded_at,superseded_by),
  INSERT(organization_id,site_id,source_id,reporting_date,replaced_import_id,replacement_import_id,superseded_by)
  ON oip.publication_supersessions TO iop_runtime;
