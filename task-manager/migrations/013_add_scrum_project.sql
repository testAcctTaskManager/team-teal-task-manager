PRAGMA foreign_keys = ON;

-- adds a 'type' column to Projects allowing "kanban" or "scrum"
ALTER TABLE Projects
ADD COLUMN type TEXT NOT NULL DEFAULT 'kanban'
CHECK (type IN ('kanban', 'scrum'));

-- scrum projects must be associated with one and only one Backlog column
-- prevent creating a second Backlog column for the same scrum project
CREATE TRIGGER IF NOT EXISTS prevent_duplicate_scrum_backlog_insert
BEFORE INSERT ON Columns
FOR EACH ROW
WHEN
	LOWER(TRIM(NEW.name)) = 'backlog'
	AND EXISTS (
		SELECT 1
		FROM Projects p
		WHERE p.id = NEW.project_id AND p.type = 'scrum'
	)
	AND EXISTS (
		SELECT 1
		FROM Columns c
		WHERE c.project_id = NEW.project_id
			AND LOWER(TRIM(c.name)) = 'backlog'
	)
BEGIN
	SELECT RAISE(ABORT, 'Scrum project can only have one Backlog column');
END;

-- prevent creating a second Backlog column on updates
CREATE TRIGGER IF NOT EXISTS prevent_duplicate_scrum_backlog_update
BEFORE UPDATE OF name, project_id ON Columns
FOR EACH ROW
WHEN
	LOWER(TRIM(NEW.name)) = 'backlog'
	AND EXISTS (
		SELECT 1
		FROM Projects p
		WHERE p.id = NEW.project_id AND p.type = 'scrum'
	)
	AND EXISTS (
		SELECT 1
		FROM Columns c
		WHERE c.project_id = NEW.project_id
			AND LOWER(TRIM(c.name)) = 'backlog'
			AND c.id <> OLD.id
	)
BEGIN
	SELECT RAISE(ABORT, 'Scrum project can only have one Backlog column');
END;

-- prevent deleting the only Backlog column from a scrum project
CREATE TRIGGER IF NOT EXISTS prevent_removing_scrum_backlog_delete
BEFORE DELETE ON Columns
FOR EACH ROW
WHEN
	LOWER(TRIM(OLD.name)) = 'backlog'
	AND EXISTS (
		SELECT 1
		FROM Projects p
		WHERE p.id = OLD.project_id AND p.type = 'scrum'
	)
BEGIN
	SELECT RAISE(ABORT, 'Scrum project must have a Backlog column');
END;

-- prevent renaming/moving away the only Backlog column from a scrum project
CREATE TRIGGER IF NOT EXISTS prevent_removing_scrum_backlog_update
BEFORE UPDATE OF name, project_id ON Columns
FOR EACH ROW
WHEN
	LOWER(TRIM(OLD.name)) = 'backlog'
	AND EXISTS (
		SELECT 1
		FROM Projects p
		WHERE p.id = OLD.project_id AND p.type = 'scrum'
	)
	AND (
		LOWER(TRIM(NEW.name)) <> 'backlog'
		OR NEW.project_id <> OLD.project_id
	)
BEGIN
	SELECT RAISE(ABORT, 'Scrum project must have a Backlog column');
END;

-- if a scrum project has no columns yet, require Backlog to be the first column created
CREATE TRIGGER IF NOT EXISTS require_backlog_first_for_scrum
BEFORE INSERT ON Columns
FOR EACH ROW
WHEN
	LOWER(TRIM(NEW.name)) <> 'backlog'
	AND EXISTS (
		SELECT 1
		FROM Projects p
		WHERE p.id = NEW.project_id AND p.type = 'scrum'
	)
	AND NOT EXISTS (
		SELECT 1
		FROM Columns c
		WHERE c.project_id = NEW.project_id
			AND LOWER(TRIM(c.name)) = 'backlog'
	)
BEGIN
	SELECT RAISE(ABORT, 'Scrum project must create Backlog column first');
END;

-- sample scrum w/tasks
INSERT OR IGNORE INTO Projects (id, name, created_by, type)
VALUES (4, 'Scrum Seed Project', 1, 'scrum');

INSERT OR IGNORE INTO Columns (id, project_id, name, key, position)
VALUES
	(100, 4, 'Backlog', 'backlog', 1),
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
