import { useNavigate } from "react-router-dom";
import { useUsers } from "../contexts/UsersContext.jsx";
import { formatDate } from "../utils/dateHelpers.js";

function OldSprintTask({ task }) {
  const navigate = useNavigate();
  const { users } = useUsers();

  const assignee =
    task.assignee_id != null
      ? users.find((u) => u.id === Number(task.assignee_id))
      : null;

  return (
    <div
      className="px-4 py-3 rounded-lg bg-white/[0.04] shadow cursor-pointer hover:bg-white/[0.07] transition-colors"
      onClick={() => navigate(`/task/${task.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          navigate(`/task/${task.id}`);
        }
      }}
    >
      <div className="flex justify-between items-center">
        <h4 className="m-0 text-sm text-white">{task.title}</h4>
        {assignee && (
          <span className="text-white/50 text-xs">
            {assignee.display_name || assignee.email}
          </span>
        )}
      </div>
      {task.due_date && (
        <div className="text-white/40 text-xs mt-1">
          Due: {formatDate(task.due_date)}
        </div>
      )}
    </div>
  );
}

/*
 * OldSprints
 *
 * Read-only view of all completed sprints for the current project.
 * Each sprint section lists the tasks that were finished during that sprint.
 */
function OldSprints({ sprints = [], allTasks = [] }) {
  const completedSprints = sprints
    .filter((s) => s.status === "complete")
    .slice()
    .reverse();

  if (completedSprints.length === 0) {
    return (
      <div className="text-white/40 text-center py-12">
        No completed sprints yet.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {completedSprints.map((sprint) => {
        const sprintTasks = allTasks.filter(
          (t) => Number(t.sprint_id) === Number(sprint.id)
        );
        return (
          <section
            key={sprint.id}
            className="rounded-lg bg-slate-800/30 shadow-xl overflow-hidden"
          >
            <div className="bg-gradient-to-r from-slate-700 to-slate-600 px-5 py-3">
              <h2 className="text-xl font-semibold text-white m-0">
                {sprint.name}
              </h2>
              <span className="text-white/50 text-xs">
                Completed &middot; {sprintTasks.length} task
                {sprintTasks.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="px-4 py-4 flex flex-col gap-2">
              {sprintTasks.length > 0 ? (
                sprintTasks.map((task) => (
                  <OldSprintTask key={task.id} task={task} />
                ))
              ) : (
                <p className="text-white/40 text-center py-4">
                  No tasks completed in this sprint.
                </p>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}

export default OldSprints;
