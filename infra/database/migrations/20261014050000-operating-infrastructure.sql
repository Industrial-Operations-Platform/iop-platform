-- Up Migration
-- IOP-208 / ADR-0038: durable scoped jobs and explicit append-only site Audit.
CREATE SCHEMA jobs AUTHORIZATION iop_migrator;
CREATE SCHEMA audit AUTHORIZATION iop_migrator;
REVOKE ALL ON SCHEMA jobs,audit FROM PUBLIC;
GRANT USAGE ON SCHEMA jobs,audit TO iop_runtime;
CREATE TABLE jobs.records (
 organization_id text NOT NULL,site_id text NOT NULL,id text NOT NULL,initiator_id text NOT NULL,
 request_key text NOT NULL CHECK(length(request_key) BETWEEN 1 AND 64),
 state text NOT NULL CHECK(state IN('queued','running','retry','completed','failed','waiting-handler','waiting-configuration')),
 available_at timestamptz(3) NOT NULL,lease_until timestamptz(3),revision integer NOT NULL CHECK(revision>0),
 snapshot jsonb NOT NULL CHECK(octet_length(snapshot::text)<=16384),
 PRIMARY KEY(organization_id,site_id,id),UNIQUE(organization_id,site_id,initiator_id,request_key),
 FOREIGN KEY(organization_id,site_id) REFERENCES platform_core.sites(organization_id,site_id),
 FOREIGN KEY(organization_id,site_id,initiator_id) REFERENCES users_rbac.profiles(organization_id,site_id,user_id)
);
CREATE INDEX jobs_available ON jobs.records(organization_id,site_id,initiator_id,state,available_at,id);
CREATE TABLE jobs.local_effects (
 organization_id text NOT NULL,site_id text NOT NULL,job_id text NOT NULL,value integer NOT NULL CHECK(value BETWEEN 0 AND 1000000),
 PRIMARY KEY(organization_id,site_id,job_id),FOREIGN KEY(organization_id,site_id,job_id) REFERENCES jobs.records(organization_id,site_id,id)
);
CREATE TABLE audit.site_events (
 organization_id text NOT NULL,site_id text NOT NULL,event_id text NOT NULL,operation_id text NOT NULL,
 module text NOT NULL,event_type text NOT NULL,schema_version integer NOT NULL CHECK(schema_version=1),actor_id text NOT NULL,
 subject_type text NOT NULL,subject_id text NOT NULL,revision integer NOT NULL,before_revision integer NOT NULL,
 state text NOT NULL,before_state text NOT NULL,reason text NOT NULL,
 occurred_at timestamptz(3) NOT NULL,recorded_at timestamptz(3) NOT NULL,retention_class text NOT NULL CHECK(retention_class IN('change','maintenance')),expires_at timestamptz(3) NOT NULL,policy_version text NOT NULL,fingerprint text NOT NULL,
 PRIMARY KEY(organization_id,site_id,event_id),FOREIGN KEY(organization_id,site_id) REFERENCES platform_core.sites(organization_id,site_id),
 CHECK(expires_at>recorded_at),CHECK(length(actor_id)<=128),CHECK(length(operation_id)<=128),CHECK(length(event_type)<=128),
 CHECK(length(subject_type)<=128),CHECK(length(subject_id)<=128),CHECK(length(state)<=32),CHECK(length(before_state)<=32),CHECK(length(reason)<=64),CHECK(length(fingerprint)=64)
);
CREATE INDEX audit_expiry ON audit.site_events(organization_id,site_id,expires_at,event_id);
DO $$ DECLARE schema_name text;table_name text;BEGIN
 FOR schema_name,table_name IN VALUES('jobs','records'),('jobs','local_effects'),('audit','site_events') LOOP
  EXECUTE format('ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY',schema_name,table_name);
  EXECUTE format('ALTER TABLE %I.%I FORCE ROW LEVEL SECURITY',schema_name,table_name);
  EXECUTE format('REVOKE ALL ON %I.%I FROM PUBLIC',schema_name,table_name);
  EXECUTE format('CREATE POLICY site_scope ON %I.%I TO iop_runtime USING(organization_id=current_setting(''iop.organization_id'',true) AND site_id=current_setting(''iop.site_id'',true)) WITH CHECK(organization_id=current_setting(''iop.organization_id'',true) AND site_id=current_setting(''iop.site_id'',true))',schema_name,table_name);
 END LOOP;END $$;
GRANT SELECT(organization_id,site_id,id,initiator_id,request_key,state,available_at,lease_until,revision,snapshot),
 INSERT(organization_id,site_id,id,initiator_id,request_key,state,available_at,lease_until,revision,snapshot),
 UPDATE(state,available_at,lease_until,revision,snapshot) ON jobs.records TO iop_runtime;
GRANT SELECT(organization_id,site_id,job_id,value),INSERT(organization_id,site_id,job_id,value) ON jobs.local_effects TO iop_runtime;
GRANT SELECT(organization_id,site_id,event_id,fingerprint),
 INSERT(organization_id,site_id,event_id,operation_id,module,event_type,schema_version,actor_id,subject_type,subject_id,revision,before_revision,state,before_state,reason,occurred_at,recorded_at,retention_class,expires_at,policy_version,fingerprint) ON audit.site_events TO iop_runtime;

-- Separate operators receive function execution, never broad table grants or product roles.
CREATE TABLE audit.operator_targets (
 operator_role text NOT NULL CHECK(operator_role IN('iop_audit_inspector','iop_audit_retention')),
 organization_id text NOT NULL,site_id text NOT NULL,
 PRIMARY KEY(operator_role,organization_id,site_id),
 FOREIGN KEY(organization_id,site_id) REFERENCES platform_core.sites(organization_id,site_id)
);
REVOKE ALL ON audit.operator_targets FROM PUBLIC;
ALTER TABLE audit.operator_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit.operator_targets FORCE ROW LEVEL SECURITY;
CREATE POLICY owner_targets ON audit.operator_targets TO iop_migrator USING(true) WITH CHECK(true);
CREATE POLICY operator_owner ON audit.site_events TO iop_migrator
 USING(organization_id=current_setting('iop.organization_id',true) AND site_id=current_setting('iop.site_id',true))
 WITH CHECK(organization_id=current_setting('iop.organization_id',true) AND site_id=current_setting('iop.site_id',true));
CREATE FUNCTION audit.inspect_events(purpose text,before_at timestamptz DEFAULT NULL,before_id text DEFAULT '',page_limit integer DEFAULT 100)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,audit AS $$
 DECLARE org text:=current_setting('iop.organization_id',true);site text:=current_setting('iop.site_id',true);
 cutoff timestamptz:=clock_timestamp();op text:=gen_random_uuid()::text;answer jsonb;
 BEGIN
  IF session_user<>'iop_audit_inspector' OR purpose NOT IN('investigation','recovery') OR page_limit<1 OR page_limit>100 OR length(before_id)>64
   OR NOT EXISTS(SELECT 1 FROM audit.operator_targets WHERE operator_role=session_user AND organization_id=org AND site_id=site)
   THEN RAISE EXCEPTION 'Audit inspection is not permitted.' USING ERRCODE='42501';END IF;
  WITH matching AS MATERIALIZED(SELECT * FROM audit.site_events WHERE organization_id=org AND site_id=site AND expires_at>cutoff),
   page AS(SELECT * FROM matching WHERE before_at IS NULL OR(recorded_at,event_id)<(before_at,before_id) ORDER BY recorded_at DESC,event_id DESC LIMIT page_limit)
   SELECT jsonb_build_object('total',(SELECT count(*) FROM matching),'events',coalesce((SELECT jsonb_agg(to_jsonb(page) ORDER BY recorded_at DESC,event_id DESC) FROM page),'[]'::jsonb)) INTO answer;
  INSERT INTO audit.site_events(organization_id,site_id,event_id,operation_id,module,event_type,schema_version,actor_id,subject_type,subject_id,revision,before_revision,state,before_state,reason,occurred_at,recorded_at,retention_class,expires_at,policy_version,fingerprint)
   VALUES(org,site,op,op,'audit','audit.inspected',1,session_user,'audit-operation',op,0,0,'','',purpose,cutoff,cutoff,'maintenance',cutoff+interval '31536000 seconds','audit-v1-20261014',encode(sha256(convert_to(op||purpose,'UTF8')),'hex'));
  RETURN answer;
 END $$;
CREATE FUNCTION audit.purge_expired(batch_limit integer DEFAULT 1000) RETURNS jsonb
 LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,audit AS $$
 DECLARE org text:=current_setting('iop.organization_id',true);site text:=current_setting('iop.site_id',true);
 cutoff timestamptz:=clock_timestamp();op text:=gen_random_uuid()::text;removed integer;
 BEGIN
  IF session_user<>'iop_audit_retention' OR batch_limit<1 OR batch_limit>1000
   OR NOT EXISTS(SELECT 1 FROM audit.operator_targets WHERE operator_role=session_user AND organization_id=org AND site_id=site)
   THEN RAISE EXCEPTION 'Audit retention is not permitted.' USING ERRCODE='42501';END IF;
  WITH expired AS(SELECT event_id FROM audit.site_events WHERE organization_id=org AND site_id=site AND expires_at<=cutoff ORDER BY expires_at,event_id FOR UPDATE SKIP LOCKED LIMIT batch_limit)
   DELETE FROM audit.site_events e USING expired x WHERE e.organization_id=org AND e.site_id=site AND e.event_id=x.event_id;
  GET DIAGNOSTICS removed=ROW_COUNT;
  IF removed>0 THEN
   INSERT INTO audit.site_events(organization_id,site_id,event_id,operation_id,module,event_type,schema_version,actor_id,subject_type,subject_id,revision,before_revision,state,before_state,reason,occurred_at,recorded_at,retention_class,expires_at,policy_version,fingerprint)
    VALUES(org,site,op,op,'audit','audit.purged',1,session_user,'audit-operation',op,removed,0,'','', 'retention',cutoff,cutoff,'maintenance',cutoff+interval '31536000 seconds','audit-v1-20261014',encode(sha256(convert_to(op||removed::text,'UTF8')),'hex'));
  END IF;
  RETURN jsonb_build_object('cutoff',cutoff,'removed',removed,'policy','audit-v1-20261014');
 END $$;
REVOKE ALL ON FUNCTION audit.inspect_events(text,timestamptz,text,integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION audit.purge_expired(integer) FROM PUBLIC;
