/** Shared scoped relational read model; positional scope parameters are $1/$2/$3. */
export const hitlisteReadModel = `SELECT f.organization_id,f.site_id,f.source_id,f.import_id,f.source_record_number,
     f.datum AS reporting_date,f.haufigkeit AS reported_frequency,f.dauer_sekunden AS accumulated_alarm_seconds,f.profile_version,
     jsonb_build_object('sector',s.name,'area',b.name,'equipment',e.kennzeichen,'message',m.name,'type',t.name,'messageGroup',g.name,
       'frequency',f.haufigkeit::text,'duration',f.dauer_sekunden::text) AS values,s.is_unclassified AS unmapped
     FROM analytics.fact_hitliste f
     JOIN analytics.sektor s ON (s.organization_id,s.site_id,s.source_id,s.id)=(f.organization_id,f.site_id,f.source_id,f.sektor_id)
     JOIN analytics.bereich b ON (b.organization_id,b.site_id,b.source_id,b.id)=(f.organization_id,f.site_id,f.source_id,f.bereich_id)
     JOIN analytics.betriebsmittel e ON (e.organization_id,e.site_id,e.source_id,e.id,e.bereich_id)=(f.organization_id,f.site_id,f.source_id,f.betriebsmittel_id,f.bereich_id)
     JOIN analytics.meldetext m ON (m.organization_id,m.site_id,m.source_id,m.id)=(f.organization_id,f.site_id,f.source_id,f.meldetext_id)
     JOIN analytics.meldung_typ t ON (t.organization_id,t.site_id,t.source_id,t.id)=(f.organization_id,f.site_id,f.source_id,f.typ_id)
     JOIN analytics.meldegruppe g ON (g.organization_id,g.site_id,g.source_id,g.id)=(f.organization_id,f.site_id,f.source_id,f.meldegruppe_id)
     WHERE f.organization_id=$1 AND f.site_id=$2 AND f.source_id=$3`;
