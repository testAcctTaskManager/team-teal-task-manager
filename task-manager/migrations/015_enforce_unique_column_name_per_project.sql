PRAGMA foreign_keys = ON;

-- remove projects that currently contain duplicate normalized column names just in case
DELETE FROM Projects
WHERE id IN (
	SELECT project_id
	FROM Columns
	GROUP BY project_id, lower(trim(name))
	HAVING COUNT(*) > 1
);

-- one normalized column name per project (case and edge-whitespace insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS idx_columns_project_normalized_name_unique
ON Columns(project_id, lower(trim(name)));
