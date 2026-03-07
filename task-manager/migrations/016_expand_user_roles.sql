-- Expand Users.role allowed values without dropping/rebuilding Users.
-- This avoids foreign-key churn in runtimes that enforce strict FK validity.
ALTER TABLE Users RENAME COLUMN role TO role_legacy;

ALTER TABLE Users
ADD COLUMN role TEXT NOT NULL DEFAULT 'developer'
CHECK (role IN ('admin', 'developer', 'clinician', 'ai-team', 'professor'));

UPDATE Users
SET role = role_legacy;
