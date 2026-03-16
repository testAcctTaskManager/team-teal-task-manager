-- Consolidated schema: final-state DDL for the task-manager database.
-- This single migration replaces the incremental 006–016 chain.
-- Seed / test data lives separately in seed/seed.sql.

PRAGMA foreign_keys = ON;

---------------------------------------------------------------------
-- USERS
---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS Users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    display_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    timezone TEXT,
    role TEXT NOT NULL DEFAULT 'developer'
        CHECK (role IN ('admin', 'developer', 'clinician', 'ai-team', 'professor')),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

---------------------------------------------------------------------
-- USER_PROVIDERS  (OAuth / third-party auth)
---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS User_Providers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    provider TEXT NOT NULL,
    provider_user_id TEXT,
    refresh_token TEXT,
    token_expires_at DATETIME,
    created_at DATETIME DEFAULT (CURRENT_TIMESTAMP),
    updated_at DATETIME DEFAULT (CURRENT_TIMESTAMP),
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
);

---------------------------------------------------------------------
-- PROJECTS
---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS Projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    created_by INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'not_started'
        CHECK (status IN ('not_started', 'in_progress', 'complete')),
    type TEXT NOT NULL DEFAULT 'kanban'
        CHECK (type IN ('kanban', 'scrum')),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES Users(id) ON DELETE RESTRICT
);

---------------------------------------------------------------------
-- SPRINTS
---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS Sprints (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    start_date DATE,
    end_date DATE,
    created_by INTEGER NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status TEXT NOT NULL DEFAULT 'not_started'
        CHECK (status IN ('not_started', 'in_progress', 'complete')),
    FOREIGN KEY (project_id) REFERENCES Projects(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES Users(id) ON DELETE RESTRICT
);

---------------------------------------------------------------------
-- COLUMNS
---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS Columns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    key TEXT NOT NULL,
    position INTEGER NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES Projects(id) ON DELETE CASCADE,
    UNIQUE (project_id, key)
);

---------------------------------------------------------------------
-- TASKS
---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS Tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    column_id INTEGER,
    sprint_id INTEGER,
    reporter_id INTEGER NOT NULL,
    assignee_id INTEGER,
    created_by INTEGER NOT NULL,
    modified_by INTEGER,
    title TEXT NOT NULL,
    description TEXT,
    start_date DATE,
    due_date DATE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    position INTEGER,
    FOREIGN KEY (project_id) REFERENCES Projects(id) ON DELETE CASCADE,
    FOREIGN KEY (column_id) REFERENCES Columns(id) ON DELETE SET NULL,
    FOREIGN KEY (sprint_id) REFERENCES Sprints(id) ON DELETE SET NULL,
    FOREIGN KEY (reporter_id) REFERENCES Users(id) ON DELETE RESTRICT,
    FOREIGN KEY (assignee_id) REFERENCES Users(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES Users(id) ON DELETE RESTRICT,
    FOREIGN KEY (modified_by) REFERENCES Users(id) ON DELETE SET NULL
);

---------------------------------------------------------------------
-- COMMENTS
---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS Comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER NOT NULL,
    created_by INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES Tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES Users(id) ON DELETE RESTRICT
);

---------------------------------------------------------------------
-- TRIGGERS
---------------------------------------------------------------------

-- Tasks: start_date must not exceed due_date
CREATE TRIGGER IF NOT EXISTS validate_task_dates_insert
BEFORE INSERT ON Tasks
FOR EACH ROW
WHEN NEW.start_date IS NOT NULL
AND NEW.due_date IS NOT NULL
AND julianday(NEW.start_date) > julianday(NEW.due_date)
BEGIN
    SELECT RAISE(ABORT, 'start_date must be <= due_date');
END;

CREATE TRIGGER IF NOT EXISTS validate_task_dates_update
BEFORE UPDATE ON Tasks
FOR EACH ROW
WHEN NEW.start_date IS NOT NULL
AND NEW.due_date IS NOT NULL
AND julianday(NEW.start_date) > julianday(NEW.due_date)
BEGIN
    SELECT RAISE(ABORT, 'start_date must be <= due_date');
END;

-- Sprints: start_date must not exceed end_date
CREATE TRIGGER IF NOT EXISTS validate_sprint_dates_insert
BEFORE INSERT ON Sprints
FOR EACH ROW
WHEN NEW.start_date IS NOT NULL
AND NEW.end_date IS NOT NULL
AND julianday(NEW.start_date) > julianday(NEW.end_date)
BEGIN
    SELECT RAISE(ABORT, 'start_date must be <= end_date');
END;

CREATE TRIGGER IF NOT EXISTS validate_sprint_dates_update
BEFORE UPDATE ON Sprints
FOR EACH ROW
WHEN NEW.start_date IS NOT NULL
AND NEW.end_date IS NOT NULL
AND julianday(NEW.start_date) > julianday(NEW.end_date)
BEGIN
    SELECT RAISE(ABORT, 'start_date must be <= end_date');
END;

-- Comments: auto-set updated_at on update
CREATE TRIGGER IF NOT EXISTS update_comments_updated_at
AFTER UPDATE ON Comments
FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN
    UPDATE Comments
    SET updated_at = CURRENT_TIMESTAMP
    WHERE id = OLD.id;
END;

---------------------------------------------------------------------
-- INDICES
---------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON Projects(created_by);
CREATE INDEX IF NOT EXISTS idx_sprints_project_id ON Sprints(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON Tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_sprint_id ON Tasks(sprint_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_id ON Tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_comments_task_id ON Comments(task_id);

-- One normalized column name per project (case and whitespace insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS idx_columns_project_normalized_name_unique
ON Columns(project_id, lower(trim(name)));
