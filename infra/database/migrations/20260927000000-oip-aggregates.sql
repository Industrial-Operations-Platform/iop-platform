-- Up Migration
CREATE SCHEMA oip AUTHORIZATION iop_migrator;
REVOKE ALL ON SCHEMA oip FROM PUBLIC;
GRANT USAGE ON SCHEMA oip TO iop_runtime;
CREATE TABLE oip.publications (
  organization_id text COLLATE "C" NOT NULL,
  site_id text COLLATE "C" NOT NULL,
  source_id text COLLATE "C" NOT NULL,
  import_id uuid NOT NULL,
  reporting_date date NOT NULL,
  raw_id uuid NOT NULL,
  record_count integer NOT NULL CHECK (record_count BETWEEN 1 AND 20000),
  context jsonb NOT NULL CHECK (jsonb_typeof(context) = 'object'),
  PRIMARY KEY (organization_id,site_id,source_id,import_id),
  UNIQUE (organization_id,site_id,source_id,reporting_date,import_id),
  FOREIGN KEY (organization_id,site_id,source_id,reporting_date,import_id)
    REFERENCES integrations.import_batches (organization_id,site_id,source_id,reporting_date,import_id)
);
CREATE TABLE oip.facts (
  organization_id text COLLATE "C" NOT NULL,
  site_id text COLLATE "C" NOT NULL,
  source_id text COLLATE "C" NOT NULL,
  import_id uuid NOT NULL,
  reporting_date date NOT NULL,
  source_record_number integer NOT NULL CHECK (source_record_number BETWEEN 2 AND 25000),
  reported_frequency bigint NOT NULL CHECK (reported_frequency BETWEEN 0 AND 9007199254740991),
  accumulated_alarm_seconds bigint NOT NULL CHECK (accumulated_alarm_seconds BETWEEN 0 AND 9007199254740991),
  sector_ref text COLLATE "C" NOT NULL CHECK (sector_ref ~ '^d1\.[A-Za-z0-9_-]{43}$'),
  area_ref text COLLATE "C" NOT NULL CHECK (area_ref ~ '^d1\.[A-Za-z0-9_-]{43}$'),
  equipment_ref text COLLATE "C" NOT NULL CHECK (equipment_ref ~ '^d1\.[A-Za-z0-9_-]{43}$'),
  message_ref text COLLATE "C" NOT NULL CHECK (message_ref ~ '^d1\.[A-Za-z0-9_-]{43}$'),
  payload jsonb NOT NULL CHECK (jsonb_typeof(payload) = 'object'),
  PRIMARY KEY (organization_id,site_id,source_id,import_id,source_record_number),
  FOREIGN KEY (organization_id,site_id,source_id,reporting_date,import_id)
    REFERENCES oip.publications (organization_id,site_id,source_id,reporting_date,import_id)
);
CREATE INDEX facts_date ON oip.facts (organization_id,site_id,source_id,reporting_date,import_id,source_record_number);
ALTER TABLE oip.publications ENABLE ROW LEVEL SECURITY;
ALTER TABLE oip.publications FORCE ROW LEVEL SECURITY;
ALTER TABLE oip.facts ENABLE ROW LEVEL SECURITY;
ALTER TABLE oip.facts FORCE ROW LEVEL SECURITY;
CREATE POLICY publication_scope ON oip.publications TO iop_runtime
 USING (organization_id=current_setting('iop.organization_id',true) AND site_id=current_setting('iop.site_id',true)
   AND coalesce(current_setting('iop.user_id',true),'')<>'')
 WITH CHECK (organization_id=current_setting('iop.organization_id',true) AND site_id=current_setting('iop.site_id',true)
   AND coalesce(current_setting('iop.user_id',true),'')<>'');
CREATE POLICY fact_scope ON oip.facts TO iop_runtime
 USING (organization_id=current_setting('iop.organization_id',true) AND site_id=current_setting('iop.site_id',true)
   AND coalesce(current_setting('iop.user_id',true),'')<>'')
 WITH CHECK (organization_id=current_setting('iop.organization_id',true) AND site_id=current_setting('iop.site_id',true)
   AND coalesce(current_setting('iop.user_id',true),'')<>'');
REVOKE ALL ON oip.publications,oip.facts FROM PUBLIC;
GRANT SELECT (organization_id,site_id,source_id,import_id,reporting_date,raw_id,record_count,context),
 INSERT (organization_id,site_id,source_id,import_id,reporting_date,raw_id,record_count,context)
 ON oip.publications TO iop_runtime;
GRANT SELECT (organization_id,site_id,source_id,import_id,reporting_date,source_record_number,
 reported_frequency,accumulated_alarm_seconds,sector_ref,area_ref,equipment_ref,message_ref,payload),
 INSERT (organization_id,site_id,source_id,import_id,reporting_date,source_record_number,
 reported_frequency,accumulated_alarm_seconds,sector_ref,area_ref,equipment_ref,message_ref,payload)
 ON oip.facts TO iop_runtime;
GRANT SELECT (time_zone) ON platform_core.sites TO iop_runtime;
