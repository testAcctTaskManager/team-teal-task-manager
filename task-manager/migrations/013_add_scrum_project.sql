PRAGMA foreign_keys = ON;

-- adds a 'type' column to Projects allowing "kanban" or "scrum"
ALTER TABLE Projects
ADD COLUMN type TEXT NOT NULL DEFAULT 'kanban'
CHECK (type IN ('kanban', 'scrum'));

-- sample scrum w/tasks
INSERT OR IGNORE INTO Projects (id, name, created_by, type)
VALUES (4, 'Scrum Seed Project', 1, 'scrum');

INSERT OR IGNORE INTO Columns (id, project_id, name, key, position)
VALUES
	(100, 4, 'To Do', 'todo', 1),
	(101, 4, 'In Progress', 'in_progress', 2),
	(102, 4, 'Blocked', 'blocked', 3),
	(103, 4, 'Done', 'done', 4);

INSERT OR IGNORE INTO Tasks (
	id, project_id, column_id, sprint_id, reporter_id, assignee_id, created_by, modified_by,
	title, description, start_date, due_date, position
)
VALUES
	(1000, 4, 100, NULL, 1, 2, 1, 1, 'Backlog: Epic planning', 'Outline high-level epics', NULL, NULL, 0),
	(1001, 4, 100, NULL, 1, NULL, 1, NULL, 'Backlog: User research', 'Collect user interviews', NULL, NULL, 1),
	(1002, 4, 101, NULL, 2, 2, 1, 2, 'Implement login flow', 'Add OAuth and session handling', '2026-02-01', '2026-02-10', 0),
	(1003, 4, 102, NULL, 2, 1, 1, 2, 'Fix signup bug', 'Resolve validation error on submit', NULL, NULL, 0),
	(1004, 4, 103, NULL, 3, 3, 1, 3, 'Release v1.0', 'Prepare release notes and tag', NULL, NULL, 0);
