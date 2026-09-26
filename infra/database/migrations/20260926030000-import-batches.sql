-- Up Migration
-- ADR-0027: Integrations owns bounded receipts, outcomes and successful date claims.
CREATE SCHEMA integrations AUTHORIZATION iop_migrator;
REVOKE ALL ON SCHEMA integrations FROM PUBLIC;
GRANT USAGE ON SCHEMA integrations TO iop_runtime;

CREATE TABLE integrations.import_batches (
  organization_id text COLLATE "C" NOT NULL,
  site_id text COLLATE "C" NOT NULL,
  source_id text COLLATE "C" NOT NULL CHECK (source_id ~ '^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$'),
  import_id uuid NOT NULL,
  raw_id uuid NOT NULL UNIQUE,
  original_filename text NOT NULL CHECK (original_filename ~ '^Hitliste-[0-9]{8}\.csv$'),
  reporting_date date NOT NULL CHECK (reporting_date BETWEEN DATE '0001-01-01' AND DATE '9999-12-31'),
  original_bytes bytea NOT NULL CHECK (octet_length(original_bytes) BETWEEN 1 AND 5242880),
  byte_length integer NOT NULL CHECK (byte_length = octet_length(original_bytes)),
  sha256 text NOT NULL CHECK (sha256 ~ '^[a-f0-9]{64}$' AND sha256 = encode(sha256(original_bytes), 'hex')),
  received_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  submitted_by text NOT NULL CHECK (submitted_by ~ '^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$'),
  adapter_revision text NOT NULL CHECK (length(adapter_revision) BETWEEN 1 AND 64),
  profile_revision text NOT NULL CHECK (length(profile_revision) BETWEEN 1 AND 64),
  mapping_revision text NOT NULL CHECK (length(mapping_revision) BETWEEN 1 AND 64),
  site_time_zone text NOT NULL CHECK (length(site_time_zone) BETWEEN 1 AND 100),
  reporting_window_status text NOT NULL DEFAULT 'unknown' CHECK (reporting_window_status = 'unknown'),
  outcome text NOT NULL DEFAULT 'received' CHECK (outcome IN ('received','succeeded','rejected','failed')),
  completed_at timestamptz(3),
  reason_code text CHECK (reason_code IN ('invalid-input','duplicate-date','processing-failed','interrupted')),
  data_record_count integer CHECK (data_record_count BETWEEN 0 AND 20000),
  admitted_record_count integer CHECK (admitted_record_count BETWEEN 0 AND 20000),
  rejected_record_count integer CHECK (rejected_record_count BETWEEN 0 AND 20000),
  inspected_valid_count integer NOT NULL DEFAULT 0 CHECK (inspected_valid_count BETWEEN 0 AND 20000),
  inspected_invalid_count integer NOT NULL DEFAULT 0 CHECK (inspected_invalid_count BETWEEN 0 AND 20000),
  inspection_complete boolean NOT NULL DEFAULT false,
  unclassified_count integer NOT NULL DEFAULT 0 CHECK (unclassified_count BETWEEN 0 AND 20000),
  repeated_count integer NOT NULL DEFAULT 0 CHECK (repeated_count BETWEEN 0 AND 20000),
  diagnostics jsonb NOT NULL DEFAULT '[]' CHECK (jsonb_typeof(diagnostics) = 'array' AND jsonb_array_length(diagnostics) <= 100),
  diagnostics_truncated boolean NOT NULL DEFAULT false,
  PRIMARY KEY (organization_id, site_id, source_id, import_id),
  UNIQUE (organization_id, site_id, source_id, reporting_date, import_id),
  FOREIGN KEY (organization_id, site_id) REFERENCES platform_core.sites (organization_id, site_id),
  CHECK (original_filename = 'Hitliste-' || to_char(reporting_date, 'YYYYMMDD') || '.csv'),
  CHECK ((outcome = 'received' AND completed_at IS NULL AND reason_code IS NULL
      AND admitted_record_count IS NULL AND rejected_record_count IS NULL)
    OR (outcome = 'succeeded' AND completed_at IS NOT NULL AND reason_code IS NULL
      AND data_record_count IS NOT NULL AND admitted_record_count IS NOT NULL
      AND rejected_record_count IS NOT NULL AND data_record_count > 0 AND admitted_record_count = data_record_count
      AND rejected_record_count = 0 AND inspection_complete AND inspected_invalid_count = 0
      AND inspected_valid_count = data_record_count)
    OR (outcome IN ('rejected','failed') AND completed_at IS NOT NULL AND reason_code IS NOT NULL
      AND admitted_record_count IS NOT NULL AND admitted_record_count = 0 AND rejected_record_count IS NOT DISTINCT FROM data_record_count)),
  CHECK (NOT inspection_complete OR (data_record_count IS NOT NULL
    AND inspected_valid_count + inspected_invalid_count = data_record_count)),
  CHECK (unclassified_count <= inspected_valid_count AND repeated_count <= inspected_valid_count)
);

CREATE TABLE integrations.import_date_claims (
  organization_id text COLLATE "C" NOT NULL,
  site_id text COLLATE "C" NOT NULL,
  source_id text COLLATE "C" NOT NULL,
  reporting_date date NOT NULL,
  import_id uuid NOT NULL,
  PRIMARY KEY (organization_id, site_id, source_id, reporting_date),
  FOREIGN KEY (organization_id, site_id, source_id, reporting_date, import_id)
    REFERENCES integrations.import_batches (organization_id, site_id, source_id, reporting_date, import_id)
);

-- Database-local operational counters contain no customer identifiers or payloads.
CREATE TABLE integrations.import_quota (
  singleton boolean PRIMARY KEY DEFAULT true CHECK (singleton),
  retained_attempts integer NOT NULL CHECK (retained_attempts BETWEEN 0 AND 1000),
  retained_bytes bigint NOT NULL CHECK (retained_bytes BETWEEN 0 AND 268435456)
);
INSERT INTO integrations.import_quota VALUES (true, 0, 0);
REVOKE ALL ON integrations.import_batches, integrations.import_date_claims, integrations.import_quota FROM PUBLIC;

CREATE FUNCTION integrations.guard_batch_transition() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path = pg_catalog AS $function$
BEGIN
  IF OLD.outcome <> 'received' OR NEW.outcome = 'received' THEN
    RAISE EXCEPTION 'Import outcome transition is not permitted.' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$function$;
REVOKE ALL ON FUNCTION integrations.guard_batch_transition() FROM PUBLIC;
CREATE TRIGGER batch_transition BEFORE UPDATE ON integrations.import_batches
  FOR EACH ROW EXECUTE FUNCTION integrations.guard_batch_transition();

CREATE FUNCTION integrations.guard_quota_charge() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path = pg_catalog AS $function$
BEGIN
  IF current_user = 'iop_runtime' AND
    (NEW.retained_attempts <> OLD.retained_attempts + 1
      OR NEW.retained_bytes - OLD.retained_bytes NOT BETWEEN 1 AND 5242880) THEN
    RAISE EXCEPTION 'Only a bounded receipt charge is permitted.' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$function$;
REVOKE ALL ON FUNCTION integrations.guard_quota_charge() FROM PUBLIC;
CREATE TRIGGER quota_charge BEFORE UPDATE ON integrations.import_quota
  FOR EACH ROW EXECUTE FUNCTION integrations.guard_quota_charge();

ALTER TABLE integrations.import_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations.import_batches FORCE ROW LEVEL SECURITY;
CREATE POLICY batch_scope ON integrations.import_batches TO iop_runtime
  USING (organization_id = current_setting('iop.organization_id',true)
    AND site_id = current_setting('iop.site_id',true) AND coalesce(current_setting('iop.user_id',true),'') <> '')
  WITH CHECK (organization_id = current_setting('iop.organization_id',true)
    AND site_id = current_setting('iop.site_id',true) AND coalesce(current_setting('iop.user_id',true),'') <> '');
ALTER TABLE integrations.import_date_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations.import_date_claims FORCE ROW LEVEL SECURITY;
CREATE POLICY claim_scope ON integrations.import_date_claims TO iop_runtime
  USING (organization_id = current_setting('iop.organization_id',true)
    AND site_id = current_setting('iop.site_id',true) AND coalesce(current_setting('iop.user_id',true),'') <> '')
  WITH CHECK (organization_id = current_setting('iop.organization_id',true)
    AND site_id = current_setting('iop.site_id',true) AND coalesce(current_setting('iop.user_id',true),'') <> '');
ALTER TABLE integrations.import_quota ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations.import_quota FORCE ROW LEVEL SECURITY;
CREATE POLICY quota_operation ON integrations.import_quota TO iop_runtime
  USING (coalesce(current_setting('iop.organization_id',true),'') <> ''
    AND coalesce(current_setting('iop.site_id',true),'') <> '' AND coalesce(current_setting('iop.user_id',true),'') <> '')
  WITH CHECK (coalesce(current_setting('iop.organization_id',true),'') <> ''
    AND coalesce(current_setting('iop.site_id',true),'') <> '' AND coalesce(current_setting('iop.user_id',true),'') <> '');

GRANT SELECT (organization_id, site_id, source_id, import_id, raw_id, original_filename,
 reporting_date, original_bytes, byte_length, sha256, received_at, submitted_by,
 adapter_revision, profile_revision, mapping_revision, site_time_zone, reporting_window_status,
 outcome, completed_at, reason_code, data_record_count, admitted_record_count, rejected_record_count,
 inspected_valid_count, inspected_invalid_count, inspection_complete, unclassified_count, repeated_count,
 diagnostics, diagnostics_truncated) ON integrations.import_batches TO iop_runtime;
GRANT INSERT (organization_id, site_id, source_id, import_id, raw_id, original_filename,
 reporting_date, original_bytes, byte_length, sha256, submitted_by, adapter_revision,
 profile_revision, mapping_revision, site_time_zone) ON integrations.import_batches TO iop_runtime;
GRANT UPDATE (outcome, completed_at, reason_code, data_record_count, admitted_record_count,
 rejected_record_count, inspected_valid_count, inspected_invalid_count, inspection_complete,
 unclassified_count, repeated_count, diagnostics, diagnostics_truncated) ON integrations.import_batches TO iop_runtime;
GRANT SELECT (organization_id, site_id, source_id, reporting_date, import_id),
 INSERT (organization_id, site_id, source_id, reporting_date, import_id)
 ON integrations.import_date_claims TO iop_runtime;
GRANT SELECT (singleton, retained_attempts, retained_bytes), UPDATE (retained_attempts, retained_bytes)
 ON integrations.import_quota TO iop_runtime;
