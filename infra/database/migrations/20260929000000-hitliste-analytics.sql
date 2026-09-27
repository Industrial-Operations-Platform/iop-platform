-- Up Migration
-- Source-specific analytical projection; retained OIP facts remain immutable.
CREATE SCHEMA analytics AUTHORIZATION iop_migrator;
REVOKE ALL ON SCHEMA analytics FROM PUBLIC;
GRANT USAGE ON SCHEMA analytics TO iop_runtime;
CREATE TABLE analytics.sektor (
 organization_id text COLLATE "C" NOT NULL,
 site_id text COLLATE "C" NOT NULL,
 source_id text COLLATE "C" NOT NULL,
 id text COLLATE "C" NOT NULL CHECK (id ~ '^[a-f0-9]{64}$'),
 name text COLLATE "C" NOT NULL,
 is_unclassified boolean NOT NULL,
 PRIMARY KEY (organization_id,site_id,source_id,id),
 FOREIGN KEY (organization_id,site_id) REFERENCES platform_core.sites(organization_id,site_id)
);
CREATE TABLE analytics.bereich (
 organization_id text COLLATE "C" NOT NULL,
 site_id text COLLATE "C" NOT NULL,
 source_id text COLLATE "C" NOT NULL,
 id text COLLATE "C" NOT NULL CHECK (id ~ '^[a-f0-9]{64}$'),
 name text COLLATE "C" NOT NULL,
 PRIMARY KEY (organization_id,site_id,source_id,id),
 FOREIGN KEY (organization_id,site_id) REFERENCES platform_core.sites(organization_id,site_id)
);
CREATE TABLE analytics.meldetext (
 organization_id text COLLATE "C" NOT NULL,
 site_id text COLLATE "C" NOT NULL,
 source_id text COLLATE "C" NOT NULL,
 id text COLLATE "C" NOT NULL CHECK (id ~ '^[a-f0-9]{64}$'),
 name text COLLATE "C" NOT NULL,
 PRIMARY KEY (organization_id,site_id,source_id,id),
 FOREIGN KEY (organization_id,site_id) REFERENCES platform_core.sites(organization_id,site_id)
);
CREATE TABLE analytics.meldung_typ (
 organization_id text COLLATE "C" NOT NULL,
 site_id text COLLATE "C" NOT NULL,
 source_id text COLLATE "C" NOT NULL,
 id text COLLATE "C" NOT NULL CHECK (id ~ '^[a-f0-9]{64}$'),
 name text COLLATE "C" NOT NULL,
 PRIMARY KEY (organization_id,site_id,source_id,id),
 FOREIGN KEY (organization_id,site_id) REFERENCES platform_core.sites(organization_id,site_id)
);
CREATE TABLE analytics.meldegruppe (
 organization_id text COLLATE "C" NOT NULL,
 site_id text COLLATE "C" NOT NULL,
 source_id text COLLATE "C" NOT NULL,
 id text COLLATE "C" NOT NULL CHECK (id ~ '^[a-f0-9]{64}$'),
 name text COLLATE "C" NOT NULL,
 PRIMARY KEY (organization_id,site_id,source_id,id),
 FOREIGN KEY (organization_id,site_id) REFERENCES platform_core.sites(organization_id,site_id)
);
CREATE TABLE analytics.betriebsmittel (
 organization_id text COLLATE "C" NOT NULL,
 site_id text COLLATE "C" NOT NULL,
 source_id text COLLATE "C" NOT NULL,
 id text COLLATE "C" NOT NULL CHECK (id ~ '^[a-f0-9]{64}$'),
 kennzeichen text COLLATE "C" NOT NULL,
 bereich_id text COLLATE "C" NOT NULL,
 PRIMARY KEY (organization_id,site_id,source_id,id),
 UNIQUE (organization_id,site_id,source_id,id,bereich_id),
 FOREIGN KEY (organization_id,site_id,source_id,bereich_id) REFERENCES analytics.bereich(organization_id,site_id,source_id,id)
);
CREATE TABLE analytics.fact_hitliste (
 organization_id text COLLATE "C" NOT NULL,
 site_id text COLLATE "C" NOT NULL,
 source_id text COLLATE "C" NOT NULL,
 import_id uuid NOT NULL,
 source_record_number integer NOT NULL,
 datum date NOT NULL,
 haufigkeit bigint NOT NULL CHECK (haufigkeit BETWEEN 0 AND 9007199254740991),
 dauer_sekunden bigint NOT NULL CHECK (dauer_sekunden BETWEEN 0 AND 9007199254740991),
 dauer_original text NOT NULL,
 sektor_id text COLLATE "C" NOT NULL,
 bereich_id text COLLATE "C" NOT NULL,
 betriebsmittel_id text COLLATE "C" NOT NULL,
 meldetext_id text COLLATE "C" NOT NULL,
 typ_id text COLLATE "C" NOT NULL,
 meldegruppe_id text COLLATE "C" NOT NULL,
 profile_version text COLLATE "C" NOT NULL,
 PRIMARY KEY (organization_id,site_id,source_id,import_id,source_record_number),
 FOREIGN KEY (organization_id,site_id,source_id,import_id,source_record_number)
   REFERENCES oip.facts(organization_id,site_id,source_id,import_id,source_record_number),
 FOREIGN KEY (organization_id,site_id,source_id,sektor_id) REFERENCES analytics.sektor(organization_id,site_id,source_id,id),
 FOREIGN KEY (organization_id,site_id,source_id,bereich_id) REFERENCES analytics.bereich(organization_id,site_id,source_id,id),
 FOREIGN KEY (organization_id,site_id,source_id,meldetext_id) REFERENCES analytics.meldetext(organization_id,site_id,source_id,id),
 FOREIGN KEY (organization_id,site_id,source_id,typ_id) REFERENCES analytics.meldung_typ(organization_id,site_id,source_id,id),
 FOREIGN KEY (organization_id,site_id,source_id,meldegruppe_id) REFERENCES analytics.meldegruppe(organization_id,site_id,source_id,id),
 FOREIGN KEY (organization_id,site_id,source_id,betriebsmittel_id,bereich_id) REFERENCES analytics.betriebsmittel(organization_id,site_id,source_id,id,bereich_id)
);
CREATE INDEX hitliste_date ON analytics.fact_hitliste(organization_id,site_id,source_id,datum,import_id,source_record_number);
CREATE INDEX hitliste_sector ON analytics.fact_hitliste(organization_id,site_id,source_id,sektor_id,datum);
ALTER TABLE analytics.sektor ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics.sektor FORCE ROW LEVEL SECURITY;
CREATE POLICY runtime_scope ON analytics.sektor TO iop_runtime
 USING (organization_id=current_setting('iop.organization_id',true) AND site_id=current_setting('iop.site_id',true)
   AND coalesce(current_setting('iop.user_id',true),'')<>'')
 WITH CHECK (organization_id=current_setting('iop.organization_id',true) AND site_id=current_setting('iop.site_id',true)
   AND coalesce(current_setting('iop.user_id',true),'')<>'');
CREATE POLICY reset_scope ON analytics.sektor TO iop_migrator
 USING (organization_id=current_setting('iop.reset_organization_id',true) AND site_id=current_setting('iop.reset_site_id',true)
   AND source_id=current_setting('iop.reset_source_id',true)) WITH CHECK(false);
REVOKE ALL ON analytics.sektor FROM PUBLIC;
GRANT SELECT(organization_id,site_id,source_id,id,name,is_unclassified), INSERT(organization_id,site_id,source_id,id,name,is_unclassified) ON analytics.sektor TO iop_runtime;
ALTER TABLE analytics.bereich ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics.bereich FORCE ROW LEVEL SECURITY;
CREATE POLICY runtime_scope ON analytics.bereich TO iop_runtime
 USING (organization_id=current_setting('iop.organization_id',true) AND site_id=current_setting('iop.site_id',true)
   AND coalesce(current_setting('iop.user_id',true),'')<>'')
 WITH CHECK (organization_id=current_setting('iop.organization_id',true) AND site_id=current_setting('iop.site_id',true)
   AND coalesce(current_setting('iop.user_id',true),'')<>'');
CREATE POLICY reset_scope ON analytics.bereich TO iop_migrator
 USING (organization_id=current_setting('iop.reset_organization_id',true) AND site_id=current_setting('iop.reset_site_id',true)
   AND source_id=current_setting('iop.reset_source_id',true)) WITH CHECK(false);
REVOKE ALL ON analytics.bereich FROM PUBLIC;
GRANT SELECT(organization_id,site_id,source_id,id,name), INSERT(organization_id,site_id,source_id,id,name) ON analytics.bereich TO iop_runtime;
ALTER TABLE analytics.meldetext ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics.meldetext FORCE ROW LEVEL SECURITY;
CREATE POLICY runtime_scope ON analytics.meldetext TO iop_runtime
 USING (organization_id=current_setting('iop.organization_id',true) AND site_id=current_setting('iop.site_id',true)
   AND coalesce(current_setting('iop.user_id',true),'')<>'')
 WITH CHECK (organization_id=current_setting('iop.organization_id',true) AND site_id=current_setting('iop.site_id',true)
   AND coalesce(current_setting('iop.user_id',true),'')<>'');
CREATE POLICY reset_scope ON analytics.meldetext TO iop_migrator
 USING (organization_id=current_setting('iop.reset_organization_id',true) AND site_id=current_setting('iop.reset_site_id',true)
   AND source_id=current_setting('iop.reset_source_id',true)) WITH CHECK(false);
REVOKE ALL ON analytics.meldetext FROM PUBLIC;
GRANT SELECT(organization_id,site_id,source_id,id,name), INSERT(organization_id,site_id,source_id,id,name) ON analytics.meldetext TO iop_runtime;
ALTER TABLE analytics.meldung_typ ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics.meldung_typ FORCE ROW LEVEL SECURITY;
CREATE POLICY runtime_scope ON analytics.meldung_typ TO iop_runtime
 USING (organization_id=current_setting('iop.organization_id',true) AND site_id=current_setting('iop.site_id',true)
   AND coalesce(current_setting('iop.user_id',true),'')<>'')
 WITH CHECK (organization_id=current_setting('iop.organization_id',true) AND site_id=current_setting('iop.site_id',true)
   AND coalesce(current_setting('iop.user_id',true),'')<>'');
CREATE POLICY reset_scope ON analytics.meldung_typ TO iop_migrator
 USING (organization_id=current_setting('iop.reset_organization_id',true) AND site_id=current_setting('iop.reset_site_id',true)
   AND source_id=current_setting('iop.reset_source_id',true)) WITH CHECK(false);
REVOKE ALL ON analytics.meldung_typ FROM PUBLIC;
GRANT SELECT(organization_id,site_id,source_id,id,name), INSERT(organization_id,site_id,source_id,id,name) ON analytics.meldung_typ TO iop_runtime;
ALTER TABLE analytics.meldegruppe ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics.meldegruppe FORCE ROW LEVEL SECURITY;
CREATE POLICY runtime_scope ON analytics.meldegruppe TO iop_runtime
 USING (organization_id=current_setting('iop.organization_id',true) AND site_id=current_setting('iop.site_id',true)
   AND coalesce(current_setting('iop.user_id',true),'')<>'')
 WITH CHECK (organization_id=current_setting('iop.organization_id',true) AND site_id=current_setting('iop.site_id',true)
   AND coalesce(current_setting('iop.user_id',true),'')<>'');
CREATE POLICY reset_scope ON analytics.meldegruppe TO iop_migrator
 USING (organization_id=current_setting('iop.reset_organization_id',true) AND site_id=current_setting('iop.reset_site_id',true)
   AND source_id=current_setting('iop.reset_source_id',true)) WITH CHECK(false);
REVOKE ALL ON analytics.meldegruppe FROM PUBLIC;
GRANT SELECT(organization_id,site_id,source_id,id,name), INSERT(organization_id,site_id,source_id,id,name) ON analytics.meldegruppe TO iop_runtime;
ALTER TABLE analytics.betriebsmittel ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics.betriebsmittel FORCE ROW LEVEL SECURITY;
CREATE POLICY runtime_scope ON analytics.betriebsmittel TO iop_runtime
 USING (organization_id=current_setting('iop.organization_id',true) AND site_id=current_setting('iop.site_id',true)
   AND coalesce(current_setting('iop.user_id',true),'')<>'')
 WITH CHECK (organization_id=current_setting('iop.organization_id',true) AND site_id=current_setting('iop.site_id',true)
   AND coalesce(current_setting('iop.user_id',true),'')<>'');
CREATE POLICY reset_scope ON analytics.betriebsmittel TO iop_migrator
 USING (organization_id=current_setting('iop.reset_organization_id',true) AND site_id=current_setting('iop.reset_site_id',true)
   AND source_id=current_setting('iop.reset_source_id',true)) WITH CHECK(false);
REVOKE ALL ON analytics.betriebsmittel FROM PUBLIC;
GRANT SELECT(organization_id,site_id,source_id,id,kennzeichen,bereich_id), INSERT(organization_id,site_id,source_id,id,kennzeichen,bereich_id) ON analytics.betriebsmittel TO iop_runtime;
ALTER TABLE analytics.fact_hitliste ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics.fact_hitliste FORCE ROW LEVEL SECURITY;
CREATE POLICY runtime_scope ON analytics.fact_hitliste TO iop_runtime
 USING (organization_id=current_setting('iop.organization_id',true) AND site_id=current_setting('iop.site_id',true)
   AND coalesce(current_setting('iop.user_id',true),'')<>'')
 WITH CHECK (organization_id=current_setting('iop.organization_id',true) AND site_id=current_setting('iop.site_id',true)
   AND coalesce(current_setting('iop.user_id',true),'')<>'');
CREATE POLICY reset_scope ON analytics.fact_hitliste TO iop_migrator
 USING (organization_id=current_setting('iop.reset_organization_id',true) AND site_id=current_setting('iop.reset_site_id',true)
   AND source_id=current_setting('iop.reset_source_id',true)) WITH CHECK(false);
REVOKE ALL ON analytics.fact_hitliste FROM PUBLIC;
GRANT SELECT(organization_id,site_id,source_id,import_id,source_record_number,datum,haufigkeit,dauer_sekunden,dauer_original,sektor_id,bereich_id,betriebsmittel_id,meldetext_id,typ_id,meldegruppe_id,profile_version), INSERT(organization_id,site_id,source_id,import_id,source_record_number,datum,haufigkeit,dauer_sekunden,dauer_original,sektor_id,bereich_id,betriebsmittel_id,meldetext_id,typ_id,meldegruppe_id,profile_version) ON analytics.fact_hitliste TO iop_runtime;
GRANT UPDATE(sektor_id,bereich_id,betriebsmittel_id,meldetext_id,typ_id,meldegruppe_id,profile_version) ON analytics.fact_hitliste TO iop_runtime;
