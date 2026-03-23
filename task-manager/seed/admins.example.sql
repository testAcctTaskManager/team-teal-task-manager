-- Copy this file to seed/admins.local.sql and replace placeholder emails.
-- Apply with: npx wrangler d1 execute test-db --local --file=seed/admins.local.sql

INSERT INTO Users (display_name, email, role, timezone, is_active)
VALUES
  ('Admin One', lower('admin1@example.com'), 'admin', 'UTC', 1),
  ('Admin Two', lower('admin2@example.com'), 'admin', 'UTC', 1)
ON CONFLICT(email) DO UPDATE SET
  display_name = excluded.display_name,
  role = excluded.role,
  timezone = COALESCE(excluded.timezone, Users.timezone),
  is_active = 1,
  updated_at = CURRENT_TIMESTAMP;
