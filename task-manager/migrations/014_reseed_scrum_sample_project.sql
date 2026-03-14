PRAGMA foreign_keys = ON;

-- D1 migrations are applied once, so this migration should re-apply scrum sample cleanup/reseed in live DBs

-- remove existing scrum projects so seed starts clean
DELETE FROM Projects
WHERE type = 'scrum';

-- ensure at least one user exists for required FK fields
INSERT INTO Users (display_name, email, timezone)
SELECT 'Seed User', 'seed.user@example.com', 'UTC'
WHERE NOT EXISTS (SELECT 1 FROM Users);

-- sample scrum project
INSERT OR IGNORE INTO Projects (id, name, created_by, type)
VALUES (
  4,
  'Scrum Sample Project',
  (SELECT id FROM Users ORDER BY id LIMIT 1),
  'scrum'
);

-- Seed a demo sprint for the project
INSERT OR IGNORE INTO Sprints (id, project_id, name, start_date, end_date, created_by, status)
VALUES
  (2, 4, 'Sprint 1', '2024-01-03', '2024-01-16', 2, 'complete'),
  (3, 4, 'Sprint 2', '2024-01-16', '2024-02-01', 1, 'in_progress'),
  (4, 4, 'Sprint 3', '2024-02-16', '2024-03-01', 2, 'not_started');

-- scrum columns
INSERT OR IGNORE INTO Columns (id, project_id, name, key, position)
VALUES
  (100, 4, 'to do', 'to_do', 1),
  (101, 4, 'in progress', 'in_progress', 2),
  (102, 4, 'done', 'done', 3),
  (103, 4, 'blocked', 'blocked', 4);

-- sample tasks (some intentionally have NULL column_id for backlog testing)
INSERT OR IGNORE INTO Tasks (
  id, project_id, column_id, sprint_id, reporter_id, assignee_id, created_by, modified_by,
  title, description, start_date, due_date, position
)
VALUES
  (1000, 4, 100, NULL, (SELECT id FROM Users ORDER BY id LIMIT 1), NULL, (SELECT id FROM Users ORDER BY id LIMIT 1), NULL, 'Setup sprint board', 'Create initial board and workflow', NULL, NULL, 0),
  (1001, 4, 100, NULL, (SELECT id FROM Users ORDER BY id LIMIT 1), NULL, (SELECT id FROM Users ORDER BY id LIMIT 1), NULL, 'Write task templates', 'Define standard ticket format', NULL, NULL, 1),
  (1002, 4, 101, NULL, (SELECT id FROM Users ORDER BY id LIMIT 1), (SELECT id FROM Users ORDER BY id LIMIT 1), (SELECT id FROM Users ORDER BY id LIMIT 1), (SELECT id FROM Users ORDER BY id LIMIT 1), 'Implement auth checks', 'Add role checks to protected routes', '2026-03-01', '2026-03-08', 0),
  (1003, 4, 101, NULL, (SELECT id FROM Users ORDER BY id LIMIT 1), NULL, (SELECT id FROM Users ORDER BY id LIMIT 1), NULL, 'Add project filters', 'Filter by assignee/reporter', NULL, NULL, 1),
  (1004, 4, 102, NULL, (SELECT id FROM Users ORDER BY id LIMIT 1), (SELECT id FROM Users ORDER BY id LIMIT 1), (SELECT id FROM Users ORDER BY id LIMIT 1), (SELECT id FROM Users ORDER BY id LIMIT 1), 'Ship first UI pass', 'Deliver first styled version', NULL, NULL, 0),
  (1005, 4, 103, NULL, (SELECT id FROM Users ORDER BY id LIMIT 1), NULL, (SELECT id FROM Users ORDER BY id LIMIT 1), NULL, 'Resolve API timeout', 'Investigate intermittent timeout errors', NULL, NULL, 0),
  (1006, 4, NULL, NULL, (SELECT id FROM Users ORDER BY id LIMIT 1), NULL, (SELECT id FROM Users ORDER BY id LIMIT 1), NULL, 'Backlog: Profile page polish', 'Improve spacing and labels', NULL, NULL, 0),
  (1007, 4, NULL, NULL, (SELECT id FROM Users ORDER BY id LIMIT 1), NULL, (SELECT id FROM Users ORDER BY id LIMIT 1), NULL, 'Backlog: Add empty states', 'Create useful zero-data messages', NULL, NULL, 1),
  (1008, 4, NULL, NULL, (SELECT id FROM Users ORDER BY id LIMIT 1), NULL, (SELECT id FROM Users ORDER BY id LIMIT 1), NULL, 'Backlog: Audit accessibility', 'Check heading/contrast/navigation', NULL, NULL, 2),
  (1009, 4, 100, NULL, (SELECT id FROM Users ORDER BY id LIMIT 1), NULL, (SELECT id FROM Users ORDER BY id LIMIT 1), NULL, 'Plan sprint goals', 'Draft goals for next sprint', NULL, NULL, 2),
  (1010, 4, 100, 2, (SELECT id FROM Users ORDER BY id LIMIT 1), NULL, (SELECT id FROM Users ORDER BY id LIMIT 1), NULL, 'Write sprint tests', 'Write tests for sprints', NULL, NULL, 2),
  (1011, 4, 100, 2, (SELECT id FROM Users ORDER BY id LIMIT 1), NULL, (SELECT id FROM Users ORDER BY id LIMIT 1), NULL, 'Create scrum board', 'Create scrum board component', NULL, NULL, 2),
  (1012, 4, 101, 3, (SELECT id FROM Users ORDER BY id LIMIT 1), NULL, (SELECT id FROM Users ORDER BY id LIMIT 1), NULL, 'Create scrum tests', 'Write tests for the scrum board', NULL, NULL, 2),
  (1013, 4, 102, 3, (SELECT id FROM Users ORDER BY id LIMIT 1), NULL, (SELECT id FROM Users ORDER BY id LIMIT 1), NULL, 'Sprint retro', 'Review sprint activity', NULL, NULL, 2),
  (1014, 4, 101, 4, (SELECT id FROM Users ORDER BY id LIMIT 1), NULL, (SELECT id FROM Users ORDER BY id LIMIT 1), NULL, 'Add tickets from retro', 'Add tickets based on retro', NULL, NULL, 2);
