-- NOTE: This leaves a temporary `role_legacy` column behind.
-- Cleanup requires a future full Users table rebuild/reset migration.
ALTER TABLE Users RENAME COLUMN role TO role_legacy;

ALTER TABLE Users
ADD COLUMN role TEXT NOT NULL DEFAULT 'developer'
CHECK (role IN ('admin', 'developer', 'clinician', 'ai-team', 'professor'));

UPDATE Users
SET role = role_legacy;
