-- Up Migration
-- IOP-204: formal transfer evidence retains separate issue lifecycle and source shift ownership.
CREATE TABLE shift_handover.records (
 organization_id text NOT NULL, site_id text NOT NULL, id text NOT NULL,
 shift_id text NOT NULL CHECK(length(shift_id) BETWEEN 1 AND 64),
 business_date date NOT NULL, starts_at timestamptz(3) NOT NULL,
 department_id text NOT NULL CHECK(length(department_id) BETWEEN 1 AND 64),
 area_id text NOT NULL CHECK(length(area_id)<=64), author_id text NOT NULL,
 created_at timestamptz(3) NOT NULL, revision integer NOT NULL CHECK(revision>0),
 snapshot jsonb NOT NULL CHECK(octet_length(snapshot::text)<=2097152),
 request_key text NOT NULL CHECK(length(request_key) BETWEEN 1 AND 64),
 fingerprint text NOT NULL CHECK(octet_length(fingerprint)<=32768),
 PRIMARY KEY(organization_id,site_id,id), UNIQUE(organization_id,site_id,author_id,request_key),
 UNIQUE(organization_id,site_id,shift_id,department_id,area_id),
 FOREIGN KEY(organization_id,site_id) REFERENCES platform_core.sites(organization_id,site_id),
 FOREIGN KEY(organization_id,site_id,author_id) REFERENCES users_rbac.profiles(organization_id,site_id,user_id)
);
CREATE TABLE shift_handover.record_revisions (
 organization_id text NOT NULL, site_id text NOT NULL, record_id text NOT NULL,
 revision integer NOT NULL CHECK(revision>0), actor_id text NOT NULL,
 recorded_at timestamptz(3) NOT NULL, snapshot jsonb NOT NULL CHECK(octet_length(snapshot::text)<=2162688),
 PRIMARY KEY(organization_id,site_id,record_id,revision),
 FOREIGN KEY(organization_id,site_id,record_id) REFERENCES shift_handover.records(organization_id,site_id,id),
 FOREIGN KEY(organization_id,actor_id) REFERENCES users_rbac.organization_memberships(organization_id,user_id)
);
CREATE INDEX handover_record_date ON shift_handover.records(organization_id,site_id,business_date,starts_at DESC,id DESC);
DO $$ DECLARE t text; BEGIN FOREACH t IN ARRAY ARRAY['records','record_revisions'] LOOP
 EXECUTE format('ALTER TABLE shift_handover.%I ENABLE ROW LEVEL SECURITY',t);
 EXECUTE format('ALTER TABLE shift_handover.%I FORCE ROW LEVEL SECURITY',t);
 EXECUTE format('REVOKE ALL ON shift_handover.%I FROM PUBLIC',t);
 EXECUTE format('CREATE POLICY site_scope ON shift_handover.%I TO iop_runtime USING
   (organization_id=current_setting(''iop.organization_id'',true) AND site_id=current_setting(''iop.site_id'',true))
   WITH CHECK(organization_id=current_setting(''iop.organization_id'',true) AND site_id=current_setting(''iop.site_id'',true))',t);
 END LOOP; END $$;
GRANT SELECT(organization_id,site_id,id,shift_id,business_date,starts_at,department_id,area_id,author_id,created_at,revision,snapshot,request_key,fingerprint),
 INSERT(organization_id,site_id,id,shift_id,business_date,starts_at,department_id,area_id,author_id,created_at,revision,snapshot,request_key,fingerprint),
 UPDATE(revision,snapshot) ON shift_handover.records TO iop_runtime;
GRANT SELECT(organization_id,site_id,record_id,revision,actor_id,recorded_at,snapshot),
 INSERT(organization_id,site_id,record_id,revision,actor_id,recorded_at,snapshot) ON shift_handover.record_revisions TO iop_runtime;
