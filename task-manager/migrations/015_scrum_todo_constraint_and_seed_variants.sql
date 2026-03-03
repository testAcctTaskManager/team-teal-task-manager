PRAGMA foreign_keys = ON;

DELETE FROM Projects
WHERE type = 'scrum';

-- require exactly one todo column for scrum projects:

-- don't allow duplicate todo columns on insert
CREATE TRIGGER IF NOT EXISTS prevent_duplicate_scrum_todo_insert
BEFORE INSERT ON Columns
FOR EACH ROW
WHEN
    LOWER(TRIM(NEW.name)) = 'todo'
    AND EXISTS (
        SELECT 1
        FROM Projects p
        WHERE p.id = NEW.project_id AND p.type = 'scrum'
    )
    AND EXISTS (
        SELECT 1
        FROM Columns c
        WHERE c.project_id = NEW.project_id
            AND LOWER(TRIM(c.name)) = 'todo'
    )
BEGIN
    SELECT RAISE(ABORT, 'Scrum project can only have one Todo column');
END;

-- don't allow duplicate todo columns on update
CREATE TRIGGER IF NOT EXISTS prevent_duplicate_scrum_todo_update
BEFORE UPDATE OF name, project_id ON Columns
FOR EACH ROW
WHEN
    LOWER(TRIM(NEW.name)) = 'todo'
    AND EXISTS (
        SELECT 1
        FROM Projects p
        WHERE p.id = NEW.project_id AND p.type = 'scrum'
    )
    AND EXISTS (
        SELECT 1
        FROM Columns c
        WHERE c.project_id = NEW.project_id
            AND LOWER(TRIM(c.name)) = 'todo'
            AND c.id <> OLD.id
    )
BEGIN
    SELECT RAISE(ABORT, 'Scrum project can only have one Todo column');
END;

-- don't allow direct deletion of todo
CREATE TRIGGER IF NOT EXISTS prevent_removing_scrum_todo_delete
BEFORE DELETE ON Columns
FOR EACH ROW
WHEN
    LOWER(TRIM(OLD.name)) = 'todo'
    AND EXISTS (
        SELECT 1
        FROM Projects p
        WHERE p.id = OLD.project_id AND p.type = 'scrum'
    )
BEGIN
    SELECT RAISE(ABORT, 'Scrum project must have a Todo column');
END;

-- don't allow deletion of todo via update
CREATE TRIGGER IF NOT EXISTS prevent_removing_scrum_todo_update
BEFORE UPDATE OF name, project_id ON Columns
FOR EACH ROW
WHEN
    LOWER(TRIM(OLD.name)) = 'todo'
    AND EXISTS (
        SELECT 1
        FROM Projects p
        WHERE p.id = OLD.project_id AND p.type = 'scrum'
    )
    AND (
        LOWER(TRIM(NEW.name)) <> 'todo'
        OR NEW.project_id <> OLD.project_id
    )
BEGIN
    SELECT RAISE(ABORT, 'Scrum project must have a Todo column');
END;

-- don't allow switching to scrum unless project already has exactly one backlog and one todo
CREATE TRIGGER IF NOT EXISTS require_backlog_and_todo_before_scrum_type
BEFORE UPDATE OF type ON Projects
FOR EACH ROW
WHEN
    LOWER(TRIM(NEW.type)) = 'scrum'
    AND LOWER(TRIM(OLD.type)) <> 'scrum'
    AND (
        (
            SELECT COUNT(*)
            FROM Columns c
            WHERE c.project_id = NEW.id
              AND LOWER(TRIM(c.name)) = 'backlog'
        ) <> 1
        OR
        (
            SELECT COUNT(*)
            FROM Columns c
            WHERE c.project_id = NEW.id
              AND LOWER(TRIM(c.name)) = 'todo'
        ) <> 1
    )
BEGIN
    SELECT RAISE(ABORT, 'Scrum project requires exactly one Backlog and one Todo column');
END;

-- create five project fixtures for constraint integration tests:
-- 1) missing backlog, has todo
-- 2) missing todo, has backlog
-- 3) has duplicate todo columns
-- 4) has one backlog and one todo (valid)
-- 5) created as scrum with one backlog and one todo (valid)
INSERT INTO Users (display_name, email, timezone)
SELECT 'Example User', 'example.user@example.com', 'UTC'
WHERE NOT EXISTS (SELECT 1 FROM Users);

-- start as kanban so we can seed intentionally invalid column states,
-- then switch all four projects to scrum.
INSERT INTO Projects (name, created_by, type)
VALUES
    ('Failed Kanban to Scrum convert - Missing Backlog', (SELECT id FROM Users ORDER BY id LIMIT 1), 'kanban'),
    ('Failed Kanban to Scrum convert - Missing Todo', (SELECT id FROM Users ORDER BY id LIMIT 1), 'kanban'),
    ('Failed Kanban to Scrum convert - Duplicate Todo', (SELECT id FROM Users ORDER BY id LIMIT 1), 'kanban'),
    ('Kanban to Scrum convert - Valid', (SELECT id FROM Users ORDER BY id LIMIT 1), 'kanban'),
    ('Pure Scrum - Valid', (SELECT id FROM Users ORDER BY id LIMIT 1), 'scrum');

-- 1) missing backlog, has todo
INSERT INTO Columns (project_id, name, key, position)
VALUES
    (
        (SELECT id FROM Projects WHERE name = 'Failed Kanban to Scrum convert - Missing Backlog' ORDER BY id DESC LIMIT 1),
        'Todo',
        'todo',
        1
    );

-- 2) missing todo, has backlog
INSERT INTO Columns (project_id, name, key, position)
VALUES
    (
        (SELECT id FROM Projects WHERE name = 'Failed Kanban to Scrum convert - Missing Todo' ORDER BY id DESC LIMIT 1),
        'Backlog',
        'backlog',
        1
    );

-- 3) duplicate todo columns
INSERT INTO Columns (project_id, name, key, position)
VALUES
    (
        (SELECT id FROM Projects WHERE name = 'Failed Kanban to Scrum convert - Duplicate Todo' ORDER BY id DESC LIMIT 1),
        'Backlog',
        'backlog',
        1
    ),
    (
        (SELECT id FROM Projects WHERE name = 'Failed Kanban to Scrum convert - Duplicate Todo' ORDER BY id DESC LIMIT 1),
        'Todo',
        'todo',
        2
    ),
    (
        (SELECT id FROM Projects WHERE name = 'Failed Kanban to Scrum convert - Duplicate Todo' ORDER BY id DESC LIMIT 1),
        'Todo',
        'todo_extra',
        3
    );

-- 4) valid backlog + todo
INSERT INTO Columns (project_id, name, key, position)
VALUES
    (
        (SELECT id FROM Projects WHERE name = 'Kanban to Scrum convert - Valid' ORDER BY id DESC LIMIT 1),
        'Backlog',
        'backlog',
        1
    ),
    (
        (SELECT id FROM Projects WHERE name = 'Kanban to Scrum convert - Valid' ORDER BY id DESC LIMIT 1),
        'Todo',
        'todo',
        2
    );

-- 5) pure scrum valid backlog + todo
INSERT INTO Columns (project_id, name, key, position)
VALUES
    (
        (SELECT id FROM Projects WHERE name = 'Pure Scrum - Valid' ORDER BY id DESC LIMIT 1),
        'Backlog',
        'backlog',
        1
    ),
    (
        (SELECT id FROM Projects WHERE name = 'Pure Scrum - Valid' ORDER BY id DESC LIMIT 1),
        'Todo',
        'todo',
        2
    );

UPDATE Projects
SET type = 'scrum'
WHERE name = 'Kanban to Scrum convert - Valid';

-- sample tasks for the valid scrum project only
INSERT INTO Tasks (
    project_id, column_id, sprint_id, reporter_id, assignee_id, created_by, modified_by,
    title, description, start_date, due_date, position
)
VALUES
    (
        (SELECT id FROM Projects WHERE name = 'Kanban to Scrum convert - Valid' ORDER BY id DESC LIMIT 1),
        (
            SELECT c.id
            FROM Columns c
            JOIN Projects p ON p.id = c.project_id
            WHERE p.name = 'Kanban to Scrum convert - Valid' AND LOWER(TRIM(c.name)) = 'backlog'
            ORDER BY c.id DESC
            LIMIT 1
        ),
        NULL,
        (SELECT id FROM Users ORDER BY id LIMIT 1),
        (SELECT id FROM Users ORDER BY id LIMIT 1),
        (SELECT id FROM Users ORDER BY id LIMIT 1),
        (SELECT id FROM Users ORDER BY id LIMIT 1),
        'Backlog: Wireframe sprint board',
        'Draft board layout and card interactions',
        NULL,
        NULL,
        0
    ),
    (
        (SELECT id FROM Projects WHERE name = 'Kanban to Scrum convert - Valid' ORDER BY id DESC LIMIT 1),
        (
            SELECT c.id
            FROM Columns c
            JOIN Projects p ON p.id = c.project_id
            WHERE p.name = 'Kanban to Scrum convert - Valid' AND LOWER(TRIM(c.name)) = 'backlog'
            ORDER BY c.id DESC
            LIMIT 1
        ),
        NULL,
        (SELECT id FROM Users ORDER BY id LIMIT 1),
        NULL,
        (SELECT id FROM Users ORDER BY id LIMIT 1),
        NULL,
        'Backlog: Define acceptance criteria',
        'Write clear completion criteria for top stories',
        NULL,
        NULL,
        1
    ),
    (
        (SELECT id FROM Projects WHERE name = 'Kanban to Scrum convert - Valid' ORDER BY id DESC LIMIT 1),
        (
            SELECT c.id
            FROM Columns c
            JOIN Projects p ON p.id = c.project_id
            WHERE p.name = 'Kanban to Scrum convert - Valid' AND LOWER(TRIM(c.name)) = 'todo'
            ORDER BY c.id DESC
            LIMIT 1
        ),
        NULL,
        (SELECT id FROM Users ORDER BY id LIMIT 1),
        (SELECT id FROM Users ORDER BY id LIMIT 1),
        (SELECT id FROM Users ORDER BY id LIMIT 1),
        (SELECT id FROM Users ORDER BY id LIMIT 1),
        'Todo: Implement drag-and-drop',
        'Enable moving tasks between scrum columns',
        '2026-03-01',
        '2026-03-08',
        0
    ),
    (
        (SELECT id FROM Projects WHERE name = 'Kanban to Scrum convert - Valid' ORDER BY id DESC LIMIT 1),
        (
            SELECT c.id
            FROM Columns c
            JOIN Projects p ON p.id = c.project_id
            WHERE p.name = 'Kanban to Scrum convert - Valid' AND LOWER(TRIM(c.name)) = 'todo'
            ORDER BY c.id DESC
            LIMIT 1
        ),
        NULL,
        (SELECT id FROM Users ORDER BY id LIMIT 1),
        NULL,
        (SELECT id FROM Users ORDER BY id LIMIT 1),
        NULL,
        'Todo: Add api validation tests',
        'Cover scrum column edge cases in integration tests',
        NULL,
        NULL,
        1
    ),
    (
        (SELECT id FROM Projects WHERE name = 'Pure Scrum - Valid' ORDER BY id DESC LIMIT 1),
        (
            SELECT c.id
            FROM Columns c
            JOIN Projects p ON p.id = c.project_id
            WHERE p.name = 'Pure Scrum - Valid' AND LOWER(TRIM(c.name)) = 'backlog'
            ORDER BY c.id DESC
            LIMIT 1
        ),
        NULL,
        (SELECT id FROM Users ORDER BY id LIMIT 1),
        (SELECT id FROM Users ORDER BY id LIMIT 1),
        (SELECT id FROM Users ORDER BY id LIMIT 1),
        (SELECT id FROM Users ORDER BY id LIMIT 1),
        'Backlog: Research notification patterns',
        'Collect examples for alerts and reminders',
        NULL,
        NULL,
        0
    ),
    (
        (SELECT id FROM Projects WHERE name = 'Pure Scrum - Valid' ORDER BY id DESC LIMIT 1),
        (
            SELECT c.id
            FROM Columns c
            JOIN Projects p ON p.id = c.project_id
            WHERE p.name = 'Pure Scrum - Valid' AND LOWER(TRIM(c.name)) = 'backlog'
            ORDER BY c.id DESC
            LIMIT 1
        ),
        NULL,
        (SELECT id FROM Users ORDER BY id LIMIT 1),
        NULL,
        (SELECT id FROM Users ORDER BY id LIMIT 1),
        NULL,
        'Backlog: Define rollout checklist',
        'List launch prerequisites and owner signoffs',
        NULL,
        NULL,
        1
    ),
    (
        (SELECT id FROM Projects WHERE name = 'Pure Scrum - Valid' ORDER BY id DESC LIMIT 1),
        (
            SELECT c.id
            FROM Columns c
            JOIN Projects p ON p.id = c.project_id
            WHERE p.name = 'Pure Scrum - Valid' AND LOWER(TRIM(c.name)) = 'todo'
            ORDER BY c.id DESC
            LIMIT 1
        ),
        NULL,
        (SELECT id FROM Users ORDER BY id LIMIT 1),
        (SELECT id FROM Users ORDER BY id LIMIT 1),
        (SELECT id FROM Users ORDER BY id LIMIT 1),
        (SELECT id FROM Users ORDER BY id LIMIT 1),
        'Todo: Implement reminder endpoint',
        'Add API route for scheduled reminder dispatch',
        '2026-03-02',
        '2026-03-10',
        0
    ),
    (
        (SELECT id FROM Projects WHERE name = 'Pure Scrum - Valid' ORDER BY id DESC LIMIT 1),
        (
            SELECT c.id
            FROM Columns c
            JOIN Projects p ON p.id = c.project_id
            WHERE p.name = 'Pure Scrum - Valid' AND LOWER(TRIM(c.name)) = 'todo'
            ORDER BY c.id DESC
            LIMIT 1
        ),
        NULL,
        (SELECT id FROM Users ORDER BY id LIMIT 1),
        NULL,
        (SELECT id FROM Users ORDER BY id LIMIT 1),
        NULL,
        'Todo: Add retry logic for webhooks',
        'Retry failed webhook deliveries with backoff',
        NULL,
        NULL,
        1
    );
