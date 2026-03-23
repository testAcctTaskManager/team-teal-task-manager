-- Add activation flag for user access control.
-- Existing rows default to active (1).

ALTER TABLE Users
ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1
    CHECK (is_active IN (0, 1));
