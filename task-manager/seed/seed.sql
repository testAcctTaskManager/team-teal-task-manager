-- Seed data for dev / test environments.
-- NOT applied in production — only via cf:seed:local or cf:seed:test.
-- All statements use INSERT OR IGNORE so the file is safe to re-run.

PRAGMA foreign_keys = ON;

---------------------------------------------------------------------
-- USERS (from 007 + 012 roles)
---------------------------------------------------------------------
INSERT OR IGNORE INTO Users (id, display_name, email, timezone, role)
VALUES
  (1, 'Alice Developer', 'alice@example.com', 'UTC', 'developer'),
  (2, 'Bob Tester', 'bob@example.com', 'UTC', 'developer'),
  (3, 'Carol Manager', 'carol@example.com', 'UTC', 'admin');

---------------------------------------------------------------------
-- KANBAN PROJECTS (from 007)
---------------------------------------------------------------------
INSERT OR IGNORE INTO Projects (id, name, created_by)
VALUES
  (1, 'Demo Project 1', 1),
  (2, 'Demo Project 2', 2),
  (3, 'Demo Project 3', 3);

-- Kanban sprints
INSERT OR IGNORE INTO Sprints (id, project_id, name, start_date, end_date, created_by)
VALUES
  (1, 1, 'Sprint 1', '2026-01-01', '2026-01-15', 3);

-- Kanban columns
INSERT OR IGNORE INTO Columns (id, project_id, name, key, position)
VALUES
  (1, 1, 'To Do', 'todo', 1),
  (2, 1, 'Blocked', 'blocked', 2),
  (3, 1, 'In Progress', 'in_progress', 3),
  (4, 1, 'In Review', 'in_review', 4),
  (5, 1, 'Complete', 'complete', 5),
  (6, 2, 'To Do', 'todo', 1),
  (7, 2, 'Blocked', 'blocked', 2),
  (8, 2, 'In Progress', 'in_progress', 3),
  (9, 2, 'In Review', 'in_review', 4),
  (10, 2, 'Complete', 'complete', 5),
  (11, 3, 'To Do', 'todo', 1),
  (12, 3, 'Blocked', 'blocked', 2),
  (13, 3, 'In Progress', 'in_progress', 3),
  (14, 3, 'In Review', 'in_review', 4),
  (15, 3, 'Complete', 'complete', 5);

-- Kanban tasks
INSERT OR IGNORE INTO Tasks (
  id, project_id, column_id, sprint_id, reporter_id, assignee_id, created_by, modified_by,
  title, description, start_date, due_date, position
)
VALUES
  (1, 1, 1, 1, 1, 2, 1, 2, 'Set up project', 'Initialize repo, CI and migrations', '2026-01-02', '2026-01-04', 0),
  (2, 1, 1, 1, 2, 2, 2, 2, 'Create tasks endpoint', 'Implement CRUD handlers for Tasks', '2026-01-03', '2026-01-07', 1),
  (3, 1, 2, 1, 1, 1, 1, 1, 'Write docs', 'Add README notes for local dev', NULL, NULL, 2),
  (4, 2, 6, 1, 1, 1, 1, 2, 'Design UI', 'Mockup screens', '2023-02-02', '2023-02-05', 0),
  (5, 2, 7, 1, 2, 1, 2, 2, 'Review PR', 'Check code quality', '2023-02-03', '2023-02-07', 1),
  (6, 2, 8, 1, 1, 1, 1, 2, 'Fix login bug', 'Auth error', NULL, NULL, 2),
  (7, 3, 11, 1, 2, 2, 1, 2, 'Update dependencies', 'Update packages', '2025-03-02', '2025-03-05', 0),
  (8, 3, 14, 1, 2, 1, 2, 2, 'Deploy staging', 'Push to server', '2025-03-03', '2025-03-07', 1),
  (9, 3, 15, 1, 1, 1, 2, 2, 'Gather feedback', 'User survey', NULL, NULL, 2);

-- Kanban comments
INSERT OR IGNORE INTO Comments (id, task_id, created_by, content, created_at, updated_at)
VALUES
  (1, 1, 2, 'This task has no AC.', '2026-01-05', '2026-01-05'),
  (2, 1, 3, 'Added AC.', '2026-01-06', '2026-01-06'),
  (3, 2, 1, 'This task should be on next sprint.', '2026-01-07', '2026-01-07');

---------------------------------------------------------------------
-- SCRUM SAMPLE PROJECT (from 014, supersedes 013)
---------------------------------------------------------------------
INSERT OR IGNORE INTO Projects (id, name, created_by)
VALUES (4, 'Scrum Sample Project', 1);

-- Scrum sprints
INSERT OR IGNORE INTO Sprints (id, project_id, name, start_date, end_date, created_by, status)
VALUES
  (2, 4, 'Sprint 1', '2024-01-03', '2024-01-16', 2, 'complete'),
  (3, 4, 'Sprint 2', '2024-01-16', '2024-02-01', 1, 'in_progress'),
  (4, 4, 'Sprint 3', '2024-02-16', '2024-03-01', 2, 'not_started');

-- Scrum columns
INSERT OR IGNORE INTO Columns (id, project_id, name, key, position)
VALUES
  (100, 4, 'to do', 'to_do', 1),
  (101, 4, 'in progress', 'in_progress', 2),
  (102, 4, 'done', 'done', 3),
  (103, 4, 'blocked', 'blocked', 4);

-- Scrum tasks (some intentionally have NULL column_id for backlog testing)
INSERT OR IGNORE INTO Tasks (
  id, project_id, column_id, sprint_id, reporter_id, assignee_id, created_by, modified_by,
  title, description, start_date, due_date, position
)
VALUES
  (1000, 4, 100, NULL, 1, NULL, 1, NULL, 'Setup sprint board', 'Create initial board and workflow', NULL, NULL, 0),
  (1001, 4, 100, NULL, 1, NULL, 1, NULL, 'Write task templates', 'Define standard ticket format', NULL, NULL, 1),
  (1002, 4, 101, NULL, 1, 1, 1, 1, 'Implement auth checks', 'Add role checks to protected routes', '2026-03-01', '2026-03-08', 0),
  (1003, 4, 101, NULL, 1, NULL, 1, NULL, 'Add project filters', 'Filter by assignee/reporter', NULL, NULL, 1),
  (1004, 4, 102, NULL, 1, 1, 1, 1, 'Ship first UI pass', 'Deliver first styled version', NULL, NULL, 0),
  (1005, 4, 103, NULL, 1, NULL, 1, NULL, 'Resolve API timeout', 'Investigate intermittent timeout errors', NULL, NULL, 0),
  (1006, 4, NULL, NULL, 1, NULL, 1, NULL, 'Backlog: Profile page polish', 'Improve spacing and labels', NULL, NULL, 0),
  (1007, 4, NULL, NULL, 1, NULL, 1, NULL, 'Backlog: Add empty states', 'Create useful zero-data messages', NULL, NULL, 1),
  (1008, 4, NULL, NULL, 1, NULL, 1, NULL, 'Backlog: Audit accessibility', 'Check heading/contrast/navigation', NULL, NULL, 2),
  (1009, 4, 100, NULL, 1, NULL, 1, NULL, 'Plan sprint goals', 'Draft goals for next sprint', NULL, NULL, 2),
  (1010, 4, 100, 2, 1, NULL, 1, NULL, 'Write sprint tests', 'Write tests for sprints', NULL, NULL, 2),
  (1011, 4, 100, 2, 1, NULL, 1, NULL, 'Create scrum board', 'Create scrum board component', NULL, NULL, 2),
  (1012, 4, 101, 3, 1, NULL, 1, NULL, 'Create scrum tests', 'Write tests for the scrum board', NULL, NULL, 2),
  (1013, 4, 102, 3, 1, NULL, 1, NULL, 'Sprint retro', 'Review sprint activity', NULL, NULL, 2),
  (1014, 4, 101, 4, 1, NULL, 1, NULL, 'Add tickets from retro', 'Add tickets based on retro', NULL, NULL, 2);
