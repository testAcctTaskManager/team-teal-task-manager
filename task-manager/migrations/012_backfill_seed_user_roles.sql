PRAGMA foreign_keys = ON;

-- Backfill roles for seeded users in databases where 007 ran before
-- the role column was introduced in 011.
UPDATE Users
SET role = 'developer'
WHERE email = 'alice@example.com';

UPDATE Users
SET role = 'developer'
WHERE email = 'bob@example.com';

UPDATE Users
SET role = 'admin'
WHERE email = 'carol@example.com';
