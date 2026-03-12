-- Fix "Write docs" task (id=3) that failed to insert in 007_data_seed.sql
-- due to NOT NULL constraint violations on reporter_id and created_by columns.
--
-- The original INSERT OR IGNORE silently failed because:
--   reporter_id INTEGER NOT NULL (was NULL)
--   created_by INTEGER NOT NULL (was NULL)

-- Insert the task with valid NOT NULL values if it doesn't exist
INSERT OR IGNORE INTO Tasks (
  id, project_id, column_id, sprint_id, reporter_id, assignee_id, created_by, modified_by,
  title, description, start_date, due_date, position
)
VALUES
  (3, 1, 2, 1, 1, 1, 1, NULL, 'Write docs', 'Add README notes for local dev', NULL, NULL, 2);
