-- Up Migration
-- IOP-205: independent scoped improvement actions and immutable evidence.
-- Receiving-owned responsibility projection reads only this role within an
-- already-authorized site. Before authorization, the business selectors are empty.
CREATE POLICY improvement_responsibility_read ON users_rbac.site_role_assignments
 FOR SELECT TO iop_runtime USING (
 organization_id=current_setting('iop.organization_id',true)
 AND site_id=current_setting('iop.site_id',true) AND role_id='improvement-contributor');
CREATE SCHEMA improvement AUTHORIZATION iop_migrator;
REVOKE ALL ON SCHEMA improvement FROM PUBLIC;
GRANT USAGE ON SCHEMA improvement TO iop_runtime;
CREATE TABLE improvement.actions (
 organization_id text NOT NULL, site_id text NOT NULL, id text NOT NULL,
 revision integer NOT NULL CHECK(revision>0),
 status text NOT NULL CHECK(status IN ('planned','in-progress','blocked','implemented','evaluated','cancelled')),
 location_id text NOT NULL, asset_id text, owner_id text, author_id text NOT NULL,
 updated_at timestamptz(3) NOT NULL, snapshot jsonb NOT NULL CHECK(octet_length(snapshot::text)<=65536),
 PRIMARY KEY(organization_id,site_id,id),
 FOREIGN KEY(organization_id,site_id) REFERENCES platform_core.sites(organization_id,site_id),
 FOREIGN KEY(organization_id,site_id,asset_id) REFERENCES assets.records(organization_id,site_id,id),
 FOREIGN KEY(organization_id,site_id,author_id) REFERENCES users_rbac.profiles(organization_id,site_id,user_id),
 FOREIGN KEY(organization_id,site_id,owner_id) REFERENCES users_rbac.profiles(organization_id,site_id,user_id)
);
CREATE TABLE improvement.revisions (
 organization_id text NOT NULL, site_id text NOT NULL, action_id text NOT NULL,
 revision integer NOT NULL CHECK(revision>0), actor_id text NOT NULL, at timestamptz(3) NOT NULL,
 snapshot jsonb NOT NULL CHECK(octet_length(snapshot::text)<=131072),
 PRIMARY KEY(organization_id,site_id,action_id,revision),
 FOREIGN KEY(organization_id,site_id,action_id) REFERENCES improvement.actions(organization_id,site_id,id),
 FOREIGN KEY(organization_id,site_id,actor_id) REFERENCES users_rbac.profiles(organization_id,site_id,user_id)
);
CREATE TABLE improvement.evidence (
 organization_id text NOT NULL, site_id text NOT NULL, id text NOT NULL, action_id text NOT NULL,
 action_revision integer NOT NULL CHECK(action_revision>0), actor_id text NOT NULL,
 at timestamptz(3) NOT NULL, supersedes_id text,
 snapshot jsonb NOT NULL CHECK(octet_length(snapshot::text)<=65536),
 PRIMARY KEY(organization_id,site_id,id),
 FOREIGN KEY(organization_id,site_id,action_id) REFERENCES improvement.actions(organization_id,site_id,id),
 FOREIGN KEY(organization_id,site_id,actor_id) REFERENCES users_rbac.profiles(organization_id,site_id,user_id),
 FOREIGN KEY(organization_id,site_id,supersedes_id) REFERENCES improvement.evidence(organization_id,site_id,id),
 UNIQUE(organization_id,site_id,supersedes_id)
);
CREATE TABLE improvement.comparisons (
 organization_id text NOT NULL, site_id text NOT NULL, id text NOT NULL, action_id text NOT NULL,
 action_revision integer NOT NULL CHECK(action_revision>0), actor_id text NOT NULL,
 at timestamptz(3) NOT NULL, snapshot jsonb NOT NULL CHECK(octet_length(snapshot::text)<=262144),
 PRIMARY KEY(organization_id,site_id,id),
 FOREIGN KEY(organization_id,site_id,action_id) REFERENCES improvement.actions(organization_id,site_id,id),
 FOREIGN KEY(organization_id,site_id,actor_id) REFERENCES users_rbac.profiles(organization_id,site_id,user_id)
);
CREATE INDEX improvement_board ON improvement.actions(organization_id,site_id,updated_at DESC,id DESC);
CREATE INDEX improvement_evidence_page ON improvement.evidence(organization_id,site_id,action_id,at DESC,id DESC);
CREATE INDEX improvement_comparison_page ON improvement.comparisons(organization_id,site_id,action_id,at DESC,id DESC);
DO $$ DECLARE t text; BEGIN FOREACH t IN ARRAY ARRAY['actions','revisions','evidence','comparisons'] LOOP
 EXECUTE format('ALTER TABLE improvement.%I ENABLE ROW LEVEL SECURITY',t);
 EXECUTE format('ALTER TABLE improvement.%I FORCE ROW LEVEL SECURITY',t);
 EXECUTE format('CREATE POLICY site_scope ON improvement.%I TO iop_runtime USING (organization_id=current_setting(''iop.organization_id'',true) AND site_id=current_setting(''iop.site_id'',true)) WITH CHECK (organization_id=current_setting(''iop.organization_id'',true) AND site_id=current_setting(''iop.site_id'',true))',t);
 END LOOP; END $$;
GRANT SELECT(organization_id,site_id,id,revision,status,location_id,asset_id,owner_id,author_id,updated_at,snapshot),
 INSERT(organization_id,site_id,id,revision,status,location_id,asset_id,owner_id,author_id,updated_at,snapshot) ON improvement.actions TO iop_runtime;
GRANT UPDATE(revision,status,location_id,asset_id,owner_id,updated_at,snapshot) ON improvement.actions TO iop_runtime;
GRANT SELECT(organization_id,site_id,action_id,revision,actor_id,at,snapshot),
 INSERT(organization_id,site_id,action_id,revision,actor_id,at,snapshot) ON improvement.revisions TO iop_runtime;
GRANT SELECT(organization_id,site_id,id,action_id,action_revision,actor_id,at,supersedes_id,snapshot),
 INSERT(organization_id,site_id,id,action_id,action_revision,actor_id,at,supersedes_id,snapshot) ON improvement.evidence TO iop_runtime;
GRANT SELECT(organization_id,site_id,id,action_id,action_revision,actor_id,at,snapshot),
 INSERT(organization_id,site_id,id,action_id,action_revision,actor_id,at,snapshot) ON improvement.comparisons TO iop_runtime;
