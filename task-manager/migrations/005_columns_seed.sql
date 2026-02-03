-- Seed basic board columns
INSERT OR IGNORE INTO Columns (id, project_id, name, key, position)
VALUES
  (1, 1, 'To Do', 'todo', 1),
  (2, 1, 'Blocked', 'blocked', 2),
  (3, 1, 'In Progress', 'in_progress', 3),
  (4, 1, 'In Review', 'in_review', 4),
  (5, 1, 'Complete', 'complete', 5);
