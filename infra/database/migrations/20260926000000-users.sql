-- Up Migration
-- Users/RBAC owns global identity; membership and grants are separate scoped data.
CREATE SCHEMA users_rbac AUTHORIZATION iop_migrator;
REVOKE ALL ON SCHEMA users_rbac FROM PUBLIC;

CREATE TABLE users_rbac.users (
  user_id text COLLATE "C" PRIMARY KEY
    CHECK (user_id ~ '^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$'),
  is_active boolean NOT NULL
);
REVOKE ALL ON users_rbac.users FROM PUBLIC;
ALTER TABLE users_rbac.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE users_rbac.users FORCE ROW LEVEL SECURITY;

CREATE POLICY user_seed_read ON users_rbac.users
  FOR SELECT TO iop_migrator
  USING (user_id = current_setting('iop.seed_user_id', true));
CREATE POLICY user_seed_insert ON users_rbac.users
  FOR INSERT TO iop_migrator
  WITH CHECK (user_id = current_setting('iop.seed_user_id', true));
-- No runtime grants, PUBLIC policies, or ordinary UPDATE/DELETE policies.
