-- Up Migration
-- Display-name edits reuse scoped Users/RBAC transactions and retained access audit.
GRANT UPDATE (display_name) ON users_rbac.profiles TO iop_runtime;
