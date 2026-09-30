-- Up Migration
-- Preserve referential identity and author snapshots while removing access and listing visibility.
ALTER TABLE users_rbac.profiles ADD COLUMN deleted_at timestamptz(3);
GRANT SELECT(deleted_at),UPDATE(deleted_at) ON users_rbac.profiles TO iop_runtime;
