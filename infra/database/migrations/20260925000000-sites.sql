-- Up Migration
-- Platform Core owns this site-scoped identity; installation grants no runtime access.
CREATE TABLE platform_core.sites (
  site_id text COLLATE "C" PRIMARY KEY
    CHECK (site_id ~ '^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$'),
  organization_id text COLLATE "C" NOT NULL
    REFERENCES platform_core.organizations (organization_id)
    CHECK (organization_id ~ '^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$'),
  display_name text NOT NULL
    CHECK (char_length(display_name) BETWEEN 1 AND 200)
    CHECK (display_name !~ U&'[\0001-\001F\007F-\009F]')
    -- Match JavaScript trim whitespace explicitly, independently of database locale.
    CHECK (display_name = btrim(display_name,
      U&'\0009\000A\000B\000C\000D\0020\00A0\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200A\2028\2029\202F\205F\3000\FEFF')),
  time_zone text COLLATE "C" NOT NULL
    CHECK (char_length(time_zone) BETWEEN 1 AND 100)
    CHECK (time_zone ~ '^(UTC|[A-Za-z][A-Za-z0-9_+-]*(/[A-Za-z0-9_+-]+)+)$'),
  UNIQUE (organization_id, site_id)
);
REVOKE ALL ON platform_core.sites FROM PUBLIC;

CREATE FUNCTION platform_core.validate_site_time_zone() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path = pg_catalog AS $function$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_catalog.pg_timezone_names WHERE name COLLATE "C" = NEW.time_zone) THEN
    RAISE EXCEPTION 'Site time zone is not supported by the database.' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$function$;
REVOKE ALL ON FUNCTION platform_core.validate_site_time_zone() FROM PUBLIC;
CREATE TRIGGER site_time_zone_insert BEFORE INSERT ON platform_core.sites
  FOR EACH ROW EXECUTE FUNCTION platform_core.validate_site_time_zone();

ALTER TABLE platform_core.sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_core.sites FORCE ROW LEVEL SECURITY;
CREATE POLICY site_seed_read ON platform_core.sites
  FOR SELECT TO iop_migrator
  USING (organization_id = current_setting('iop.seed_organization_id', true)
    AND site_id = current_setting('iop.seed_site_id', true));
CREATE POLICY site_seed_insert ON platform_core.sites
  FOR INSERT TO iop_migrator
  WITH CHECK (organization_id = current_setting('iop.seed_organization_id', true)
    AND site_id = current_setting('iop.seed_site_id', true));
-- No runtime grants, PUBLIC policies or ordinary UPDATE/DELETE policies.
