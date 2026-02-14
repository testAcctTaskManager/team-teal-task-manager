import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { formatDate, isDateOverdue } from "../utils/dateHelpers.js";
import { Draggable } from "@hello-pangea/dnd";
import { useUsers } from "../contexts/UsersContext.jsx";
import TimeZone from "./TimeZone.jsx";

/**
 * UserWithTime
 *
 * Display user label with timezone
 */
function UserWithTime({ userId, user, users }) {
  const [showUserWithTime, setShowUserWithTime] = useState(false);
  const getUserLabel = (id) => {
    if (id == null) return null;
    const u = users.find((u) => u.id === Number(id));
    if (!u) return `User ${id}`;
    return u.display_name || u.email || `User ${u.id}`;
  };
  return (
    <dd className="m-0">
      <span
        onMouseEnter={() => setShowUserWithTime(true)}
        onMouseLeave={() => setShowUserWithTime(false)}
      >
        {getUserLabel(userId)}
      </span>
      {showUserWithTime && (
        <div>
          <TimeZone user={user} />
        </div>
      )}
    </dd>
  );
}

/**
 * TaskCard
 *
 * Presentational component for displaying a single task inside a board column.
 * - Does not make any API calls.
 * - Expects a populated `task` object to be passed in as a prop.
 * - The parent column / list is responsible for loading tasks from the backend
 *   and passing the correct data into this component.
 */
export default function TaskCard({ task, index }) {
  const navigate = useNavigate();
  const { users } = useUsers();
  const { users } = useUsers();

  if (!task || task.id == null) {
    return null;
  }

  const { id, title, reporter_id, assignee_id, start_date, due_date } = task;

  const isOverdue = isDateOverdue(due_date);

  const assigneeUser =
    assignee_id != null
      ? users.find((u) => u.id === Number(assignee_id))
      : null;
  const reporterUser =
    reporter_id != null
      ? users.find((u) => u.id === Number(reporter_id))
      : null;

  return (
    <Draggable draggableId={String(id)} index={index}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className="px-4 py-3.5 my-2 rounded-[10px] bg-white/[0.04] shadow-[0_4px_10px_rgba(0,0,0,0.3)] cursor-pointer text-left"
          testid="task-card"
          onClick={() => navigate(`/task/${id}`)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              navigate(`/task/${id}`);
            }
          }}
        >
          <div className="flex justify-between items-center mb-[0.4rem]">
            <h3 className="m-0 text-base" testid="task-card__title">
              {title}
            </h3>
          </div>

          <dl className="flex flex-wrap gap-x-[1.2rem] gap-y-[0.6rem] m-0 p-0 text-xs">
            <div className="flex gap-1 text-[0.6rem]">
              <dt className="opacity-70">ID</dt>
              <dd className="m-0">{id}</dd>
            </div>
            {sprint_id != null && (
              <div className="flex gap-1 text-[0.6rem]">
                <dt className="opacity-70">Sprint</dt>
                <dd className="m-0">{sprint_id}</dd>
              </div>
            )}
            {assignee_id != null && (
              <div className="flex gap-1 text-[0.6rem]">
                <dt className="opacity-70">Assignee</dt>
                <UserWithTime
                  userId={assignee_id}
                  user={assigneeUser}
                  users={users}
                />
              </div>
            )}
            {reporter_id != null && (
              <div className="flex gap-1 text-[0.6rem]">
                <dt className="opacity-70">Reporter</dt>
                <UserWithTime
                  userId={reporter_id}
                  user={reporterUser}
                  users={users}
                />
              </div>
            )}
            <div className="flex gap-1 text-[0.6rem]">
              <dt className="opacity-70">Start</dt>
              <dd className="m-0">{formatDate(start_date)}</dd>
            </div>
            <div className="flex gap-1 text-[0.6rem]">
              <dt className="opacity-70">Due</dt>
              <dd
                className={`m-0 ${isOverdue ? "text-[#ff6b6b]" : ""}`}
                testid="task-card-due"
              >
                {formatDate(due_date)}
              </dd>
            </div>
          </dl>
        </div>
      )}
    </Draggable>
  );
}