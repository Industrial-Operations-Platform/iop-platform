-- Up Migration
-- Platform Core owns this organization-scoped root; it is not global reference data.
CREATE SCHEMA platform_core AUTHORIZATION iop_migrator;
REVOKE ALL ON SCHEMA platform_core FROM PUBLIC;

CREATE TABLE platform_core.organizations (
  organization_id text COLLATE "C" PRIMARY KEY
    CHECK (organization_id ~ '^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$'),
  display_name text NOT NULL
    CHECK (char_length(display_name) BETWEEN 1 AND 200)
    CHECK (display_name !~ U&'[\0001-\001F\007F-\009F]')
    -- Match JavaScript trim whitespace explicitly, independently of database locale.
    CHECK (display_name = btrim(display_name,
      U&'\0009\000A\000B\000C\000D\0020\00A0\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200A\2028\2029\202F\205F\3000\FEFF'))
);
REVOKE ALL ON platform_core.organizations FROM PUBLIC;
ALTER TABLE platform_core.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_core.organizations FORCE ROW LEVEL SECURITY;

CREATE POLICY organization_seed_read ON platform_core.organizations
  FOR SELECT TO iop_migrator
  USING (organization_id = current_setting('iop.seed_organization_id', true));
CREATE POLICY organization_seed_insert ON platform_core.organizations
  FOR INSERT TO iop_migrator
  WITH CHECK (organization_id = current_setting('iop.seed_organization_id', true));
-- No runtime grants, PUBLIC policies, or ordinary UPDATE/DELETE policies.
