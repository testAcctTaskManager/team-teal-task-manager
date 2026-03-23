-- Follow the instructions in the README when using this file

INSERT INTO Users (display_name, email, role, timezone, is_active)
VALUES
  ('Firstname Lastname', lower('admin1@example.com'), 'admin', 'UTC', 1),
  ('Firstname Lastname', lower('admin2@example.com'), 'admin', 'UTC', 1)
ON CONFLICT(email) DO UPDATE SET
  display_name = excluded.display_name,
  role = excluded.role,
  timezone = COALESCE(excluded.timezone, Users.timezone),
  is_active = 1,
  updated_at = CURRENT_TIMESTAMP;
