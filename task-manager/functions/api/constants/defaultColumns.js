/**
 * Default Kanban columns created automatically for every new project.
 * Matches the column layout used by Demo Projects 1–3 in the seed data.
 */
export const DEFAULT_COLUMNS = [
  { name: "To Do",        key: "todo",        position: 1 },
  { name: "Blocked",      key: "blocked",     position: 2 },
  { name: "In Progress",  key: "in_progress", position: 3 },
  { name: "In Review",    key: "in_review",   position: 4 },
  { name: "Complete",     key: "complete",     position: 5 },
];
