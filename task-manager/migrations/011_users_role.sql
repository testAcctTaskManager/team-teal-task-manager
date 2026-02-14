-- Adds roles column to Users
ALTER TABLE Users
ADD COLUMN role TEXT NOT NULL DEFAULT 'developer'
CHECK (role IN ('admin', 'developer', 'clinician'));